import express from 'express';
import cors from 'cors';
import path from 'path';
import mapsRoutes from './routes/maps';
import leadsRoutes from './routes/leads';
import whatsappRoutes from './routes/whatsapp';
import settingsRoutes from './routes/settings';
import chatRoutes from './routes/chat';
import pushRoutes from './routes/push';

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
app.use('/api/push', pushRoutes);

// Servir frontend compilado em produção
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback para React SPA em Express 5
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  next();
});

// Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log('✅ Banco de dados inicializado com suporte a Chat/CRM!');
  console.log('Rotas disponíveis: /api/maps, /api/leads, /api/whatsapp, /api/settings, /api/chat');
});
