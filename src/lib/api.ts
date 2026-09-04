const API_BASE = '/api';

export async function searchBusinesses(params: any) {
  return fetch(`${API_BASE}/maps/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }).then(r => r.json());
}

export async function geocodeLocation(query: string) {
  return fetch(`${API_BASE}/maps/geocode?query=${encodeURIComponent(query)}`).then(r => r.json());
}

export async function getLeads(status?: string) {
  const url = status ? `${API_BASE}/leads?status=${status}` : `${API_BASE}/leads`;
  return fetch(url).then(r => r.json());
}

export async function saveLeads(leads: any[]) {
  return fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leads })
  }).then(r => r.json());
}

export async function updateLead(id: number, data: any) {
  return fetch(`${API_BASE}/leads/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());
}

export async function deleteLead(id: number) {
  return fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE' }).then(r => r.json());
}

export async function getLeadStats() {
  return fetch(`${API_BASE}/leads/stats`).then(r => r.json());
}

export async function sendWhatsApp(data: { leadIds: number[], message: string, campaignName: string }) {
  return fetch(`${API_BASE}/whatsapp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());
}

export async function getCampaigns() {
  return fetch(`${API_BASE}/campaigns`).then(r => r.json());
}

export async function getCampaign(id: number) {
  return fetch(`${API_BASE}/campaigns/${id}`).then(r => r.json());
}

export async function testWhatsApp() {
  return fetch(`${API_BASE}/whatsapp/test`).then(r => r.json());
}

export async function getSettings() {
  return fetch(`${API_BASE}/settings`).then(r => r.json());
}

export async function updateSettings(settings: any) {
  return fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  }).then(r => r.json());
}

export async function testGoogleApi() {
  return fetch(`${API_BASE}/maps/test`).then(r => r.json());
}

export async function testWhatsAppApi() {
  return fetch(`${API_BASE}/whatsapp/test-api`).then(r => r.json());
}

// Chat / CRM
export async function getConversations() {
  return fetch(`${API_BASE}/chat/conversations`).then(r => r.json());
}

export async function getChatMessages(phone: string) {
  return fetch(`${API_BASE}/chat/messages/${encodeURIComponent(phone)}`).then(r => r.json());
}

export async function sendChatMessage(data: { phone: string; body: string; contactName?: string }) {
  return fetch(`${API_BASE}/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());
}

export async function updateLeadStatusByPhone(phone: string, status: string) {
  return fetch(`${API_BASE}/chat/lead-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, status })
  }).then(r => r.json());
}

export const CRM_STAGES = [
  { id: 'novo', label: 'Novo Lead', icon: '📥', color: 'badge-gray' },
  { id: 'contatado', label: 'Proposta Enviada', icon: '📩', color: 'badge-yellow' },
  { id: 'respondeu', label: 'Respondeu', icon: '💬', color: 'badge-cyan' },
  { id: 'desenvolver', label: 'Criar Prévia / Desenvolver', icon: '🛠️', color: 'badge-purple' },
  { id: 'em_desenvolvimento', label: 'Site em Desenvolvimento', icon: '⚡', color: 'badge-indigo' },
  { id: 'aguardando_aprovacao', label: 'Aguardando Aprovação', icon: '⏳', color: 'badge-orange' },
  { id: 'fechado', label: 'Cliente Fechado', icon: '🎉', color: 'badge-green' },
  { id: 'perdido', label: 'Sem Interesse', icon: '❌', color: 'badge-red' },
];

