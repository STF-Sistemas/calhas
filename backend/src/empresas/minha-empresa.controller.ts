import { Body, Controller, Get, HttpStatus, Put } from '@nestjs/common';
import { ApenasAdmin, EmpresaAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { PrismaService } from '../prisma/prisma.service';
import { MinhaEmpresaDto } from './empresa.dto';

@ApenasAdmin()
@Controller('minha-empresa')
export class MinhaEmpresaController {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(codEmpresa: number) {
    if (!codEmpresa) throw falha(HttpStatus.BAD_REQUEST, 'Usuário não está vinculado a uma empresa.');
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: codEmpresa, excluido: false },
      include: { cidade: true },
    });
    if (!empresa) throw falha(HttpStatus.NOT_FOUND, 'Empresa não encontrada.');
    return empresa;
  }

  @Get()
  async buscar(@EmpresaAtual() codEmpresa: number) {
    return { success: true, data: await this.obter(codEmpresa) };
  }

  @Put()
  async atualizar(@Body() dto: MinhaEmpresaDto, @EmpresaAtual() codEmpresa: number) {
    await this.obter(codEmpresa);
    const data = await this.prisma.empresa.update({
      where: { id: codEmpresa },
      data: { ...dto, email: dto.email || null },
      include: { cidade: true },
    });
    return { success: true, data };
  }
}
