import { Module } from '@nestjs/common';
import { EmpresasController } from './empresas.controller';
import { EmpresasService } from './empresas.service';
import { MinhaEmpresaController } from './minha-empresa.controller';

@Module({
  controllers: [EmpresasController, MinhaEmpresaController],
  providers: [EmpresasService],
})
export class EmpresasModule {}
