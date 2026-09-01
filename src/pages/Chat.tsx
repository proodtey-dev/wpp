import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Search, Phone, Zap, CheckCheck, Check, X,
  Clock, RefreshCw, AlertCircle
} from 'lucide-react';
import { getConversations, getChatMessages, sendChatMessage } from '../lib/api';

const API_BASE = '/api';

const QUICK_RESPONSES = [
  "Trabalho em até 48h! Crio o site completo, te envio o link para aprovação e você só paga após gostar.",
  "Posso criar uma prévia gratuita do site para seu negócio ainda hoje. Qual o principal serviço que deseja destacar?",
  "Perfeito! Vou preparar o modelo e te envio aqui no WhatsApp assim que estiver pronto para sua avaliação.",
  "Sem custo inicial! Você aprova o resultado e só então fecha o negócio. Quer ver um exemplo do seu segmento?",
];

const formatPhone = (phone: string) => {
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 13) return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  if (cleaned.length === 12) return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  return phone;
};

const formatTime = (ts: string) => {
  try {
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

// Toca um som suave de notificação usando Web Audio API (sem arquivo externo)
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    // Dois bips suaves: primeira nota e segunda nota mais alta
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.setValueAtTime(780, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
};

// Ícone de entrega:
// Clock  = enviando (cinza)
// ✓ cinza = enviado para o WhatsApp
// ✓✓ verde = entregue no celular do cliente
// ✓✓ azul  = lido pelo cliente
const DeliveryIcon = ({ status }: { status: string }) => {
  if (status === 'failed') return <X size={12} className="delivery-icon failed" />;
  if (status === 'read') return <CheckCheck size={12} className="delivery-icon read" />;
  if (status === 'delivered') return <CheckCheck size={12} className="delivery-icon delivered" />;
  if (status === 'sent') return <Check size={12} className="delivery-icon sent" />;
  return <Clock size={10} className="delivery-icon sent" />;
};

const Chat = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedPhoneRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  selectedPhoneRef.current = selectedPhone;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      if (Array.isArray(data)) setConversations(data);
    } catch {}
  };

  const loadMessages = async (phone: string) => {
    setLoading(true);
    try {
      const data = await getChatMessages(phone);
      if (Array.isArray(data)) setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // SSE connection for real-time updates
  useEffect(() => {
    const connectSSE = () => {
      const es = new EventSource(`${API_BASE}/chat/stream`);
      eventSourceRef.current = es;

      es.onopen = () => setSseConnected(true);
      es.onerror = () => {
        setSseConnected(false);
        // Reconnect after 3s
        setTimeout(connectSSE, 3000);
      };

      es.addEventListener('new_message', (e: MessageEvent) => {
        const msg = JSON.parse(e.data);

        // Toca som de notificação só quando é mensagem recebida (do cliente)
        if (msg.sender === 'user') {
          playNotificationSound();
        }

        // Atualiza lista de conversas
        setConversations(prev => {
          const existing = prev.find(c => c.phone === msg.phone);
          if (existing) {
            return [
              { ...existing, lastMessage: msg.body, timestamp: msg.timestamp, unreadCount: msg.sender === 'user' && selectedPhoneRef.current !== msg.phone ? (existing.unreadCount || 0) + 1 : 0 },
              ...prev.filter(c => c.phone !== msg.phone)
            ];
          }
          return [{ phone: msg.phone, contactName: msg.contactName || 'Cliente', lastMessage: msg.body, timestamp: msg.timestamp, unreadCount: msg.sender === 'user' ? 1 : 0 }, ...prev];
        });

        // Se é a conversa ativa, adiciona a mensagem
        if (selectedPhoneRef.current === msg.phone) {
          setMessages(prev => {
            // evita duplicatas
            if (prev.find(m => m.id === msg.id || (m.body === msg.body && m.sender === msg.sender && Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 2000))) {
              return prev;
            }
            return [...prev, { id: Date.now(), ...msg }];
          });
          setTimeout(scrollToBottom, 50);
        }
      });

      es.addEventListener('message_status', (e: MessageEvent) => {
        const { waMessageId, deliveryStatus } = JSON.parse(e.data);
        setMessages(prev => prev.map(m =>
          m.waMessageId === waMessageId ? { ...m, deliveryStatus } : m
        ));
      });
    };

    connectSSE();

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedPhone) {
      loadMessages(selectedPhone);
      // Mark unread as read
      setConversations(prev => prev.map(c => c.phone === selectedPhone ? { ...c, unreadCount: 0 } : c));
    }
  }, [selectedPhone]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !selectedPhone || sending) return;

    const currentConv = conversations.find(c => c.phone === selectedPhone);
    if (!textToSend) setInputText('');
    setSending(true);

    // Optimistic update
    const tempId = Date.now();
    const tempMsg = {
      id: tempId,
      phone: selectedPhone,
      sender: 'me',
      body: text,
      deliveryStatus: 'sending',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const result = await sendChatMessage({ phone: selectedPhone, body: text, contactName: currentConv?.contactName });

      // Update temp msg with real delivery status
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, deliveryStatus: result.deliveryStatus || 'sent', waMessageId: result.result?.messageId }
          : m
      ));

      setConversations(prev => prev.map(c =>
        c.phone === selectedPhone
          ? { ...c, lastMessage: text, timestamp: new Date().toISOString() }
          : c
      ));
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, deliveryStatus: 'failed' } : m));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedConv = conversations.find(c => c.phone === selectedPhone);
  const filteredConvs = conversations.filter(c =>
    c.contactName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.phone?.includes(searchFilter)
  );

  return (
    <div className="chat-layout">
      {/* Conversations Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={14} className="green" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Chat / CRM</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className={`online-dot`} style={{ background: sseConnected ? 'var(--green)' : '#f59e0b', boxShadow: sseConnected ? '0 0 6px var(--green)' : '0 0 6px #f59e0b' }} />
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{sseConnected ? 'Ao vivo' : 'Conectando...'}</span>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              className="input"
              style={{ paddingLeft: 30, fontSize: 12 }}
              type="text"
              placeholder="Buscar conversa..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-list">
          {filteredConvs.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              <MessageSquare size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p>Nenhuma conversa ainda.</p>
              <p style={{ marginTop: 4, fontSize: 11 }}>As mensagens recebidas aparecerão aqui em tempo real.</p>
            </div>
          ) : (
            filteredConvs.map(conv => (
              <div
                key={conv.phone}
                className={`chat-item ${selectedPhone === conv.phone ? 'active' : ''}`}
                onClick={() => setSelectedPhone(conv.phone)}
              >
                <div className="chat-avatar">{(conv.contactName || 'C')[0].toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="chat-item-name">{conv.contactName || formatPhone(conv.phone)}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{formatTime(conv.timestamp)}</span>
                  </div>
                  <span className="chat-item-preview">{conv.lastMessage}</span>
                </div>
                {conv.unreadCount > 0 && selectedPhone !== conv.phone && (
                  <span className="nav-badge" style={{ flexShrink: 0, fontSize: 9 }}>{conv.unreadCount}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      {selectedPhone ? (
        <div className="chat-main">
          {/* Header */}
          <div className="chat-main-header">
            <div className="chat-avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
              {(selectedConv?.contactName || 'C')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{selectedConv?.contactName || 'Cliente'}</div>
              <div style={{ fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={10} /> {formatPhone(selectedPhone)}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => loadMessages(selectedPhone)} title="Recarregar mensagens">
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)', fontSize: 12 }}>Carregando mensagens...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)', fontSize: 12 }}>
                <MessageSquare size={28} style={{ margin: '0 auto 8px', opacity: 0.2 }} />
                Nenhuma mensagem ainda.
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender === 'me';
                return (
                  <div key={msg.id || i} className={`message-row ${isMe ? 'me' : ''}`}>
                    {!isMe && (
                      <div className="chat-avatar" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>
                        {(selectedConv?.contactName || 'C')[0].toUpperCase()}
                      </div>
                    )}
                    <div className={`message-bubble ${isMe ? 'me' : 'user'}`}>
                      <div>{msg.body}</div>
                      {isMe && (
                        <div className="message-meta">
                          <span>{formatTime(msg.timestamp)}</span>
                          <DeliveryIcon status={msg.deliveryStatus || 'sent'} />
                        </div>
                      )}
                      {!isMe && (
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{formatTime(msg.timestamp)}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick responses */}
          <div className="chat-quick-responses">
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <Zap size={11} /> Rápida:
            </span>
            {QUICK_RESPONSES.map((qr, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qr)}
                style={{
                  background: 'var(--bg-4)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text-2)',
                  fontSize: 11,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.borderColor = 'rgba(34,197,94,0.4)';
                  (e.target as HTMLElement).style.color = 'var(--green)';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.borderColor = 'var(--border)';
                  (e.target as HTMLElement).style.color = 'var(--text-2)';
                }}
              >
                {qr.slice(0, 40)}…
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="chat-input-bar">
            <input
              className="input"
              style={{ flex: 1, fontSize: 13 }}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua resposta… (Enter para enviar)"
            />
            <button
              className="btn btn-primary"
              onClick={() => handleSend()}
              disabled={!inputText.trim() || sending}
              style={{ padding: '8px 14px' }}
            >
              <Send size={14} />
              {sending ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-main" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-3)' }}>
          <MessageSquare size={44} style={{ opacity: 0.15 }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', textAlign: 'center' }}>Caixa de Entrada</p>
            <p style={{ fontSize: 12, marginTop: 4, textAlign: 'center' }}>Selecione uma conversa para visualizar e responder</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginTop: 8 }}>
            <span className="online-dot" style={{ background: sseConnected ? 'var(--green)' : '#f59e0b' }} />
            {sseConnected ? 'Conectado — novas mensagens chegam automaticamente' : 'Conectando ao stream de mensagens...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
