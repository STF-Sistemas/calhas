import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CidadesService } from './cidades.service';

@Controller('cep')
export class CepController {
  constructor(private readonly cidades: CidadesService) {}

  @Throttle({ default: { limit: 60, ttl: 15 * 60 * 1000 } })
  @Get(':cep')
  consultar(@Param('cep') cep: string) {
    return this.cidades.consultarCep(cep);
  }
}
