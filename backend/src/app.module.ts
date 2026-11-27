import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LimiteGuard } from './common/guards/limite.guard';
import { AuthModule } from './auth/auth.module';
import { ChapasModule } from './chapas/chapas.module';
import { CidadesModule } from './cidades/cidades.module';
import { ClientesModule } from './clientes/clientes.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { LicencaGuard } from './common/guards/licenca.guard';
import { PerfilGuard } from './common/guards/perfil.guard';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ComprasModule } from './compras/compras.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DesenhosModule } from './desenhos/desenhos.module';
import { EmpresasModule } from './empresas/empresas.module';
import { FornecedoresModule } from './fornecedores/fornecedores.module';
import { MailModule } from './mail/mail.module';
import { MeiosPagamentoModule } from './meios-pagamento/meios-pagamento.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { OrdemCortePublicoModule } from './ordem-corte-publico/ordem-corte-publico.module';
import { PagamentosModule } from './pagamentos/pagamentos.module';
import { PedidosPublicoModule } from './pedidos-publico/pedidos-publico.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProdutosModule } from './produtos/produtos.module';
import { PushModule } from './push/push.module';
import { EventosModule } from './eventos/eventos.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { ServicosModule } from './servicos/servicos.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ name: 'default', ttl: 15 * 60 * 1000, limit: 600 }]),
    PrismaModule,
    MailModule,
    PushModule,
    EventosModule,
    AuthModule,
    PagamentosModule,
    PedidosPublicoModule,
    OrdemCortePublicoModule,
    UsuariosModule,
    EmpresasModule,
    ClientesModule,
    ProdutosModule,
    ChapasModule,
    ServicosModule,
    PedidosModule,
    DesenhosModule,
    MeiosPagamentoModule,
    CidadesModule,
    DashboardModule,
    FornecedoresModule,
    ComprasModule,
    RelatoriosModule,
    NotificacoesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: LimiteGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: LicencaGuard },
    { provide: APP_GUARD, useClass: PerfilGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
