import { Router, Request, Response } from 'express';
import { aiService } from '../services/ai';

const router = Router();

// POST /api/ai/pitch -> gera pitch personalizado para o prospector
router.post('/pitch', async (req: Request, res: Response) => {
  try {
    const { lead } = req.body;
    if (!lead || !lead.name) {
      return res.status(400).json({ error: 'Dados do lead são obrigatórios' });
    }
    const result = await aiService.generatePitch(lead);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/chat-suggest -> sugere resposta de texto e roteiro de áudio no chat
router.post('/chat-suggest', async (req: Request, res: Response) => {
  try {
    const { contactName, phone, messages } = req.body;
    if (!phone || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'phone e messages são obrigatórios' });
    }
    const result = await aiService.suggestChatReply({ contactName, phone, messages });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
