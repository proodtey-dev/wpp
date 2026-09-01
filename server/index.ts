import express from 'express';
import cors from 'cors';
import path from 'path';
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

// API Routes
app.use('/api/maps', mapsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/webhook', chatRoutes);

// Servir frontend compilado em produção
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log('✅ Banco de dados inicializado com suporte a Chat/CRM!');
  console.log('Rotas disponíveis: /api/maps, /api/leads, /api/whatsapp, /api/settings, /api/chat');
});
