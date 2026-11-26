import { Injectable, Logger } from '@nestjs/common';
import webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

interface IPushPayload {
  title: string;
  body: string;
  url?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly configurado: boolean;

  constructor(private readonly prisma: PrismaService) {
    const publica = process.env['VAPID_PUBLIC_KEY'];
    const privada = process.env['VAPID_PRIVATE_KEY'];
    this.configurado = !!publica && !!privada;
    if (this.configurado) {
      webpush.setVapidDetails(
        process.env['VAPID_SUBJECT'] || 'mailto:contato@calhaspro.com.br',
        publica as string,
        privada as string,
      );
    } else {
      this.logger.warn('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY não configuradas: push desativado.');
    }
  }

  async enviarParaUsuarios(usuarioIds: number[], payload: IPushPayload): Promise<void> {
    if (!this.configurado || usuarioIds.length === 0) return;
    try {
      const inscricoes = await this.prisma.pushSubscription.findMany({ where: { cod_usuario: { in: usuarioIds } } });
      const corpo = JSON.stringify({
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/icons/icon-192x192.png',
          data: { onActionClick: { default: { operation: 'openWindow', url: payload.url ?? '/' } } },
        },
      });
      await Promise.all(
        inscricoes.map(async (sub) => {
          try {
            await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, corpo);
          } catch (erro) {
            const status = (erro as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) {
              await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
            } else {
              this.logger.error(`Falha no envio: ${(erro as Error).message}`);
            }
          }
        }),
      );
    } catch (erro) {
      this.logger.error(`Falha ao enviar push: ${(erro as Error).message}`);
    }
  }
}
