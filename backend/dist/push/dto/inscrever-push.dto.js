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
exports.InscreverPushDto = exports.ChavesPushDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class ChavesPushDto {
    p256dh;
    auth;
}
exports.ChavesPushDto = ChavesPushDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ChavesPushDto.prototype, "p256dh", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ChavesPushDto.prototype, "auth", void 0);
class InscreverPushDto {
    endpoint;
    keys;
}
exports.InscreverPushDto = InscreverPushDto;
__decorate([
    (0, class_validator_1.IsUrl)({ protocols: ['https'], require_protocol: true }, { message: 'Endpoint inválido.' }),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], InscreverPushDto.prototype, "endpoint", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ChavesPushDto),
    __metadata("design:type", ChavesPushDto)
], InscreverPushDto.prototype, "keys", void 0);
//# sourceMappingURL=inscrever-push.dto.js.map