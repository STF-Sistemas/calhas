import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const include = { cidade: true };

const fornecedorSchema = z.object({
  razao_social: z.string().min(1).max(200),
  nome_fantasia: z.string().max(200).nullish().or(z.literal('')),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos numéricos'),
  ie: z.string().max(20).nullish().or(z.literal('')),
  iest: z.string().max(20).nullish().or(z.literal('')),
  im: z.string().max(20).nullish().or(z.literal('')),
  crt: z.number().int().min(1).max(3).default(1),
  email: z.string().email().max(200).nullish().or(z.literal('')),
  fone: z.string().max(20).nullish().or(z.literal('')),
  cep: z.string().max(8).nullish().or(z.literal('')),
  logradouro: z.string().max(200).nullish().or(z.literal('')),
  numero: z.string().max(20).nullish().or(z.literal('')),
  complemento: z.string().max(100).nullish().or(z.literal('')),
  bairro: z.string().max(100).nullish().or(z.literal('')),
  cod_cidade: z.number().int().positive().nullish(),
});

// GET / — lista fornecedores da empresa
router.get('/', async (req: Request, res: Response) => {
  try {
    const { razaoSocial, nomeFantasia, cnpj, telefone, status, pagina = '1', limite = '10' } = req.query as Record<string, string>;
    const where: any = { cod_empresa: req.user!.cod_empresa!, excluido: false };
    const conditions: any[] = [];

    if (razaoSocial) conditions.push({ razao_social: { contains: razaoSocial, mode: 'insensitive' } });
    if (nomeFantasia) conditions.push({ nome_fantasia: { contains: nomeFantasia, mode: 'insensitive' } });
    if (cnpj) conditions.push({ cnpj: { contains: cnpj.replace(/\D/g, '') } });
    if (telefone) conditions.push({ fone: { contains: telefone } });
    if (status) conditions.push({ status: Number(status) });
    if (conditions.length > 0) where.AND = conditions;

    const paginaNum = Math.max(1, parseInt(pagina) || 1);
    const limiteNum = Math.min(100, Math.max(1, parseInt(limite) || 10));

    const [total, fornecedores] = await Promise.all([
      prisma.fornecedor.count({ where }),
      prisma.fornecedor.findMany({ where, include, orderBy: { razao_social: 'asc' }, skip: (paginaNum - 1) * limiteNum, take: limiteNum }),
    ]);
    res.json({ success: true, data: fornecedores, total, pagina: paginaNum, totalPaginas: Math.ceil(total / limiteNum) });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar fornecedores.' });
  }
});

// GET /por-cnpj/:cnpj — lookup por CNPJ (apenas dígitos)
router.get('/por-cnpj/:cnpj', async (req: Request, res: Response) => {
  try {
    const cnpj = String(req.params['cnpj']).replace(/\D/g, '');
    if (cnpj.length !== 14) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'CNPJ inválido.' });
      return;
    }
    const fornecedor = await prisma.fornecedor.findFirst({
      where: { cnpj, cod_empresa: req.user!.cod_empresa!, excluido: false },
      include,
    });
    if (!fornecedor) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Fornecedor não encontrado.' });
      return;
    }
    res.json({ success: true, data: fornecedor });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar fornecedor por CNPJ.' });
  }
});

// GET /:id — busca por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const fornecedor = await prisma.fornecedor.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
      include,
    });
    if (!fornecedor) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Fornecedor não encontrado.' });
      return;
    }
    res.json({ success: true, data: fornecedor });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar fornecedor.' });
  }
});

// POST / — cria fornecedor
router.post('/', async (req: Request, res: Response) => {
  try {
    const parse = fornecedorSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0]!.message });
      return;
    }
    // Verifica duplicidade de CNPJ na empresa
    const existing = await prisma.fornecedor.findFirst({
      where: { cnpj: parse.data.cnpj, cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (existing) {
      res.status(StatusCodes.CONFLICT).json({ success: false, message: 'Já existe um fornecedor com este CNPJ.' });
      return;
    }
    const fornecedor = await prisma.fornecedor.create({
      data: { ...parse.data, cod_empresa: req.user!.cod_empresa! },
      include,
    });
    res.status(StatusCodes.CREATED).json({ success: true, data: fornecedor });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar fornecedor.' });
  }
});

// PUT /:id — atualiza fornecedor
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.fornecedor.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Fornecedor não encontrado.' });
      return;
    }
    const parse = fornecedorSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0]!.message });
      return;
    }
    // Verifica duplicidade de CNPJ (exceto o próprio)
    const dup = await prisma.fornecedor.findFirst({
      where: {
        cnpj: parse.data.cnpj,
        cod_empresa: req.user!.cod_empresa!,
        excluido: false,
        NOT: { id: Number(req.params['id']) },
      },
    });
    if (dup) {
      res.status(StatusCodes.CONFLICT).json({ success: false, message: 'Já existe outro fornecedor com este CNPJ.' });
      return;
    }
    const fornecedor = await prisma.fornecedor.update({
      where: { id: Number(req.params['id']) },
      data: parse.data,
      include,
    });
    res.json({ success: true, data: fornecedor });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar fornecedor.' });
  }
});

// PATCH /:id/status — ativa/inativa
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (status !== 1 && status !== 2) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Status inválido.' });
      return;
    }
    const existing = await prisma.fornecedor.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Fornecedor não encontrado.' });
      return;
    }
    const fornecedor = await prisma.fornecedor.update({ where: { id: Number(req.params['id']) }, data: { status } });
    res.json({ success: true, data: fornecedor });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao alterar status do fornecedor.' });
  }
});

// DELETE /:id — soft delete
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.fornecedor.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Fornecedor não encontrado.' });
      return;
    }
    await prisma.fornecedor.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Fornecedor excluído.' });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir fornecedor.' });
  }
});

export default router;
