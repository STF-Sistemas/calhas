import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import fetch from 'node-fetch';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const include = { cidade: true };

router.get('/', async (req: Request, res: Response) => {
  try {
    const { nome, endereco, cpfCnpj, telefone, ativo, pagina = '1', limite = '10' } = req.query as Record<string, string>;
    const where: any = { cod_empresa: req.user!.cod_empresa!, excluido: false };
    const conditions: any[] = [];

    if (nome) conditions.push({ OR: [
      { razao_social: { contains: nome, mode: 'insensitive' } },
      { nome_fantasia: { contains: nome, mode: 'insensitive' } },
    ]});
    if (endereco) conditions.push({ OR: [
      { endereco: { contains: endereco, mode: 'insensitive' } },
      { bairro: { contains: endereco, mode: 'insensitive' } },
      { cidade: { descricao: { contains: endereco, mode: 'insensitive' } } },
    ]});
    if (cpfCnpj) conditions.push({ cpf_cnpj: { contains: cpfCnpj, mode: 'insensitive' } });
    if (telefone) conditions.push({ telefone: { contains: telefone } });
    if (ativo) conditions.push({ ativo: Number(ativo) });
    if (conditions.length > 0) where.AND = conditions;

    const paginaNum = Math.max(1, parseInt(pagina) || 1);
    const limiteNum = Math.min(100, Math.max(1, parseInt(limite) || 10));

    const [total, clientes] = await Promise.all([
      prisma.cliente.count({ where }),
      prisma.cliente.findMany({ where, include, orderBy: { razao_social: 'asc' }, skip: (paginaNum - 1) * limiteNum, take: limiteNum }),
    ]);
    res.json({ success: true, data: clientes, total, pagina: paginaNum, totalPaginas: Math.ceil(total / limiteNum) });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao listar clientes.' }); }
});

router.get('/consultar-receita/:cpfcnpj', async (req: Request, res: Response) => {
  try {
    const cpfCnpj = String(req.params['cpfcnpj']).replace(/\D/g, '');

    if (cpfCnpj.length === 11) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ success: false, message: 'A consulta de CPF não está disponível em APIs públicas gratuitas. Preencha os dados manualmente.' });
      return;
    }

    if (cpfCnpj.length !== 14) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Informe um CNPJ completo (14 dígitos).' });
      return;
    }

    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cpfCnpj}`);
    if (!response.ok) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'CNPJ não encontrado na Receita Federal.' });
      return;
    }

    const d = await response.json() as any;

    // Busca ou cria a cidade pelo código IBGE (mesmo padrão do CEP)
    let cidade = null;
    if (d.codigo_municipio_ibge) {
      const ibge = String(d.codigo_municipio_ibge);
      cidade = await prisma.cidade.findFirst({ where: { codigo_ibge: ibge } });
      if (!cidade && d.municipio && d.uf) {
        cidade = await prisma.cidade.create({
          data: { descricao: d.municipio, uf: d.uf, codigo_ibge: ibge },
        });
      }
    }

    res.json({
      success: true,
      data: {
        razao_social: d.razao_social ?? '',
        nome_fantasia: d.nome_fantasia ?? '',
        email: d.email ?? '',
        telefone: (d.ddd_telefone_1 ?? '').replace(/\D/g, ''),
        cep: (d.cep ?? '').replace(/\D/g, ''),
        endereco: d.logradouro ?? '',
        numero: d.numero ?? '',
        bairro: d.bairro ?? '',
        complemento: d.complemento ?? '',
        cod_cidade: cidade?.id ?? null,
        cidade_nome: cidade?.descricao ?? d.municipio ?? '',
        uf: d.uf ?? '',
      },
    });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao consultar Receita Federal.' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
      include,
    });
    if (!cliente) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Cliente não encontrado.' }); return; }
    res.json({ success: true, data: cliente });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar cliente.' }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { cidade, cidade_nome, excluido, ...body } = req.body;
    const cliente = await prisma.cliente.create({ data: { ...body, cod_empresa: req.user!.cod_empresa! } });
    res.status(StatusCodes.CREATED).json({ success: true, data: cliente });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao criar cliente.' }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.cliente.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Cliente não encontrado.' }); return; }
    const { cidade, cidade_nome, excluido, ...body } = req.body;
    const cliente = await prisma.cliente.update({
      where: { id: Number(req.params['id']) },
      data: { ...body, updated_at: new Date() },
    });
    res.json({ success: true, data: cliente });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar cliente.' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.cliente.findFirst({
      where: { id: Number(req.params['id']), cod_empresa: req.user!.cod_empresa!, excluido: false },
    });
    if (!existing) { res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Cliente não encontrado.' }); return; }
    await prisma.cliente.update({ where: { id: Number(req.params['id']) }, data: { excluido: true } });
    res.json({ success: true, message: 'Cliente excluído.' });
  } catch { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao excluir cliente.' }); }
});

export default router;
