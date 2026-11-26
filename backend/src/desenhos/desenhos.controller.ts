import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { IdPipe } from '../common/validadores';
import { DesenhosService } from './desenhos.service';
import { DesenhoDto } from './dto/desenho.dto';

@Controller('desenhos')
export class DesenhosController {
  constructor(private readonly desenhos: DesenhosService) {}

  @Get()
  listar(@EmpresaAtual() codEmpresa: number) {
    return this.desenhos.listar(codEmpresa);
  }

  @Get(':id')
  buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.desenhos.buscar(id, codEmpresa);
  }

  @Post()
  criar(@Body() dto: DesenhoDto, @EmpresaAtual() codEmpresa: number) {
    return this.desenhos.criar(dto, codEmpresa);
  }

  @Put(':id')
  atualizar(@Param('id', IdPipe) id: number, @Body() dto: DesenhoDto, @EmpresaAtual() codEmpresa: number) {
    return this.desenhos.atualizar(id, dto, codEmpresa);
  }

  @Delete(':id')
  excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.desenhos.excluir(id, codEmpresa);
  }
}
