"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const limite_guard_1 = require("./common/guards/limite.guard");
const auth_module_1 = require("./auth/auth.module");
const chapas_module_1 = require("./chapas/chapas.module");
const cidades_module_1 = require("./cidades/cidades.module");
const clientes_module_1 = require("./clientes/clientes.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const licenca_guard_1 = require("./common/guards/licenca.guard");
const perfil_guard_1 = require("./common/guards/perfil.guard");
const http_exception_filter_1 = require("./common/http-exception.filter");
const compras_module_1 = require("./compras/compras.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const desenhos_module_1 = require("./desenhos/desenhos.module");
const empresas_module_1 = require("./empresas/empresas.module");
const fornecedores_module_1 = require("./fornecedores/fornecedores.module");
const mail_module_1 = require("./mail/mail.module");
const meios_pagamento_module_1 = require("./meios-pagamento/meios-pagamento.module");
const notificacoes_module_1 = require("./notificacoes/notificacoes.module");
const ordem_corte_publico_module_1 = require("./ordem-corte-publico/ordem-corte-publico.module");
const pagamentos_module_1 = require("./pagamentos/pagamentos.module");
const pedidos_publico_module_1 = require("./pedidos-publico/pedidos-publico.module");
const pedidos_module_1 = require("./pedidos/pedidos.module");
const prisma_module_1 = require("./prisma/prisma.module");
const produtos_module_1 = require("./produtos/produtos.module");
const push_module_1 = require("./push/push.module");
const eventos_module_1 = require("./eventos/eventos.module");
const relatorios_module_1 = require("./relatorios/relatorios.module");
const servicos_module_1 = require("./servicos/servicos.module");
const usuarios_module_1 = require("./usuarios/usuarios.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([{ name: 'default', ttl: 15 * 60 * 1000, limit: 600 }]),
            prisma_module_1.PrismaModule,
            mail_module_1.MailModule,
            push_module_1.PushModule,
            eventos_module_1.EventosModule,
            auth_module_1.AuthModule,
            pagamentos_module_1.PagamentosModule,
            pedidos_publico_module_1.PedidosPublicoModule,
            ordem_corte_publico_module_1.OrdemCortePublicoModule,
            usuarios_module_1.UsuariosModule,
            empresas_module_1.EmpresasModule,
            clientes_module_1.ClientesModule,
            produtos_module_1.ProdutosModule,
            chapas_module_1.ChapasModule,
            servicos_module_1.ServicosModule,
            pedidos_module_1.PedidosModule,
            desenhos_module_1.DesenhosModule,
            meios_pagamento_module_1.MeiosPagamentoModule,
            cidades_module_1.CidadesModule,
            dashboard_module_1.DashboardModule,
            fornecedores_module_1.FornecedoresModule,
            compras_module_1.ComprasModule,
            relatorios_module_1.RelatoriosModule,
            notificacoes_module_1.NotificacoesModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: limite_guard_1.LimiteGuard },
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: licenca_guard_1.LicencaGuard },
            { provide: core_1.APP_GUARD, useClass: perfil_guard_1.PerfilGuard },
            { provide: core_1.APP_FILTER, useClass: http_exception_filter_1.HttpExceptionFilter },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map