import { Module } from '@nestjs/common';
import { MeiosPagamentoController } from './meios-pagamento.controller';

@Module({
  controllers: [MeiosPagamentoController],
})
export class MeiosPagamentoModule {}
