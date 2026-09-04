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

        const msgType = msgObj.type;
        let msgText = msgObj.text?.body || '';
        let mediaUrl: string | undefined = undefined;
        let mediaType: string | undefined = undefined;

        if (msgType === 'image') {
          const mediaId = msgObj.image?.id;
          const caption = msgObj.image?.caption || '';
          msgText = caption ? `📷 ${caption}` : '📷 Imagem';
          if (mediaId) {
            mediaUrl = `/api/chat/media/${mediaId}`;
            mediaType = 'image';
          }
        } else if (msgType === 'sticker') {
          const mediaId = msgObj.sticker?.id;
          msgText = '💟 Figurinha';
          if (mediaId) {
            mediaUrl = `/api/chat/media/${mediaId}`;
            mediaType = 'sticker';
          }
        } else if (msgType === 'audio' || msgType === 'voice') {
          const audioObj = msgObj.audio || msgObj.voice;
          const mediaId = audioObj?.id;
          msgText = '🎵 Áudio de voz';
          if (mediaId) {
            mediaUrl = `/api/chat/media/${mediaId}`;
            mediaType = 'audio';
          }
        } else if (msgType === 'video') {
          const mediaId = msgObj.video?.id;
          const caption = msgObj.video?.caption || '';
          msgText = caption ? `🎥 ${caption}` : '🎥 Vídeo';
          if (mediaId) {
            mediaUrl = `/api/chat/media/${mediaId}`;
            mediaType = 'video';
          }
        } else if (msgType === 'document') {
          const mediaId = msgObj.document?.id;
          const filename = msgObj.document?.filename || 'Documento';
          msgText = `📄 Documento: ${filename}`;
          if (mediaId) {
            mediaUrl = `/api/chat/media/${mediaId}`;
            mediaType = 'document';
          }
        } else if (msgType === 'button') {
          msgText = msgObj.button?.text || '[Botão]';
        } else if (msgType === 'interactive') {
          msgText = msgObj.interactive?.button_reply?.title || msgObj.interactive?.list_reply?.title || '[Resposta Interativa]';
        } else if (msgType === 'reaction') {
          msgText = msgObj.reaction?.emoji || '👍';
        } else if (msgType === 'location') {
          msgText = `📍 Localização: ${msgObj.location?.name || ''} (${msgObj.location?.latitude}, ${msgObj.location?.longitude})`;
        } else if (!msgText) {
          msgText = '[Mensagem do WhatsApp]';
        }

        await dbService.saveChatMessage({
          phone: fromPhone,
          contactName,
          sender: 'user',
          body: msgText,
          waMessageId: msgObj.id,
          deliveryStatus: 'received',
          mediaUrl,
          mediaType
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
          mediaUrl,
          mediaType,
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

    res.json({ success: true, result: waResult, deliveryStatus });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Update lead status by phone number
router.post('/lead-status', async (req: Request, res: Response) => {
  try {
    const { phone, status } = req.body;
    if (!phone || !status) {
      return res.status(400).json({ error: 'phone e status são obrigatórios' });
    }

    const result = await dbService.updateLeadStatusByPhone(phone, status);
    if (result.success) {
      broadcastToSSE('lead_status_updated', {
        phone,
        leadId: result.leadId,
        status
      });
    }
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Send an audio recording in chat
router.post('/send-audio', async (req: Request, res: Response) => {
  try {
    const { phone, audioBase64, mimeType, contactName } = req.body;
    if (!phone || !audioBase64) {
      return res.status(400).json({ error: 'phone e audioBase64 são obrigatórios' });
    }

    const settings = await dbService.getSettings();
    const token = settings.whatsappToken || process.env.WHATSAPP_TOKEN;
    const phoneNumberId = settings.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return res.status(400).json({ error: 'WhatsApp API não configurada' });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-zA-Z0-9-+.]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    // Meta API requer tipos de áudio suportados: audio/mp4, audio/aac, audio/mpeg, audio/ogg
    let audioMime = mimeType || 'audio/mp4';
    if (audioMime.includes('webm')) {
      audioMime = 'audio/mp4';
    }
    const ext = audioMime.includes('ogg') ? 'ogg' : audioMime.includes('aac') ? 'aac' : 'mp4';
    const filename = `voice_${Date.now()}.${ext}`;

    const mediaId = await whatsappService.uploadMedia(buffer, audioMime, filename, {
      token,
      phoneNumberId
    });

    const waResult = await whatsappService.sendAudioMessage(phone, mediaId, {
      token,
      phoneNumberId
    });

    let errorMsg = waResult.error;
    if (!waResult.success && errorMsg) {
      if (errorMsg.includes('24 hours') || errorMsg.includes('131047') || errorMsg.includes('re-engagement')) {
        errorMsg = 'Janela de 24h expirada: O WhatsApp só permite enviar áudios/mensagens diretas para quem te respondeu nas últimas 24 horas. Para este lead, envie primeiro a Proposta (Template).';
      }
    }

    const deliveryStatus = waResult.success ? 'sent' : 'failed';
    const mediaUrl = `/api/chat/media/${mediaId}`;

    await dbService.saveChatMessage({
      phone,
      contactName,
      sender: 'me',
      body: '🎵 Áudio de voz',
      waMessageId: waResult.messageId,
      deliveryStatus,
      mediaUrl,
      mediaType: 'audio'
    });

    broadcastToSSE('new_message', {
      phone,
      contactName,
      sender: 'me',
      body: '🎵 Áudio de voz',
      mediaUrl,
      mediaType: 'audio',
      timestamp: new Date().toISOString(),
      deliveryStatus,
      waMessageId: waResult.messageId
    });

    res.json({
      success: waResult.success,
      result: waResult,
      mediaUrl,
      mediaId,
      deliveryStatus,
      error: errorMsg
    });
  } catch (e: any) {
    console.error('Erro ao enviar áudio no chat:', e);
    res.status(500).json({ error: e.message });
  }
});

// Proxy de Mídia do WhatsApp (imagens, figurinhas, áudios, vídeos, documentos)
router.get('/media/:mediaId', async (req: Request, res: Response) => {
  try {
    const { mediaId } = req.params;
    const settings = await dbService.getSettings();
    const token = settings.whatsappToken || process.env.WHATSAPP_TOKEN;

    if (!token) {
      return res.status(400).send('Token do WhatsApp não configurado');
    }

    // 1. Obter URL do arquivo na Meta API
    const metaResp = await fetch(`https://graph.facebook.com/v22.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!metaResp.ok) {
      const err = await metaResp.text();
      console.error('Erro ao buscar mídia na Meta API:', err);
      return res.status(404).send('Mídia não encontrada na Meta');
    }

    const metaData = await metaResp.json() as any;
    const fileUrl = metaData.url;

    if (!fileUrl) {
      return res.status(404).send('URL da mídia não disponível');
    }

    // 2. Baixar os bytes da mídia usando o token do WhatsApp
    const mediaResp = await fetch(fileUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!mediaResp.ok) {
      return res.status(500).send('Erro ao baixar arquivo de mídia da Meta');
    }

    const contentType = metaData.mime_type || mediaResp.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache de 24h

    const arrayBuffer = await mediaResp.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('Erro no proxy de mídia do WhatsApp:', error.message);
    res.status(500).send('Erro interno ao carregar mídia');
  }
});

export default router;
