import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '#config/prisma';
import { authMiddleware, adminMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware, adminMiddleware);

// ── GET / — dados da empresa do usuário logado ───────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const codEmpresa = req.user!.cod_empresa;
    if (!codEmpresa) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Usuário não está vinculado a uma empresa.' });
      return;
    }

    const empresa = await prisma.empresa.findFirst({
      where: { id: codEmpresa, excluido: false },
      include: { cidade: true },
    });

    if (!empresa) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Empresa não encontrada.' });
      return;
    }

    res.json({ success: true, data: empresa });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao buscar dados da empresa.' });
  }
});

// ── Schema — apenas campos que o admin pode alterar ──────────────────────────
// Campos sensíveis (data_expiracao, valor_mensalidade, ativo, excluido)
// continuam sendo exclusividade do super_admin via /api/empresas.
const minhaEmpresaSchema = z.object({
  razao_social:   z.string().min(1).max(200),
  nome_fantasia:  z.string().max(200).nullable().optional(),
  cnpj:           z.string().min(1).max(20),
  email:          z.string().email().max(200).nullable().optional().or(z.literal('')),
  telefone:       z.string().max(20).nullable().optional(),
  cep:            z.string().max(10).nullable().optional(),
  endereco:       z.string().max(200).nullable().optional(),
  numero:         z.string().max(10).nullable().optional(),
  bairro:         z.string().max(100).nullable().optional(),
  complemento:    z.string().max(100).nullable().optional(),
  cod_cidade:     z.number().int().positive().nullable().optional(),
  marca_dagua:                 z.string().max(250).nullable().optional(),
  validar_estoque:             z.boolean().optional(),
  quantidade_desenho_por_folha: z.number().int().min(1).max(20).optional(),
});

// ── PUT / — atualiza dados da própria empresa ────────────────────────────────
router.put('/', async (req: Request, res: Response) => {
  try {
    const codEmpresa = req.user!.cod_empresa;
    if (!codEmpresa) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Usuário não está vinculado a uma empresa.' });
      return;
    }

    const existing = await prisma.empresa.findFirst({ where: { id: codEmpresa, excluido: false } });
    if (!existing) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Empresa não encontrada.' });
      return;
    }

    const parse = minhaEmpresaSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message });
      return;
    }

    const empresa = await prisma.empresa.update({
      where: { id: codEmpresa },
      data: { ...parse.data, updated_at: new Date() },
      include: { cidade: true },
    });

    res.json({ success: true, data: empresa });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao atualizar dados da empresa.' });
  }
});

export default router;
