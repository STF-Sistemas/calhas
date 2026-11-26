import { Module } from '@nestjs/common';
import { ServicosController } from './servicos.controller';

@Module({
  controllers: [ServicosController],
})
export class ServicosModule {}
