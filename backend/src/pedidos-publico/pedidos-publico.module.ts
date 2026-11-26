import { Module } from '@nestjs/common';
import { PedidosPublicoController } from './pedidos-publico.controller';
import { PedidosPublicoService } from './pedidos-publico.service';

@Module({
  controllers: [PedidosPublicoController],
  providers: [PedidosPublicoService],
})
export class PedidosPublicoModule {}
