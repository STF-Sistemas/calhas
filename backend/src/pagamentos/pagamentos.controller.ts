import { Body, Controller, Get, HttpCode, Logger, Param, Post, Put } from '@nestjs/common';
import { ApenasSuperAdmin, Publico, SemLicenca, UsuarioAtual } from '../common/decorators';
import { JwtPayload } from '../common/jwt-payload';
import { IdPipe } from '../common/validadores';
import { PagamentosService } from './pagamentos.service';

/** Pagamento da licença: funciona mesmo com a licença vencida. */
@SemLicenca()
@Controller('pagamentos')
export class PagamentosController {
  private readonly logger = new Logger(PagamentosController.name);

  constructor(private readonly pagamentos: PagamentosService) {}

  @Post('pix/criar')
  @HttpCode(200)
  criarPix(@UsuarioAtual() usuario: JwtPayload) {
    return this.pagamentos.criarPix(usuario.cod_empresa);
  }

  @Get('pix/status/:id')
  status(@Param('id', IdPipe) id: number, @UsuarioAtual() usuario: JwtPayload) {
    return this.pagamentos.status(id, usuario.cod_empresa);
  }

  /** Mercado Pago: responde sempre 200 (retries agressivos em 4xx/5xx). */
  @Publico()
  @Post('webhook')
  @HttpCode(200)
  async webhook(@Body() corpo: { type?: string; data?: { id?: unknown } }) {
    try {
      await this.pagamentos.webhook(corpo);
    } catch (erro) {
      this.logger.error(`Webhook: ${(erro as Error).message}`);
    }
    return { success: true };
  }

  @ApenasSuperAdmin()
  @Put('confirmar/:id')
  confirmar(@Param('id', IdPipe) id: number) {
    return this.pagamentos.confirmarManual(id);
  }

  @ApenasSuperAdmin()
  @Get('pendentes')
  pendentes() {
    return this.pagamentos.pendentes();
  }
}
