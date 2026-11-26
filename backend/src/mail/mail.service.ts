import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  private obterTransporter(): Transporter {
    this.transporter ??= nodemailer.createTransport({
      host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
      port: parseInt(process.env['SMTP_PORT'] || '587', 10),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: { user: process.env['SMTP_USER'] || '', pass: process.env['SMTP_PASS'] || '' },
    });
    return this.transporter;
  }

  async enviar(para: string, assunto: string, html: string): Promise<boolean> {
    try {
      await this.obterTransporter().sendMail({
        from: `"Calhas Pro" <${process.env['SMTP_USER'] || 'noreply@calhaspro.com.br'}>`,
        to: para,
        subject: assunto,
        html,
      });
      return true;
    } catch (erro) {
      this.logger.error(`Falha ao enviar e-mail: ${(erro as Error).message}`);
      return false;
    }
  }
}
