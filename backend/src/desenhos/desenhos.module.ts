import { Module } from '@nestjs/common';
import { DesenhosController } from './desenhos.controller';
import { DesenhosService } from './desenhos.service';

@Module({
  controllers: [DesenhosController],
  providers: [DesenhosService],
})
export class DesenhosModule {}
