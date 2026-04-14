import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const produtoSchema = z.object({
  descricao: z.string().min(1).max(200),
  unidade_medida: z.string().min(1).max(10),
  valor_unitario: z.number().min(0),
  custo: z.preprocess(v => v ?? 0, z.number().min(0)),
  markup: z.preprocess(v => v ?? 0, z.number().min(0)),
  estoque_atual: z.preprocess(v => v ?? 0, z.number().min(0)),
  ncm: z.string().max(10).nullish().or(z.literal('')),
  cest: z.string().max(7).nullish().or(z.literal('')),
  gtin: z.string().max(14).nullish().or(z.literal('')),
  cfop_padrao: z.string().max(5).nullish().or(z.literal('')),
  origem: z.preprocess(v => v ?? 0, z.number().int().min(0).max(8)),
});

const updateSchema = produtoSchema;
// custo e estoque_atual não são alterados pelo PUT — são gerenciados pelo módulo de compras

router.get('/', async (req: Request, res: Response) => {
  try {
    const produtos = await prisma.produto.findMany({
      where: { cod_empresa: req.user!.cod_empresa!, excluido: false },
      orderBy: { descricao: 'asc' },
    });
    res.json({ success: true, data: produtos });
  } catch (err) {
    console.error('[PRODUTOS_GET]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar produtos.' });
  }
});

router.get('/por-codigo-fornecedor', async (req: Request, res: Response) => {
  try {
    const codFornecedor = Number(req.query['cod_fornecedor']);
    const codigo = String(req.query['codigo'] ?? '').trim();
    if (!codFornecedor || !codigo) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Parâmetros cod_fornecedor e codigo são obrigatórios.' });
      return;
    }
    const vinculo = await prisma.produtoFornecedor.findFirst({
      where: { cod_fornecedor: codFornecedor, codigo_produto_fornecedor: codigo },
      include: { produto: true },
    });
    if (!vinculo || vinculo.produto.excluido || vinculo.produto.cod_empresa !== req.user!.cod_empresa!) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Produto não encontrado pelo código do fornecedor.' });
      return;
    }
    res.json({ success: true, data: vinculo.produto });
  } catch (err) {
    console.error('[PRODUTOS_GET_CODIGO_FORNECEDOR]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar produto por código do fornecedor.' });
  }
});

router.get('/por-gtin/:gtin', async (req: Request, res: Response) => {
  try {
    const gtin = String(req.params['gtin']).trim();
    if (!gtin) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'GTIN inválido.' });
      return;
    }
    const produto = await prisma.produto.findFirst({
      where: { gtin, cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!produto) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Produto não encontrado pelo GTIN.' });
      return;
    }
    res.json({ success: true, data: produto });
  } catch (err) {
    console.error('[PRODUTOS_GET_GTIN]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar produto por GTIN.' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const produto = await prisma.produto.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!produto) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Produto não encontrado.' }); return; }
    res.json({ success: true, data: produto });
  } catch (err) {
    console.error('[PRODUTOS_GET_ID]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar produto.' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parse = produtoSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }
    const produto = await prisma.produto.create({ data: { ...parse.data, cod_empresa: req.user!.cod_empresa! } });
    res.status(StatusCodes.CREATED).json({ success: true, data: produto });
  } catch (err) {
    console.error('[PRODUTOS_POST]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar produto.' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.produto.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Produto não encontrado.' }); return; }

    const parse = updateSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message }); return;
    }
    // custo, markup e estoque_atual podem ser editados pelo PUT
    const { estoque_atual, ...dadosSemEstoque } = parse.data;
    const dadosSemCusto = dadosSemEstoque;
    const produto = await prisma.produto.update({ where: { id: Number(req.params['id']) }, data: dadosSemCusto });
    res.json({ success: true, data: produto });
  } catch (err) {
    console.error('[PRODUTOS_PUT]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar produto.' });
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (status !== 1 && status !== 2) { res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Status inválido.' }); return; }
    const existing = await prisma.produto.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Produto não encontrado.' }); return; }
    const produto = await prisma.produto.update({ where: { id: Number(req.params['id']) }, data: { status } });
    res.json({ success: true, data: produto });
  } catch (err) {
    console.error('[PRODUTOS_STATUS]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao alterar status do produto.' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.produto.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Produto não encontrado.' }); return; }
    await prisma.produto.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Produto excluído.' });
  } catch (err) {
    console.error('[PRODUTOS_DELETE]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir produto.' });
  }
});

// ── POST /:id/codigo-fornecedor — vincula código do fornecedor ao produto ─────
router.post('/:id/codigo-fornecedor', async (req: Request, res: Response) => {
  try {
    const codProduto = Number(req.params['id']);
    const { cod_fornecedor, codigo } = req.body as { cod_fornecedor: number; codigo: string };
    if (!cod_fornecedor || !codigo?.trim()) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'cod_fornecedor e codigo são obrigatórios.' });
      return;
    }
    const produto = await prisma.produto.findFirst({
      where: { id: codProduto, cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!produto) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Produto não encontrado.' });
      return;
    }
    const vinculo = await prisma.produtoFornecedor.upsert({
      where: { cod_fornecedor_codigo_produto_fornecedor: { cod_fornecedor, codigo_produto_fornecedor: codigo.trim() } },
      create: { cod_produto: codProduto, cod_fornecedor, codigo_produto_fornecedor: codigo.trim() },
      update: { cod_produto: codProduto },
    });
    res.json({ success: true, data: vinculo });
  } catch (err) {
    console.error('[PRODUTOS_CODIGO_FORNECEDOR]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao salvar código do fornecedor.' });
  }
});

// ── GET /:id/historico-compras — últimas 20 compras do produto ────────────────
router.get('/:id/historico-compras', async (req: Request, res: Response) => {
  try {
    const produto = await prisma.produto.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!produto) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Produto não encontrado.' });
      return;
    }

    const itens = await prisma.compraItem.findMany({
      where: {
        cod_produto: Number(req.params['id']),
        excluido: false,
        compra: { cod_empresa: req.user!.cod_empresa!, excluido: false },
      },
      include: {
        compra: {
          select: {
            id: true,
            numero_nfe: true,
            serie: true,
            data_emissao: true,
            fornecedor: { select: { id: true, razao_social: true } },
          },
        },
      },
      orderBy: { compra: { data_emissao: 'desc' } },
      take: 20,
    });

    const historico = itens.map((item) => ({
      cod_compra: item.cod_compra,
      numero_nfe: item.compra.numero_nfe ?? '',
      serie: item.compra.serie ?? '',
      data_emissao: item.compra.data_emissao,
      fornecedor: item.compra.fornecedor?.razao_social ?? '',
      quantidade: Number(item.quantidade),
      valor_unitario: Number(item.valor_unitario),
      valor_total: Number(item.valor_total),
      custo_unitario: Number(item.custo_unitario),
    }));

    res.json({ success: true, data: historico });
  } catch (err) {
    console.error('[PRODUTOS_HISTORICO]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar histórico.' });
  }
});

export default router;
