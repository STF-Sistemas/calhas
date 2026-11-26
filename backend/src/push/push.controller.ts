import { Type } from 'class-transformer';
import { Body, Controller, Delete, Get, Headers, Post } from '@nestjs/common';
import { IsNotEmpty, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';
import { UsuarioAtual } from '../common/decorators';
import { JwtPayload } from '../common/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';

class ChavesDto {
  @IsString() @IsNotEmpty() @MaxLength(500)
  p256dh: string;

  @IsString() @IsNotEmpty() @MaxLength(500)
  auth: string;
}

class CancelarDto {
  @IsUrl({ require_tld: false }, { message: 'Endpoint inválido.' })
  @MaxLength(2000)
  endpoint: string;
}

class InscreverDto extends CancelarDto {
  @ValidateNested()
  @Type(() => ChavesDto)
  keys: ChavesDto;
}

@Controller('push-subscription')
export class PushController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async inscrever(@Body() dto: InscreverDto, @UsuarioAtual() usuario: JwtPayload, @Headers('user-agent') agente?: string) {
    const user_agent = agente?.slice(0, 255) ?? null;
    const chaves = { p256dh: dto.keys.p256dh, auth: dto.keys.auth, user_agent };
    await this.prisma.pushSubscription.upsert({
      where: { cod_usuario_endpoint: { cod_usuario: usuario.id, endpoint: dto.endpoint } },
      create: { cod_usuario: usuario.id, endpoint: dto.endpoint, ...chaves },
      update: chaves,
    });
    return { success: true };
  }

  @Delete()
  async cancelar(@Body() dto: CancelarDto, @UsuarioAtual() usuario: JwtPayload) {
    await this.prisma.pushSubscription.deleteMany({ where: { cod_usuario: usuario.id, endpoint: dto.endpoint } });
    return { success: true };
  }

  @Get('vapid-public-key')
  chavePublica() {
    return { success: true, data: { publicKey: process.env['VAPID_PUBLIC_KEY'] ?? null } };
  }

  @Get('status')
  async status(@UsuarioAtual() usuario: JwtPayload) {
    const total = await this.prisma.pushSubscription.count({ where: { cod_usuario: usuario.id } });
    return { success: true, data: { inscrito: total > 0 } };
  }
}
