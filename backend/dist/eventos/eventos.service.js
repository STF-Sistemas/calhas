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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventosService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const enums_1 = require("../shared/enums");
const prisma_service_1 = require("../prisma/prisma.service");
const INTERVALO_SINAL_MS = 25_000;
let EventosService = class EventosService {
    prisma;
    canal = new rxjs_1.Subject();
    constructor(prisma) {
        this.prisma = prisma;
    }
    emitir(codEmpresa, evento) {
        this.canal.next({ codEmpresa, evento });
    }
    fluxo(usuario) {
        const verificacao = (0, rxjs_1.interval)(INTERVALO_SINAL_MS).pipe((0, rxjs_1.switchMap)(() => (0, rxjs_1.from)(this.sessaoValida(usuario))), (0, rxjs_1.share)());
        const sinal = verificacao.pipe((0, rxjs_1.filter)((valida) => valida), (0, rxjs_1.map)(() => ({ type: 'sinal', data: '' })));
        const encerrada = verificacao.pipe((0, rxjs_1.filter)((valida) => !valida));
        const codEmpresa = usuario.cod_empresa;
        const eventos = codEmpresa
            ? this.canal.pipe((0, rxjs_1.filter)((e) => e.codEmpresa === codEmpresa), (0, rxjs_1.map)((e) => ({ type: e.evento.tipo, data: e.evento })))
            : [];
        return (0, rxjs_1.merge)(eventos, sinal).pipe((0, rxjs_1.takeUntil)(encerrada));
    }
    async sessaoValida(usuario) {
        const atual = await this.prisma.usuario.findFirst({
            where: { id: usuario.id, excluido: false },
            select: { status: true, token_versao: true, cod_empresa: true },
        });
        return (!!atual &&
            atual.status === enums_1.EStatusGeral.Ativo &&
            atual.token_versao === (usuario.tv ?? 0) &&
            atual.cod_empresa === usuario.cod_empresa);
    }
};
exports.EventosService = EventosService;
exports.EventosService = EventosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventosService);
//# sourceMappingURL=eventos.service.js.map