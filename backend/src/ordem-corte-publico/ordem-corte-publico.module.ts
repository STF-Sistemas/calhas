import { Module } from '@nestjs/common';
import { OrdemCortePublicoController } from './ordem-corte-publico.controller';

@Module({
  controllers: [OrdemCortePublicoController],
})
export class OrdemCortePublicoModule {}
