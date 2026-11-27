"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimiteGuard = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const decorators_1 = require("../decorators");
function usuarioDoToken(req) {
    const header = req.headers['authorization'];
    if (typeof header !== 'string' || !header.startsWith('Bearer '))
        return null;
    try {
        const payload = jsonwebtoken_1.default.verify(header.slice(7), process.env['JWT_SECRET'], {
            algorithms: ['HS256'],
        });
        return Number.isInteger(payload?.id) ? payload.id : null;
    }
    catch {
        return null;
    }
}
let LimiteGuard = class LimiteGuard extends throttler_1.ThrottlerGuard {
    async handleRequest(props) {
        const alvos = [props.context.getHandler(), props.context.getClass()];
        if (this.reflector.getAllAndOverride(decorators_1.ROTA_PUBLICA, alvos))
            return super.handleRequest(props);
        const idUsuario = usuarioDoToken(this.getRequestResponse(props.context).req);
        if (!idUsuario)
            return super.handleRequest(props);
        return super.handleRequest({ ...props, getTracker: async () => `usuario:${idUsuario}` });
    }
};
exports.LimiteGuard = LimiteGuard;
exports.LimiteGuard = LimiteGuard = __decorate([
    (0, common_1.Injectable)()
], LimiteGuard);
//# sourceMappingURL=limite.guard.js.map