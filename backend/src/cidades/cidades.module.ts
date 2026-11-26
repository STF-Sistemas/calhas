import { Module } from '@nestjs/common';
import { CepController } from './cep.controller';
import { CidadesController } from './cidades.controller';

@Module({
  controllers: [CidadesController, CepController],
})
export class CidadesModule {}
