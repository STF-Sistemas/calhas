import { HttpStatus, Injectable } from '@nestjs/common';
import { falha } from '../common/falha';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(codEmpresa: number | null, apenasNaoLidas: boolean) {
    if (!codEmpresa) return { success: true, data: [] };
    const data = await this.prisma.notificacao.findMany({
      where: { cod_empresa: codEmpresa, ...(apenasNaoLidas ? { lida: false } : {}) },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    return { success: true, data };
  }

  async contagem(codEmpresa: number | null) {
    const count = codEmpresa ? await this.prisma.notificacao.count({ where: { cod_empresa: codEmpresa, lida: false } }) : 0;
    return { success: true, data: { count } };
  }

  async marcarTodas(codEmpresa: number | null) {
    if (codEmpresa) {
      await this.prisma.notificacao.updateMany({
        where: { cod_empresa: codEmpresa, lida: false },
        data: { lida: true, lida_em: new Date() },
      });
    }
    return { success: true };
  }

  async marcarLida(id: number, codEmpresa: number | null) {
    const marcada = await this.prisma.notificacao.updateMany({
      where: { id, cod_empresa: codEmpresa ?? -1 },
      data: { lida: true, lida_em: new Date() },
    });
    if (marcada.count === 0) throw falha(HttpStatus.NOT_FOUND, 'Notificação não encontrada.');
    return { success: true };
  }
}
