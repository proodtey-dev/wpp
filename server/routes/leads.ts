import { Router } from 'express';
import { dbService } from '../services/database';

const router = Router();

router.get('/', (req, res) => {
  try {
    const status = req.query.status as string;
    const leads = dbService.getAllLeads(status);
    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar leads', details: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const data = req.body;
    const leads = Array.isArray(data) ? data : [data];
    
    const savedIds: number[] = [];
    for (const lead of leads) {
      const id = dbService.createLead(lead);
      if (id) savedIds.push(id);
    }
    
    res.status(201).json({ message: 'Leads salvos com sucesso', ids: savedIds });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao salvar leads', details: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    dbService.updateLead(id, req.body);
    res.json({ message: 'Lead atualizado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar lead', details: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    dbService.deleteLead(id);
    res.json({ message: 'Lead excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir lead', details: error.message });
  }
});

router.get('/stats', (req, res) => {
  try {
    const stats = dbService.getLeadStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas', details: error.message });
  }
});

export default router;
