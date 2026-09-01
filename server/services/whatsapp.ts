interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
  wabaId?: string;
}

export const whatsappService = {
  sendTemplateMessage: async (to: string, templateName: string, params: string[], config: WhatsAppConfig) => {
    try {
      const formattedTo = to.replace(/\D/g, '');
      const response = await fetch(`https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedTo,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'pt_BR'
            },
            components: params.length > 0 ? [
              {
                type: 'body',
                parameters: params.map(p => ({
                  type: 'text',
                  text: p
                }))
              }
            ] : []
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao enviar template');
      }
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error: any) {
      console.error('Erro ao enviar mensagem no WhatsApp:', error);
      return { success: false, error: error.message };
    }
  },

  sendTextMessage: async (to: string, message: string, config: WhatsAppConfig) => {
    try {
      const formattedTo = to.replace(/\D/g, '');
      const response = await fetch(`https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedTo,
          type: 'text',
          text: {
            body: message
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao enviar mensagem de texto');
      }
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error: any) {
      console.error('Erro ao enviar mensagem de texto no WhatsApp:', error);
      return { success: false, error: error.message };
    }
  },

  testConnection: async (config: WhatsAppConfig) => {
    try {
      const response = await fetch(`https://graph.facebook.com/v22.0/${config.phoneNumberId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Falha ao testar conexão');
      }
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getTemplates: async (wabaId: string, token: string) => {
    try {
      const response = await fetch(`https://graph.facebook.com/v22.0/${wabaId}/message_templates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Falha ao buscar templates');
      }
      return { success: true, data: data.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};
