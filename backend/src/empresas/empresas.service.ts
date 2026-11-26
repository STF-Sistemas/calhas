import { HttpStatus, Injectable } from '@nestjs/common';
import { falha } from '../common/falha';
import { JwtPayload } from '../common/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { EmpresaDto, MinhaEmpresaDto, ValidadeDto } from './dto/empresa.dto';

function dadosEmpresa(dto: EmpresaDto, superAdmin: boolean) {
  const { data_expiracao, valor_mensalidade, ativo, ...resto } = dto;
  const base = { ...resto, email: resto.email || null };
  if (!superAdmin) return base;
  return {
    ...base,
    ...(data_expiracao !== undefined && { data_expiracao: data_expiracao ? new Date(data_expiracao) : null }),
    ...(valor_mensalidade !== undefined && { valor_mensalidade }),
    ...(ativo !== undefined && { ativo }),
  };
}

@Injectable()
export class EmpresasService {
  constructor(private readonly prisma: PrismaService) {}

  private async obter(id: number) {
    const empresa = await this.prisma.empresa.findFirst({ where: { id, excluido: false }, include: { cidade: true } });
    if (!empresa) throw falha(HttpStatus.NOT_FOUND, 'Empresa não encontrada.');
    return empresa;
  }

  private exigirPropria(id: number, usuario: JwtPayload): void {
    if (!usuario.super_admin && usuario.cod_empresa !== id) throw falha(HttpStatus.FORBIDDEN, 'Acesso negado.');
  }

  async listar() {
    const data = await this.prisma.empresa.findMany({
      where: { excluido: false },
      include: { cidade: true },
      orderBy: { razao_social: 'asc' },
      take: 2000,
    });
    return { success: true, data };
  }

  async buscar(id: number, usuario: JwtPayload) {
    this.exigirPropria(id, usuario);
    return { success: true, data: await this.obter(id) };
  }

  async criar(dto: EmpresaDto) {
    return { success: true, data: await this.prisma.empresa.create({ data: dadosEmpresa(dto, true) }) };
  }

  async atualizar(id: number, dto: EmpresaDto, usuario: JwtPayload) {
    this.exigirPropria(id, usuario);
    await this.obter(id);
    const data = await this.prisma.empresa.update({ where: { id }, data: dadosEmpresa(dto, usuario.super_admin) });
    return { success: true, data };
  }

  async atualizarValidade(id: number, dto: ValidadeDto) {
    await this.obter(id);
    const data = await this.prisma.empresa.update({
      where: { id },
      data: {
        data_expiracao: dto.data_expiracao ? new Date(dto.data_expiracao) : null,
        ...(dto.valor_mensalidade !== undefined && { valor_mensalidade: dto.valor_mensalidade }),
      },
    });
    return { success: true, data };
  }

  async excluir(id: number) {
    await this.obter(id);
    await this.prisma.empresa.update({ where: { id }, data: { excluido: true } });
    return { success: true, message: 'Empresa excluída.' };
  }

  private async obterMinha(codEmpresa: number | null) {
    if (!codEmpresa) throw falha(HttpStatus.BAD_REQUEST, 'Usuário não está vinculado a uma empresa.');
    return this.obter(codEmpresa);
  }

  async buscarMinha(codEmpresa: number | null) {
    return { success: true, data: await this.obterMinha(codEmpresa) };
  }

  async atualizarMinha(dto: MinhaEmpresaDto, codEmpresa: number | null) {
    const empresa = await this.obterMinha(codEmpresa);
    const data = await this.prisma.empresa.update({
      where: { id: empresa.id },
      data: { ...dto, email: dto.email || null },
      include: { cidade: true },
    });
    return { success: true, data };
  }
}
