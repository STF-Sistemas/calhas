import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Publico } from '../common/decorators';
import { OrdemCortePublicoService } from './ordem-corte-publico.service';

@Publico()
@Controller('ordem-corte-publico')
export class OrdemCortePublicoController {
  constructor(private readonly ordemCorte: OrdemCortePublicoService) {}

  @Throttle({ default: { limit: 60, ttl: 15 * 60 * 1000 } })
  @Get(':token')
  buscar(@Param('token') token: string) {
    return this.ordemCorte.buscar(token);
  }
}
