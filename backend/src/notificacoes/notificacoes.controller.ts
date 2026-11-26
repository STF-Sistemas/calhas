import { Controller, Get, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { IdPipe } from '../common/validadores';
import { PrismaService } from '../prisma/prisma.service';

@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listar(@EmpresaAtual() codEmpresa: number, @Query('apenasNaoLidas') apenasNaoLidas?: string) {
    if (!codEmpresa) return { success: true, data: [] };
    const data = await this.prisma.notificacao.findMany({
      where: { cod_empresa: codEmpresa, ...(apenasNaoLidas === 'true' ? { lida: false } : {}) },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    return { success: true, data };
  }

  @Get('nao-lidas/contagem')
  async contagem(@EmpresaAtual() codEmpresa: number) {
    const count = codEmpresa ? await this.prisma.notificacao.count({ where: { cod_empresa: codEmpresa, lida: false } }) : 0;
    return { success: true, data: { count } };
  }

  @Patch('marcar-todas-lidas')
  async marcarTodas(@EmpresaAtual() codEmpresa: number) {
    if (codEmpresa) {
      await this.prisma.notificacao.updateMany({
        where: { cod_empresa: codEmpresa, lida: false },
        data: { lida: true, lida_em: new Date() },
      });
    }
    return { success: true };
  }

  @Patch(':id/lida')
  async marcarLida(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    const notificacao = await this.prisma.notificacao.findFirst({ where: { id, cod_empresa: codEmpresa ?? -1 } });
    if (!notificacao) throw falha(HttpStatus.NOT_FOUND, 'Notificação não encontrada.');
    await this.prisma.notificacao.update({ where: { id }, data: { lida: true, lida_em: new Date() } });
    return { success: true };
  }
}
