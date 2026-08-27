import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '#config/prisma';
import { authMiddleware } from '#middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const subscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parse = subscribeSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message });
      return;
    }
    const { endpoint, keys } = parse.data;
    const userAgent = req.headers['user-agent']?.slice(0, 255) ?? null;

    await prisma.pushSubscription.upsert({
      where: { cod_usuario_endpoint: { cod_usuario: req.user!.id, endpoint } },
      create: {
        cod_usuario: req.user!.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent,
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent,
      },
    });
    res.status(StatusCodes.CREATED).json({ success: true });
  } catch (err) {
    console.error('[PUSH_SUBSCRIPTION_POST]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao registrar inscrição de push.' });
  }
});

router.delete('/', async (req: Request, res: Response) => {
  try {
    const parse = unsubscribeSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: parse.error.issues[0].message });
      return;
    }
    await prisma.pushSubscription.deleteMany({
      where: { cod_usuario: req.user!.id, endpoint: parse.data.endpoint },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[PUSH_SUBSCRIPTION_DELETE]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao remover inscrição de push.' });
  }
});

router.get('/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ success: true, data: { publicKey: process.env['VAPID_PUBLIC_KEY'] ?? null } });
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const count = await prisma.pushSubscription.count({ where: { cod_usuario: req.user!.id } });
    res.json({ success: true, data: { inscrito: count > 0 } });
  } catch (err) {
    console.error('[PUSH_SUBSCRIPTION_STATUS]', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erro ao consultar status da inscrição.' });
  }
});

export default router;
