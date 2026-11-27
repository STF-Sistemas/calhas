"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmpresaAtual = exports.UsuarioAtual = exports.ApenasSuperAdmin = exports.ApenasAdmin = exports.PERFIL_EXIGIDO = exports.SemLicenca = exports.SEM_LICENCA = exports.Publico = exports.ROTA_PUBLICA = void 0;
const common_1 = require("@nestjs/common");
exports.ROTA_PUBLICA = 'rotaPublica';
const Publico = () => (0, common_1.SetMetadata)(exports.ROTA_PUBLICA, true);
exports.Publico = Publico;
exports.SEM_LICENCA = 'semLicenca';
const SemLicenca = () => (0, common_1.SetMetadata)(exports.SEM_LICENCA, true);
exports.SemLicenca = SemLicenca;
exports.PERFIL_EXIGIDO = 'perfilExigido';
const ApenasAdmin = () => (0, common_1.SetMetadata)(exports.PERFIL_EXIGIDO, 'admin');
exports.ApenasAdmin = ApenasAdmin;
const ApenasSuperAdmin = () => (0, common_1.SetMetadata)(exports.PERFIL_EXIGIDO, 'super_admin');
exports.ApenasSuperAdmin = ApenasSuperAdmin;
exports.UsuarioAtual = (0, common_1.createParamDecorator)((_dados, ctx) => ctx.switchToHttp().getRequest().user);
exports.EmpresaAtual = (0, common_1.createParamDecorator)((_dados, ctx) => ctx.switchToHttp().getRequest().user?.cod_empresa);
//# sourceMappingURL=decorators.js.map