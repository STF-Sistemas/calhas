import { Module } from '@nestjs/common';
import { PedidosPublicoController } from './pedidos-publico.controller';

@Module({
  controllers: [PedidosPublicoController],
})
export class PedidosPublicoModule {}
