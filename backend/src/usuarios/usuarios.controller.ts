import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApenasAdmin, UsuarioAtual } from '../common/decorators';
import { JwtPayload } from '../common/jwt-payload';
import { IdPipe } from '../common/validadores';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { UsuariosService } from './usuarios.service';

@ApenasAdmin()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  listar(@UsuarioAtual() usuario: JwtPayload) {
    return this.usuarios.listar(usuario);
  }

  @Get(':id')
  buscar(@Param('id', IdPipe) id: number, @UsuarioAtual() usuario: JwtPayload) {
    return this.usuarios.buscar(id, usuario);
  }

  @Post()
  criar(@Body() dto: CriarUsuarioDto, @UsuarioAtual() usuario: JwtPayload) {
    return this.usuarios.criar(dto, usuario);
  }

  @Put(':id')
  atualizar(@Param('id', IdPipe) id: number, @Body() dto: AtualizarUsuarioDto, @UsuarioAtual() usuario: JwtPayload) {
    return this.usuarios.atualizar(id, dto, usuario);
  }

  @Delete(':id')
  excluir(@Param('id', IdPipe) id: number, @UsuarioAtual() usuario: JwtPayload) {
    return this.usuarios.excluir(id, usuario);
  }
}
