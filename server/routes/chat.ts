import { Router, Request, Response } from 'express';
import { dbService } from '../services/database';
import { whatsappService } from '../services/whatsapp';
import { pushService } from '../services/push';

const router = Router();

// SSE clients store
const sseClients: Set<Response> = new Set();

// Broadcast to all SSE clients
export const broadcastToSSE = (event: string, data: any) => {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  });
};

// SSE Stream endpoint for real-time chat updates
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Add client to set
  sseClients.add(res);

  // Send a heartbeat every 25s to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 25000);

  // Remove client when disconnected
  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

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

const handleWebhookEvent = async (req: any, res: any) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Incoming message from customer
      if (value?.messages?.[0]) {
        const msgObj = value.messages[0];
        const fromPhone = msgObj.from;
        const contactName = value.contacts?.[0]?.profile?.name || 'Cliente';
        const msgText = msgObj.text?.body || msgObj.caption || '[Mídia / Botão]';

        await dbService.saveChatMessage({
          phone: fromPhone,
          contactName,
          sender: 'user',
          body: msgText,
          waMessageId: msgObj.id,
          deliveryStatus: 'received'
        });

        // Update lead status if exists
        const leads = await dbService.getAllLeads();
        const lead = leads.find(l => l.phone && l.phone.replace(/\D/g, '') === fromPhone);
        if (lead && lead.id) {
          await dbService.updateLead(lead.id, { status: 'respondeu' });
        }

        // Broadcast new message to all SSE clients in real time
        broadcastToSSE('new_message', {
          phone: fromPhone,
          contactName,
          sender: 'user',
          body: msgText,
          timestamp: new Date().toISOString(),
          deliveryStatus: 'received'
        });

        // Trigger Web Push Notification to registered iPhones/devices
        pushService.sendPushToAll(
          `💬 ${contactName || 'Novo Cliente'}`,
          msgText,
          '/chat'
        ).catch(err => console.error('Erro ao disparar push no webhook:', err));
      }

      // Delivery/read status updates from Meta
      if (value?.statuses?.[0]) {
        const statusUpdate = value.statuses[0];
        const { id: waMessageId, status, errors } = statusUpdate;

        if (waMessageId) {
          const deliveryStatus = errors ? 'failed' : status;
          await dbService.updateChatMessageDelivery(waMessageId, deliveryStatus);

          broadcastToSSE('message_status', {
            waMessageId,
            deliveryStatus
          });
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

// Webhook GET / POST handlers
router.get('/', handleWebhookVerification);
router.get('/webhook', handleWebhookVerification);
router.post('/', handleWebhookEvent);
router.post('/webhook', handleWebhookEvent);

// List all chat conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await dbService.getConversations();
    res.json(conversations);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get messages for a specific phone number
router.get('/messages/:phone', async (req, res) => {
  try {
    const messages = await dbService.getChatMessagesByPhone(req.params.phone);
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

    const settings = await dbService.getSettings();
    const token = settings.whatsappToken || process.env.WHATSAPP_TOKEN;
    const phoneNumberId = settings.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return res.status(400).json({ error: 'WhatsApp API não configurada' });
    }

    // Send via WhatsApp Cloud API
    const waResult = await whatsappService.sendTextMessage(phone, body, {
      token,
      phoneNumberId
    });

    const deliveryStatus = waResult.success ? 'sent' : 'failed';

    // Save to database with delivery status
    await dbService.saveChatMessage({
      phone,
      contactName,
      sender: 'me',
      body,
      waMessageId: waResult.messageId,
      deliveryStatus
    });

    // Broadcast to SSE clients
    broadcastToSSE('new_message', {
      phone,
      contactName,
      sender: 'me',
      body,
      timestamp: new Date().toISOString(),
      deliveryStatus,
      waMessageId: waResult.messageId
    });

    res.json({ success: waResult.success, result: waResult, deliveryStatus });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
