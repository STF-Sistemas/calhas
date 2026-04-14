import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import multer from 'multer';
import { parseStringPromise } from 'xml2js';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';
import { Decimal } from '@prisma/client/runtime/library';
import {
  IDanfeData,
  IDanfeEmitente,
  IDanfeDestinatario,
  IDanfeItem,
  IDanfeTotais,
  IDanfeTransporte,
  IDanfeFatura,
} from '#shared/interfaces';

const router = Router();
router.use(authMiddleware);

// Multer: armazena em memória, limite 5 MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── Schemas Zod ────────────────────────────────────────────────────────────────
const compraItemSchema = z.object({
  cod_produto: z.number().int().positive(),
  descricao_xml: z.string().max(200).nullish().or(z.literal('')),
  descricao: z.string().min(1).max(200),
  ncm: z.string().max(10).nullish().or(z.literal('')),
  cfop: z.string().max(5).nullish().or(z.literal('')),
  unidade: z.string().min(1).max(10),
  quantidade: z.number().positive(),
  valor_unitario: z.number().min(0),
  valor_total: z.number().min(0),
  desconto: z.preprocess(v => v ?? 0, z.number().min(0)),
  base_icms: z.preprocess(v => v ?? 0, z.number().min(0)),
  aliq_icms: z.preprocess(v => v ?? 0, z.number().min(0)),
  valor_icms: z.preprocess(v => v ?? 0, z.number().min(0)),
  base_icms_st: z.preprocess(v => v ?? 0, z.number().min(0)),
  valor_icms_st: z.preprocess(v => v ?? 0, z.number().min(0)),
  valor_ipi: z.preprocess(v => v ?? 0, z.number().min(0)),
  aliq_pis: z.preprocess(v => v ?? 0, z.number().min(0)),
  valor_pis: z.preprocess(v => v ?? 0, z.number().min(0)),
  aliq_cofins: z.preprocess(v => v ?? 0, z.number().min(0)),
  valor_cofins: z.preprocess(v => v ?? 0, z.number().min(0)),
});

const compraSchema = z.object({
  cod_fornecedor: z.number().int().positive(),
  numero_nfe: z.string().max(20).nullish().or(z.literal('')),
  serie: z.string().max(5).nullish().or(z.literal('')),
  chave_acesso: z.string().max(44).nullish().or(z.literal('')),
  data_emissao: z.string().nullish().or(z.literal('')),
  data_entrada: z.string().nullish().or(z.literal('')),
  valor_frete: z.preprocess(v => v ?? 0, z.number().min(0)),
  valor_seguro: z.preprocess(v => v ?? 0, z.number().min(0)),
  valor_desconto: z.preprocess(v => v ?? 0, z.number().min(0)),
  valor_outros: z.preprocess(v => v ?? 0, z.number().min(0)),
  observacao: z.string().max(500).nullish().or(z.literal('')),
  itens: z.array(compraItemSchema).min(1),
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function calcularRateioECusto(
  itens: z.infer<typeof compraItemSchema>[],
  valorFrete: number,
  valorSeguro: number,
  valorOutros: number,
  valorDesconto: number
) {
  const somaItens = itens.reduce((s, i) => s + i.valor_total, 0);
  return itens.map((item) => {
    const proporcao = somaItens > 0 ? item.valor_total / somaItens : 0;
    const rateio_frete = valorFrete * proporcao;
    const rateio_seguro = valorSeguro * proporcao;
    const rateio_outros = valorOutros * proporcao;
    const rateio_desconto = valorDesconto * proporcao;
    const custo_unitario =
      item.quantidade > 0
        ? (item.valor_total - item.desconto + item.valor_ipi + item.valor_icms_st +
           rateio_frete + rateio_seguro + rateio_outros - rateio_desconto) / item.quantidade
        : 0;
    return { ...item, rateio_frete, rateio_seguro, rateio_outros, rateio_desconto, custo_unitario };
  });
}

// Nota: o controle de estoque (entrada/saída) é feito pelo trigger PostgreSQL
// calhas.trg_controle_estoque_compra (ver prisma/trigger_estoque_compra.sql).
// Esta função atualiza apenas o CUSTO e o VALOR DE VENDA dos produtos.
async function atualizarCustoProdutos(compraId: number, codEmpresa: number) {
  // Busca o cabeçalho da compra para recalcular o rateio com os valores atuais
  const compra = await prisma.compra.findFirst({
    where: { id: compraId, excluido: false },
    include: { itens: { where: { excluido: false } } },
  });
  if (!compra) return;

  // Recalcula rateio e custo com base nos valores atuais do cabeçalho
  const somaItens = compra.itens.reduce((s, i) => s + Number(i.valor_total), 0);

  for (const item of compra.itens) {
    const proporcao = somaItens > 0 ? Number(item.valor_total) / somaItens : 0;
    const rateio_frete    = Number(compra.valor_frete) * proporcao;
    const rateio_seguro   = Number(compra.valor_seguro) * proporcao;
    const rateio_outros   = Number(compra.valor_outros) * proporcao;
    const rateio_desconto = Number(compra.valor_desconto) * proporcao;

    // Custo de aquisição por unidade:
    //   valor_produto (já inclui ICMS/PIS/COFINS embutidos p/ Simples Nacional)
    //   + IPI         (encargo extra ao comprador)
    //   + ICMS ST     (encargo extra ao comprador)
    //   - desconto do item
    //   + rateio (frete + seguro + outros - desconto da nota)
    const custo_unitario =
      Number(item.quantidade) > 0
        ? (Number(item.valor_total)
           - Number(item.desconto)
           + Number(item.valor_ipi)
           + Number(item.valor_icms_st)
           + rateio_frete
           + rateio_seguro
           + rateio_outros
           - rateio_desconto)
          / Number(item.quantidade)
        : 0;

    // Atualiza o custo recalculado no item
    await prisma.compraItem.update({
      where: { id: item.id },
      data: { rateio_frete, rateio_seguro, rateio_outros, rateio_desconto, custo_unitario },
    });

    // Atualiza custo e estoque do produto
    const produto = await prisma.produto.findFirst({
      where: { id: item.cod_produto, cod_empresa: codEmpresa, excluido: false },
    });
    if (produto) {
      const markup = Number(produto.markup);
      // Se o produto tem markup configurado, recalcula o valor de venda automaticamente
      const novoValorUnitario = markup > 0
        ? custo_unitario * (1 + markup / 100)
        : Number(produto.valor_unitario);
      // Estoque é controlado pelo trigger do banco — aqui só custo e preço de venda
      await prisma.produto.update({
        where: { id: item.cod_produto },
        data: {
          custo: custo_unitario as unknown as Decimal,
          valor_unitario: novoValorUnitario,
        },
      });
    }
  }
}

// ── GET / — lista compras ──────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const compras = await prisma.compra.findMany({
      where: { cod_empresa: req.user!.cod_empresa!, excluido: false },
      include: { fornecedor: { select: { id: true, razao_social: true, cnpj: true } } },
      orderBy: { id: 'desc' },
    });
    res.json({ success: true, data: compras });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar compras.' });
  }
});

// ── GET /:id/danfe-data — dados para impressão DANFE ─────────────────────────
router.get('/:id/danfe-data', async (req: Request, res: Response) => {
  try {
    const compraId = Number(req.params['id']);
    const codEmpresa = req.user!.cod_empresa!;

    const compra = await prisma.compra.findFirst({
      where: { id: compraId, cod_empresa: codEmpresa, excluido: false },
      include: {
        fornecedor: { include: { cidade: true } },
        itens: { where: { excluido: false } },
        xml: true,
      },
    });
    if (!compra) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Compra não encontrada.' });
      return;
    }

    const empresa = await prisma.empresa.findFirst({
      where: { id: codEmpresa },
      include: { cidade: true },
    });

    let danfeData: IDanfeData;

    if (compra.xml?.xml_content) {
      danfeData = await parseDanfeXml(compra.xml.xml_content);
    } else {
      danfeData = buildDanfeFromDb(compra, empresa);
    }

    res.json({ success: true, data: danfeData });
  } catch (err) {
    console.error('[DANFE]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao gerar dados DANFE.' });
  }
});

// ── GET /:id — detalhe com itens ──────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const compra = await prisma.compra.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
      include: { fornecedor: true, itens: { where: { excluido: false } } },
    });
    if (!compra) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Compra não encontrada.' });
      return;
    }
    res.json({ success: true, data: compra });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar compra.' });
  }
});

// ── POST / — cria compra em rascunho ──────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const parse = compraSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0]!.message });
      return;
    }
    const { itens, ...cabecalho } = parse.data;

    // Verificar duplicidade por chave_acesso
    if (cabecalho.chave_acesso && cabecalho.chave_acesso.length === 44) {
      const dup = await prisma.compra.findFirst({
        where: { chave_acesso: cabecalho.chave_acesso, cod_empresa: req.user!.cod_empresa!, excluido: false },
      });
      if (dup) {
        res.status(StatusCodes.CONFLICT).json({ success: false, message: 'Esta NF-e já foi importada (chave de acesso duplicada).' });
        return;
      }
    }

    // Verificar ownership do fornecedor
    const fornecedor = await prisma.fornecedor.findFirst({
      where: { id: cabecalho.cod_fornecedor, cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!fornecedor) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Fornecedor não encontrado.' });
      return;
    }

    const itensCalculados = calcularRateioECusto(
      itens,
      cabecalho.valor_frete ?? 0,
      cabecalho.valor_seguro ?? 0,
      cabecalho.valor_outros ?? 0,
      cabecalho.valor_desconto ?? 0
    );

    const valor_produtos = itens.reduce((s, i) => s + i.valor_total, 0);
    const valor_ipi = itens.reduce((s, i) => s + i.valor_ipi, 0);
    const valor_total =
      valor_produtos +
      (cabecalho.valor_frete ?? 0) +
      (cabecalho.valor_seguro ?? 0) +
      (cabecalho.valor_outros ?? 0) +
      valor_ipi -
      (cabecalho.valor_desconto ?? 0);

    const compra = await prisma.compra.create({
      data: {
        ...cabecalho,
        cod_empresa: req.user!.cod_empresa!,
        valor_produtos,
        valor_ipi,
        valor_total,
        data_emissao: cabecalho.data_emissao ? new Date(cabecalho.data_emissao) : null,
        data_entrada: cabecalho.data_entrada ? new Date(cabecalho.data_entrada) : null,
        itens: {
          create: itensCalculados.map((item) => ({
            cod_produto: item.cod_produto,
            descricao_xml: item.descricao_xml ?? null,
            descricao: item.descricao,
            ncm: item.ncm ?? null,
            cfop: item.cfop ?? null,
            unidade: item.unidade,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: item.valor_total,
            desconto: item.desconto,
            base_icms: item.base_icms,
            aliq_icms: item.aliq_icms,
            valor_icms: item.valor_icms,
            base_icms_st: item.base_icms_st,
            valor_icms_st: item.valor_icms_st,
            valor_ipi: item.valor_ipi,
            aliq_pis: item.aliq_pis,
            valor_pis: item.valor_pis,
            aliq_cofins: item.aliq_cofins,
            valor_cofins: item.valor_cofins,
            rateio_frete: item.rateio_frete,
            rateio_seguro: item.rateio_seguro,
            rateio_outros: item.rateio_outros,
            rateio_desconto: item.rateio_desconto,
            custo_unitario: item.custo_unitario,
          })),
        },
      },
      include: { fornecedor: true, itens: true },
    });

    const xmlContent = req.body['xml_content'] as string | undefined;
    if (xmlContent) {
      await prisma.compraXml.upsert({
        where: { cod_compra: compra.id },
        update: { xml_content: xmlContent },
        create: { cod_compra: compra.id, xml_content: xmlContent },
      });
    }

    res.status(StatusCodes.CREATED).json({ success: true, data: compra });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar compra.' });
  }
});

// ── PUT /:id — atualiza compra (somente rascunho) ────────────────────────────
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.compra.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Compra não encontrada.' });
      return;
    }
    if (existing.status !== 1) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Apenas compras em Rascunho podem ser editadas.' });
      return;
    }

    const parse = compraSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0]!.message });
      return;
    }
    const { itens, ...cabecalho } = parse.data;

    // Verificar duplicidade por chave_acesso (exceto a própria)
    if (cabecalho.chave_acesso && cabecalho.chave_acesso.length === 44) {
      const dup = await prisma.compra.findFirst({
        where: {
          chave_acesso: cabecalho.chave_acesso,
          cod_empresa: req.user!.cod_empresa!,
          excluido: false,
          NOT: { id: Number(req.params['id']) },
        },
      });
      if (dup) {
        res.status(StatusCodes.CONFLICT).json({ success: false, message: 'Esta NF-e já foi importada (chave de acesso duplicada).' });
        return;
      }
    }

    const itensCalculados = calcularRateioECusto(
      itens,
      cabecalho.valor_frete ?? 0,
      cabecalho.valor_seguro ?? 0,
      cabecalho.valor_outros ?? 0,
      cabecalho.valor_desconto ?? 0
    );

    const valor_produtos = itens.reduce((s, i) => s + i.valor_total, 0);
    const valor_ipi = itens.reduce((s, i) => s + i.valor_ipi, 0);
    const valor_total =
      valor_produtos +
      (cabecalho.valor_frete ?? 0) +
      (cabecalho.valor_seguro ?? 0) +
      (cabecalho.valor_outros ?? 0) +
      valor_ipi -
      (cabecalho.valor_desconto ?? 0);

    // Soft-delete itens anteriores e recria
    await prisma.compraItem.updateMany({ where: { cod_compra: Number(req.params['id']) }, data: { excluido: true } });

    const compra = await prisma.compra.update({
      where: { id: Number(req.params['id']) },
      data: {
        ...cabecalho,
        valor_produtos,
        valor_ipi,
        valor_total,
        data_emissao: cabecalho.data_emissao ? new Date(cabecalho.data_emissao) : null,
        data_entrada: cabecalho.data_entrada ? new Date(cabecalho.data_entrada) : null,
        itens: {
          create: itensCalculados.map((item) => ({
            cod_produto: item.cod_produto,
            descricao_xml: item.descricao_xml ?? null,
            descricao: item.descricao,
            ncm: item.ncm ?? null,
            cfop: item.cfop ?? null,
            unidade: item.unidade,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: item.valor_total,
            desconto: item.desconto,
            base_icms: item.base_icms,
            aliq_icms: item.aliq_icms,
            valor_icms: item.valor_icms,
            base_icms_st: item.base_icms_st,
            valor_icms_st: item.valor_icms_st,
            valor_ipi: item.valor_ipi,
            aliq_pis: item.aliq_pis,
            valor_pis: item.valor_pis,
            aliq_cofins: item.aliq_cofins,
            valor_cofins: item.valor_cofins,
            rateio_frete: item.rateio_frete,
            rateio_seguro: item.rateio_seguro,
            rateio_outros: item.rateio_outros,
            rateio_desconto: item.rateio_desconto,
            custo_unitario: item.custo_unitario,
          })),
        },
      },
      include: { fornecedor: true, itens: { where: { excluido: false } } },
    });

    const xmlContent = req.body['xml_content'] as string | undefined;
    if (xmlContent) {
      await prisma.compraXml.upsert({
        where: { cod_compra: compra.id },
        update: { xml_content: xmlContent },
        create: { cod_compra: compra.id, xml_content: xmlContent },
      });
    }

    res.json({ success: true, data: compra });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar compra.' });
  }
});

// ── PATCH /:id/status — muda status ──────────────────────────────────────────
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, motivo_cancelamento } = req.body;
    if (![1, 2, 3].includes(status)) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Status inválido. Use 1=Rascunho, 2=Confirmada, 3=Cancelada.' });
      return;
    }
    if (status === 3 && !motivo_cancelamento?.trim()) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Informe o motivo do cancelamento.' });
      return;
    }
    const existing = await prisma.compra.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Compra não encontrada.' });
      return;
    }
    if (existing.status === 2 && status !== 3) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Compra confirmada só pode ser cancelada.' });
      return;
    }
    const compra = await prisma.compra.update({
      where: { id: Number(req.params['id']) },
      data: {
        status,
        ...(status === 3 ? { motivo_cancelamento: motivo_cancelamento.trim() } : {}),
      },
    });

    // Ao confirmar: atualiza custo e preço de venda dos produtos
    // (estoque é controlado pelo trigger do banco)
    if (status === 2) {
      await atualizarCustoProdutos(Number(req.params['id']), req.user!.cod_empresa!);
    }

    res.json({ success: true, data: compra });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao alterar status da compra.' });
  }
});

// ── POST /:id/atualizar-custo — recalcula e aplica custo nos produtos ────────
router.post('/:id/atualizar-custo', async (req: Request, res: Response) => {
  try {
    const compra = await prisma.compra.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!compra) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Compra não encontrada.' });
      return;
    }
    await atualizarCustoProdutos(Number(req.params['id']), req.user!.cod_empresa!);
    res.json({ success: true, message: 'Custo dos produtos atualizado com sucesso.' });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar custos.' });
  }
});

// ── DELETE /:id — soft delete (rascunho ou confirmada; confirmada reverte estoque) ──
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.compra.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Compra não encontrada.' });
      return;
    }
    // Soft-delete — o trigger do banco reverte o estoque automaticamente se status=2
    await prisma.compra.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Compra excluída.' });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir compra.' });
  }
});

// ── POST /importar-xml — importa NF-e a partir de XML ─────────────────────────
router.post('/importar-xml', upload.single('arquivo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Arquivo XML não enviado.' });
      return;
    }

    const xmlContent = req.file.buffer.toString('utf-8');
    const parsed = await parseStringPromise(xmlContent, { explicitArray: false, ignoreAttrs: false });

    // Suporta NF-e com ou sem envelope nfeProc
    const nfeRoot = parsed['nfeProc'] ?? parsed['NFe'];
    if (!nfeRoot) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'XML inválido: estrutura NF-e não reconhecida.' });
      return;
    }
    const nfe = nfeRoot['NFe'] ?? nfeRoot;
    const infNFe = nfe['infNFe'];
    if (!infNFe) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'XML inválido: tag infNFe não encontrada.' });
      return;
    }

    const ide = infNFe['ide'];
    const emit = infNFe['emit'];
    const total = infNFe['total']?.['ICMSTot'];
    const transp = infNFe['transp'];
    const rawDets = infNFe['det'];
    const dets: Record<string, unknown>[] = Array.isArray(rawDets) ? rawDets : rawDets ? [rawDets] : [];

    const chave_acesso = (infNFe['$']?.['Id'] ?? '').replace('NFe', '').trim();
    const numero_nfe = ide?.['nNF'] ?? '';
    const serie = ide?.['serie'] ?? '';
    const data_emissao = ide?.['dhEmi'] ?? ide?.['dEmi'] ?? null;

    // Verifica duplicidade por chave de acesso
    if (chave_acesso.length === 44) {
      const dup = await prisma.compra.findFirst({
        where: { chave_acesso, cod_empresa: req.user!.cod_empresa!, excluido: false },
      });
      if (dup) {
        res.status(StatusCodes.CONFLICT).json({ success: false, message: 'Esta NF-e já foi importada (chave de acesso duplicada).', data: null });
        return;
      }
    }

    // Monta dados do emitente para retornar ao frontend
    const cnpj_emit = (emit?.['CNPJ'] ?? '').replace(/\D/g, '');
    const fornecedorExistente = cnpj_emit
      ? await prisma.fornecedor.findFirst({
          where: { cnpj: cnpj_emit, cod_empresa: req.user!.cod_empresa!, excluido: false },
          include: { cidade: true },
        })
      : null;

    // Monta itens a partir do XML
    const itens = dets.map((det: Record<string, unknown>) => {
      const prod = det['prod'] as Record<string, unknown>;
      const imposto = det['imposto'] as Record<string, unknown> | undefined;
      const icms = (imposto?.['ICMS'] ?? {}) as Record<string, unknown>;
      const icmsGrupo = Object.values(icms)[0] as Record<string, unknown> ?? {};
      const ipi = (imposto?.['IPI'] ?? {}) as Record<string, unknown>;
      const ipiTrib = (ipi['IPITrib'] ?? ipi['IPINT'] ?? {}) as Record<string, unknown>;
      const pis = (imposto?.['PIS'] ?? {}) as Record<string, unknown>;
      const pisAliq = (pis['PISAliq'] ?? pis['PISNT'] ?? {}) as Record<string, unknown>;
      const cofins = (imposto?.['COFINS'] ?? {}) as Record<string, unknown>;
      const cofinsAliq = (cofins['COFINSAliq'] ?? cofins['COFINSNT'] ?? {}) as Record<string, unknown>;

      // cEAN = GTIN do produto; 'SEM GTIN' é o valor padrão quando não há código de barras
      const gtin = String(prod['cEAN'] ?? '').trim();

      return {
        cod_produto: null as number | null,
        cProd: String(prod['cProd'] ?? '').trim(),
        gtin: gtin === 'SEM GTIN' ? '' : gtin,
        descricao: String(prod['xProd'] ?? ''),
        ncm: String(prod['NCM'] ?? ''),
        cfop: String(prod['CFOP'] ?? ''),
        unidade: String(prod['uCom'] ?? prod['uTrib'] ?? 'UN'),
        quantidade: Number(prod['qCom'] ?? prod['qTrib'] ?? 0),
        valor_unitario: Number(prod['vUnCom'] ?? 0),
        valor_total: Number(prod['vProd'] ?? 0),
        desconto: Number(prod['vDesc'] ?? 0),
        base_icms: Number(icmsGrupo['vBC'] ?? 0),
        aliq_icms: Number(icmsGrupo['pICMS'] ?? 0),
        valor_icms: Number(icmsGrupo['vICMS'] ?? 0),
        base_icms_st: Number(icmsGrupo['vBCST'] ?? 0),
        valor_icms_st: Number(icmsGrupo['vICMSST'] ?? 0),
        valor_ipi: Number(ipiTrib['vIPI'] ?? 0),
        aliq_pis: Number(pisAliq['pPIS'] ?? 0),
        valor_pis: Number(pisAliq['vPIS'] ?? 0),
        aliq_cofins: Number(cofinsAliq['pCOFINS'] ?? 0),
        valor_cofins: Number(cofinsAliq['vCOFINS'] ?? 0),
      };
    });

    const dados = {
      chave_acesso,
      numero_nfe,
      serie,
      data_emissao,
      valor_frete: Number(transp?.['vol']?.['vTroco'] ?? total?.['vFrete'] ?? 0),
      valor_seguro: Number(total?.['vSeg'] ?? 0),
      valor_desconto: Number(total?.['vDesc'] ?? 0),
      valor_outros: Number(total?.['vOutro'] ?? 0),
      emitente: {
        cnpj: cnpj_emit,
        razao_social: emit?.['xNome'] ?? '',
        nome_fantasia: emit?.['xFant'] ?? '',
        ie: emit?.['IE'] ?? '',
        crt: Number(emit?.['CRT'] ?? 1),
        fone: emit?.['enderEmit']?.['fone'] ?? '',
        cep: (emit?.['enderEmit']?.['CEP'] ?? '').replace(/\D/g, ''),
        logradouro: emit?.['enderEmit']?.['xLgr'] ?? '',
        numero: emit?.['enderEmit']?.['nro'] ?? '',
        complemento: emit?.['enderEmit']?.['xCpl'] ?? '',
        bairro: emit?.['enderEmit']?.['xBairro'] ?? '',
        municipio: emit?.['enderEmit']?.['xMun'] ?? '',
        cod_ibge: emit?.['enderEmit']?.['cMun'] ?? '',
        uf: emit?.['enderEmit']?.['UF'] ?? '',
      },
      fornecedor: fornecedorExistente,
      itens,
    };

    res.json({ success: true, data: dados });
  } catch (err) {
    console.error('[COMPRAS_XML]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao processar XML da NF-e.' });
  }
});

export default router;

// ── Funções auxiliares DANFE ───────────────────────────────────────────────────

async function parseDanfeXml(xmlContent: string): Promise<IDanfeData> {
  const parsed = await parseStringPromise(xmlContent, { explicitArray: false, ignoreAttrs: false });
  const nfeRoot = parsed['nfeProc'] ?? parsed['NFe'];
  const nfe = nfeRoot?.['NFe'] ?? nfeRoot;
  const infNFe = nfe?.['infNFe'];
  const protNFe = parsed['nfeProc']?.['protNFe']?.['infProt'];

  const ide = infNFe?.['ide'] ?? {};
  const emit = infNFe?.['emit'] ?? {};
  const dest = infNFe?.['dest'] ?? {};
  const total = infNFe?.['total']?.['ICMSTot'] ?? {};
  const transp = infNFe?.['transp'] ?? {};
  const cobr = infNFe?.['cobr'];
  const infAdic = infNFe?.['infAdic'];

  const rawDets = infNFe?.['det'];
  const dets: Record<string, unknown>[] = Array.isArray(rawDets) ? rawDets : rawDets ? [rawDets] : [];

  const chave = (infNFe?.['$']?.['Id'] ?? '').replace('NFe', '').trim();

  // Emitente
  const emitente: IDanfeEmitente = {
    razao_social: emit['xNome'] ?? '',
    nome_fantasia: emit['xFant'],
    cnpj: emit['CNPJ'] ?? '',
    ie: emit['IE'],
    iest: emit['IEST'],
    crt: Number(emit['CRT'] ?? 1),
    logradouro: emit['enderEmit']?.['xLgr'],
    numero: emit['enderEmit']?.['nro'],
    complemento: emit['enderEmit']?.['xCpl'],
    bairro: emit['enderEmit']?.['xBairro'],
    municipio: emit['enderEmit']?.['xMun'],
    uf: emit['enderEmit']?.['UF'],
    cep: emit['enderEmit']?.['CEP'],
    fone: emit['enderEmit']?.['fone'],
  };

  // Destinatário
  const destinatario: IDanfeDestinatario = {
    razao_social: dest['xNome'] ?? '',
    cnpj: dest['CNPJ'],
    cpf: dest['CPF'],
    ie: dest['IE'],
    logradouro: dest['enderDest']?.['xLgr'],
    numero: dest['enderDest']?.['nro'],
    complemento: dest['enderDest']?.['xCpl'],
    bairro: dest['enderDest']?.['xBairro'],
    municipio: dest['enderDest']?.['xMun'],
    uf: dest['enderDest']?.['UF'],
    cep: dest['enderDest']?.['CEP'],
    fone: dest['enderDest']?.['fone'],
    email: dest['email'],
  };

  // Itens
  const itens: IDanfeItem[] = dets.map((det: Record<string, unknown>, i: number) => {
    const prod = det['prod'] as Record<string, unknown> ?? {};
    const imposto = det['imposto'] as Record<string, unknown> ?? {};
    const icms = imposto['ICMS'] as Record<string, unknown> ?? {};
    const icmsGrupo = Object.values(icms)[0] as Record<string, unknown> ?? {};
    const ipi = imposto['IPI'] as Record<string, unknown> ?? {};
    const ipiTrib = (ipi['IPITrib'] ?? ipi['IPINT'] ?? {}) as Record<string, unknown>;
    const cst = (icmsGrupo['CST'] ?? icmsGrupo['CSOSN'] ?? '') as string;
    return {
      num: i + 1,
      codigo: String(prod['cProd'] ?? ''),
      descricao: String(prod['xProd'] ?? ''),
      ncm: String(prod['NCM'] ?? ''),
      cst,
      cfop: String(prod['CFOP'] ?? ''),
      unidade: String(prod['uCom'] ?? 'UN'),
      quantidade: Number(prod['qCom'] ?? 0),
      valor_unitario: Number(prod['vUnCom'] ?? 0),
      valor_total: Number(prod['vProd'] ?? 0),
      base_icms: Number(icmsGrupo['vBC'] ?? 0),
      valor_icms: Number(icmsGrupo['vICMS'] ?? 0),
      aliq_icms: Number(icmsGrupo['pICMS'] ?? 0),
      base_icms_st: Number(icmsGrupo['vBCST'] ?? 0),
      valor_icms_st: Number(icmsGrupo['vICMSST'] ?? 0),
      valor_ipi: Number(ipiTrib['vIPI'] ?? 0),
      aliq_ipi: Number(ipiTrib['pIPI'] ?? 0),
      desconto: Number(prod['vDesc'] ?? 0),
    };
  });

  // Totais
  const totais: IDanfeTotais = {
    base_icms: Number(total['vBC'] ?? 0),
    valor_icms: Number(total['vICMS'] ?? 0),
    base_icms_st: Number(total['vBCST'] ?? 0),
    valor_icms_st: Number(total['vST'] ?? 0),
    valor_produtos: Number(total['vProd'] ?? 0),
    valor_frete: Number(total['vFrete'] ?? 0),
    valor_seguro: Number(total['vSeg'] ?? 0),
    desconto: Number(total['vDesc'] ?? 0),
    outros: Number(total['vOutro'] ?? 0),
    valor_ipi: Number(total['vIPI'] ?? 0),
    valor_total: Number(total['vNF'] ?? 0),
  };

  // Transporte
  const transpVol = Array.isArray(transp['vol']) ? transp['vol'][0] : transp['vol'];
  const transporte: IDanfeTransporte = {
    modalidade_frete: String(transp['modFrete'] ?? '9'),
    transportadora: transp['transporta']?.['xNome'],
    cnpj: transp['transporta']?.['CNPJ'],
    ie: transp['transporta']?.['IE'],
    endereco: transp['transporta']?.['xEnder'],
    municipio: transp['transporta']?.['xMun'],
    uf: transp['transporta']?.['UF'],
    placa: transp['veicTransp']?.['placa'],
    uf_veiculo: transp['veicTransp']?.['UF'],
    rntc: transp['veicTransp']?.['RNTC'],
    quantidade_volumes: transpVol ? Number(transpVol['qVol'] ?? 0) : undefined,
    especie: transpVol?.['esp'],
    marca: transpVol?.['marca'],
    numero_volumes: transpVol?.['nVol'],
    peso_liquido: transpVol ? Number(transpVol['pesoL'] ?? 0) : undefined,
    peso_bruto: transpVol ? Number(transpVol['pesoB'] ?? 0) : undefined,
  };

  // Faturas
  let faturas: IDanfeFatura[] | undefined;
  if (cobr?.['dup']) {
    const dups = Array.isArray(cobr['dup']) ? cobr['dup'] : [cobr['dup']];
    faturas = dups.map((d: Record<string, unknown>) => ({
      numero: String(d['nDup'] ?? ''),
      vencimento: String(d['dVenc'] ?? ''),
      valor: Number(d['vDup'] ?? 0),
    }));
  }

  return {
    source: 'xml',
    chave_acesso: chave || undefined,
    protocolo: protNFe?.['nProt'],
    data_protocolo: protNFe?.['dhRecbto'],
    natureza_operacao: ide['natOp'],
    tipo_operacao: Number(ide['tpNF'] ?? 0),
    numero_nfe: ide['nNF'],
    serie: ide['serie'],
    data_emissao: ide['dhEmi'] ?? ide['dEmi'],
    data_saida: ide['dhSaiEnt'] ?? ide['dSaiEnt'],
    emitente,
    destinatario,
    itens,
    totais,
    transporte,
    faturas,
    info_complementar: infAdic?.['infCpl'],
  };
}

function buildDanfeFromDb(compra: any, empresa: any): IDanfeData {
  const fornecedor = compra.fornecedor;
  const emitente: IDanfeEmitente = {
    razao_social: fornecedor?.razao_social ?? '',
    nome_fantasia: fornecedor?.nome_fantasia,
    cnpj: fornecedor?.cnpj ?? '',
    ie: fornecedor?.ie,
    logradouro: fornecedor?.logradouro,
    numero: fornecedor?.numero,
    complemento: fornecedor?.complemento,
    bairro: fornecedor?.bairro,
    municipio: fornecedor?.cidade?.descricao,
    uf: fornecedor?.cidade?.uf,
    cep: fornecedor?.cep,
    fone: fornecedor?.fone,
  };

  const destinatario: IDanfeDestinatario | undefined = empresa ? {
    razao_social: empresa.razao_social,
    cnpj: empresa.cnpj,
    logradouro: empresa.endereco,
    numero: empresa.numero,
    complemento: empresa.complemento,
    bairro: empresa.bairro,
    municipio: empresa.cidade?.descricao,
    uf: empresa.cidade?.uf,
    cep: empresa.cep,
  } : undefined;

  const itens: IDanfeItem[] = compra.itens.map((item: any, i: number) => ({
    num: i + 1,
    codigo: String(item.cod_produto),
    descricao: item.descricao_xml || item.descricao,
    ncm: item.ncm,
    cfop: item.cfop,
    unidade: item.unidade,
    quantidade: Number(item.quantidade),
    valor_unitario: Number(item.valor_unitario),
    valor_total: Number(item.valor_total),
    base_icms: Number(item.base_icms),
    valor_icms: Number(item.valor_icms),
    aliq_icms: Number(item.aliq_icms),
    base_icms_st: Number(item.base_icms_st),
    valor_icms_st: Number(item.valor_icms_st),
    valor_ipi: Number(item.valor_ipi),
    desconto: Number(item.desconto),
  }));

  const totais: IDanfeTotais = {
    base_icms: itens.reduce((s, i) => s + (i.base_icms ?? 0), 0),
    valor_icms: itens.reduce((s, i) => s + (i.valor_icms ?? 0), 0),
    base_icms_st: itens.reduce((s, i) => s + (i.base_icms_st ?? 0), 0),
    valor_icms_st: itens.reduce((s, i) => s + (i.valor_icms_st ?? 0), 0),
    valor_produtos: Number(compra.valor_produtos),
    valor_frete: Number(compra.valor_frete),
    valor_seguro: Number(compra.valor_seguro),
    desconto: Number(compra.valor_desconto),
    outros: Number(compra.valor_outros),
    valor_ipi: Number(compra.valor_ipi),
    valor_total: Number(compra.valor_total),
  };

  return {
    source: 'db',
    chave_acesso: compra.chave_acesso || undefined,
    numero_nfe: compra.numero_nfe,
    serie: compra.serie,
    data_emissao: compra.data_emissao?.toISOString(),
    data_saida: compra.data_entrada?.toISOString(),
    emitente,
    destinatario,
    itens,
    totais,
    transporte: { modalidade_frete: '9' },
    info_complementar: compra.observacao,
  };
}
