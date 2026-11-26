import { Module } from '@nestjs/common';
import { DesenhosController } from './desenhos.controller';

@Module({
  controllers: [DesenhosController],
})
export class DesenhosModule {}
