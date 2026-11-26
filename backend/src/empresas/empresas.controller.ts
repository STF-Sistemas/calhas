import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApenasAdmin, ApenasSuperAdmin, UsuarioAtual } from '../common/decorators';
import { JwtPayload } from '../common/jwt-payload';
import { IdPipe } from '../common/validadores';
import { EmpresaDto, ValidadeDto } from './dto/empresa.dto';
import { EmpresasService } from './empresas.service';

@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresas: EmpresasService) {}

  @ApenasSuperAdmin()
  @Get()
  listar() {
    return this.empresas.listar();
  }

  @ApenasAdmin()
  @Get(':id')
  buscar(@Param('id', IdPipe) id: number, @UsuarioAtual() usuario: JwtPayload) {
    return this.empresas.buscar(id, usuario);
  }

  @ApenasSuperAdmin()
  @Post()
  criar(@Body() dto: EmpresaDto) {
    return this.empresas.criar(dto);
  }

  @ApenasAdmin()
  @Put(':id')
  atualizar(@Param('id', IdPipe) id: number, @Body() dto: EmpresaDto, @UsuarioAtual() usuario: JwtPayload) {
    return this.empresas.atualizar(id, dto, usuario);
  }

  @ApenasSuperAdmin()
  @Put(':id/validade')
  atualizarValidade(@Param('id', IdPipe) id: number, @Body() dto: ValidadeDto) {
    return this.empresas.atualizarValidade(id, dto);
  }

  @ApenasSuperAdmin()
  @Delete(':id')
  excluir(@Param('id', IdPipe) id: number) {
    return this.empresas.excluir(id);
  }
}
