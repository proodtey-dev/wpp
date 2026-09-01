import express from 'express';
import cors from 'cors';
import mapsRoutes from './routes/maps';
import leadsRoutes from './routes/leads';
import whatsappRoutes from './routes/whatsapp';
import settingsRoutes from './routes/settings';
import chatRoutes from './routes/chat';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/maps', mapsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/webhook', chatRoutes); // Support both /api/webhook and /api/chat/webhook

// Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log('✅ Banco de dados inicializado com suporte a Chat/CRM!');
  console.log('Rotas disponíveis:');
  console.log(' - /api/maps');
  console.log(' - /api/leads');
  console.log(' - /api/whatsapp');
  console.log(' - /api/settings');
  console.log(' - /api/chat');
});
