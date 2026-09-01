import { Router } from 'express';
import { googleMapsService } from '../services/googleMaps';
import { dbService } from '../services/database';

const router = Router();

router.post('/search', async (req, res) => {
  try {
    const { latitude, longitude, radius, type, keyword, queryText, page, ...filters } = req.body;
    const settings = dbService.getSettings();
    const apiKey = settings.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY || '';

    const queryToUse = queryText || keyword || '';

    const leads = await googleMapsService.searchNearby({
      latitude: latitude || 0,
      longitude: longitude || 0,
      radius: radius || 5000,
      type: type || '',
      keyword: queryToUse,
      queryText: queryToUse,
      page: Number(page) || 1
    }, apiKey);

    const filteredLeads = googleMapsService.filterResults(leads, filters as any);

    res.json({
      results: filteredLeads,
      total: leads.length,
      filtered: filteredLeads.length,
      page: Number(page) || 1,
      isFreeMode: !apiKey
    });
  } catch (error: any) {
    console.error('Erro no /api/maps/search:', error);
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
    const apiKey = settings.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY || '';

    const location = await googleMapsService.geocode(query, apiKey);
    if (!location) {
      return res.json({ latitude: -19.9167, longitude: -43.9345 });
    }

    res.json(location);
  } catch (error: any) {
    res.json({ latitude: -19.9167, longitude: -43.9345 });
  }
});

export default router;
