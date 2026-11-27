import { Controller, Sse } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { EventosService } from './eventos.service';

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventos: EventosService) {}

  @Sse('fluxo')
  fluxo(@EmpresaAtual() codEmpresa: number | null) {
    return this.eventos.fluxo(codEmpresa ?? null);
  }
}
