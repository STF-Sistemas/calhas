import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EmpresaAtual } from '../common/decorators';
import { IdPipe } from '../common/validadores';
import { ClientesService } from './clientes.service';
import { ClienteDto } from './dto/cliente.dto';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientes: ClientesService) {}

  @Get()
  listar(@EmpresaAtual() codEmpresa: number, @Query() q: Record<string, string>) {
    return this.clientes.listar(codEmpresa, q);
  }

  @Throttle({ default: { limit: 30, ttl: 15 * 60 * 1000 } })
  @Get('consultar-receita/:cpfcnpj')
  consultarReceita(@Param('cpfcnpj') cpfCnpj: string) {
    return this.clientes.consultarReceita(cpfCnpj);
  }

  @Get(':id')
  buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.clientes.buscar(id, codEmpresa);
  }

  @Post()
  criar(@Body() dto: ClienteDto, @EmpresaAtual() codEmpresa: number) {
    return this.clientes.criar(dto, codEmpresa);
  }

  @Put(':id')
  atualizar(@Param('id', IdPipe) id: number, @Body() dto: ClienteDto, @EmpresaAtual() codEmpresa: number) {
    return this.clientes.atualizar(id, dto, codEmpresa);
  }

  @Delete(':id')
  excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.clientes.excluir(id, codEmpresa);
  }
}
