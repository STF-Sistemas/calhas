import webpush from 'web-push';
import { prisma } from '#config/prisma';

const VAPID_PUBLIC_KEY = process.env['VAPID_PUBLIC_KEY'];
const VAPID_PRIVATE_KEY = process.env['VAPID_PRIVATE_KEY'];
const VAPID_SUBJECT = process.env['VAPID_SUBJECT'] || 'mailto:contato@calhaspro.com.br';

const vapidConfigurado = !!VAPID_PUBLIC_KEY && !!VAPID_PRIVATE_KEY;

if (vapidConfigurado) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY as string, VAPID_PRIVATE_KEY as string);
} else {
  console.warn('[WEB_PUSH] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY não configuradas — push notifications desativadas.');
}

interface IPushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function enviarPushParaUsuarios(usuarioIds: number[], payload: IPushPayload): Promise<void> {
  if (!vapidConfigurado || usuarioIds.length === 0) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { cod_usuario: { in: usuarioIds } },
    });

    const url = payload.url ?? '/';
    const payloadJson = JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body,
        icon: '/icons/icon-192x192.png',
        data: {
          onActionClick: {
            default: { operation: 'openWindow', url },
          },
        },
      },
    });

    await Promise.all(subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payloadJson,
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error('[WEB_PUSH_SEND]', err?.message ?? err);
        }
      }
    }));
  } catch (err) {
    console.error('[WEB_PUSH_ENVIAR]', err);
  }
}
