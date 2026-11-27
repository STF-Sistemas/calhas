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
exports.UsuariosService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt_1 = __importDefault(require("bcrypt"));
const enums_1 = require("../shared/enums");
const auth_service_1 = require("../auth/auth.service");
const falha_1 = require("../common/falha");
const prisma_service_1 = require("../prisma/prisma.service");
const campos = {
    id: true, nome: true, email: true, status: true, admin: true,
    super_admin: true, cod_empresa: true, data_criacao: true, excluido: true,
};
let UsuariosService = class UsuariosService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async obter(id, usuario) {
        const existente = await this.prisma.usuario.findFirst({ where: { id, excluido: false }, select: campos });
        const visivel = existente && (usuario.super_admin || (!existente.super_admin && existente.cod_empresa === usuario.cod_empresa));
        if (!existente || !visivel)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Usuário não encontrado.');
        return existente;
    }
    async exigirEmailLivre(email, ignorarId) {
        const emUso = await this.prisma.usuario.findFirst({
            where: { email, ...(ignorarId ? { NOT: { id: ignorarId } } : {}) },
            select: { id: true },
        });
        if (emUso)
            throw (0, falha_1.falha)(common_1.HttpStatus.CONFLICT, 'Este e-mail já está em uso.');
    }
    async listar(usuario) {
        const data = await this.prisma.usuario.findMany({
            where: usuario.super_admin
                ? { excluido: false }
                : { cod_empresa: usuario.cod_empresa, super_admin: false, excluido: false },
            select: campos,
            orderBy: { nome: 'asc' },
            take: 1000,
        });
        return { success: true, data };
    }
    async buscar(id, usuario) {
        return { success: true, data: await this.obter(id, usuario) };
    }
    async criar(dto, usuario) {
        const email = dto.email.toLowerCase().trim();
        await this.exigirEmailLivre(email);
        const data = await this.prisma.usuario.create({
            data: {
                nome: dto.nome,
                email,
                senha: await bcrypt_1.default.hash(dto.senha, auth_service_1.BCRYPT_ROUNDS),
                admin: !!dto.admin,
                super_admin: false,
                cod_empresa: usuario.super_admin ? (dto.cod_empresa ?? null) : usuario.cod_empresa,
                status: enums_1.EStatusGeral.Ativo,
            },
            select: campos,
        });
        return { success: true, data };
    }
    async atualizar(id, dto, usuario) {
        const existente = await this.obter(id, usuario);
        const data = {};
        let encerrarSessoes = false;
        if (dto.nome)
            data.nome = dto.nome;
        if (dto.email) {
            data.email = dto.email.toLowerCase().trim();
            await this.exigirEmailLivre(data.email, id);
        }
        if (dto.admin != null && dto.admin !== existente.admin) {
            data.admin = dto.admin;
            encerrarSessoes = true;
        }
        if (dto.status != null && dto.status !== existente.status) {
            data.status = dto.status;
            encerrarSessoes = true;
        }
        if (dto.senha) {
            data.senha = await bcrypt_1.default.hash(dto.senha, auth_service_1.BCRYPT_ROUNDS);
            encerrarSessoes = true;
        }
        if (usuario.super_admin && dto.cod_empresa !== undefined && dto.cod_empresa !== existente.cod_empresa) {
            data.cod_empresa = dto.cod_empresa;
            encerrarSessoes = true;
        }
        if (encerrarSessoes && id !== usuario.id)
            data.token_versao = { increment: 1 };
        return { success: true, data: await this.prisma.usuario.update({ where: { id }, data, select: campos }) };
    }
    async excluir(id, usuario) {
        if (id === usuario.id)
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Você não pode excluir o próprio usuário.');
        await this.obter(id, usuario);
        await this.prisma.usuario.update({ where: { id }, data: { excluido: true, token_versao: { increment: 1 } } });
        return { success: true, message: 'Usuário excluído.' };
    }
};
exports.UsuariosService = UsuariosService;
exports.UsuariosService = UsuariosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsuariosService);
//# sourceMappingURL=usuarios.service.js.map