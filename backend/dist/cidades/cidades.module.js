"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CidadesModule = void 0;
const common_1 = require("@nestjs/common");
const cep_controller_1 = require("./cep.controller");
const cidades_controller_1 = require("./cidades.controller");
const cidades_service_1 = require("./cidades.service");
let CidadesModule = class CidadesModule {
};
exports.CidadesModule = CidadesModule;
exports.CidadesModule = CidadesModule = __decorate([
    (0, common_1.Module)({
        controllers: [cidades_controller_1.CidadesController, cep_controller_1.CepController],
        providers: [cidades_service_1.CidadesService],
    })
], CidadesModule);
//# sourceMappingURL=cidades.module.js.map