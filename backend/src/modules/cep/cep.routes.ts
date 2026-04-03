import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();

interface ViaCepResponse {
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean;
}

router.get('/:cep', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cepRaw = req.params['cep'];
    const cep = (typeof cepRaw === 'string' ? cepRaw : (cepRaw as string[])[0]).replace(/\D/g, '');

    if (cep.length !== 8) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'CEP inválido.' });
      return;
    }

    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = (await response.json()) as ViaCepResponse;

    if (dados.erro) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'CEP não encontrado.' });
      return;
    }

    // Busca ou cria a cidade
    let cidade = await prisma.cidade.findFirst({
      where: { codigo_ibge: dados.ibge },
    });

    if (!cidade) {
      cidade = await prisma.cidade.create({
        data: {
          descricao: dados.localidade,
          uf: dados.uf,
          codigo_ibge: dados.ibge,
        },
      });
    }

    res.json({
      success: true,
      data: {
        cep,
        logradouro: (dados as any).logradouro || '',
        complemento: (dados as any).complemento || '',
        bairro: (dados as any).bairro || '',
        localidade: dados.localidade,
        uf: dados.uf,
        cidade,
      },
    });
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao consultar CEP.' });
  }
});

export default router;
