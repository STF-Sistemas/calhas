"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
function ehViolacaoDeUnicidade(erro) {
    return (erro instanceof Error &&
        erro.name === 'PrismaClientKnownRequestError' &&
        erro.code === 'P2002');
}
let HttpExceptionFilter = class HttpExceptionFilter {
    logger = new common_1.Logger('Erro');
    catch(erro, host) {
        const res = host.switchToHttp().getResponse();
        if (erro instanceof throttler_1.ThrottlerException) {
            res.status(common_1.HttpStatus.TOO_MANY_REQUESTS).json({
                success: false,
                message: 'Muitas requisições. Tente novamente em alguns minutos.',
            });
            return;
        }
        if (erro instanceof common_1.HttpException) {
            const status = erro.getStatus();
            const corpo = erro.getResponse();
            if (typeof corpo === 'object' && corpo !== null && 'success' in corpo) {
                res.status(status).json(corpo);
                return;
            }
            const bruta = typeof corpo === 'string' ? corpo : corpo.message;
            const mensagem = Array.isArray(bruta) ? String(bruta[0]) : String(bruta ?? erro.message);
            res.status(status).json({ success: false, message: status === 404 ? 'Recurso não encontrado.' : mensagem });
            return;
        }
        if (ehViolacaoDeUnicidade(erro)) {
            res.status(common_1.HttpStatus.CONFLICT).json({
                success: false,
                message: 'Já existe um cadastro com estes dados. Confira CNPJ, e-mail ou código informados.',
            });
            return;
        }
        this.logger.error(erro instanceof Error ? (erro.stack ?? erro.message) : String(erro));
        res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Erro interno do servidor.',
            error: process.env['NODE_ENV'] === 'development' && erro instanceof Error ? erro.message : undefined,
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map