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
exports.AuthService = exports.BCRYPT_ROUNDS = void 0;
const common_1 = require("@nestjs/common");
const bcrypt_1 = __importDefault(require("bcrypt"));
const node_crypto_1 = require("node:crypto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const enums_1 = require("../shared/enums");
const falha_1 = require("../common/falha");
const site_url_util_1 = require("../common/site-url.util");
const mail_service_1 = require("../mail/mail.service");
const prisma_service_1 = require("../prisma/prisma.service");
exports.BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10);
const HASH_FALSO = bcrypt_1.default.hashSync('senha-inexistente', 10);
const hashDoToken = (token) => (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
const MAX_FALHAS_LOGIN = 10;
const JANELA_FALHAS_MS = 15 * 60 * 1000;
const MAX_CONTAS_VIGIADAS = 10_000;
let AuthService = class AuthService {
    prisma;
    mail;
    falhasLogin = new Map();
    constructor(prisma, mail) {
        this.prisma = prisma;
        this.mail = mail;
    }
    gerarToken(usuario) {
        return jsonwebtoken_1.default.sign({
            id: usuario.id,
            cod_empresa: usuario.cod_empresa,
            admin: usuario.admin,
            super_admin: usuario.super_admin,
            tv: usuario.token_versao,
        }, process.env['JWT_SECRET'], { algorithm: 'HS256', expiresIn: (process.env['JWT_EXPIRES_IN'] || '8h') });
    }
    contaBloqueada(email) {
        const registro = this.falhasLogin.get(email);
        if (!registro)
            return false;
        if (Date.now() - registro.inicio > JANELA_FALHAS_MS) {
            this.falhasLogin.delete(email);
            return false;
        }
        return registro.total >= MAX_FALHAS_LOGIN;
    }
    registrarFalha(email) {
        const agora = Date.now();
        const registro = this.falhasLogin.get(email);
        if (registro && agora - registro.inicio <= JANELA_FALHAS_MS) {
            registro.total++;
            return;
        }
        if (this.falhasLogin.size >= MAX_CONTAS_VIGIADAS) {
            for (const [chave, valor] of this.falhasLogin) {
                if (agora - valor.inicio > JANELA_FALHAS_MS)
                    this.falhasLogin.delete(chave);
            }
            if (this.falhasLogin.size >= MAX_CONTAS_VIGIADAS) {
                const maisAntiga = this.falhasLogin.keys().next().value;
                if (maisAntiga !== undefined)
                    this.falhasLogin.delete(maisAntiga);
            }
        }
        this.falhasLogin.set(email, { total: 1, inicio: agora });
    }
    async login(dto) {
        const email = dto.email.toLowerCase().trim();
        if (this.contaBloqueada(email)) {
            throw (0, falha_1.falha)(common_1.HttpStatus.TOO_MANY_REQUESTS, 'Muitas tentativas de acesso com este e-mail. Aguarde 15 minutos ou use "Esqueci minha senha".');
        }
        const usuario = await this.prisma.usuario.findFirst({ where: { email, excluido: false } });
        const senhaConfere = await bcrypt_1.default.compare(dto.senha, usuario?.senha ?? HASH_FALSO);
        if (!usuario || usuario.status !== enums_1.EStatusGeral.Ativo || !senhaConfere) {
            this.registrarFalha(email);
            throw (0, falha_1.falha)(common_1.HttpStatus.UNAUTHORIZED, 'Credenciais inválidas.');
        }
        this.falhasLogin.delete(email);
        const token = this.gerarToken(usuario);
        const { senha: _senha, reset_token: _token, reset_token_expiracao: _exp, token_versao: _versao, ...usuarioPublico } = usuario;
        let empresa_expiracao = null;
        if (usuario.cod_empresa) {
            const empresa = await this.prisma.empresa.findFirst({
                where: { id: usuario.cod_empresa },
                select: { data_expiracao: true },
            });
            empresa_expiracao = empresa?.data_expiracao?.toISOString() ?? null;
        }
        return { success: true, data: { token, usuario: usuarioPublico, empresa_expiracao } };
    }
    async esqueciSenha(dto) {
        const email = dto.email.toLowerCase().trim();
        const usuario = await this.prisma.usuario.findFirst({ where: { email, excluido: false, status: enums_1.EStatusGeral.Ativo } });
        if (usuario) {
            const token = (0, node_crypto_1.randomBytes)(32).toString('hex');
            await this.prisma.usuario.update({
                where: { id: usuario.id },
                data: { reset_token: hashDoToken(token), reset_token_expiracao: new Date(Date.now() + 60 * 60 * 1000) },
            });
            const base = process.env['FRONTEND_URL']?.trim().replace(/\/+$/, '') || (0, site_url_util_1.siteUrl)();
            const link = `${base}/redefinir-senha?token=${token}`;
            await this.mail.enviar(email, 'Recuperação de Senha: Calhas Pro', this.htmlRecuperacao(usuario.nome, link));
        }
        return { success: true, message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' };
    }
    async redefinirSenha(dto) {
        const usuario = await this.prisma.usuario.findFirst({
            where: { reset_token: hashDoToken(dto.token), reset_token_expiracao: { gt: new Date() }, excluido: false },
        });
        if (!usuario)
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Token inválido ou expirado.');
        await this.prisma.usuario.update({
            where: { id: usuario.id },
            data: {
                senha: await bcrypt_1.default.hash(dto.nova_senha, exports.BCRYPT_ROUNDS),
                reset_token: null,
                reset_token_expiracao: null,
                token_versao: { increment: 1 },
            },
        });
        this.falhasLogin.delete(usuario.email);
        return { success: true, message: 'Senha redefinida com sucesso. Você já pode fazer login.' };
    }
    htmlRecuperacao(nome, link) {
        const nomeSeguro = nome.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
        return `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #f97316;">Recuperação de Senha</h2>
        <p>Olá, <strong>${nomeSeguro}</strong>!</p>
        <p>Você solicitou a redefinição de senha no <strong>Calhas Pro</strong>.</p>
        <p>Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>1 hora</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Redefinir Senha
          </a>
        </div>
        <p style="color: #666; font-size: 13px;">Se você não solicitou isso, ignore este e-mail. Sua senha permanece a mesma.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Calhas Pro, Sistema de Gestão</p>
      </div>`;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map