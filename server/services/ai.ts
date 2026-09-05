import { dbService } from './database';

interface LeadContext {
  name: string;
  category?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  website?: string;
}

interface ChatContext {
  contactName?: string;
  phone: string;
  messages: Array<{ sender: string; body: string; timestamp?: string }>;
}

export const aiService = {
  // 1. Geração de Pitch de Venda Personalizado para o Prospector
  generatePitch: async (lead: LeadContext) => {
    const settings = await dbService.getSettings();
    const apiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
    const tone = settings.aiTone || 'consultivo e focado em converter';

    const prompt = `Você é um especialista em vendas B2B no WhatsApp no Brasil.
Crie UMA mensagem curta, humana e altamente persuasiva para o primeiro contato no WhatsApp com esta empresa:

- Nome da Empresa: "${lead.name}"
- Categoria / Ramo: "${lead.category || 'Serviços'}"
- Endereço / Local: "${lead.address || 'Brasil'}"
- Nota no Google: ${lead.rating ? `${lead.rating} estrelas (${lead.reviewCount || 0} avaliações)` : 'Sem avaliações'}
- Situação do Site: Não possui site ou possui um site desatualizado.

REGRAS OBRIGATÓRIAS:
1. O objetivo é oferecer a criação de um SITE PROFISSIONAL com modelo/prévia gratuita para aprovação (pagamento de R$ 200 somente se aprovar).
2. Escreva em português do Brasil com tom ${tone}.
3. A mensagem DEVE parecer escrita manualmente por uma pessoa no celular (sem formatação exagerada, sem hashtags, use no máximo 1 emoji).
4. Termine com uma pergunta direta oferecendo enviar o link de um modelo pronto do segmento dela.
5. Retorne APENAS o texto da mensagem.`;

    if (apiKey) {
      try {
        const isGroq = apiKey.startsWith('gsk_');
        const endpoint = isGroq
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';
        const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 300
          })
        });

        const data = await res.json();
        if (data.choices?.[0]?.message?.content) {
          return { success: true, pitch: data.choices[0].message.content.trim() };
        }
      } catch (err: any) {
        console.error('Erro na chamada da API de IA:', err);
      }
    }

    // Fallback inteligente caso não haja API Key configurada
    const cat = lead.category || 'sua área';
    const fallbackPitch = `Olá, boa tarde! Notei que a ${lead.name} é referência no segmento de ${cat}, mas ainda não possui um site otimizado para celulares. Consigo criar um modelo profissional gratuitamente e você só paga R$ 200 se aprovar. Posso te enviar uma prévia do segmento de ${cat} para você dar uma olhada?`;

    return { success: true, pitch: fallbackPitch };
  },

  // 2. Sugestão de Resposta / Roteiro de Áudio para o Chat
  suggestChatReply: async (chatCtx: ChatContext) => {
    const settings = await dbService.getSettings();
    const apiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;

    const formattedMessages = chatCtx.messages
      .slice(-6)
      .map(m => `${m.sender === 'me' ? 'Eu (Vendedor)' : 'Cliente'}: ${m.body}`)
      .join('\n');

    const prompt = `Você é um fechador de vendas experiente no WhatsApp.
Examine o histórico recente desta conversa de vendas de site profissional (R$ 200 após aprovação):

---
Histórico da Conversa:
${formattedMessages}
---

Sua tarefa:
Gere DUAS opções de resposta para dar continuidade ao fechamento:
1. "texto": Uma resposta direta em texto (máximo 2 a 3 frases).
2. "roteiroAudio": Um roteiro de áudio curto de 15 a 25 segundos em 1ª pessoa (ex: "Opa Fulano, tudo bem? Tô gravando esse áudio rapidinho porque...").

Responda ESTRITAMENTE em formato JSON sem markdown com esta estrutura:
{"texto": "...", "roteiroAudio": "..."}`;

    if (apiKey) {
      try {
        const isGroq = apiKey.startsWith('gsk_');
        const endpoint = isGroq
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';
        const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          })
        });

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return { success: true, ...parsed };
        }
      } catch (err: any) {
        console.error('Erro na IA chat suggestion:', err);
      }
    }

    // Fallback inteligente para o chat
    const name = chatCtx.contactName || 'parceiro';
    return {
      success: true,
      texto: `Opa ${name}, tudo bem? Já preparei a prévia do site com foco em colocar seu negócio no topo do Google. Posso te enviar o link para você conferir agora?`,
      roteiroAudio: `Opa ${name}, tudo bem? Tô passando aqui rapidinho porque terminei a prévia do seu site aqui no computador! Ficou bem moderno e com o botão de WhatsApp direto pro seu celular. Te mando o link pra você dar uma olhada?`
    };
  }
};
