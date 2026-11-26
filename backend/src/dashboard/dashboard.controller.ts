import { Controller, Get } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  resumo(@EmpresaAtual() codEmpresa: number) {
    return this.dashboard.resumo(codEmpresa);
  }
}
