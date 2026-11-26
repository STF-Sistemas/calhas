import { Module } from '@nestjs/common';
import { MeiosPagamentoController } from './meios-pagamento.controller';
import { MeiosPagamentoService } from './meios-pagamento.service';

@Module({
  controllers: [MeiosPagamentoController],
  providers: [MeiosPagamentoService],
})
export class MeiosPagamentoModule {}
