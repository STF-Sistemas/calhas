import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { IdPipe } from '../common/validadores';
import { GerarLinkCorteDto, PedidoDto, PedidoItemDto, PedidoUpdateDto, StatusPedidoDto } from './dto/pedido.dto';
import { PedidosService } from './pedidos.service';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @Get()
  listar(@EmpresaAtual() codEmpresa: number, @Query() q: Record<string, string>) {
    return this.pedidos.listar(codEmpresa, q);
  }

  @Get(':id')
  buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.pedidos.buscar(id, codEmpresa);
  }

  @Post()
  criar(@Body() dto: PedidoDto, @EmpresaAtual() codEmpresa: number) {
    return this.pedidos.criar(dto, codEmpresa);
  }

  @Put(':id')
  atualizar(@Param('id', IdPipe) id: number, @Body() dto: PedidoUpdateDto, @EmpresaAtual() codEmpresa: number) {
    return this.pedidos.atualizar(id, dto, codEmpresa);
  }

  @Delete(':id')
  excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.pedidos.excluir(id, codEmpresa);
  }

  @Patch(':id/status')
  alterarStatus(@Param('id', IdPipe) id: number, @Body() dto: StatusPedidoDto, @EmpresaAtual() codEmpresa: number) {
    return this.pedidos.alterarStatus(id, dto.status, codEmpresa);
  }

  @Post(':id/itens')
  adicionarItem(@Param('id', IdPipe) id: number, @Body() dto: PedidoItemDto, @EmpresaAtual() codEmpresa: number) {
    return this.pedidos.adicionarItem(id, dto, codEmpresa);
  }

  @Put(':id/itens/:itemId')
  atualizarItem(
    @Param('id', IdPipe) id: number,
    @Param('itemId', IdPipe) itemId: number,
    @Body() dto: PedidoItemDto,
    @EmpresaAtual() codEmpresa: number,
  ) {
    return this.pedidos.atualizarItem(id, itemId, dto, codEmpresa);
  }

  @Delete(':id/itens/:itemId')
  removerItem(@Param('id', IdPipe) id: number, @Param('itemId', IdPipe) itemId: number, @EmpresaAtual() codEmpresa: number) {
    return this.pedidos.removerItem(id, itemId, codEmpresa);
  }

  @Post(':id/gerar-link')
  @HttpCode(200)
  gerarLink(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.pedidos.gerarLink(id, codEmpresa);
  }

  @Post(':id/gerar-link-corte')
  @HttpCode(200)
  gerarLinkCorte(@Param('id', IdPipe) id: number, @Body() dto: GerarLinkCorteDto, @EmpresaAtual() codEmpresa: number) {
    return this.pedidos.gerarLinkCorte(id, dto.itens, codEmpresa);
  }
}
