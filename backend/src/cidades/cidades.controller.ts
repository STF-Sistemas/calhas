import { Controller, Get, Query } from '@nestjs/common';
import { CidadesService } from './cidades.service';

@Controller('cidades')
export class CidadesController {
  constructor(private readonly cidades: CidadesService) {}

  @Get()
  listar(@Query('q') q?: string) {
    return this.cidades.listar(q);
  }
}
