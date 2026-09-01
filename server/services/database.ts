import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Lead, Campaign, Message, Settings } from '../types';

// Determinar path do banco de dados
// Tenta usar /data (Render Persistent Disk) ou SQLITE_PATH env, senão usa cwd
function getDbPath(): string {
  const envPath = process.env.SQLITE_PATH;
  if (envPath) return envPath;

  if (process.env.NODE_ENV === 'production') {
    // Tenta criar /data se não existir
    try {
      if (!fs.existsSync('/data')) {
        fs.mkdirSync('/data', { recursive: true });
      }
      return '/data/prospector.db';
    } catch {
      // Fallback para diretório do projeto
      return path.join(process.cwd(), 'prospector.db');
    }
  }
  return path.join(process.cwd(), 'prospector.db');
}

const DB_PATH = getDbPath();
console.log(`📂 Banco de dados: ${DB_PATH}`);

const db = new Database(DB_PATH);

// Melhorar performance SQLite
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// Inicializar banco de dados
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    rating REAL,
    reviewCount INTEGER,
    website TEXT,
    placeId TEXT UNIQUE NOT NULL,
    photoUrl TEXT,
    category TEXT,
    status TEXT DEFAULT 'novo',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    templateName TEXT,
    message TEXT NOT NULL,
    totalLeads INTEGER DEFAULT 0,
    sent INTEGER DEFAULT 0,
    delivered INTEGER DEFAULT 0,
    read INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'rascunho',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaignId INTEGER NOT NULL,
    leadId INTEGER NOT NULL,
    waMessageId TEXT,
    status TEXT DEFAULT 'pendente',
    error TEXT,
    sentAt DATETIME,
    FOREIGN KEY(campaignId) REFERENCES campaigns(id),
    FOREIGN KEY(leadId) REFERENCES leads(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    contactName TEXT,
    sender TEXT NOT NULL,
    body TEXT NOT NULL,
    waMessageId TEXT,
    deliveryStatus TEXT DEFAULT 'sent',
    status TEXT DEFAULT 'unread',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const DEFAULT_SETTINGS = {
  googleMapsApiKey: '',
  whatsappToken: '',
  whatsappPhoneNumberId: '',
  whatsappWabaId: '',
  defaultMessage: "Olá {nome}! Somos especialistas em criação de sites profissionais. Notamos que {nome} ainda não possui um site — gostaríamos de apresentar uma proposta que pode aumentar suas vendas. Posso te enviar mais detalhes?"
};

export const dbService = {
  // Leads
  createLead: (lead: Lead): number => {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO leads (name, address, phone, rating, reviewCount, website, placeId, photoUrl, category, status)
      VALUES (@name, @address, @phone, @rating, @reviewCount, @website, @placeId, @photoUrl, @category, @status)
    `);
    const result = stmt.run(lead);
    return result.lastInsertRowid as number;
  },

  getAllLeads: (status?: string): Lead[] => {
    if (status) {
      return db.prepare('SELECT * FROM leads WHERE status = ? ORDER BY createdAt DESC').all(status) as Lead[];
    }
    return db.prepare('SELECT * FROM leads ORDER BY createdAt DESC').all() as Lead[];
  },

  getLeadById: (id: number): Lead | undefined => {
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as Lead | undefined;
  },

  getByPlaceId: (placeId: string): Lead | undefined => {
    return db.prepare('SELECT * FROM leads WHERE placeId = ?').get(placeId) as Lead | undefined;
  },

  updateLead: (id: number, lead: Partial<Lead>) => {
    const sets = Object.keys(lead).map(k => `${k} = @${k}`).join(', ');
    const stmt = db.prepare(`UPDATE leads SET ${sets} WHERE id = @id`);
    stmt.run({ ...lead, id });
  },

  deleteLead: (id: number) => {
    db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  },

  getLeadStats: () => {
    return db.prepare('SELECT status, COUNT(*) as count FROM leads GROUP BY status').all();
  },

  // Campanhas
  createCampaign: (campaign: Campaign): number => {
    const stmt = db.prepare(`
      INSERT INTO campaigns (name, templateName, message, totalLeads, status)
      VALUES (@name, @templateName, @message, @totalLeads, @status)
    `);
    const result = stmt.run(campaign);
    return result.lastInsertRowid as number;
  },

  getAllCampaigns: (): Campaign[] => {
    return db.prepare('SELECT * FROM campaigns ORDER BY createdAt DESC').all() as Campaign[];
  },

  getCampaignById: (id: number): Campaign | undefined => {
    return db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as Campaign | undefined;
  },

  updateCampaign: (id: number, campaign: Partial<Campaign>) => {
    const sets = Object.keys(campaign).map(k => `${k} = @${k}`).join(', ');
    const stmt = db.prepare(`UPDATE campaigns SET ${sets} WHERE id = @id`);
    stmt.run({ ...campaign, id });
  },

  // Mensagens
  createMessage: (message: Message): number => {
    const stmt = db.prepare(`
      INSERT INTO messages (campaignId, leadId, waMessageId, status, error, sentAt)
      VALUES (@campaignId, @leadId, @waMessageId, @status, @error, @sentAt)
    `);
    const result = stmt.run(message);
    return result.lastInsertRowid as number;
  },

  getMessagesByCampaign: (campaignId: number): Message[] => {
    return db.prepare('SELECT * FROM messages WHERE campaignId = ?').all(campaignId) as Message[];
  },

  updateMessageStatus: (id: number, status: string, error?: string, waMessageId?: string) => {
    const stmt = db.prepare('UPDATE messages SET status = ?, error = ?, waMessageId = ?, sentAt = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(status, error || null, waMessageId || null, id);
  },

  // Chat / CRM
  saveChatMessage: (msg: { phone: string; contactName?: string; sender: 'user' | 'me'; body: string; waMessageId?: string; deliveryStatus?: string }) => {
    const stmt = db.prepare(`
      INSERT INTO chat_messages (phone, contactName, sender, body, waMessageId, deliveryStatus)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      msg.phone.replace(/\D/g, ''),
      msg.contactName || null,
      msg.sender,
      msg.body,
      msg.waMessageId || null,
      msg.deliveryStatus || 'sent'
    );
  },

  updateChatMessageDelivery: (waMessageId: string, deliveryStatus: string) => {
    db.prepare('UPDATE chat_messages SET deliveryStatus = ? WHERE waMessageId = ?').run(deliveryStatus, waMessageId);
  },

  getConversations: () => {
    return db.prepare(`
      SELECT 
        cm.phone,
        cm.contactName,
        cm.body as lastMessage,
        cm.timestamp,
        cm.sender,
        COUNT(CASE WHEN cm2.status = 'unread' AND cm2.sender = 'user' THEN 1 END) as unreadCount
      FROM chat_messages cm
      INNER JOIN (
        SELECT phone, MAX(id) as maxId
        FROM chat_messages
        GROUP BY phone
      ) latest ON cm.phone = latest.phone AND cm.id = latest.maxId
      LEFT JOIN chat_messages cm2 ON cm2.phone = cm.phone AND cm2.status = 'unread' AND cm2.sender = 'user'
      GROUP BY cm.phone
      ORDER BY cm.timestamp DESC
    `).all();
  },

  getChatMessagesByPhone: (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    db.prepare("UPDATE chat_messages SET status = 'read' WHERE phone = ? AND sender = 'user'").run(cleanPhone);
    return db.prepare("SELECT * FROM chat_messages WHERE phone = ? ORDER BY timestamp ASC").all(cleanPhone);
  },

  getLatestChatMessageId: (): number => {
    const row = db.prepare('SELECT MAX(id) as maxId FROM chat_messages').get() as any;
    return row?.maxId || 0;
  },

  getNewChatMessages: (sinceId: number) => {
    return db.prepare('SELECT * FROM chat_messages WHERE id > ? ORDER BY timestamp ASC').all(sinceId);
  },

  // Configurações
  getSettings: (): Settings => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string, value: string }[];
    const settings = { ...DEFAULT_SETTINGS } as Record<string, any>;
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings as Settings;
  },

  setSetting: (key: string, value: string) => {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
  },

  updateSettings: (settings: Partial<Settings>) => {
    const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    const transaction = db.transaction((settings: Partial<Settings>) => {
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined) {
          stmt.run(key, String(value));
        }
      }
    });
    transaction(settings);
  }
};
