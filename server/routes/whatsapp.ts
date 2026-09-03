import { Router } from 'express';
import { whatsappService } from '../services/whatsapp';
import { dbService } from '../services/database';
import { broadcastToSSE } from './chat';

const router = Router();

router.post('/send', async (req, res) => {
  try {
    const { leadIds, leads: rawLeads, message, campaignName } = req.body;
    
    const settings = await dbService.getSettings();
    const token = settings.whatsappToken || process.env.WHATSAPP_TOKEN;
    const phoneNumberId = settings.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return res.status(400).json({ error: 'Credenciais do WhatsApp não configuradas nas Configurações ou Environment' });
    }

    const campaignId = await dbService.createCampaign({
      name: campaignName || 'Campanha sem nome',
      templateName: '',
      message,
      totalLeads: Array.isArray(leadIds) ? leadIds.length : (Array.isArray(rawLeads) ? rawLeads.length : 1),
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

      console.log(`\n🚀 Campanha ${campaignId} iniciada. leadIds=${JSON.stringify(leadIds)}, rawLeads=${Array.isArray(rawLeads) ? rawLeads.length : 0}`);

      // Lista consolidada de alvos
      const targets: Array<{ id?: number; name: string; phone: string }> = [];

      // Prioridade 1: usar rawLeads diretamente (já vêm com dados completos do frontend)
      if (Array.isArray(rawLeads) && rawLeads.length > 0) {
        for (const r of rawLeads) {
          const phone = (r.phone || '').replace(/\D/g, '');
          if (!phone || phone.length < 8) {
            console.log(`⚠️ Lead "${r.name}" sem telefone válido, pulando.`);
            failedCount++;
            continue;
          }
          try {
            const savedId = await dbService.createLead({
              name: r.name || 'Empresa',
              address: r.address || '',
              phone: phone,
              rating: r.rating || null,
              reviewCount: r.reviewCount || null,
              website: r.website || null,
              placeId: r.placeId || `gen-${Date.now()}-${Math.random()}`,
              photoUrl: r.photoUrl || null,
              category: r.category || 'Empresa',
              status: 'novo'
            });
            // Se INSERT OR IGNORE retornou 0, busca o existente pelo placeId
            const finalId = savedId || (r.placeId ? (await dbService.getByPlaceId(r.placeId))?.id : undefined);
            targets.push({ id: finalId, name: r.name, phone });
          } catch (e: any) {
            console.error(`❌ Erro ao salvar lead "${r.name}":`, e.message);
            targets.push({ name: r.name, phone });
          }
        }
      } else if (Array.isArray(leadIds) && leadIds.length > 0) {
        // Prioridade 2: buscar por IDs numéricos no banco
        for (const id of leadIds) {
          const lead = await dbService.getLeadById(Number(id));
          if (lead && lead.phone) {
            targets.push({ id: lead.id, name: lead.name, phone: lead.phone });
          } else {
            console.log(`⚠️ Lead ID ${id} não encontrado ou sem telefone.`);
          }
        }
      }

      console.log(`📋 Alvos para envio: ${targets.length}`);

      if (targets.length === 0) {
        console.error('❌ Nenhum alvo válido para envio. Encerrando campanha.');
        await dbService.updateCampaign(campaignId, { status: 'concluida', failed: failedCount });
        return;
      }

      for (const target of targets) {
        try {
          const msgId = await dbService.createMessage({
            campaignId,
            leadId: target.id || 0,
            waMessageId: null,
            status: 'pendente',
            error: null
          });

          const text = message.replace(/{nome}/g, target.name);

          let result;
          const templateName = settings.defaultTemplateName || process.env.WHATSAPP_TEMPLATE_NAME || 'proposta_site_v1';
          if (templateName) {
            result = await whatsappService.sendTemplateMessage(target.phone, templateName, [target.name], {
              token: token!,
              phoneNumberId: phoneNumberId!
            });
          } else {
            result = await whatsappService.sendTextMessage(target.phone, text, {
              token: token!,
              phoneNumberId: phoneNumberId!
            });
          }

          if (result.success) {
            sentCount++;
            await dbService.updateMessageStatus(msgId, 'enviado', undefined, result.messageId);
            if (target.id) {
              await dbService.updateLead(target.id, { status: 'contatado' });
            }

            // Registra a mensagem enviada no Chat / CRM
            await dbService.saveChatMessage({
              phone: target.phone,
              contactName: target.name,
              sender: 'me',
              body: text,
              waMessageId: result.messageId,
              deliveryStatus: 'sent'
            });

            // Notifica o Chat em tempo real via SSE
            broadcastToSSE('new_message', {
              phone: target.phone,
              contactName: target.name,
              sender: 'me',
              body: text,
              timestamp: new Date().toISOString(),
              deliveryStatus: 'sent',
              waMessageId: result.messageId
            });
          } else {
            failedCount++;
            await dbService.updateMessageStatus(msgId, 'falhou', result.error);
          }

          await dbService.updateCampaign(campaignId, { sent: sentCount, failed: failedCount });
        } catch (err: any) {
          console.error('Erro no envio em lote:', err);
          failedCount++;
        }

        // Delay de 1 segundo para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await dbService.updateCampaign(campaignId, { status: 'concluida' });
    })().catch(err => console.error('Erro geral na campanha:', err));

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
