import webpush from 'web-push';
import { dbService } from './database';

let vapidConfigured = false;
let vapidPublicKey = '';

async function initVapid() {
  if (vapidConfigured) return;

  const settings = await dbService.getSettings();
  let publicKey = process.env.VAPID_PUBLIC_KEY || (settings as any).vapidPublicKey;
  let privateKey = process.env.VAPID_PRIVATE_KEY || (settings as any).vapidPrivateKey;

  if (!publicKey || !privateKey) {
    console.log('🔑 Gerando novas chaves VAPID para Notificações Push...');
    const keys = webpush.generateVAPIDKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;

    await dbService.setSetting('vapidPublicKey', publicKey);
    await dbService.setSetting('vapidPrivateKey', privateKey);
  }

  webpush.setVapidDetails(
    'mailto:suporte@prospector.app',
    publicKey,
    privateKey
  );

  vapidPublicKey = publicKey;
  vapidConfigured = true;
  console.log('📱 Push Notifications VAPID configuradas com sucesso');
}

export const pushService = {
  getPublicKey: async (): Promise<string> => {
    await initVapid();
    return vapidPublicKey;
  },

  sendPushToAll: async (title: string, body: string, url: string = '/chat') => {
    try {
      await initVapid();
      const subscriptions = await dbService.getAllPushSubscriptions();

      if (!subscriptions || subscriptions.length === 0) {
        console.log('📱 Nenhuma inscrição push cadastrada para notificar.');
        return;
      }

      console.log(`📱 Disparando notificação push para ${subscriptions.length} dispositivo(s)...`);

      const payload = JSON.stringify({
        title,
        body,
        url,
        tag: 'wpp-msg-' + Date.now()
      });

      const promises = subscriptions.map(async (sub) => {
        try {
          const subscriptionObj = {
            endpoint: sub.endpoint,
            keys: JSON.parse(sub.keys)
          };
          await webpush.sendNotification(subscriptionObj, payload);
          console.log(`✅ Push enviado para: ${sub.endpoint.slice(0, 30)}...`);
        } catch (err: any) {
          console.error(`❌ Erro ao enviar push para ${sub.endpoint.slice(0, 30)}:`, err.message);
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Inscrição expirada ou cancelada -> remover do banco
            await dbService.removePushSubscription(sub.endpoint);
          }
        }
      });

      await Promise.all(promises);
    } catch (e: any) {
      console.error('Erro no pushService.sendPushToAll:', e.message);
    }
  }
};
