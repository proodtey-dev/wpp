import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Lead, Campaign, Message, Settings } from '../types';

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const useTurso = Boolean(tursoUrl && tursoToken);

let client: any = null;
let db: any = null;

if (useTurso) {
  console.log(`🌐 Usando Turso Cloud Database: ${tursoUrl}`);
  client = createClient({
    url: tursoUrl!,
    authToken: tursoToken!,
  });
} else {
  function getDbPath(): string {
    const envPath = process.env.SQLITE_PATH;
    if (envPath) return envPath;

    if (process.env.NODE_ENV === 'production') {
      try {
        if (!fs.existsSync('/data')) {
          fs.mkdirSync('/data', { recursive: true });
        }
        return '/data/prospector.db';
      } catch {
        return path.join(process.cwd(), 'prospector.db');
      }
    }
    return path.join(process.cwd(), 'prospector.db');
  }

  const DB_PATH = getDbPath();
  console.log(`📂 Usando SQLite Local: ${DB_PATH}`);
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
}

// Promessa de inicialização de tabelas
const initPromise = (async () => {
  const statements = [
    `CREATE TABLE IF NOT EXISTS leads (
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
    )`,
    `CREATE TABLE IF NOT EXISTS campaigns (
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
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaignId INTEGER NOT NULL,
      leadId INTEGER NOT NULL,
      waMessageId TEXT,
      status TEXT DEFAULT 'pendente',
      error TEXT,
      sentAt DATETIME,
      FOREIGN KEY(campaignId) REFERENCES campaigns(id),
      FOREIGN KEY(leadId) REFERENCES leads(id)
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      contactName TEXT,
      sender TEXT NOT NULL,
      body TEXT NOT NULL,
      waMessageId TEXT,
      deliveryStatus TEXT DEFAULT 'sent',
      status TEXT DEFAULT 'unread',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT UNIQUE NOT NULL,
      keys TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  if (useTurso) {
    for (const stmt of statements) {
      await client.execute(stmt);
    }
    // Migration: adicionar colunas de mídia caso não existam
    try { await client.execute('ALTER TABLE chat_messages ADD COLUMN mediaUrl TEXT'); } catch {}
    try { await client.execute('ALTER TABLE chat_messages ADD COLUMN mediaType TEXT'); } catch {}
  } else {
    for (const stmt of statements) {
      db.exec(stmt);
    }
    // Migration: adicionar colunas de mídia caso não existam
    try { db.exec('ALTER TABLE chat_messages ADD COLUMN mediaUrl TEXT'); } catch {}
    try { db.exec('ALTER TABLE chat_messages ADD COLUMN mediaType TEXT'); } catch {}
  }
})().catch(err => console.error('Erro ao inicializar tabelas:', err));

const DEFAULT_SETTINGS = {
  googleMapsApiKey: '',
  whatsappToken: '',
  whatsappPhoneNumberId: '',
  whatsappWabaId: '',
  openaiApiKey: '',
  aiTone: 'consultivo e focado em converter',
  defaultMessage: "Olá {nome}! Somos especialistas em criação de sites profissionais. Notamos que {nome} ainda não possui um site — gostaríamos de apresentar uma proposta que pode aumentar suas vendas. Posso te enviar mais detalhes?"
};

async function ensureInit() {
  await initPromise;
}

export const dbService = {
  // Leads
  createLead: async (lead: Lead): Promise<number> => {
    await ensureInit();
    if (useTurso) {
      const res = await client.execute({
        sql: `INSERT OR IGNORE INTO leads (name, address, phone, rating, reviewCount, website, placeId, photoUrl, category, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [lead.name, lead.address, lead.phone || null, lead.rating || null, lead.reviewCount || null, lead.website || null, lead.placeId, lead.photoUrl || null, lead.category || null, lead.status || 'novo']
      });
      return Number(res.lastInsertRowid || 0);
    } else {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO leads (name, address, phone, rating, reviewCount, website, placeId, photoUrl, category, status)
        VALUES (@name, @address, @phone, @rating, @reviewCount, @website, @placeId, @photoUrl, @category, @status)
      `);
      const result = stmt.run(lead);
      return result.lastInsertRowid as number;
    }
  },

  getAllLeads: async (status?: string): Promise<Lead[]> => {
    await ensureInit();
    if (useTurso) {
      const res = status
        ? await client.execute({ sql: 'SELECT * FROM leads WHERE status = ? ORDER BY createdAt DESC', args: [status] })
        : await client.execute('SELECT * FROM leads ORDER BY createdAt DESC');
      return res.rows as unknown as Lead[];
    } else {
      if (status) {
        return db.prepare('SELECT * FROM leads WHERE status = ? ORDER BY createdAt DESC').all(status) as Lead[];
      }
      return db.prepare('SELECT * FROM leads ORDER BY createdAt DESC').all() as Lead[];
    }
  },

  getLeadById: async (id: number): Promise<Lead | undefined> => {
    if (useTurso) {
      const res = await client.execute({ sql: 'SELECT * FROM leads WHERE id = ?', args: [id] });
      return res.rows[0] as unknown as Lead | undefined;
    } else {
      return db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as Lead | undefined;
    }
  },

  getByPlaceId: async (placeId: string): Promise<Lead | undefined> => {
    if (useTurso) {
      const res = await client.execute({ sql: 'SELECT * FROM leads WHERE placeId = ?', args: [placeId] });
      return res.rows[0] as unknown as Lead | undefined;
    } else {
      return db.prepare('SELECT * FROM leads WHERE placeId = ?').get(placeId) as Lead | undefined;
    }
  },

  updateLead: async (id: number, lead: Partial<Lead>) => {
    const keys = Object.keys(lead);
    if (keys.length === 0) return;
    if (useTurso) {
      const sets = keys.map(k => `${k} = ?`).join(', ');
      const args = [...Object.values(lead), id];
      await client.execute({ sql: `UPDATE leads SET ${sets} WHERE id = ?`, args });
    } else {
      const sets = keys.map(k => `${k} = @${k}`).join(', ');
      const stmt = db.prepare(`UPDATE leads SET ${sets} WHERE id = @id`);
      stmt.run({ ...lead, id });
    }
  },

  deleteLead: async (id: number) => {
    if (useTurso) {
      await client.execute({ sql: 'DELETE FROM leads WHERE id = ?', args: [id] });
    } else {
      db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    }
  },

  getLeadStats: async () => {
    if (useTurso) {
      const res = await client.execute('SELECT status, COUNT(*) as count FROM leads GROUP BY status');
      return res.rows;
    } else {
      return db.prepare('SELECT status, COUNT(*) as count FROM leads GROUP BY status').all();
    }
  },

  // Campanhas
  createCampaign: async (campaign: Campaign): Promise<number> => {
    if (useTurso) {
      const res = await client.execute({
        sql: `INSERT INTO campaigns (name, templateName, message, totalLeads, status) VALUES (?, ?, ?, ?, ?)`,
        args: [campaign.name, campaign.templateName || null, campaign.message, campaign.totalLeads || 0, campaign.status || 'rascunho']
      });
      return Number(res.lastInsertRowid || 0);
    } else {
      const stmt = db.prepare(`
        INSERT INTO campaigns (name, templateName, message, totalLeads, status)
        VALUES (@name, @templateName, @message, @totalLeads, @status)
      `);
      const result = stmt.run(campaign);
      return result.lastInsertRowid as number;
    }
  },

  getAllCampaigns: async (): Promise<Campaign[]> => {
    if (useTurso) {
      const res = await client.execute('SELECT * FROM campaigns ORDER BY createdAt DESC');
      return res.rows as unknown as Campaign[];
    } else {
      return db.prepare('SELECT * FROM campaigns ORDER BY createdAt DESC').all() as Campaign[];
    }
  },

  getCampaignById: async (id: number): Promise<Campaign | undefined> => {
    if (useTurso) {
      const res = await client.execute({ sql: 'SELECT * FROM campaigns WHERE id = ?', args: [id] });
      return res.rows[0] as unknown as Campaign | undefined;
    } else {
      return db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as Campaign | undefined;
    }
  },

  updateCampaign: async (id: number, campaign: Partial<Campaign>) => {
    const keys = Object.keys(campaign);
    if (keys.length === 0) return;
    if (useTurso) {
      const sets = keys.map(k => `${k} = ?`).join(', ');
      const args = [...Object.values(campaign), id];
      await client.execute({ sql: `UPDATE campaigns SET ${sets} WHERE id = ?`, args });
    } else {
      const sets = keys.map(k => `${k} = @${k}`).join(', ');
      const stmt = db.prepare(`UPDATE campaigns SET ${sets} WHERE id = @id`);
      stmt.run({ ...campaign, id });
    }
  },

  // Mensagens
  createMessage: async (message: Message): Promise<number> => {
    if (useTurso) {
      const res = await client.execute({
        sql: `INSERT INTO messages (campaignId, leadId, waMessageId, status, error, sentAt) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [message.campaignId, message.leadId, message.waMessageId || null, message.status || 'pendente', message.error || null, message.sentAt || null]
      });
      return Number(res.lastInsertRowid || 0);
    } else {
      const stmt = db.prepare(`
        INSERT INTO messages (campaignId, leadId, waMessageId, status, error, sentAt)
        VALUES (@campaignId, @leadId, @waMessageId, @status, @error, @sentAt)
      `);
      const result = stmt.run(message);
      return result.lastInsertRowid as number;
    }
  },

  getMessagesByCampaign: async (campaignId: number): Promise<Message[]> => {
    if (useTurso) {
      const res = await client.execute({ sql: 'SELECT * FROM messages WHERE campaignId = ?', args: [campaignId] });
      return res.rows as unknown as Message[];
    } else {
      return db.prepare('SELECT * FROM messages WHERE campaignId = ?').all(campaignId) as Message[];
    }
  },

  updateMessageStatus: async (id: number, status: string, error?: string, waMessageId?: string) => {
    if (useTurso) {
      await client.execute({
        sql: 'UPDATE messages SET status = ?, error = ?, waMessageId = ?, sentAt = CURRENT_TIMESTAMP WHERE id = ?',
        args: [status, error || null, waMessageId || null, id]
      });
    } else {
      const stmt = db.prepare('UPDATE messages SET status = ?, error = ?, waMessageId = ?, sentAt = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.run(status, error || null, waMessageId || null, id);
    }
  },

  // Chat / CRM
  saveChatMessage: async (msg: { phone: string; contactName?: string; sender: 'user' | 'me'; body: string; waMessageId?: string; deliveryStatus?: string; mediaUrl?: string; mediaType?: string }) => {
    await ensureInit();
    const cleanPhone = msg.phone.replace(/\D/g, '');
    if (useTurso) {
      await client.execute({
        sql: `INSERT INTO chat_messages (phone, contactName, sender, body, waMessageId, deliveryStatus, mediaUrl, mediaType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [cleanPhone, msg.contactName || null, msg.sender, msg.body, msg.waMessageId || null, msg.deliveryStatus || 'sent', msg.mediaUrl || null, msg.mediaType || null]
      });
    } else {
      const stmt = db.prepare(`
        INSERT INTO chat_messages (phone, contactName, sender, body, waMessageId, deliveryStatus, mediaUrl, mediaType)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(cleanPhone, msg.contactName || null, msg.sender, msg.body, msg.waMessageId || null, msg.deliveryStatus || 'sent', msg.mediaUrl || null, msg.mediaType || null);
    }
  },

  updateChatMessageDelivery: async (waMessageId: string, deliveryStatus: string) => {
    if (useTurso) {
      await client.execute({
        sql: 'UPDATE chat_messages SET deliveryStatus = ? WHERE waMessageId = ?',
        args: [deliveryStatus, waMessageId]
      });
    } else {
      db.prepare('UPDATE chat_messages SET deliveryStatus = ? WHERE waMessageId = ?').run(deliveryStatus, waMessageId);
    }
  },

  getConversations: async () => {
    await ensureInit();
    const sql = `
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
    `;
    const rows = useTurso ? (await client.execute(sql)).rows : db.prepare(sql).all();
    const leads = await dbService.getAllLeads();
    return (rows as any[]).map((conv: any) => {
      const cleanConvPhone = String(conv.phone).replace(/\D/g, '');
      const match = leads.find(l => {
        if (!l.phone) return false;
        const lp = String(l.phone).replace(/\D/g, '');
        return lp === cleanConvPhone || (lp.length >= 8 && cleanConvPhone.length >= 8 && (lp.endsWith(cleanConvPhone) || cleanConvPhone.endsWith(lp)));
      });
      return {
        ...conv,
        leadId: match?.id || null,
        leadStatus: match?.status || 'novo',
        leadName: match?.name || conv.contactName,
      };
    });
  },

  updateLeadStatusByPhone: async (phone: string, status: string, contactName?: string) => {
    await ensureInit();
    const cleanPhone = phone.replace(/\D/g, '');
    const leads = await dbService.getAllLeads();
    let lead = leads.find(l => {
      if (!l.phone) return false;
      const lp = String(l.phone).replace(/\D/g, '');
      return lp === cleanPhone || (lp.length >= 8 && cleanPhone.length >= 8 && (lp.endsWith(cleanPhone) || cleanPhone.endsWith(lp)));
    });

    if (lead && lead.id) {
      await dbService.updateLead(lead.id, { status });
      return { success: true, leadId: lead.id, status };
    }

    // Se o lead ainda não existia na tabela de leads, cria automaticamente para salvar a categoria para sempre
    const name = contactName || `Contato ${cleanPhone}`;
    const newLeadId = await dbService.createLead({
      name,
      address: 'WhatsApp Direct Chat',
      phone: cleanPhone,
      placeId: `chat_${cleanPhone}_${Date.now()}`,
      status: status
    });

    return { success: true, leadId: newLeadId, status };
  },

  getChatMessagesByPhone: async (phone: string) => {
    await ensureInit();
    const cleanPhone = phone.replace(/\D/g, '');
    if (useTurso) {
      await client.execute({ sql: "UPDATE chat_messages SET status = 'read' WHERE phone = ? AND sender = 'user'", args: [cleanPhone] });
      const res = await client.execute({ sql: "SELECT * FROM chat_messages WHERE phone = ? ORDER BY timestamp ASC", args: [cleanPhone] });
      return res.rows;
    } else {
      db.prepare("UPDATE chat_messages SET status = 'read' WHERE phone = ? AND sender = 'user'").run(cleanPhone);
      return db.prepare("SELECT * FROM chat_messages WHERE phone = ? ORDER BY timestamp ASC").all(cleanPhone);
    }
  },

  // Configurações
  getSettings: async (): Promise<Settings> => {
    await ensureInit();
    let rows: { key: string; value: string }[] = [];
    if (useTurso) {
      const res = await client.execute('SELECT key, value FROM settings');
      rows = res.rows as unknown as { key: string; value: string }[];
    } else {
      rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    }
    const settings = { ...DEFAULT_SETTINGS } as Record<string, any>;
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings as Settings;
  },

  setSetting: async (key: string, value: string) => {
    if (useTurso) {
      await client.execute({
        sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        args: [key, value]
      });
    } else {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
    }
  },

  updateSettings: async (settings: Partial<Settings>) => {
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        await dbService.setSetting(key, String(value));
      }
    }
  },

  // Push Subscriptions
  savePushSubscription: async (endpoint: string, keysJson: string) => {
    await ensureInit();
    if (useTurso) {
      await client.execute({
        sql: 'INSERT INTO push_subscriptions (endpoint, keys) VALUES (?, ?) ON CONFLICT(endpoint) DO UPDATE SET keys = excluded.keys',
        args: [endpoint, keysJson]
      });
    } else {
      db.prepare('INSERT INTO push_subscriptions (endpoint, keys) VALUES (?, ?) ON CONFLICT(endpoint) DO UPDATE SET keys = excluded.keys').run(endpoint, keysJson);
    }
  },

  removePushSubscription: async (endpoint: string) => {
    await ensureInit();
    if (useTurso) {
      await client.execute({ sql: 'DELETE FROM push_subscriptions WHERE endpoint = ?', args: [endpoint] });
    } else {
      db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
    }
  },

  getAllPushSubscriptions: async (): Promise<Array<{ endpoint: string; keys: string }>> => {
    await ensureInit();
    if (useTurso) {
      const res = await client.execute('SELECT endpoint, keys FROM push_subscriptions');
      return res.rows as unknown as Array<{ endpoint: string; keys: string }>;
    } else {
      return db.prepare('SELECT endpoint, keys FROM push_subscriptions').all() as Array<{ endpoint: string; keys: string }>;
    }
  }
};
