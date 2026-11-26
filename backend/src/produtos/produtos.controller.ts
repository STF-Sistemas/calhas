import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { IdPipe } from '../common/validadores';
import { CodigoFornecedorDto } from './dto/codigo-fornecedor.dto';
import { ProdutoDto } from './dto/produto.dto';
import { StatusProdutoDto } from './dto/status-produto.dto';
import { ProdutosService } from './produtos.service';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtos: ProdutosService) {}

  @Get()
  listar(@EmpresaAtual() codEmpresa: number) {
    return this.produtos.listar(codEmpresa);
  }

  @Get('por-codigo-fornecedor')
  porCodigoFornecedor(
    @EmpresaAtual() codEmpresa: number,
    @Query('cod_fornecedor') codFornecedor?: string,
    @Query('codigo') codigo?: string,
  ) {
    return this.produtos.porCodigoFornecedor(codEmpresa, codFornecedor, codigo);
  }

  @Get('por-gtin/:gtin')
  porGtin(@Param('gtin') gtin: string, @EmpresaAtual() codEmpresa: number) {
    return this.produtos.porGtin(gtin, codEmpresa);
  }

  @Get(':id')
  buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.produtos.buscar(id, codEmpresa);
  }

  @Post()
  criar(@Body() dto: ProdutoDto, @EmpresaAtual() codEmpresa: number) {
    return this.produtos.criar(dto, codEmpresa);
  }

  @Put(':id')
  atualizar(@Param('id', IdPipe) id: number, @Body() dto: ProdutoDto, @EmpresaAtual() codEmpresa: number) {
    return this.produtos.atualizar(id, dto, codEmpresa);
  }

  @Patch(':id/status')
  alterarStatus(@Param('id', IdPipe) id: number, @Body() dto: StatusProdutoDto, @EmpresaAtual() codEmpresa: number) {
    return this.produtos.alterarStatus(id, dto.status, codEmpresa);
  }

  @Delete(':id')
  excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.produtos.excluir(id, codEmpresa);
  }

  @Post(':id/codigo-fornecedor')
  vincularCodigoFornecedor(@Param('id', IdPipe) id: number, @Body() dto: CodigoFornecedorDto, @EmpresaAtual() codEmpresa: number) {
    return this.produtos.vincularCodigoFornecedor(id, dto, codEmpresa);
  }

  @Get(':id/historico-compras')
  historicoCompras(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.produtos.historicoCompras(id, codEmpresa);
  }
}
