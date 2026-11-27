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
var PagamentosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagamentosService = void 0;
const common_1 = require("@nestjs/common");
const frontend_url_util_1 = require("../common/frontend-url.util");
const falha_1 = require("../common/falha");
const prisma_service_1 = require("../prisma/prisma.service");
const MP_API = 'https://api.mercadopago.com/v1/payments';
let PagamentosService = PagamentosService_1 = class PagamentosService {
    prisma;
    logger = new common_1.Logger(PagamentosService_1.name);
    mpToken = process.env['MP_ACCESS_TOKEN'] || '';
    pixChaveManual = process.env['PIX_CHAVE_MANUAL'] || '';
    backendUrl = process.env['BACKEND_URL']?.trim().replace(/\/+$/, '') || (0, frontend_url_util_1.frontendUrl)();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async criarPix(codEmpresa) {
        if (!codEmpresa)
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Empresa não identificada.');
        const empresa = await this.prisma.empresa.findFirst({
            where: { id: codEmpresa, excluido: false },
            select: { id: true, email: true, valor_mensalidade: true },
        });
        if (!empresa)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Empresa não encontrada.');
        const valor = Number(empresa.valor_mensalidade ?? 150);
        const pendente = await this.prisma.pagamentoPix.findFirst({
            where: { cod_empresa: codEmpresa, status: 'pendente' },
            orderBy: { created_at: 'desc' },
        });
        if (pendente) {
            const manual = !pendente.mp_payment_id;
            return { success: true, data: { pagamento: pendente, manual, pix_chave: manual ? this.pixChaveManual : null, valor } };
        }
        if (!this.mpToken) {
            const pagamento = await this.prisma.pagamentoPix.create({
                data: { cod_empresa: codEmpresa, valor, status: 'pendente', qr_code: this.pixChaveManual },
            });
            return { success: true, data: { pagamento, manual: true, pix_chave: this.pixChaveManual, valor } };
        }
        const resposta = await fetch(MP_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.mpToken}`,
                'X-Idempotency-Key': `licenca_${codEmpresa}_${Date.now()}`,
            },
            body: JSON.stringify({
                transaction_amount: valor,
                description: 'Licença Calhas Pro, 30 dias',
                payment_method_id: 'pix',
                payer: { email: empresa.email || 'pagamento@calhas.pro' },
                external_reference: `empresa_${codEmpresa}`,
                ...(this.backendUrl && { notification_url: `${this.backendUrl}/api/pagamentos/webhook` }),
            }),
            signal: AbortSignal.timeout(15000),
        });
        if (!resposta.ok) {
            this.logger.error(`Mercado Pago ${resposta.status}: ${await resposta.text()}`);
            throw (0, falha_1.falha)(common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'Erro ao criar cobrança Pix.');
        }
        const mp = (await resposta.json());
        const tx = mp.point_of_interaction?.transaction_data;
        const pagamento = await this.prisma.pagamentoPix.create({
            data: {
                cod_empresa: codEmpresa,
                mp_payment_id: String(mp.id),
                valor,
                status: 'pendente',
                qr_code: tx?.qr_code ?? null,
                qr_code_base64: tx?.qr_code_base64 ?? null,
            },
        });
        return { success: true, data: { pagamento, manual: false, pix_chave: null, valor } };
    }
    async status(id, codEmpresa) {
        const pagamento = await this.prisma.pagamentoPix.findFirst({ where: { id, cod_empresa: codEmpresa ?? -1 } });
        if (!pagamento)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Pagamento não encontrado.');
        if (pagamento.status === 'pendente' && pagamento.mp_payment_id && (await this.aprovadoNoMp(pagamento.mp_payment_id))) {
            const nova_expiracao = await this.confirmar(pagamento.id, pagamento.cod_empresa);
            const atualizado = await this.prisma.pagamentoPix.findFirst({ where: { id } });
            return { success: true, data: { pagamento: atualizado, nova_expiracao } };
        }
        if (pagamento.status === 'aprovado') {
            const empresa = await this.prisma.empresa.findFirst({
                where: { id: pagamento.cod_empresa },
                select: { data_expiracao: true },
            });
            return { success: true, data: { pagamento, nova_expiracao: empresa?.data_expiracao ?? undefined } };
        }
        return { success: true, data: { pagamento } };
    }
    async webhook(corpo) {
        const idMp = corpo?.data?.id;
        if (corpo?.type !== 'payment' || !idMp || !/^\d{1,30}$/.test(String(idMp)))
            return;
        if (!(await this.aprovadoNoMp(String(idMp))))
            return;
        const pagamento = await this.prisma.pagamentoPix.findFirst({ where: { mp_payment_id: String(idMp), status: 'pendente' } });
        if (pagamento)
            await this.confirmar(pagamento.id, pagamento.cod_empresa);
    }
    async confirmarManual(id) {
        const pagamento = await this.prisma.pagamentoPix.findFirst({ where: { id } });
        if (!pagamento)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Pagamento não encontrado.');
        const nova_expiracao = await this.confirmar(pagamento.id, pagamento.cod_empresa);
        return { success: true, message: 'Pagamento confirmado.', nova_expiracao };
    }
    async pendentes() {
        const data = await this.prisma.pagamentoPix.findMany({
            where: { status: 'pendente' },
            include: { empresa: { select: { razao_social: true, cnpj: true } } },
            orderBy: { created_at: 'desc' },
        });
        return { success: true, data };
    }
    async aprovadoNoMp(idMp) {
        if (!this.mpToken)
            return false;
        try {
            const resposta = await fetch(`${MP_API}/${encodeURIComponent(idMp)}`, {
                headers: { Authorization: `Bearer ${this.mpToken}` },
                signal: AbortSignal.timeout(10000),
            });
            if (!resposta.ok)
                return false;
            return (await resposta.json()).status === 'approved';
        }
        catch {
            return false;
        }
    }
    async confirmar(pagamentoId, codEmpresa) {
        return this.prisma.$transaction(async (tx) => {
            const marcado = await tx.pagamentoPix.updateMany({
                where: { id: pagamentoId, status: { not: 'aprovado' } },
                data: { status: 'aprovado', pago_em: new Date() },
            });
            const empresa = await tx.empresa.findFirst({ where: { id: codEmpresa }, select: { data_expiracao: true } });
            if (marcado.count === 0)
                return empresa?.data_expiracao ?? null;
            const base = empresa?.data_expiracao && new Date(empresa.data_expiracao) > new Date() ? new Date(empresa.data_expiracao) : new Date();
            const novaExpiracao = new Date(base);
            novaExpiracao.setDate(novaExpiracao.getDate() + 30);
            await tx.empresa.update({ where: { id: codEmpresa }, data: { data_expiracao: novaExpiracao } });
            return novaExpiracao;
        });
    }
};
exports.PagamentosService = PagamentosService;
exports.PagamentosService = PagamentosService = PagamentosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PagamentosService);
//# sourceMappingURL=pagamentos.service.js.map