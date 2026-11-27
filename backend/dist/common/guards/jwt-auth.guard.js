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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const enums_1 = require("../../shared/enums");
const prisma_service_1 = require("../../prisma/prisma.service");
const decorators_1 = require("../decorators");
const falha_1 = require("../falha");
let JwtAuthGuard = class JwtAuthGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(ctx) {
        const publica = this.reflector.getAllAndOverride(decorators_1.ROTA_PUBLICA, [ctx.getHandler(), ctx.getClass()]);
        if (publica)
            return true;
        const req = ctx.switchToHttp().getRequest();
        const header = req.headers['authorization'];
        if (!header?.startsWith('Bearer '))
            throw (0, falha_1.falha)(common_1.HttpStatus.UNAUTHORIZED, 'Token não fornecido.');
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(header.slice(7), process.env['JWT_SECRET'], { algorithms: ['HS256'] });
        }
        catch {
            throw (0, falha_1.falha)(common_1.HttpStatus.UNAUTHORIZED, 'Token inválido ou expirado.');
        }
        const usuario = Number.isInteger(payload?.id)
            ? await this.prisma.usuario.findFirst({
                where: { id: payload.id, excluido: false },
                select: {
                    id: true,
                    status: true,
                    admin: true,
                    super_admin: true,
                    cod_empresa: true,
                    token_versao: true,
                    empresa: { select: { ativo: true, excluido: true, data_expiracao: true } },
                },
            })
            : null;
        if (!usuario || usuario.status !== enums_1.EStatusGeral.Ativo || usuario.token_versao !== (payload.tv ?? 0)) {
            throw (0, falha_1.falha)(common_1.HttpStatus.UNAUTHORIZED, 'Sessão encerrada. Entre novamente.');
        }
        req.user = {
            id: usuario.id,
            cod_empresa: usuario.cod_empresa,
            admin: usuario.admin,
            super_admin: usuario.super_admin,
            tv: usuario.token_versao,
        };
        req.licenca = usuario.empresa;
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map