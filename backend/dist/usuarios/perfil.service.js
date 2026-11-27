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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerfilService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_service_1 = require("../auth/auth.service");
const falha_1 = require("../common/falha");
const prisma_service_1 = require("../prisma/prisma.service");
const campos = { id: true, nome: true, email: true, admin: true, super_admin: true, cod_empresa: true, status: true };
let PerfilService = class PerfilService {
    prisma;
    auth;
    constructor(prisma, auth) {
        this.prisma = prisma;
        this.auth = auth;
    }
    async buscar(idUsuario) {
        const data = await this.prisma.usuario.findFirst({ where: { id: idUsuario, excluido: false }, select: campos });
        if (!data)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Usuário não encontrado.');
        return { success: true, data };
    }
    async atualizar(dto, idUsuario) {
        const email = dto.email.toLowerCase().trim();
        const atual = await this.prisma.usuario.findFirst({
            where: { id: idUsuario, excluido: false },
            select: { email: true, senha: true },
        });
        if (!atual)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Usuário não encontrado.');
        const trocouEmail = email !== atual.email;
        if (trocouEmail) {
            if (!dto.senha_atual || !(await bcrypt_1.default.compare(dto.senha_atual, atual.senha))) {
                throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Para trocar o e-mail, informe a sua senha atual corretamente.');
            }
            const emUso = await this.prisma.usuario.findFirst({ where: { email, NOT: { id: idUsuario } }, select: { id: true } });
            if (emUso)
                throw (0, falha_1.falha)(common_1.HttpStatus.CONFLICT, 'Este e-mail já está em uso.');
        }
        const usuario = await this.prisma.usuario.update({
            where: { id: idUsuario },
            data: { nome: dto.nome, email, ...(trocouEmail && { token_versao: { increment: 1 } }) },
            select: { ...campos, cod_empresa: true, admin: true, super_admin: true, token_versao: true },
        });
        const { token_versao: _versao, ...data } = usuario;
        return { success: true, data, ...(trocouEmail && { token: this.auth.gerarToken(usuario) }) };
    }
    async alterarSenha(dto, idUsuario) {
        const atual = await this.prisma.usuario.findFirst({
            where: { id: idUsuario, excluido: false },
            select: { senha: true },
        });
        if (!atual)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Usuário não encontrado.');
        if (!(await bcrypt_1.default.compare(dto.senha_atual, atual.senha))) {
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Senha atual incorreta.');
        }
        const usuario = await this.prisma.usuario.update({
            where: { id: idUsuario },
            data: { senha: await bcrypt_1.default.hash(dto.nova_senha, auth_service_1.BCRYPT_ROUNDS), token_versao: { increment: 1 } },
            select: { id: true, cod_empresa: true, admin: true, super_admin: true, token_versao: true },
        });
        return { success: true, message: 'Senha alterada com sucesso.', data: { token: this.auth.gerarToken(usuario) } };
    }
};
exports.PerfilService = PerfilService;
exports.PerfilService = PerfilService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService])
], PerfilService);
//# sourceMappingURL=perfil.service.js.map