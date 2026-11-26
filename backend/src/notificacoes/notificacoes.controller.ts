import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { IdPipe } from '../common/validadores';
import { NotificacoesService } from './notificacoes.service';

@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoes: NotificacoesService) {}

  @Get()
  listar(@EmpresaAtual() codEmpresa: number, @Query('apenasNaoLidas') apenasNaoLidas?: string) {
    return this.notificacoes.listar(codEmpresa, apenasNaoLidas === 'true');
  }

  @Get('nao-lidas/contagem')
  contagem(@EmpresaAtual() codEmpresa: number) {
    return this.notificacoes.contagem(codEmpresa);
  }

  @Patch('marcar-todas-lidas')
  marcarTodas(@EmpresaAtual() codEmpresa: number) {
    return this.notificacoes.marcarTodas(codEmpresa);
  }

  @Patch(':id/lida')
  marcarLida(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.notificacoes.marcarLida(id, codEmpresa);
  }
}
