import { Module } from '@nestjs/common';
import { ProdutosController } from './produtos.controller';

@Module({
  controllers: [ProdutosController],
})
export class ProdutosModule {}
