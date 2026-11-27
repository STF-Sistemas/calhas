"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeiosPagamentoModule = void 0;
const common_1 = require("@nestjs/common");
const meios_pagamento_controller_1 = require("./meios-pagamento.controller");
const meios_pagamento_service_1 = require("./meios-pagamento.service");
let MeiosPagamentoModule = class MeiosPagamentoModule {
};
exports.MeiosPagamentoModule = MeiosPagamentoModule;
exports.MeiosPagamentoModule = MeiosPagamentoModule = __decorate([
    (0, common_1.Module)({
        controllers: [meios_pagamento_controller_1.MeiosPagamentoController],
        providers: [meios_pagamento_service_1.MeiosPagamentoService],
    })
], MeiosPagamentoModule);
//# sourceMappingURL=meios-pagamento.module.js.map