import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { IdPipe } from '../common/validadores';
import { ServicoDto } from './dto/servico.dto';
import { StatusServicoDto } from './dto/status-servico.dto';
import { ServicosService } from './servicos.service';

@Controller('servicos')
export class ServicosController {
  constructor(private readonly servicos: ServicosService) {}

  @Get()
  listar(@EmpresaAtual() codEmpresa: number) {
    return this.servicos.listar(codEmpresa);
  }

  @Get(':id')
  buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.servicos.buscar(id, codEmpresa);
  }

  @Post()
  criar(@Body() dto: ServicoDto, @EmpresaAtual() codEmpresa: number) {
    return this.servicos.criar(dto, codEmpresa);
  }

  @Put(':id')
  atualizar(@Param('id', IdPipe) id: number, @Body() dto: ServicoDto, @EmpresaAtual() codEmpresa: number) {
    return this.servicos.atualizar(id, dto, codEmpresa);
  }

  @Patch(':id/status')
  alterarStatus(@Param('id', IdPipe) id: number, @Body() dto: StatusServicoDto, @EmpresaAtual() codEmpresa: number) {
    return this.servicos.alterarStatus(id, dto.status, codEmpresa);
  }

  @Delete(':id')
  excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.servicos.excluir(id, codEmpresa);
  }
}
