import { Body, Controller, Delete, Get, Headers, Post } from '@nestjs/common';
import { UsuarioAtual } from '../common/decorators';
import { JwtPayload } from '../common/jwt-payload';
import { CancelarPushDto } from './dto/cancelar-push.dto';
import { InscreverPushDto } from './dto/inscrever-push.dto';
import { PushService } from './push.service';

@Controller('push-subscription')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Post()
  inscrever(@Body() dto: InscreverPushDto, @UsuarioAtual() usuario: JwtPayload, @Headers('user-agent') agente?: string) {
    return this.push.inscrever(usuario.id, dto.endpoint, dto.keys, agente);
  }

  @Delete()
  cancelar(@Body() dto: CancelarPushDto, @UsuarioAtual() usuario: JwtPayload) {
    return this.push.cancelar(usuario.id, dto.endpoint);
  }

  @Get('vapid-public-key')
  chavePublica() {
    return this.push.chavePublica();
  }

  @Get('status')
  status(@UsuarioAtual() usuario: JwtPayload) {
    return this.push.status(usuario.id);
  }
}
