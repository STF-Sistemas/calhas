"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLogoDataUriValido = isLogoDataUriValido;
const LOGO_EMPRESA_1 = require("../constants/LOGO_EMPRESA");
const LOGO_DATA_URI_REGEX = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/;
function isLogoDataUriValido(valor) {
    const match = LOGO_DATA_URI_REGEX.exec(valor);
    if (!match)
        return false;
    const base64 = match[2];
    const tamanhoBytes = Math.floor((base64.length * 3) / 4);
    return tamanhoBytes <= LOGO_EMPRESA_1.LOGO_EMPRESA_TAMANHO_MAXIMO_BYTES;
}
//# sourceMappingURL=logo.functions.js.map