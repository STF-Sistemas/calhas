import { Module } from '@nestjs/common';
import { OrdemCortePublicoController } from './ordem-corte-publico.controller';
import { OrdemCortePublicoService } from './ordem-corte-publico.service';

@Module({
  controllers: [OrdemCortePublicoController],
  providers: [OrdemCortePublicoService],
})
export class OrdemCortePublicoModule {}
