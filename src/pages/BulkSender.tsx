import React, { useState, useEffect } from 'react';
import { Send, Upload, CheckCircle2, AlertTriangle, Trash2, Copy, Check, Filter, Phone } from 'lucide-react';
import { sendWhatsApp, clearAllData } from '../lib/api';

const STORAGE_KEY = 'wpp_bulk_sent_numbers';

export const DORAMA_TEMPLATE_TEXT = `Opa {nome}, tudo certo? 👋

Boa tarde! Sou desenvolvedor web e crio sites modernos e plataformas exclusivas.

Vi o perfil de vocês e preparei um modelo especial focado em alta conversão no estilo Dorama.

Montei uma demonstração exclusiva para vocês verem como ficaria.

Posso te enviar o link?`;

export default function BulkSender() {
  const [rawInput, setRawInput] = useState('');
  const [sentNumbers, setSentNumbers] = useState<string[]>([]);
  const [parsedList, setParsedList] = useState<{ original: string; formatted: string; isDuplicate: boolean; status: 'pending' | 'sent' }[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSentNumbers(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveSentNumber = (num: string) => {
    const updated = Array.from(new Set([...sentNumbers, num]));
    setSentNumbers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    if (confirm('Tem certeza que deseja limpar o histórico de números já enviados?')) {
      setSentNumbers([]);
      localStorage.removeItem(STORAGE_KEY);
      handleProcessList(rawInput, []);
    }
  };

  const normalizePhone = (text: string): string => {
    let digits = text.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10 || digits.length === 11) {
      digits = '55' + digits;
    }
    return digits;
  };

  const handleProcessList = (text: string, currentSent = sentNumbers) => {
    setRawInput(text);
    if (!text.trim()) {
      setParsedList([]);
      return;
    }

    const splitItems = text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    const seenInBatch = new Set<string>();
    const result: { original: string; formatted: string; isDuplicate: boolean; status: 'pending' | 'sent' }[] = [];

    for (const item of splitItems) {
      const formatted = normalizePhone(item);
      if (!formatted) continue;

      const isDuplicate = currentSent.includes(formatted) || seenInBatch.has(formatted);
      seenInBatch.add(formatted);

      result.push({
        original: item,
        formatted,
        isDuplicate,
        status: isDuplicate ? 'sent' : 'pending'
      });
    }

    setParsedList(result);
  };

  const newCount = parsedList.filter(i => !i.isDuplicate).length;
  const dupCount = parsedList.filter(i => i.isDuplicate).length;

  const handleOpenWhatsApp = (formattedPhone: string) => {
    saveSentNumber(formattedPhone);
    setParsedList(prev => prev.map(item => item.formatted === formattedPhone ? { ...item, isDuplicate: true, status: 'sent' } : item));
    const encoded = encodeURIComponent(DORAMA_TEMPLATE_TEXT.replace('{nome}', ''));
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
  };

  const handleDispatchAllNew = async () => {
    const newItems = parsedList.filter(i => !i.isDuplicate);
    if (newItems.length === 0) return;

    if (!confirm(`Enviar disparo oficial via API para ${newItems.length} números?`)) {
      return;
    }

    try {
      const leadsPayload = newItems.map(item => ({
        name: 'Cliente',
        address: '',
        phone: item.formatted,
        category: 'dorama',
        status: 'novo'
      }));

      await sendWhatsApp({
        leadIds: [],
        leads: leadsPayload,
        message: DORAMA_TEMPLATE_TEXT,
        campaignName: `Disparo Massa Dorama (${new Date().toLocaleDateString('pt-BR')})`,
        templateName: 'dorama'
      });

      // Mark all sent
      newItems.forEach(item => saveSentNumber(item.formatted));
      setParsedList(prev => prev.map(item => ({ ...item, isDuplicate: true, status: 'sent' })));
      alert(`Disparo enviado via API Meta com sucesso para ${newItems.length} números! Acompanhe no Chat/CRM.`);
    } catch (e: any) {
      alert('Erro ao enviar disparo via API Meta: ' + (e?.message || 'Falha no servidor. Verifique suas credenciais da API Meta em Configurações.'));
    }
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(DORAMA_TEMPLATE_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: '0 32px 32px' }}>
      <div className="page-header" style={{ paddingBottom: 24 }}>
        <div className="page-eyebrow"><Send size={12} /> Disparo Direto</div>
        <h1 className="page-title">Disparo em Massa (Dorama)</h1>
        <p className="page-subtitle">Cole sua lista de telefones. O sistema remove repetidos e números já enviados automaticamente.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Template Box */}
          <div className="card" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-green">Template Aprovado</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>🎬 Dorama</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleCopyTemplate}>
                {copied ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar Mensagem'}
              </button>
            </div>
            <pre style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              fontSize: 13,
              color: 'var(--text-2)',
              background: 'var(--bg-2)',
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--border)',
              margin: 0
            }}>
              {DORAMA_TEMPLATE_TEXT}
            </pre>
          </div>

          {/* Textarea Input */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>
                Cole a Lista de Números
              </label>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Formato: +55 11 98740-8899, vírgulas ou por linha</span>
            </div>
            <textarea
              className="input textarea"
              style={{ minHeight: 140, fontFamily: 'monospace', fontSize: 13 }}
              placeholder={`Exemplo:\n+55 11 98740-8899\n+55 34 9883-9293\n+55 54 9666-2618`}
              value={rawInput}
              onChange={e => handleProcessList(e.target.value)}
            />

            {parsedList.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span className="badge badge-green" style={{ fontSize: 12, padding: '4px 10px' }}>
                    <CheckCircle2 size={12} /> {newCount} Novos para Enviar
                  </span>
                  {dupCount > 0 && (
                    <span className="badge badge-yellow" style={{ fontSize: 12, padding: '4px 10px' }}>
                      <Filter size={12} /> {dupCount} Ignorados (Duplicados / Já Enviados)
                    </span>
                  )}
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleDispatchAllNew}
                  disabled={newCount === 0}
                >
                  <Send size={14} /> Disparar Novos ({newCount})
                </button>
              </div>
            )}
          </div>

          {/* Parsed Numbers Table */}
          {parsedList.length > 0 && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Número Digitado</th>
                    <th>Formato WhatsApp</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedList.map((item, index) => (
                    <tr key={index} style={{ opacity: item.isDuplicate ? 0.6 : 1 }}>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{item.original}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text)' }}>+{item.formatted}</td>
                      <td>
                        {item.isDuplicate ? (
                          <span className="badge badge-gray" style={{ fontSize: 11 }}>Já Enviado / Duplicado</span>
                        ) : (
                          <span className="badge badge-green" style={{ fontSize: 11 }}>Pronto para Envio</span>
                        )}
                      </td>
                      <td>
                        <button
                          className={`btn ${item.isDuplicate ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                          onClick={() => handleOpenWhatsApp(item.formatted)}
                        >
                          <Phone size={12} /> Abrir WhatsApp
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Sidebar Info & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={16} color="var(--green)" /> Anti-Duplicação Ativo
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 14 }}>
              O sistema salva automaticamente no navegador todos os números que já receberam mensagem. 
              Mesmo que você cole a mesma lista novamente amanhã, o sistema filtrará e ignorará os já enviados.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Histórico Salvo:</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--green)' }}>{sentNumbers.length} números</span>
            </div>
            {sentNumbers.length > 0 && (
              <button className="btn btn-danger btn-sm" style={{ width: '100%', marginBottom: 8 }} onClick={clearHistory}>
                <Trash2 size={13} /> Limpar Histórico do Navegador
              </button>
            )}
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', color: 'var(--red)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              onClick={async () => {
                if (confirm('Atenção: Isso vai apagar TODOS os chats, leads e campanhas antigas do servidor para deixar limpo. Deseja continuar?')) {
                  await clearAllData();
                  alert('Todos os chats e conversas antigas foram limpos com sucesso!');
                  window.location.reload();
                }
              }}
            >
              <Trash2 size={13} /> Limpar Chats e CRM (Servidor)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
