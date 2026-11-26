import { Module } from '@nestjs/common';
import { PerfilController } from './perfil.controller';
import { UsuariosController } from './usuarios.controller';

@Module({
  controllers: [UsuariosController, PerfilController],
})
export class UsuariosModule {}
