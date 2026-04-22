import { Router, Request, Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';
import { EStatusPedido } from '#shared/enums';

/** Converte medidas para o tipo JSON aceito pelo Prisma (null → DbNull) */
function toJsonMedidas(medidas: number[] | null | undefined): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
  if (medidas === null || medidas === undefined) return Prisma.DbNull;
  return medidas;
}

const router = Router();
router.use(authMiddleware);

const include = {
  empresa: true,
  cliente: { include: { cidade: true } },
  meio_pagamento: true,
  itens: { include: { produto: true, corte: { include: { chapa: true } }, servico: true, desenho: true } },
};

// ── Schemas de validação ──────────────────────────────────────────────────────

const itemSchema = z.object({
  id: z.number().int().positive().nullish(),
  tipo: z.number().int().min(10).max(12),
  cod_produto: z.number().int().positive().nullable().optional(),
  cod_servico: z.number().int().positive().nullable().optional(),
  cod_corte: z.number().int().positive().nullable().optional(),
  cod_desenho: z.number().int().positive().nullable().optional(),
  medidas: z.array(z.number()).nullable().optional(),
  quantidade: z.coerce.number().positive(),
  valor_unitario: z.coerce.number().min(0),
  observacoes: z.string().max(1000).nullable().optional(),
}).refine(
  d => d.cod_produto != null || d.cod_servico != null || d.cod_corte != null,
  { message: 'Item deve ter produto, serviço ou corte.' }
);

const pedidoSchema = z.object({
  cod_cliente: z.number().int().positive(),
  cod_meio_pagamento: z.number().int().positive().nullable().optional(),
  data_pedido: z.string().min(1),
  observacoes: z.string().max(2000).nullable().optional(),
  itens: z.array(itemSchema).min(1),
});

const pedidoUpdateSchema = pedidoSchema.extend({
  status: z.number().int().min(1),
  itens: z.array(itemSchema).min(1),
});

// ── Busca o custo diretamente do banco (não confia no cliente) ────────────────
async function buscarCustoDoItem(item: z.infer<typeof itemSchema>): Promise<Decimal> {
  if (item.cod_produto) {
    const p = await prisma.produto.findUnique({ where: { id: item.cod_produto }, select: { custo: true } });
    return p ? new Decimal(p.custo) : new Decimal(0);
  }
  if (item.cod_servico) return new Decimal(0);
  if (item.cod_corte) return new Decimal(0);
  return new Decimal(0);
}

async function recalcularPedido(pedidoId: number) {
  const itens = await prisma.pedidoItem.findMany({ where: { cod_pedido: pedidoId } });

  let valorMaterial = new Decimal(0);
  let valorServico = new Decimal(0);

  for (const item of itens) {
    if (item.cod_produto !== null || item.cod_corte !== null) {
      valorMaterial = valorMaterial.add(item.valor_total);
    } else if (item.cod_servico !== null) {
      valorServico = valorServico.add(item.valor_total);
    }
  }

  const servicoCalculado = valorMaterial;
  const valorTotal = valorMaterial.add(servicoCalculado).add(valorServico);

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { valor_material: valorMaterial, valor_servico: servicoCalculado, valor_total: valorTotal },
  });
}

// ── Valida estoque disponível para os itens do pedido ────────────────────────
// pedidoId: pedido sendo editado (null = novo); estoqueBaixado: se já está baixado.
// Quando estoque já foi baixado, o saldo atual descontou as qtds antigas — somamos
// de volta para comparar com o que será realmente debitado.
async function validarEstoqueItens(
  pedidoId: number | null,
  novoItens: z.infer<typeof itemSchema>[],
  estoqueBaixado: boolean
): Promise<{ ok: boolean; erros: string[] }> {
  const erros: string[] = [];

  for (const item of novoItens) {
    if (!item.cod_produto) continue;

    const produto = await prisma.produto.findUnique({
      where: { id: item.cod_produto },
      select: { descricao: true, estoque_atual: true },
    });
    if (!produto) continue;

    let estoqueDisponivel = Number(produto.estoque_atual);

    if (pedidoId && estoqueBaixado) {
      const itemAtual = await prisma.pedidoItem.findFirst({
        where: { cod_pedido: pedidoId, cod_produto: item.cod_produto },
        select: { quantidade: true },
      });
      if (itemAtual) {
        estoqueDisponivel += Number(itemAtual.quantidade);
      }
    }

    if (estoqueDisponivel < item.quantidade) {
      erros.push(`"${produto.descricao}": disponível ${estoqueDisponivel.toFixed(4)}, necessário ${item.quantidade}`);
    }
  }

  return { ok: erros.length === 0, erros };
}

// ── Valida que o item pertence ao pedido da empresa (prevenção de IDOR) ───────
async function validarOwnershipItem(itemId: number, pedidoId: number): Promise<boolean> {
  const item = await prisma.pedidoItem.findFirst({ where: { id: itemId, cod_pedido: pedidoId } });
  return item !== null;
}

// ─────────────────────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, dataInicio, dataFim, codCliente, pagina = '1', limite = '10' } = req.query as Record<string, string>;
    const where: any = { cod_empresa: req.user!.cod_empresa!, excluido: false };

    if (status !== undefined && status !== '') {
      const s = Number(status);
      if (!Number.isInteger(s)) { res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Status inválido.' }); return; }
      where.status = s;
    }
    if (codCliente) where.cod_cliente = Number(codCliente);
    if (dataInicio || dataFim) {
      where.data_pedido = {};
      if (dataInicio) where.data_pedido.gte = new Date(dataInicio + 'T00:00:00');
      if (dataFim) where.data_pedido.lte = new Date(dataFim + 'T23:59:59.999');
    }

    const paginaNum = Math.max(1, parseInt(pagina) || 1);
    const limiteNum = Math.min(100, Math.max(1, parseInt(limite) || 10));
    const skip = (paginaNum - 1) * limiteNum;

    const [total, pedidos] = await Promise.all([
      prisma.pedido.count({ where }),
      prisma.pedido.findMany({ where, include, orderBy: { data_pedido: 'desc' }, skip, take: limiteNum }),
    ]);

    res.json({ success: true, data: pedidos, total, pagina: paginaNum, totalPaginas: Math.ceil(total / limiteNum) });
  } catch (err) {
    console.error('[PEDIDOS_GET]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar pedidos.' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const pedido = await prisma.pedido.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
      include,
    });
    if (!pedido) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' }); return; }
    res.json({ success: true, data: pedido });
  } catch (err) {
    console.error('[PEDIDOS_GET_ID]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar pedido.' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parse = pedidoSchema.safeParse(req.body);
    if (!parse.success) {
      console.error('[PEDIDOS_POST zod]', JSON.stringify(parse.error.issues, null, 2));
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }

    const { itens, cod_cliente, cod_meio_pagamento, data_pedido, observacoes } = parse.data;

    // Busca custo real do banco para cada item
    const itensComCusto = await Promise.all(itens.map(async item => ({
      cod_produto: item.cod_produto ?? null,
      cod_servico: item.cod_servico ?? null,
      cod_corte: item.cod_corte ?? null,
      cod_desenho: item.cod_desenho ?? null,
      medidas: toJsonMedidas(item.medidas),
      tipo: item.tipo,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_total: new Decimal(item.quantidade).mul(new Decimal(item.valor_unitario)),
      custo_unitario: await buscarCustoDoItem(item),
      observacoes: item.observacoes ?? null,
    })));

    const pedido = await prisma.pedido.create({
      data: {
        cod_empresa: req.user!.cod_empresa!,
        cod_cliente,
        cod_meio_pagamento: cod_meio_pagamento ?? null,
        data_pedido: new Date(data_pedido),
        observacoes: observacoes ?? null,
        status: EStatusPedido.Aberto,
        itens: { create: itensComCusto },
      },
    });

    await recalcularPedido(pedido.id);
    const pedidoAtualizado = await prisma.pedido.findFirst({ where: { id: pedido.id }, include });
    res.status(StatusCodes.CREATED).json({ success: true, data: pedidoAtualizado });
  } catch (err) {
    console.error('[PEDIDOS_POST]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar pedido.' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const pedidoId = Number(req.params['id']);
    const codEmpresa = req.user!.cod_empresa!;

    const existing = await prisma.pedido.findFirst({
      where: { id: pedidoId, cod_empresa: codEmpresa, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' }); return; }

    const parse = pedidoUpdateSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }

    const { itens, status, cod_cliente, cod_meio_pagamento, data_pedido, observacoes } = parse.data;
    const novoStatus = Number(status);
    const STATUS_PRODUTIVOS = [EStatusPedido.EmProducao, EStatusPedido.Concluido];
    const novoEhProdutivo = STATUS_PRODUTIVOS.includes(novoStatus);

    // ── Validação de estoque (aplicação) ────────────────────────────────────────
    // Valida ANTES de qualquer alteração para retornar erro descritivo ao usuário.
    // O trigger do banco faz o débito/crédito real; a aplicação apenas garante
    // que há saldo suficiente antes de permitir a transição.
    if (novoEhProdutivo) {
      const empresa = await prisma.empresa.findFirst({
        where: { id: codEmpresa },
        select: { validar_estoque: true },
      });

      if (empresa?.validar_estoque) {
        const validacao = await validarEstoqueItens(pedidoId, itens, existing.estoque_baixado);
        if (!validacao.ok) {
          res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            success: false,
            message: 'Estoque insuficiente para um ou mais itens.',
            erros: validacao.erros,
          });
          return;
        }
      }
    }

    // ── Atualização de itens e status ───────────────────────────────────────────
    // Estratégia para edição com estoque já baixado:
    //   1. Resetar status para Aberto → trigger devolve estoque com itens antigos
    //   2. Atualizar itens no banco
    //   3. Atualizar status final → trigger debita estoque com itens novos
    await prisma.$transaction(async (tx) => {
      // Passo 1: se o estoque estava baixado, retorna-o.
      // O trigger BEFORE devolve ao estoque (se validar_estoque=true);
      // estoque_baixado=false é definido explicitamente para cobrir o caso em que
      // validar_estoque=false (trigger não atua, mas o flag precisa ser zerado).
      if (existing.estoque_baixado) {
        await tx.$executeRaw`
          UPDATE calhas.pedidos
          SET status = ${EStatusPedido.Aberto}, estoque_baixado = FALSE, updated_at = NOW()
          WHERE id = ${pedidoId}
        `;
      }

      // Passo 2: atualizar cabeçalho do pedido (sem status ainda — faremos no passo 3)
      await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          cod_cliente,
          cod_meio_pagamento: cod_meio_pagamento ?? null,
          data_pedido: new Date(data_pedido),
          observacoes: observacoes ?? null,
          updated_at: new Date(),
        },
      });

      // Passo 3: sincronizar itens
      for (const item of itens) {
        const valorTotal = new Decimal(item.quantidade).mul(new Decimal(item.valor_unitario));

        if (item.id) {
          const pertence = await validarOwnershipItem(item.id, pedidoId);
          if (!pertence) {
            throw new Error('IDOR:item_nao_pertence');
          }
          await tx.pedidoItem.update({
            where: { id: item.id },
            data: {
              cod_produto: item.cod_produto ?? null,
              cod_servico: item.cod_servico ?? null,
              cod_corte: item.cod_corte ?? null,
              cod_desenho: item.cod_desenho ?? null,
              medidas: toJsonMedidas(item.medidas),
              tipo: item.tipo,
              quantidade: item.quantidade,
              valor_unitario: item.valor_unitario,
              valor_total: valorTotal,
              observacoes: item.observacoes ?? null,
            },
          });
        } else {
          const custo_unitario = await buscarCustoDoItem(item);
          await tx.pedidoItem.create({
            data: {
              cod_pedido: pedidoId,
              cod_produto: item.cod_produto ?? null,
              cod_servico: item.cod_servico ?? null,
              cod_corte: item.cod_corte ?? null,
              cod_desenho: item.cod_desenho ?? null,
              medidas: toJsonMedidas(item.medidas),
              tipo: item.tipo,
              quantidade: item.quantidade,
              valor_unitario: item.valor_unitario,
              valor_total: valorTotal,
              custo_unitario,
              observacoes: item.observacoes ?? null,
            },
          });
        }
      }

      // Passo 4: definir status final — o trigger BEFORE cuida do débito de estoque
      await tx.pedido.update({
        where: { id: pedidoId },
        data: { status: novoStatus },
      });
    });

    await recalcularPedido(pedidoId);
    const pedidoAtualizado = await prisma.pedido.findFirst({ where: { id: pedidoId }, include });
    res.json({ success: true, data: pedidoAtualizado });
  } catch (err: any) {
    if (err?.message === 'IDOR:item_nao_pertence') {
      res.status(StatusCodes.FORBIDDEN).json({ success: false, message: 'Item não pertence a este pedido.' }); return;
    }
    console.error('[PEDIDOS_PUT]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar pedido.' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.pedido.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' }); return; }

    // O trigger BEFORE UPDATE em calhas.pedidos cuida de devolver o estoque
    // quando excluido passa de FALSE para TRUE (se empresa.validar_estoque=true).
    await prisma.pedido.update({ where: { id: existing.id }, data: { excluido: true } });
    res.json({ success: true, message: 'Pedido excluído.' });
  } catch (err) {
    console.error('[PEDIDOS_DELETE]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir pedido.' });
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const pedidoId = Number(req.params['id']);
    const codEmpresa = req.user!.cod_empresa!;
    const novoStatus = Number(req.body.status);

    const statusValidos = [EStatusPedido.Aberto, EStatusPedido.EmProducao, EStatusPedido.Concluido, EStatusPedido.Cancelado];
    if (!statusValidos.includes(novoStatus)) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Status inválido.' }); return;
    }

    const existing = await prisma.pedido.findFirst({
      where: { id: pedidoId, cod_empresa: codEmpresa, excluido: false },
      include: { itens: true },
    });
    if (!existing) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' }); return;
    }

    const STATUS_PRODUTIVOS = [EStatusPedido.EmProducao, EStatusPedido.Concluido];
    if (STATUS_PRODUTIVOS.includes(novoStatus)) {
      const empresa = await prisma.empresa.findFirst({
        where: { id: codEmpresa },
        select: { validar_estoque: true },
      });
      if (empresa?.validar_estoque) {
        const itensParaValidar = existing.itens.map(i => ({
          cod_produto: i.cod_produto,
          cod_servico: i.cod_servico,
          cod_corte: i.cod_corte,
          quantidade: Number(i.quantidade),
        }));
        const validacao = await validarEstoqueItens(pedidoId, itensParaValidar as any, existing.estoque_baixado);
        if (!validacao.ok) {
          res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            success: false,
            message: 'Estoque insuficiente para um ou mais itens.',
            erros: validacao.erros,
          });
          return;
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      if (existing.estoque_baixado) {
        await tx.$executeRaw`
          UPDATE calhas.pedidos
          SET status = ${EStatusPedido.Aberto}, estoque_baixado = FALSE, updated_at = NOW()
          WHERE id = ${pedidoId}
        `;
      }
      await tx.pedido.update({
        where: { id: pedidoId },
        data: { status: novoStatus, updated_at: new Date() },
      });
    });

    const pedidoAtualizado = await prisma.pedido.findFirst({ where: { id: pedidoId }, include });
    res.json({ success: true, data: pedidoAtualizado });
  } catch (err) {
    console.error('[PEDIDOS_PATCH_STATUS]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao alterar status do pedido.' });
  }
});

// ─── ITENS ───────────────────────────────────────────────────────────────────

router.post('/:id/itens', async (req: Request, res: Response) => {
  try {
    const pedido = await prisma.pedido.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!pedido) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' }); return; }

    const parse = itemSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }

    const item = parse.data;
    const custo_unitario = await buscarCustoDoItem(item);

    await prisma.pedidoItem.create({
      data: {
        cod_pedido: pedido.id,
        cod_produto: item.cod_produto ?? null,
        cod_servico: item.cod_servico ?? null,
        cod_corte: item.cod_corte ?? null,
        cod_desenho: item.cod_desenho ?? null,
        medidas: toJsonMedidas(item.medidas),
        tipo: item.tipo,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: new Decimal(item.quantidade).mul(new Decimal(item.valor_unitario)),
        custo_unitario,
        observacoes: item.observacoes ?? null,
      },
    });
    await recalcularPedido(pedido.id);
    const pedidoAtualizado = await prisma.pedido.findFirst({ where: { id: pedido.id }, include });
    res.status(StatusCodes.CREATED).json({ success: true, data: pedidoAtualizado });
  } catch (err) {
    console.error('[PEDIDOS_POST_ITEM]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao adicionar item.' });
  }
});

router.put('/:id/itens/:itemId', async (req: Request, res: Response) => {
  try {
    const pedidoId = Number(req.params['id']);
    const itemId = Number(req.params['itemId']);

    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!pedido) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' }); return; }

    const pertence = await validarOwnershipItem(itemId, pedidoId);
    if (!pertence) { res.status(StatusCodes.FORBIDDEN).json({ success: false, message: 'Item não pertence a este pedido.' }); return; }

    const parse = itemSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }

    const { tipo, quantidade, valor_unitario, cod_produto, cod_servico, cod_corte, cod_desenho, medidas, observacoes } = parse.data;
    await prisma.pedidoItem.update({
      where: { id: itemId },
      data: {
        tipo,
        quantidade,
        valor_unitario,
        valor_total: new Decimal(quantidade).mul(new Decimal(valor_unitario)),
        cod_produto: cod_produto ?? null,
        cod_servico: cod_servico ?? null,
        cod_corte: cod_corte ?? null,
        cod_desenho: cod_desenho ?? null,
        medidas: toJsonMedidas(medidas),
        observacoes: observacoes ?? null,
      },
    });
    await recalcularPedido(pedidoId);
    const pedidoAtualizado = await prisma.pedido.findFirst({ where: { id: pedidoId }, include });
    res.json({ success: true, data: pedidoAtualizado });
  } catch (err) {
    console.error('[PEDIDOS_PUT_ITEM]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar item.' });
  }
});

router.delete('/:id/itens/:itemId', async (req: Request, res: Response) => {
  try {
    const pedidoId = Number(req.params['id']);
    const itemId = Number(req.params['itemId']);

    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!pedido) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' }); return; }

    const pertence = await validarOwnershipItem(itemId, pedidoId);
    if (!pertence) { res.status(StatusCodes.FORBIDDEN).json({ success: false, message: 'Item não pertence a este pedido.' }); return; }

    await prisma.pedidoItem.delete({ where: { id: itemId } });
    await recalcularPedido(pedidoId);
    const pedidoAtualizado = await prisma.pedido.findFirst({ where: { id: pedidoId }, include });
    res.json({ success: true, data: pedidoAtualizado });
  } catch (err) {
    console.error('[PEDIDOS_DELETE_ITEM]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao remover item.' });
  }
});

// ── POST /:id/gerar-link — gera (ou regenera) token de acesso público ──────────
router.post('/:id/gerar-link', async (req: Request, res: Response) => {
  try {
    const pedidoId = Number(req.params['id']);
    const codEmpresa = req.user!.cod_empresa!;

    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, cod_empresa: codEmpresa, excluido: false },
    });
    if (!pedido) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' });
      return;
    }

    const empresa = await prisma.empresa.findUnique({ where: { id: codEmpresa } });
    const diasValidade = empresa?.link_validade_dias ?? 7;
    const expiracao = new Date();
    expiracao.setDate(expiracao.getDate() + diasValidade);

    const token = randomUUID();

    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { token_acesso: token, token_expiracao: expiracao },
    });

    const mensagem = empresa?.whatsapp_mensagem_padrao ?? 'Segue o link com o seu orçamento: {link}';

    res.json({ success: true, data: { token, expiracao, mensagem_padrao: mensagem } });
  } catch (err) {
    console.error('[PEDIDOS_GERAR_LINK]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao gerar link.' });
  }
});

export default router;
