import { Router } from 'express';
import { dbService } from '../services/database';
import { whatsappService } from '../services/whatsapp';
import { googleMapsService } from '../services/googleMaps';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const settings = await dbService.getSettings();
    
    // Mascarar tokens sensíveis
    const maskedSettings = {
      ...settings,
      whatsappToken: settings.whatsappToken ? `${settings.whatsappToken.substring(0, 10)}...` : '',
      googleMapsApiKey: settings.googleMapsApiKey ? `${settings.googleMapsApiKey.substring(0, 10)}...` : ''
    };
    
    res.json(maskedSettings);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar configurações', details: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const newSettings = req.body;
    
    // Evitar salvar valores mascarados
    if (newSettings.whatsappToken && newSettings.whatsappToken.includes('...')) {
      delete newSettings.whatsappToken;
    }
    if (newSettings.googleMapsApiKey && newSettings.googleMapsApiKey.includes('...')) {
      delete newSettings.googleMapsApiKey;
    }

    await dbService.updateSettings(newSettings);
    res.json({ message: 'Configurações atualizadas com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar configurações', details: error.message });
  }
});

router.post('/test-google', async (req, res) => {
  try {
    const { apiKey } = req.body;
    const settings = await dbService.getSettings();
    const key = apiKey || settings.googleMapsApiKey;
    
    if (!key) {
      return res.status(400).json({ error: 'Chave da API não fornecida' });
    }

    const result = await googleMapsService.geocode('São Paulo, SP', key);
    
    if (result) {
      res.json({ success: true, message: 'Chave da API do Google válida' });
    } else {
      res.status(400).json({ success: false, error: 'Chave da API inválida ou sem permissão' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao testar API do Google', details: error.message });
  }
});

router.post('/test-whatsapp', async (req, res) => {
  try {
    const { token, phoneNumberId } = req.body;
    const settings = await dbService.getSettings();
    
    const config = {
      token: token || settings.whatsappToken,
      phoneNumberId: phoneNumberId || settings.whatsappPhoneNumberId
    };
    
    if (!config.token || !config.phoneNumberId) {
      return res.status(400).json({ error: 'Credenciais não fornecidas' });
    }

    const result = await whatsappService.testConnection(config);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao testar WhatsApp', details: error.message });
  }
});

// Debug: lista templates reais da conta Meta usando env vars
router.get('/debug-meta', async (req, res) => {
  try {
    const settings = await dbService.getSettings();
    const token = settings.whatsappToken || process.env.WHATSAPP_TOKEN || '';
    const wabaId = settings.whatsappWabaId || process.env.WHATSAPP_WABA_ID || '1394332478791215';
    const phoneNumberId = settings.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '1280543321810380';

    const tokenStatus = token ? `${token.substring(0, 15)}...` : 'NÃO CONFIGURADO';

    if (!token) {
      return res.json({
        tokenStatus,
        wabaId,
        phoneNumberId,
        templates: [],
        error: 'Token não encontrado nas settings nem nas env vars'
      });
    }

    const resp = await fetch(`https://graph.facebook.com/v22.0/${wabaId}/message_templates?fields=name,status,language&limit=20&access_token=${token}`);
    const data = await resp.json() as any;

    res.json({
      tokenStatus,
      wabaId,
      phoneNumberId,
      metaResponse: data
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
