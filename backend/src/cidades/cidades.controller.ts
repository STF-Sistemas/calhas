import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('cidades')
export class CidadesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listar(@Query('q') q?: string) {
    const termo = typeof q === 'string' ? q.trim().slice(0, 100) : '';
    const cidades = await this.prisma.cidade.findMany({
      where: termo ? { descricao: { contains: termo, mode: 'insensitive' } } : {},
      orderBy: { descricao: 'asc' },
    });
    return { success: true, data: cidades };
  }
}
