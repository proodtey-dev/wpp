import { Router } from 'express';
import { dbService } from '../services/database';
import { pushService } from '../services/push';

const router = Router();

// Obter chave pública VAPID
router.get('/vapid-key', async (req, res) => {
  try {
    const publicKey = await pushService.getPublicKey();
    res.json({ publicKey });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Registrar inscrição Push
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Subscription inválida' });
    }

    await dbService.savePushSubscription(
      subscription.endpoint,
      JSON.stringify(subscription.keys)
    );

    console.log('✅ Dispositivo registrado para Notificações Push!');
    res.json({ message: 'Inscrição salva com sucesso' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Cancelar inscrição Push
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await dbService.removePushSubscription(endpoint);
    }
    res.json({ message: 'Inscrição removida com sucesso' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Disparar notificação de teste
router.post('/test', async (req, res) => {
  try {
    await pushService.sendPushToAll(
      '🧪 Teste de Notificação',
      'As notificações do WPP Prospector estão funcionando perfeitamente no seu dispositivo! 🎉',
      '/chat'
    );
    res.json({ message: 'Notificação de teste disparada com sucesso!' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
