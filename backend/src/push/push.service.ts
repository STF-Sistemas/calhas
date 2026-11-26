import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { sendNotification, setVapidDetails } from 'web-push';
import { falha } from '../common/falha';
import { PrismaService } from '../prisma/prisma.service';

const HOSTS_PUSH = [
  'fcm.googleapis.com',
  'android.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  'notify.windows.com',
  'push.apple.com',
];

export function endpointPushValido(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.port !== '' || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    return HOSTS_PUSH.some((permitido) => host === permitido || host.endsWith(`.${permitido}`));
  } catch {
    return false;
  }
}

interface IChavesPush {
  p256dh: string;
  auth: string;
}

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
      setVapidDetails(
        process.env['VAPID_SUBJECT'] || 'mailto:contato@calhaspro.com.br',
        publica as string,
        privada as string,
      );
    } else {
      this.logger.warn('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY não configuradas: push desativado.');
    }
  }

  async inscrever(idUsuario: number, endpoint: string, chaves: IChavesPush, agente?: string) {
    if (!endpointPushValido(endpoint)) throw falha(HttpStatus.BAD_REQUEST, 'Endpoint de notificação não permitido.');
    const dados = { p256dh: chaves.p256dh, auth: chaves.auth, user_agent: agente?.slice(0, 255) ?? null };
    await this.prisma.pushSubscription.upsert({
      where: { cod_usuario_endpoint: { cod_usuario: idUsuario, endpoint } },
      create: { cod_usuario: idUsuario, endpoint, ...dados },
      update: dados,
    });
    return { success: true };
  }

  async cancelar(idUsuario: number, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { cod_usuario: idUsuario, endpoint } });
    return { success: true };
  }

  chavePublica() {
    return { success: true, data: { publicKey: process.env['VAPID_PUBLIC_KEY'] ?? null } };
  }

  async status(idUsuario: number) {
    const total = await this.prisma.pushSubscription.count({ where: { cod_usuario: idUsuario } });
    return { success: true, data: { inscrito: total > 0 } };
  }

  async enviarParaUsuarios(usuarioIds: number[], payload: IPushPayload): Promise<void> {
    if (!this.configurado || usuarioIds.length === 0) return;
    try {
      const inscricoes = await this.prisma.pushSubscription.findMany({ where: { cod_usuario: { in: usuarioIds } }, take: 500 });
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
          if (!endpointPushValido(sub.endpoint)) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
            return;
          }
          try {
            await sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, corpo);
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
