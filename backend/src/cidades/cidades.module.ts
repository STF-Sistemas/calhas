import { Module } from '@nestjs/common';
import { CepController } from './cep.controller';
import { CidadesController } from './cidades.controller';
import { CidadesService } from './cidades.service';

@Module({
  controllers: [CidadesController, CepController],
  providers: [CidadesService],
})
export class CidadesModule {}
