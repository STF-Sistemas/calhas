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
var PushService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
exports.endpointPushValido = endpointPushValido;
const common_1 = require("@nestjs/common");
const web_push_1 = require("web-push");
const falha_1 = require("../common/falha");
const prisma_service_1 = require("../prisma/prisma.service");
const HOSTS_PUSH = [
    'fcm.googleapis.com',
    'android.googleapis.com',
    'updates.push.services.mozilla.com',
    'push.services.mozilla.com',
    'notify.windows.com',
    'push.apple.com',
];
function endpointPushValido(endpoint) {
    try {
        const url = new URL(endpoint);
        if (url.protocol !== 'https:' || url.port !== '' || url.username || url.password)
            return false;
        const host = url.hostname.toLowerCase();
        return HOSTS_PUSH.some((permitido) => host === permitido || host.endsWith(`.${permitido}`));
    }
    catch {
        return false;
    }
}
let PushService = PushService_1 = class PushService {
    prisma;
    logger = new common_1.Logger(PushService_1.name);
    configurado;
    constructor(prisma) {
        this.prisma = prisma;
        const publica = process.env['VAPID_PUBLIC_KEY'];
        const privada = process.env['VAPID_PRIVATE_KEY'];
        this.configurado = !!publica && !!privada;
        if (this.configurado) {
            (0, web_push_1.setVapidDetails)(process.env['VAPID_SUBJECT'] || 'mailto:contato@calhaspro.com.br', publica, privada);
        }
        else {
            this.logger.warn('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY não configuradas: push desativado.');
        }
    }
    async inscrever(idUsuario, endpoint, chaves, agente) {
        if (!endpointPushValido(endpoint))
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Endpoint de notificação não permitido.');
        const dados = { p256dh: chaves.p256dh, auth: chaves.auth, user_agent: agente?.slice(0, 255) ?? null };
        await this.prisma.pushSubscription.upsert({
            where: { cod_usuario_endpoint: { cod_usuario: idUsuario, endpoint } },
            create: { cod_usuario: idUsuario, endpoint, ...dados },
            update: dados,
        });
        return { success: true };
    }
    async cancelar(idUsuario, endpoint) {
        await this.prisma.pushSubscription.deleteMany({ where: { cod_usuario: idUsuario, endpoint } });
        return { success: true };
    }
    chavePublica() {
        return { success: true, data: { publicKey: process.env['VAPID_PUBLIC_KEY'] ?? null } };
    }
    async status(idUsuario) {
        const total = await this.prisma.pushSubscription.count({ where: { cod_usuario: idUsuario } });
        return { success: true, data: { inscrito: total > 0 } };
    }
    async enviarParaUsuarios(usuarioIds, payload) {
        if (!this.configurado || usuarioIds.length === 0)
            return;
        try {
            const inscricoes = await this.prisma.pushSubscription.findMany({ where: { cod_usuario: { in: usuarioIds } }, take: 500 });
            const corpo = JSON.stringify({
                notification: {
                    title: payload.title,
                    body: payload.body,
                    icon: '/icons/icon-192x192.png',
                    data: { onActionClick: { default: { operation: 'openWindow', url: payload.url ?? '/' } } },
                },
            });
            await Promise.all(inscricoes.map(async (sub) => {
                if (!endpointPushValido(sub.endpoint)) {
                    await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
                    return;
                }
                try {
                    await (0, web_push_1.sendNotification)({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, corpo);
                }
                catch (erro) {
                    const status = erro.statusCode;
                    if (status === 404 || status === 410) {
                        await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
                    }
                    else {
                        this.logger.error(`Falha no envio: ${erro.message}`);
                    }
                }
            }));
        }
        catch (erro) {
            this.logger.error(`Falha ao enviar push: ${erro.message}`);
        }
    }
};
exports.PushService = PushService;
exports.PushService = PushService = PushService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PushService);
//# sourceMappingURL=push.service.js.map