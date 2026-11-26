import { Module } from '@nestjs/common';
import { ChapasController } from './chapas.controller';

@Module({
  controllers: [ChapasController],
})
export class ChapasModule {}
