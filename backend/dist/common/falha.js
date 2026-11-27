"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.falha = falha;
const common_1 = require("@nestjs/common");
function falha(status, message, extra = {}) {
    return new common_1.HttpException({ success: false, message, ...extra }, status);
}
//# sourceMappingURL=falha.js.map