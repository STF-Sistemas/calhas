import { Controller, Get, Query } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { RelatoriosService } from './relatorios.service';

@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly relatorios: RelatoriosService) {}

  @Get('pedidos-lucros')
  pedidosLucros(@EmpresaAtual() codEmpresa: number, @Query() q: Record<string, string>) {
    return this.relatorios.pedidosLucros(codEmpresa, q);
  }
}
