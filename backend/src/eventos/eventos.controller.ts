import { Controller, Sse } from '@nestjs/common';
import { UsuarioAtual } from '../common/decorators';
import { JwtPayload } from '../common/jwt-payload';
import { EventosService } from './eventos.service';

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventos: EventosService) {}

  @Sse('fluxo')
  fluxo(@UsuarioAtual() usuario: JwtPayload) {
    return this.eventos.fluxo(usuario);
  }
}
