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

      const wabaId = config.wabaId || process.env.WHATSAPP_WABA_ID || '1394332478791215';
      const langCode = templateName === 'hello_world' ? 'en_US' : 'pt_BR';

      const doFetch = async (payload: any) => {
        console.log(`📤 Enviando Template Meta "${payload.template.name}" (idioma=${payload.template.language.code}) para ${payload.to}...`, JSON.stringify(payload.template));
        const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        return { ok: response.ok, data };
      };

      // 🔍 Tentar inspecionar o contrato exato do Template no Gerenciador da Meta
      let exactPayload: any = null;
      if (wabaId && token) {
        try {
          const templatesRes = await whatsappService.getTemplates(wabaId, token);
          if (templatesRes.success && Array.isArray(templatesRes.data)) {
            const match = templatesRes.data.find((t: any) =>
              t.name === templateName || t.name.toLowerCase() === templateName.toLowerCase()
            );
            if (match) {
              console.log('🎯 Contrato do Template encontrado no WABA Meta:', match.name, 'Status:', match.status, 'Idioma:', match.language);
              const components: any[] = [];
              const actualParams = (params && params.length > 0) ? params : ['Cliente'];

              if (Array.isArray(match.components)) {
                console.log('📋 Componentes do template:', JSON.stringify(match.components, null, 2));
                for (const comp of match.components) {
                  if (comp.type === 'HEADER') {
                    if (comp.format === 'IMAGE') {
                      // Extrair URL de exemplo do próprio template (Meta retorna em example.header_handle)
                      let imageUrl = '';
                      if (comp.example?.header_handle?.[0]) {
                        imageUrl = comp.example.header_handle[0];
                        console.log('🖼️ Usando imagem de exemplo do template:', imageUrl);
                      } else if (comp.example?.header_url?.[0]) {
                        imageUrl = comp.example.header_url[0];
                        console.log('🖼️ Usando header_url do template:', imageUrl);
                      } else {
                        // Fallback: imagem pública confiável (URL direta sem redirect)
                        imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/300px-PNG_transparency_demonstration_1.png';
                        console.log('⚠️ Template IMAGE sem exemplo, usando fallback genérico');
                      }
                      components.push({
                        type: 'header',
                        parameters: [{ type: 'image', image: { link: imageUrl } }]
                      });
                    } else if (comp.format === 'VIDEO') {
                      let videoUrl = '';
                      if (comp.example?.header_handle?.[0]) {
                        videoUrl = comp.example.header_handle[0];
                      } else {
                        videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
                      }
                      components.push({
                        type: 'header',
                        parameters: [{ type: 'video', video: { link: videoUrl } }]
                      });
                    } else if (comp.format === 'TEXT') {
                      const textMatches = (comp.text || '').match(/\{\{\d+\}\}/g) || [];
                      if (textMatches.length > 0) {
                        components.push({
                          type: 'header',
                          parameters: textMatches.map((_: any, idx: number) => ({ type: 'text', text: actualParams[idx] || 'Cliente' }))
                        });
                      }
                    }
                  } else if (comp.type === 'BODY') {
                    const bodyMatches = (comp.text || '').match(/\{\{\d+\}\}/g) || [];
                    if (bodyMatches.length > 0) {
                      console.log(`📝 Template BODY tem ${bodyMatches.length} variável(is): ${bodyMatches.join(', ')}`);
                      components.push({
                        type: 'body',
                        parameters: bodyMatches.map((_: any, idx: number) => ({ type: 'text', text: actualParams[idx] || 'Cliente' }))
                      });
                    }
                  }
                }
              }

              const templateObj: any = {
                name: match.name,
                language: { code: match.language || 'pt_BR' }
              };
              if (components.length > 0) {
                templateObj.components = components;
              }

              exactPayload = {
                messaging_product: 'whatsapp',
                to: formattedTo,
                type: 'template',
                template: templateObj
              };
            }
          }
        } catch (e: any) {
          console.warn('Aviso ao consultar WABA Meta:', e.message);
        }
      }

      let res: any = null;

      // 1ª Tentativa: Usar o payload exato inspecionado do WABA Meta se encontrado
      if (exactPayload) {
        console.log('⚡ Disparando via Contrato Inspecionado do Meta WABA...');
        res = await doFetch(exactPayload);
      }

      // Função auxiliar para montar payloads manuais de fallback
      const buildFallbackPayload = (paramCount: number, lang: string) => {
        const templateObj: any = {
          name: templateName,
          language: { code: lang }
        };
        if (paramCount > 0) {
          const actualParams = (params && params.length > 0) ? params : ['Cliente'];
          const paramList = Array(paramCount).fill(0).map((_, i) => actualParams[i] || actualParams[0] || 'Cliente');
          templateObj.components = [{
            type: 'body',
            parameters: paramList.map(p => ({ type: 'text', text: String(p) }))
          }];
        }
        return {
          messaging_product: 'whatsapp',
          to: formattedTo,
          type: 'template',
          template: templateObj
        };
      };

      // Se a 1ª tentativa falhou ou não tinha exactPayload: tenta 0 params, 1 param, 2 params, en_US
      if (!res || !res.ok) {
        if (!res) res = await doFetch(buildFallbackPayload(0, langCode));

        if (!res.ok && (res.data.error?.code === 132000 || String(res.data.error?.message).includes('parameters'))) {
          console.log(`⚠️ Fallback 1: Tentativa com 1 parâmetro para "${templateName}"...`);
          res = await doFetch(buildFallbackPayload(1, langCode));
        }

        if (!res.ok && (res.data.error?.code === 132000 || String(res.data.error?.message).includes('parameters'))) {
          console.log(`⚠️ Fallback 2: Tentativa com 2 parâmetros para "${templateName}"...`);
          res = await doFetch(buildFallbackPayload(2, langCode));
        }

        if (!res.ok && langCode === 'pt_BR' && (res.data.error?.code === 132001 || res.data.error?.code === 100)) {
          console.log(`⚠️ Fallback 3: Tentando idioma en_US para "${templateName}"...`);
          res = await doFetch(buildFallbackPayload(0, 'en_US'));
        }
      }

      // Se falhar por conta do 9º dígito no BR
      if (!res.ok && formattedTo.startsWith('55') && formattedTo.length === 12) {
        const altPhone = formattedTo.slice(0, 4) + '9' + formattedTo.slice(4);
        console.log(`⚠️ Tentando com 9º dígito: ${altPhone}...`);
        const altPayload = exactPayload ? { ...exactPayload, to: altPhone } : buildFallbackPayload(0, langCode);
        altPayload.to = altPhone;
        res = await doFetch(altPayload);
      }

      if (!res.ok) {
        const errObj = res.data.error || {};
        const code = errObj.code;
        const msg = errObj.message || 'Erro ao enviar template na Meta API';
        console.error('❌ Erro Meta API Template detalhado:', JSON.stringify(res.data, null, 2));

        let formattedError = `[Meta Erro ${code || ''}] ${msg}`;

        if (code === 132001) {
          formattedError = `Template "${templateName}" não encontrado na sua conta Meta WhatsApp. Verifique se o nome exato "${templateName}" foi aprovado no Gerenciador do WhatsApp.`;
        } else if (code === 131047) {
          formattedError = `Janela de 24h Meta: O cliente não interagiu nas últimas 24h. Use um Template aprovado para iniciar contato.`;
        } else if (code === 131026) {
          formattedError = `Número ${formattedTo} não possui conta no WhatsApp.`;
        } else if (code === 190) {
          formattedError = `Token da Meta API expirado ou inválido. Atualize o Token nas Configurações.`;
        }

        return { success: false, error: formattedError };
      }

      return { success: true, messageId: res.data.messages?.[0]?.id };
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
        const errObj = res.data.error || {};
        const code = errObj.code;
        let errMsg = errObj.message || errObj.error_data?.details || 'Erro ao enviar mensagem';

        if (code === 131047 || errMsg.includes('24 hours') || errMsg.includes('re-engagement')) {
          errMsg = 'Janela de 24h Meta: O cliente ainda não respondeu nas últimas 24h. Para iniciar a conversa, envie um Template Aprovado (Proposta/Dorama).';
        } else if (code === 190) {
          errMsg = 'Token da Meta API expirado ou inválido. Atualize o Token nas Configurações.';
        } else if (code === 131026) {
          errMsg = 'Número não possui WhatsApp ativo.';
        }

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

    const mediaTypeCategory = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'audio';

    const fileObj = typeof File !== 'undefined'
      ? new File([buffer], filename, { type: mimeType })
      : new Blob([buffer], { type: mimeType });

    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', mediaTypeCategory);
    formData.append('file', fileObj, filename);

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
