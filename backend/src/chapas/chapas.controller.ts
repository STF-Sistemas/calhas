import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { IdPipe } from '../common/validadores';
import { ChapasService } from './chapas.service';
import { ChapaDto } from './dto/chapa.dto';
import { CorteDto } from './dto/corte.dto';
import { StatusChapaDto } from './dto/status-chapa.dto';

@Controller('chapas')
export class ChapasController {
  constructor(private readonly chapas: ChapasService) {}

  @Get()
  listar(@EmpresaAtual() codEmpresa: number) {
    return this.chapas.listar(codEmpresa);
  }

  @Get(':id')
  buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.chapas.buscar(id, codEmpresa);
  }

  @Post()
  criar(@Body() dto: ChapaDto, @EmpresaAtual() codEmpresa: number) {
    return this.chapas.criar(dto, codEmpresa);
  }

  @Put(':id')
  atualizar(@Param('id', IdPipe) id: number, @Body() dto: ChapaDto, @EmpresaAtual() codEmpresa: number) {
    return this.chapas.atualizar(id, dto, codEmpresa);
  }

  @Patch(':id/status')
  alterarStatus(@Param('id', IdPipe) id: number, @Body() dto: StatusChapaDto, @EmpresaAtual() codEmpresa: number) {
    return this.chapas.alterarStatus(id, dto.status, codEmpresa);
  }

  @Delete(':id')
  excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.chapas.excluir(id, codEmpresa);
  }

  @Get(':id/cortes')
  listarCortes(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.chapas.listarCortes(id, codEmpresa);
  }

  @Post(':id/cortes')
  criarCorte(@Param('id', IdPipe) id: number, @Body() dto: CorteDto, @EmpresaAtual() codEmpresa: number) {
    return this.chapas.criarCorte(id, dto, codEmpresa);
  }

  @Put(':id/cortes/:corteId')
  atualizarCorte(
    @Param('id', IdPipe) id: number,
    @Param('corteId', IdPipe) corteId: number,
    @Body() dto: CorteDto,
    @EmpresaAtual() codEmpresa: number,
  ) {
    return this.chapas.atualizarCorte(id, corteId, dto, codEmpresa);
  }

  @Delete(':id/cortes/:corteId')
  excluirCorte(@Param('id', IdPipe) id: number, @Param('corteId', IdPipe) corteId: number, @EmpresaAtual() codEmpresa: number) {
    return this.chapas.excluirCorte(id, corteId, codEmpresa);
  }
}
