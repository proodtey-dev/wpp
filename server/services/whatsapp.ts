interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
  wabaId?: string;
}

export const whatsappService = {
  sendTemplateMessage: async (to: string, templateName: string, params: string[], config: WhatsAppConfig) => {
    try {
      let formattedTo = to.replace(/\D/g, '');
      if (formattedTo.length === 10 || formattedTo.length === 11) {
        formattedTo = '55' + formattedTo;
      }

      const phoneNumberId = config.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '1280543321810380';
      const token = config.token || process.env.WHATSAPP_TOKEN;

      const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
        console.error('Erro Meta API Template:', data);
        throw new Error(data.error?.message || 'Erro ao enviar template');
      }
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error: any) {
      console.error('Erro ao enviar mensagem no WhatsApp:', error);
      return { success: false, error: error.message };
    }
  },

  sendTextMessage: async (to: string, message: string, config: WhatsAppConfig) => {
    let formattedTo = to.replace(/\D/g, '');
    if (formattedTo.length === 10 || formattedTo.length === 11) {
      formattedTo = '55' + formattedTo;
    }

    const phoneNumberId = config.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '1280543321810380';
    const token = config.token || process.env.WHATSAPP_TOKEN;

    const doSend = async (targetPhone: string) => {
      console.log(`📤 Tentando enviar via Meta WhatsApp Cloud API para ${targetPhone}...`);
      const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: targetPhone,
          type: 'text',
          text: { body: message }
        })
      });
      const data = await response.json();
      return { ok: response.ok, data };
    };

    try {
      // 1ª tentativa com o número original
      let res = await doSend(formattedTo);

      // Se falhar e for número BR com 12 dígitos (55 + DDD + 8 dígitos sem o 9º dígito), tenta adicionando o 9
      if (!res.ok && formattedTo.startsWith('55') && formattedTo.length === 12) {
        const altPhone = formattedTo.slice(0, 4) + '9' + formattedTo.slice(4);
        console.log(`⚠️ 1ª tentativa falhou. Tentando com 9º dígito: ${altPhone}...`);
        res = await doSend(altPhone);
      }

      if (!res.ok) {
        console.error('❌ Erro na API Meta WhatsApp:', res.data);
        const errMsg = res.data.error?.message || res.data.error?.error_data?.details || 'Erro ao enviar mensagem';
        return { success: false, error: errMsg };
      }

      console.log('✅ Mensagem entregue com sucesso via Meta API! ID:', res.data.messages?.[0]?.id);
      return { success: true, messageId: res.data.messages?.[0]?.id };
    } catch (error: any) {
      console.error('Erro de conexão ao enviar mensagem no WhatsApp:', error);
      return { success: false, error: error.message };
    }
  },

  testConnection: async (config: WhatsAppConfig) => {
    try {
      const phoneNumberId = config.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '1280543321810380';
      const token = config.token || process.env.WHATSAPP_TOKEN;

      const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
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
      const id = wabaId || process.env.WHATSAPP_WABA_ID || '1394332478791215';
      const tk = token || process.env.WHATSAPP_TOKEN;

      const response = await fetch(`https://graph.facebook.com/v22.0/${id}/message_templates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tk}`
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
  },

  uploadMedia: async (buffer: Buffer, mimeType: string, filename: string, config: WhatsAppConfig) => {
    const phoneNumberId = config.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '1280543321810380';
    const token = config.token || process.env.WHATSAPP_TOKEN;

    // Meta API requer que o campo 'type' seja uma das strings literais: 'audio', 'image', 'document', 'video', 'sticker'
    const mediaTypeCategory = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'audio';

    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', mediaTypeCategory);
    formData.append('file', new Blob([buffer], { type: mimeType }), filename);

    console.log(`📤 Subindo arquivo para Meta API: filename=${filename}, category=${mediaTypeCategory}, mime=${mimeType}, size=${buffer.length} bytes...`);

    const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json() as any;
    if (!response.ok) {
      console.error('❌ Erro no upload de mídia na Meta API:', JSON.stringify(data, null, 2));
      throw new Error(data.error?.message || data.error?.error_data?.details || 'Erro ao subir arquivo de mídia na Meta API');
    }
    console.log('✅ Upload de mídia concluído na Meta API! mediaId:', data.id);
    return data.id as string;
  },

  sendAudioMessage: async (to: string, mediaId: string, config: WhatsAppConfig) => {
    let formattedTo = to.replace(/\D/g, '');
    if (formattedTo.length === 10 || formattedTo.length === 11) {
      formattedTo = '55' + formattedTo;
    }

    const phoneNumberId = config.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '1280543321810380';
    const token = config.token || process.env.WHATSAPP_TOKEN;

    const doSend = async (targetPhone: string) => {
      console.log(`📤 Enviando mensagem de áudio via Meta API para ${targetPhone}...`);
      const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: targetPhone,
          type: 'audio',
          audio: { id: mediaId }
        })
      });
      const data = await response.json() as any;
      return { ok: response.ok, data };
    };

    try {
      let res = await doSend(formattedTo);
      if (!res.ok && formattedTo.startsWith('55') && formattedTo.length === 12) {
        const altPhone = formattedTo.slice(0, 4) + '9' + formattedTo.slice(4);
        res = await doSend(altPhone);
      }
      if (!res.ok) {
        console.error('❌ Erro no envio de áudio:', res.data);
        return { success: false, error: res.data.error?.message || 'Erro ao enviar áudio' };
      }
      return { success: true, messageId: res.data.messages?.[0]?.id };
    } catch (error: any) {
      console.error('Erro no envio de áudio no WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }
};
