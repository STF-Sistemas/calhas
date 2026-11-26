import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { EmpresaAtual } from '../common/decorators';
import { IdPipe } from '../common/validadores';
import { MeioPagamentoDto } from './dto/meio-pagamento.dto';
import { StatusMeioPagamentoDto } from './dto/status-meio-pagamento.dto';
import { MeiosPagamentoService } from './meios-pagamento.service';

@Controller('meios-pagamento')
export class MeiosPagamentoController {
  constructor(private readonly meios: MeiosPagamentoService) {}

  @Get()
  listar(@EmpresaAtual() codEmpresa: number) {
    return this.meios.listar(codEmpresa);
  }

  @Get(':id')
  buscar(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.meios.buscar(id, codEmpresa);
  }

  @Post()
  criar(@Body() dto: MeioPagamentoDto, @EmpresaAtual() codEmpresa: number) {
    return this.meios.criar(dto, codEmpresa);
  }

  @Put(':id')
  atualizar(@Param('id', IdPipe) id: number, @Body() dto: MeioPagamentoDto, @EmpresaAtual() codEmpresa: number) {
    return this.meios.atualizar(id, dto, codEmpresa);
  }

  @Patch(':id/status')
  alterarStatus(@Param('id', IdPipe) id: number, @Body() dto: StatusMeioPagamentoDto, @EmpresaAtual() codEmpresa: number) {
    return this.meios.alterarStatus(id, dto.status, codEmpresa);
  }

  @Delete(':id')
  excluir(@Param('id', IdPipe) id: number, @EmpresaAtual() codEmpresa: number) {
    return this.meios.excluir(id, codEmpresa);
  }
}
