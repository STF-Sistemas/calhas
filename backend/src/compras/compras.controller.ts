import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmpresaAtual } from '../common/decorators';
import { falha } from '../common/falha';
import { IdPipe } from '../common/validadores';
import { CompraDto, StatusCompraDto } from './dto/compra.dto';
import { ComprasService } from './compras.service';

@Controller('compras')
export class ComprasController {
  constructor(private readonly compras: ComprasService) {}

  @Get()
  listar(@EmpresaAtual() codEmpresa: number, @Query() q: Record<string, string>) {
    return this.compras.listar(codEmpresa, q);
  }

  @Post('importar-xml')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('arquivo', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  importarXml(@UploadedFile() arquivo: { buffer?: Buffer } | undefined, @EmpresaAtual() codEmpresa: number) {
    if (!arquivo?.buffer) throw falha(HttpStatus.BAD_REQUEST, 'Arquivo XML não enviado.');
    return this.compras.importarXml(arquivo.buffer.toString('utf-8'), codEmpresa);
  }

  @Get(':id/danfe-data')
  danfe(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.compras.danfe(id, codEmpresa);
  }

  @Get(':id')
  buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.compras.buscar(id, codEmpresa);
  }

  @Post()
  criar(@Body() dto: CompraDto, @EmpresaAtual() codEmpresa: number) {
    return this.compras.criar(dto, codEmpresa);
  }

  @Put(':id')
  atualizar(@Param('id', IdPipe) id: number, @Body() dto: CompraDto, @EmpresaAtual() codEmpresa: number) {
    return this.compras.atualizar(id, dto, codEmpresa);
  }

  @Patch(':id/status')
  alterarStatus(@Param('id', IdPipe) id: number, @Body() dto: StatusCompraDto, @EmpresaAtual() codEmpresa: number) {
    return this.compras.alterarStatus(id, dto.status, dto.motivo_cancelamento, codEmpresa);
  }

  @Post(':id/atualizar-custo')
  @HttpCode(200)
  atualizarCusto(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.compras.atualizarCusto(id, codEmpresa);
  }

  @Delete(':id')
  excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.compras.excluir(id, codEmpresa);
  }
}
