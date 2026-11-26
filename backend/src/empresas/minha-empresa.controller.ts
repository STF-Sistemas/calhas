import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApenasAdmin, EmpresaAtual } from '../common/decorators';
import { MinhaEmpresaDto } from './dto/empresa.dto';
import { EmpresasService } from './empresas.service';

@ApenasAdmin()
@Controller('minha-empresa')
export class MinhaEmpresaController {
  constructor(private readonly empresas: EmpresasService) {}

  @Get()
  buscar(@EmpresaAtual() codEmpresa: number) {
    return this.empresas.buscarMinha(codEmpresa);
  }

  @Put()
  atualizar(@Body() dto: MinhaEmpresaDto, @EmpresaAtual() codEmpresa: number) {
    return this.empresas.atualizarMinha(dto, codEmpresa);
  }
}
