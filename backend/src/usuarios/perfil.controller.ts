import { Body, Controller, Get, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsuarioAtual } from '../common/decorators';
import { JwtPayload } from '../common/jwt-payload';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
import { PerfilDto } from './dto/perfil.dto';
import { PerfilService } from './perfil.service';

@Controller('perfil')
export class PerfilController {
  constructor(private readonly perfil: PerfilService) {}

  @Get()
  buscar(@UsuarioAtual() usuario: JwtPayload) {
    return this.perfil.buscar(usuario.id);
  }

  @Put()
  atualizar(@Body() dto: PerfilDto, @UsuarioAtual() usuario: JwtPayload) {
    return this.perfil.atualizar(dto, usuario.id);
  }

  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  @Put('senha')
  alterarSenha(@Body() dto: AlterarSenhaDto, @UsuarioAtual() usuario: JwtPayload) {
    return this.perfil.alterarSenha(dto, usuario.id);
  }
}
