import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { EStatusPedido, ETipoItemPedido } from '#shared/enums';
import { Publico } from '../common/decorators';
import { falha } from '../common/falha';
import { PrismaService } from '../prisma/prisma.service';

/** Ordem de Corte enviada a um fornecedor por link (WhatsApp). Sem login. */
@Publico()
@Controller('ordem-corte-publico')
export class OrdemCortePublicoController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':token')
  async buscar(@Param('token') token: string) {
    const pedido =
      typeof token === 'string' && token.length <= 100
        ? await this.prisma.pedido.findFirst({
            where: { token_acesso_corte: token, excluido: false },
            include: {
              empresa: true,
              cliente: true,
              itens: { include: { produto: true, corte: { include: { chapa: true } }, desenho: true } },
            },
          })
        : null;

    if (!pedido) throw falha(HttpStatus.NOT_FOUND, 'Link inválido ou não encontrado.', { code: 'NOT_FOUND' });
    if (pedido.status === EStatusPedido.Cancelado) {
      throw falha(HttpStatus.GONE, 'Este pedido foi cancelado.', { code: 'CANCELLED' });
    }
    if (!pedido.token_expiracao_corte || new Date() > new Date(pedido.token_expiracao_corte)) {
      throw falha(HttpStatus.GONE, 'Link de acesso expirado.', { code: 'EXPIRED' });
    }

    const selecionados = Array.isArray(pedido.itens_corte_selecionados)
      ? (pedido.itens_corte_selecionados as number[])
      : null;

    const itens = pedido.itens
      .filter((item) => item.tipo === ETipoItemPedido.Corte || item.tipo === ETipoItemPedido.Produto)
      .filter((item) => !selecionados || selecionados.includes(item.id))
      // Produtos primeiro, depois cortes (Produto=10 < Corte=11).
      .sort((a, b) => a.tipo - b.tipo)
      .map((item) => ({
        id: item.id,
        tipo: item.tipo,
        quantidade: Number(item.quantidade),
        observacoes: item.observacoes,
        medidas: item.medidas ?? [],
        produto: item.produto
          ? { descricao: item.produto.descricao, unidade_medida: item.produto.unidade_medida }
          : null,
        corte: item.corte
          ? {
              descricao: item.corte.descricao,
              corte: Number(item.corte.corte),
              chapa: item.corte.chapa ? { descricao: item.corte.chapa.descricao } : null,
            }
          : null,
        desenho: item.desenho
          ? { descricao: item.desenho.descricao, pontos: item.desenho.pontos, diagonais: item.desenho.diagonais }
          : Array.isArray(item.desenho_pontos) && item.desenho_pontos.length >= 2
            ? {
                descricao: 'Desenho livre',
                pontos: item.desenho_pontos,
                diagonais: Array.isArray(item.desenho_diagonais) ? item.desenho_diagonais : [],
              }
            : null,
      }));

    if (itens.length === 0) {
      throw falha(HttpStatus.NOT_FOUND, 'Este pedido não possui itens disponíveis para envio.', { code: 'NOT_FOUND' });
    }

    const { empresa } = pedido;
    return {
      success: true,
      data: {
        id: pedido.id,
        data_pedido: pedido.data_pedido,
        empresa: {
          razao_social: empresa.razao_social,
          nome_fantasia: empresa.nome_fantasia,
          cnpj: empresa.cnpj,
          telefone: empresa.telefone,
          email: empresa.email,
          logo_url: empresa.logo_url,
          marca_dagua: empresa.marca_dagua,
        },
        cliente: { razao_social: pedido.cliente.razao_social },
        itens,
      },
    };
  }
}
