import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { IdPipe } from '../common/validadores';
import { FornecedorDto } from './dto/fornecedor.dto';
import { StatusFornecedorDto } from './dto/status-fornecedor.dto';
import { FornecedoresService } from './fornecedores.service';

@Controller('fornecedores')
export class FornecedoresController {
  constructor(private readonly fornecedores: FornecedoresService) {}

  @Get()
  listar(@EmpresaAtual() codEmpresa: number, @Query() q: Record<string, string>) {
    return this.fornecedores.listar(codEmpresa, q);
  }

  @Get('por-cnpj/:cnpj')
  porCnpj(@Param('cnpj') cnpj: string, @EmpresaAtual() codEmpresa: number) {
    return this.fornecedores.porCnpj(cnpj, codEmpresa);
  }

  @Get(':id')
  buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.fornecedores.buscar(id, codEmpresa);
  }

  @Post()
  criar(@Body() dto: FornecedorDto, @EmpresaAtual() codEmpresa: number) {
    return this.fornecedores.criar(dto, codEmpresa);
  }

  @Put(':id')
  atualizar(@Param('id', IdPipe) id: number, @Body() dto: FornecedorDto, @EmpresaAtual() codEmpresa: number) {
    return this.fornecedores.atualizar(id, dto, codEmpresa);
  }

  @Patch(':id/status')
  alterarStatus(@Param('id', IdPipe) id: number, @Body() dto: StatusFornecedorDto, @EmpresaAtual() codEmpresa: number) {
    return this.fornecedores.alterarStatus(id, dto.status, codEmpresa);
  }

  @Delete(':id')
  excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.fornecedores.excluir(id, codEmpresa);
  }
}
