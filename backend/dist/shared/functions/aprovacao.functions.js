"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obterAprovacaoTag = obterAprovacaoTag;
const EAprovacaoPedido_1 = require("../enums/EAprovacaoPedido");
function obterAprovacaoTag(aprovacaoStatus) {
    if (aprovacaoStatus === EAprovacaoPedido_1.EAprovacaoPedido.Autorizado) {
        return { label: 'Autorizado', severity: 'success' };
    }
    if (aprovacaoStatus === EAprovacaoPedido_1.EAprovacaoPedido.Recusado) {
        return { label: 'Recusado', severity: 'danger' };
    }
    return { label: 'Pendente', severity: 'secondary' };
}
//# sourceMappingURL=aprovacao.functions.js.map