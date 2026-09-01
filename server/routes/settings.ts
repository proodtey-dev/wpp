import { Router } from 'express';
import { dbService } from '../services/database';
import { whatsappService } from '../services/whatsapp';
import { googleMapsService } from '../services/googleMaps';

const router = Router();

router.get('/', (req, res) => {
  try {
    const settings = dbService.getSettings();
    
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

router.put('/', (req, res) => {
  try {
    const newSettings = req.body;
    
    // Evitar salvar valores mascarados
    if (newSettings.whatsappToken && newSettings.whatsappToken.includes('...')) {
      delete newSettings.whatsappToken;
    }
    if (newSettings.googleMapsApiKey && newSettings.googleMapsApiKey.includes('...')) {
      delete newSettings.googleMapsApiKey;
    }

    dbService.updateSettings(newSettings);
    res.json({ message: 'Configurações atualizadas com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar configurações', details: error.message });
  }
});

router.post('/test-google', async (req, res) => {
  try {
    const { apiKey } = req.body;
    const key = apiKey || dbService.getSettings().googleMapsApiKey;
    
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
    const settings = dbService.getSettings();
    
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

export default router;
