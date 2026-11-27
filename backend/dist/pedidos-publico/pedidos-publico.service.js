"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PedidosPublicoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PedidosPublicoService = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../shared/enums");
const falha_1 = require("../common/falha");
const prisma_service_1 = require("../prisma/prisma.service");
const push_service_1 = require("../push/push.service");
const eventos_service_1 = require("../eventos/eventos.service");
const TOKEN_VALIDO = /^[A-Za-z0-9-]{16,100}$/;
let PedidosPublicoService = PedidosPublicoService_1 = class PedidosPublicoService {
    prisma;
    push;
    eventos;
    logger = new common_1.Logger(PedidosPublicoService_1.name);
    constructor(prisma, push, eventos) {
        this.prisma = prisma;
        this.push = push;
        this.eventos = eventos;
    }
    async pedidoValido(token) {
        const pedido = typeof token === 'string' && TOKEN_VALIDO.test(token)
            ? await this.prisma.pedido.findFirst({ where: { token_acesso: token, excluido: false } })
            : null;
        if (!pedido)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Link inválido ou não encontrado.', { code: 'NOT_FOUND' });
        if (pedido.status === enums_1.EStatusPedido.Cancelado) {
            throw (0, falha_1.falha)(common_1.HttpStatus.GONE, 'Este orçamento foi cancelado.', { code: 'CANCELLED' });
        }
        if (!pedido.token_expiracao || new Date() > new Date(pedido.token_expiracao)) {
            throw (0, falha_1.falha)(common_1.HttpStatus.GONE, 'Link de acesso expirado.', { code: 'EXPIRED' });
        }
        return pedido;
    }
    async decidir(id, dados) {
        const r = await this.prisma.pedido.updateMany({
            where: { id, aprovacao_status: enums_1.EAprovacaoPedido.Pendente },
            data: dados,
        });
        if (r.count === 0)
            throw (0, falha_1.falha)(common_1.HttpStatus.CONFLICT, 'Este orçamento já foi respondido.', { code: 'JA_DECIDIDO' });
    }
    async notificar(pedido, aprovacaoStatus, tipo, titulo, mensagem) {
        this.eventos.emitir(pedido.cod_empresa, {
            tipo: 'pedido_aprovacao',
            cod_pedido: pedido.id,
            aprovacao_status: aprovacaoStatus,
            titulo,
            mensagem,
        });
        try {
            await this.prisma.notificacao.create({
                data: { cod_empresa: pedido.cod_empresa, cod_pedido: pedido.id, tipo, titulo, mensagem },
            });
            const usuarios = await this.prisma.usuario.findMany({
                where: { cod_empresa: pedido.cod_empresa, status: enums_1.EStatusGeral.Ativo, excluido: false },
                select: { id: true },
                take: 200,
            });
            await this.push.enviarParaUsuarios(usuarios.map((u) => u.id), { title: titulo, body: mensagem, url: '/pedidos' });
        }
        catch (erro) {
            this.logger.error(`Falha ao notificar: ${erro.message}`);
        }
    }
    async buscar(token) {
        const base = await this.pedidoValido(token);
        const pedido = await this.prisma.pedido.findUniqueOrThrow({
            where: { id: base.id },
            include: {
                empresa: true,
                cliente: true,
                meio_pagamento: true,
                itens: { include: { produto: true, corte: { include: { chapa: true } }, servico: true } },
            },
        });
        const itens = pedido.itens.map((item) => ({
            id: item.id,
            tipo: item.tipo,
            descricao: item.produto
                ? item.produto.descricao
                : item.servico
                    ? item.servico.descricao
                    : item.corte
                        ? `${item.corte.chapa?.descricao ?? ''}: ${item.corte.descricao}`
                        : '',
            quantidade: Number(item.quantidade),
            valor_unitario: Number(item.valor_unitario),
            valor_total: Number(item.valor_total),
        }));
        const status_label = pedido.status === enums_1.EStatusPedido.EmProducao
            ? 'Em Produção'
            : pedido.status === enums_1.EStatusPedido.Concluido
                ? 'Finalizado'
                : 'Aberto';
        return {
            success: true,
            data: {
                id: pedido.id,
                data_pedido: pedido.data_pedido,
                status: pedido.status,
                status_label,
                observacoes: pedido.observacoes_cliente,
                valor_material: Number(pedido.valor_material),
                valor_servico: Number(pedido.valor_servico),
                valor_total: Number(pedido.valor_total),
                desconto_tipo: pedido.desconto_tipo,
                desconto_valor: Number(pedido.desconto_valor),
                valor_desconto: Number(pedido.valor_desconto),
                valor_liquido: Number(pedido.valor_liquido),
                meio_pagamento: pedido.meio_pagamento?.descricao ?? null,
                token_expiracao: pedido.token_expiracao,
                aprovacao_status: pedido.aprovacao_status,
                aprovacao_data: pedido.aprovacao_data,
                recusa_motivo: pedido.recusa_motivo,
                empresa: {
                    razao_social: pedido.empresa.razao_social,
                    nome_fantasia: pedido.empresa.nome_fantasia,
                    cnpj: pedido.empresa.cnpj,
                    telefone: pedido.empresa.telefone,
                    email: pedido.empresa.email,
                    logo_url: pedido.empresa.logo_url,
                    marca_dagua: pedido.empresa.marca_dagua,
                },
                cliente: {
                    razao_social: pedido.cliente.razao_social,
                    telefone: pedido.cliente.telefone,
                    email: pedido.cliente.email,
                },
                itens,
            },
        };
    }
    async autorizar(token, assinatura, ip) {
        const pedido = await this.pedidoValido(token);
        const agora = new Date();
        await this.decidir(pedido.id, {
            aprovacao_status: enums_1.EAprovacaoPedido.Autorizado,
            aprovacao_data: agora,
            aprovacao_assinatura: assinatura,
            aprovacao_ip: ip?.slice(0, 45) ?? null,
        });
        await this.notificar(pedido, enums_1.EAprovacaoPedido.Autorizado, 'pedido_autorizado', 'Orçamento autorizado', `O pedido Nº ${pedido.id} foi autorizado pelo cliente.`);
        return { success: true, data: { aprovacao_status: enums_1.EAprovacaoPedido.Autorizado, aprovacao_data: agora } };
    }
    async recusar(token, motivoBruto, ip) {
        const pedido = await this.pedidoValido(token);
        const motivo = motivoBruto || null;
        const agora = new Date();
        await this.decidir(pedido.id, {
            aprovacao_status: enums_1.EAprovacaoPedido.Recusado,
            aprovacao_data: agora,
            recusa_motivo: motivo,
            aprovacao_ip: ip?.slice(0, 45) ?? null,
        });
        await this.notificar(pedido, enums_1.EAprovacaoPedido.Recusado, 'pedido_recusado', 'Orçamento recusado', motivo
            ? `O pedido Nº ${pedido.id} foi recusado pelo cliente. Motivo: ${motivo.slice(0, 200)}`
            : `O pedido Nº ${pedido.id} foi recusado pelo cliente.`);
        return { success: true, data: { aprovacao_status: enums_1.EAprovacaoPedido.Recusado, aprovacao_data: agora } };
    }
};
exports.PedidosPublicoService = PedidosPublicoService;
exports.PedidosPublicoService = PedidosPublicoService = PedidosPublicoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        push_service_1.PushService,
        eventos_service_1.EventosService])
], PedidosPublicoService);
//# sourceMappingURL=pedidos-publico.service.js.map