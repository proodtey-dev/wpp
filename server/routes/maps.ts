import { Router } from 'express';
import { googleMapsService } from '../services/googleMaps';
import { dbService } from '../services/database';

const router = Router();

router.post('/search', async (req, res) => {
  try {
    const { latitude, longitude, radius, type, keyword, ...filters } = req.body;
    const settings = dbService.getSettings();
    const apiKey = settings.googleMapsApiKey || '';

    const leads = await googleMapsService.searchNearby({ latitude, longitude, radius, type, keyword }, apiKey);
    const filteredLeads = googleMapsService.filterResults(leads, filters as any);

    res.json({
      results: filteredLeads,
      total: leads.length,
      filtered: filteredLeads.length,
      isFreeMode: !apiKey
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar locais', details: error.message });
  }
});

router.get('/geocode', async (req, res) => {
  try {
    const query = req.query.query as string;
    if (!query) {
      return res.status(400).json({ error: 'Parâmetro query é obrigatório' });
    }

    const settings = dbService.getSettings();
    const apiKey = settings.googleMapsApiKey || '';

    const location = await googleMapsService.geocode(query, apiKey);
    if (!location) {
      return res.status(404).json({ error: 'Local não encontrado' });
    }

    res.json(location);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro no geocoding', details: error.message });
  }
});

export default router;
