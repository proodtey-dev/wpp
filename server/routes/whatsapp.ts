import { Router } from 'express';
import { whatsappService } from '../services/whatsapp';
import { dbService } from '../services/database';

const router = Router();

router.post('/send', async (req, res) => {
  try {
    const { leadIds, message, campaignName } = req.body;
    
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'IDs dos leads são obrigatórios' });
    }

    const settings = await dbService.getSettings();
    if (!settings.whatsappToken || !settings.whatsappPhoneNumberId) {
      return res.status(400).json({ error: 'Credenciais do WhatsApp não configuradas' });
    }

    const campaignId = await dbService.createCampaign({
      name: campaignName || 'Campanha sem nome',
      templateName: '',
      message,
      totalLeads: leadIds.length,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      status: 'enviando'
    });

    res.json({ message: 'Campanha iniciada com sucesso', campaignId });

    // Enviar mensagens em background
    (async () => {
      let sentCount = 0;
      let failedCount = 0;

      for (const id of leadIds) {
        const lead = await dbService.getLeadById(id);
        if (!lead || !lead.phone) {
          failedCount++;
          continue;
        }

        const msgId = await dbService.createMessage({
          campaignId,
          leadId: id,
          waMessageId: null,
          status: 'pendente',
          error: null
        });

        const text = message.replace(/{nome}/g, lead.name);

        let result;
        if (settings.defaultTemplateName || process.env.WHATSAPP_TEMPLATE_NAME) {
          const templateName = settings.defaultTemplateName || process.env.WHATSAPP_TEMPLATE_NAME;
          result = await whatsappService.sendTemplateMessage(lead.phone, templateName, [lead.name], {
            token: settings.whatsappToken,
            phoneNumberId: settings.whatsappPhoneNumberId
          });
        } else {
          result = await whatsappService.sendTextMessage(lead.phone, text, {
            token: settings.whatsappToken,
            phoneNumberId: settings.whatsappPhoneNumberId
          });
        }

        if (result.success) {
          sentCount++;
          await dbService.updateMessageStatus(msgId, 'enviado', undefined, result.messageId);
          await dbService.updateLead(id, { status: 'contatado' });

          // Registra a mensagem enviada no Chat / CRM
          await dbService.saveChatMessage({
            phone: lead.phone,
            contactName: lead.name,
            sender: 'me',
            body: text,
            waMessageId: result.messageId,
            deliveryStatus: 'sent'
          });
        } else {
          failedCount++;
          await dbService.updateMessageStatus(msgId, 'falhou', result.error);
        }

        await dbService.updateCampaign(campaignId, { sent: sentCount, failed: failedCount });

        // Delay de 1 segundo para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await dbService.updateCampaign(campaignId, { status: 'concluida' });
    })();

  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao iniciar campanha', details: error.message });
  }
});

router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await dbService.getAllCampaigns();
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar campanhas', details: error.message });
  }
});

router.get('/campaigns/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const campaign = await dbService.getCampaignById(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    const messages = await dbService.getMessagesByCampaign(id);
    res.json({ ...campaign, messages });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar detalhes da campanha', details: error.message });
  }
});

router.post('/test', async (req, res) => {
  try {
    const settings = await dbService.getSettings();
    if (!settings.whatsappToken || !settings.whatsappPhoneNumberId) {
      return res.status(400).json({ error: 'Credenciais não configuradas' });
    }

    const result = await whatsappService.testConnection({
      token: settings.whatsappToken,
      phoneNumberId: settings.whatsappPhoneNumberId
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao testar conexão', details: error.message });
  }
});

router.get('/templates', async (req, res) => {
  try {
    const settings = await dbService.getSettings();
    if (!settings.whatsappToken || !settings.whatsappWabaId) {
      return res.status(400).json({ error: 'WABA ID e Token não configurados' });
    }

    const result = await whatsappService.getTemplates(settings.whatsappWabaId, settings.whatsappToken);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar templates', details: error.message });
  }
});

export default router;
