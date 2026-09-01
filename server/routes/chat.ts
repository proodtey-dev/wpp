import { Router } from 'express';
import { dbService } from '../services/database';
import { whatsappService } from '../services/whatsapp';

const router = Router();

const handleWebhookVerification = (req: any, res: any) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('📬 Meta Webhook verification request received:', { mode, token, challenge });

  if (mode === 'subscribe' || challenge) {
    console.log('✅ Webhook do WhatsApp Meta verificado com sucesso!');
    return res.status(200).send(String(challenge));
  }

  res.status(200).send(String(challenge || 'OK'));
};

const handleWebhookEvent = (req: any, res: any) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Se for uma mensagem recebida de um cliente
      if (value?.messages?.[0]) {
        const msgObj = value.messages[0];
        const fromPhone = msgObj.from;
        const contactName = value.contacts?.[0]?.profile?.name || 'Cliente';
        const msgText = msgObj.text?.body || msgObj.caption || '[Mídia / Botão]';

        // Salva a mensagem recebida no chat CRM
        dbService.saveChatMessage({
          phone: fromPhone,
          contactName,
          sender: 'user',
          body: msgText
        });

        // Atualiza status do lead se existir
        const lead = dbService.getAllLeads().find(l => l.phone && l.phone.replace(/\D/g, '') === fromPhone);
        if (lead && lead.id) {
          dbService.updateLead(lead.id, { status: 'respondeu' });
        }
      }

      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.status(200).send('EVENT_RECEIVED');
    }
  } catch (error) {
    console.error('Erro ao processar webhook Meta:', error);
    res.status(200).send('EVENT_RECEIVED');
  }
};

// Webhook GET / POST handlers for both /api/webhook and /api/webhook/
router.get('/', handleWebhookVerification);
router.get('/webhook', handleWebhookVerification);
router.post('/', handleWebhookEvent);
router.post('/webhook', handleWebhookEvent);

// List all chat conversations
router.get('/conversations', (req, res) => {
  try {
    const conversations = dbService.getConversations();
    res.json(conversations);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get messages for a specific phone number
router.get('/messages/:phone', (req, res) => {
  try {
    const messages = dbService.getChatMessagesByPhone(req.params.phone);
    res.json(messages);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Send a reply in chat
router.post('/send', async (req, res) => {
  try {
    const { phone, body, contactName } = req.body;
    if (!phone || !body) {
      return res.status(400).json({ error: 'phone e body são obrigatórios' });
    }

    const settings = dbService.getSettings();
    const token = settings.whatsappToken || process.env.WHATSAPP_TOKEN;
    const phoneNumberId = settings.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return res.status(400).json({ error: 'WhatsApp API não configurada em Configurações' });
    }

    // 1. Send via WhatsApp Cloud API
    const waResult = await whatsappService.sendTextMessage(phone, body, {
      token,
      phoneNumberId
    });

    // 2. Save to database
    dbService.saveChatMessage({
      phone,
      contactName,
      sender: 'me',
      body
    });

    res.json({ success: true, result: waResult });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
