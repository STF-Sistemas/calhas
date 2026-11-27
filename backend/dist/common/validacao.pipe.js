"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validacaoPipe = void 0;
const common_1 = require("@nestjs/common");
const falha_1 = require("./falha");
function primeiraMensagem(erros) {
    for (const erro of erros) {
        const msg = erro.constraints ? Object.values(erro.constraints)[0] : undefined;
        if (msg)
            return msg;
        const filho = erro.children?.length ? primeiraMensagem(erro.children) : undefined;
        if (filho)
            return filho;
    }
    return undefined;
}
exports.validacaoPipe = new common_1.ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (erros) => (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, primeiraMensagem(erros) ?? 'Dados inválidos.'),
});
//# sourceMappingURL=validacao.pipe.js.map