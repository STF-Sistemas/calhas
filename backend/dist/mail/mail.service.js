"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer_1 = __importDefault(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    logger = new common_1.Logger(MailService_1.name);
    transporter;
    obterTransporter() {
        this.transporter ??= nodemailer_1.default.createTransport({
            host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
            port: parseInt(process.env['SMTP_PORT'] || '587', 10),
            secure: process.env['SMTP_SECURE'] === 'true',
            auth: { user: process.env['SMTP_USER'] || '', pass: process.env['SMTP_PASS'] || '' },
        });
        return this.transporter;
    }
    async enviar(para, assunto, html) {
        try {
            await this.obterTransporter().sendMail({
                from: `"Calhas Pro" <${process.env['SMTP_USER'] || 'noreply@calhaspro.com.br'}>`,
                to: para,
                subject: assunto,
                html,
            });
            return true;
        }
        catch (erro) {
            this.logger.error(`Falha ao enviar e-mail: ${erro.message}`);
            return false;
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)()
], MailService);
//# sourceMappingURL=mail.service.js.map