import { Body, Controller, Get, HttpCode, Ip, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Publico } from '../common/decorators';
import { AutorizarDto } from './dto/autorizar.dto';
import { RecusarDto } from './dto/recusar.dto';
import { PedidosPublicoService } from './pedidos-publico.service';

const QUINZE_MIN = 15 * 60 * 1000;

@Publico()
@Controller('pedidos-publico')
export class PedidosPublicoController {
  constructor(private readonly pedidos: PedidosPublicoService) {}

  @Throttle({ default: { limit: 60, ttl: QUINZE_MIN } })
  @Get(':token')
  buscar(@Param('token') token: string) {
    return this.pedidos.buscar(token);
  }

  @Throttle({ default: { limit: 20, ttl: QUINZE_MIN } })
  @Post(':token/autorizar')
  @HttpCode(200)
  autorizar(@Param('token') token: string, @Body() dto: AutorizarDto, @Ip() ip: string) {
    return this.pedidos.autorizar(token, dto.assinatura, ip);
  }

  @Throttle({ default: { limit: 20, ttl: QUINZE_MIN } })
  @Post(':token/recusar')
  @HttpCode(200)
  recusar(@Param('token') token: string, @Body() dto: RecusarDto, @Ip() ip: string) {
    return this.pedidos.recusar(token, dto.motivo, ip);
  }
}
