import { Module } from '@nestjs/common';
import { EmpresasController } from './empresas.controller';
import { MinhaEmpresaController } from './minha-empresa.controller';

@Module({
  controllers: [EmpresasController, MinhaEmpresaController],
})
export class EmpresasModule {}
