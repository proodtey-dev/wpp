import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Search, Phone, Zap, CheckCheck, Check, X,
  Clock, RefreshCw, ArrowLeft, Tag, Mic, Square, Trash2
} from 'lucide-react';
import {
  getConversations, getChatMessages, sendChatMessage, sendChatAudioMessage,
  updateLeadStatusByPhone, CRM_STAGES
} from '../lib/api';

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

const formatSeconds = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.setValueAtTime(780, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
};

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
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

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
        setTimeout(connectSSE, 3000);
      };

      es.addEventListener('new_message', (e: MessageEvent) => {
        const msg = JSON.parse(e.data);

        if (msg.sender === 'user') {
          playNotificationSound();
        }

        setConversations(prev => {
          const existing = prev.find(c => c.phone === msg.phone);
          if (existing) {
            return [
              { ...existing, lastMessage: msg.body, timestamp: msg.timestamp, unreadCount: msg.sender === 'user' && selectedPhoneRef.current !== msg.phone ? (existing.unreadCount || 0) + 1 : 0 },
              ...prev.filter(c => c.phone !== msg.phone)
            ];
          }
          return [{ phone: msg.phone, contactName: msg.contactName || 'Cliente', lastMessage: msg.body, timestamp: msg.timestamp, leadStatus: 'novo', unreadCount: msg.sender === 'user' ? 1 : 0 }, ...prev];
        });

        if (selectedPhoneRef.current === msg.phone) {
          setMessages(prev => {
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

      es.addEventListener('lead_status_updated', (e: MessageEvent) => {
        const { phone, status } = JSON.parse(e.data);
        setConversations(prev => prev.map(c => c.phone === phone ? { ...c, leadStatus: status } : c));
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
      setConversations(prev => prev.map(c => c.phone === selectedPhone ? { ...c, unreadCount: 0 } : c));
    }
  }, [selectedPhone]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedPhone) return;
    setConversations(prev => prev.map(c => c.phone === selectedPhone ? { ...c, leadStatus: newStatus } : c));
    try {
      await updateLeadStatusByPhone(selectedPhone, newStatus);
    } catch (err) {
      console.error('Erro ao atualizar status do lead:', err);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !selectedPhone || sending) return;

    const currentConv = conversations.find(c => c.phone === selectedPhone);
    if (!textToSend) setInputText('');
    setSending(true);

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

  // 🎙️ Voice Recording Functions
  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
    if (MediaRecorder.isTypeSupported('audio/aac')) return 'audio/aac';
    if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) return 'audio/ogg;codecs=opus';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    return '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao acessar o microfone:', err);
      alert('Permissão de microfone negada ou indisponível no navegador: ' + (err.message || ''));
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const stopAndSendRecording = async () => {
    if (!mediaRecorderRef.current || !selectedPhone || sending) return;

    clearInterval(recordingTimerRef.current);
    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      recorder.stream.getTracks().forEach(track => track.stop());
      const mimeType = recorder.mimeType || 'audio/mp4';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      setIsRecording(false);
      setRecordingTime(0);

      if (audioBlob.size < 500) {
        return; // Áudio muito curto
      }

      setSending(true);
      const currentConv = conversations.find(c => c.phone === selectedPhone);

      // Converte Blob para base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const audioBase64 = reader.result as string;
        const localAudioUrl = URL.createObjectURL(audioBlob);

        const tempId = Date.now();
        const tempMsg = {
          id: tempId,
          phone: selectedPhone,
          sender: 'me',
          body: '🎵 Áudio de voz',
          mediaUrl: localAudioUrl,
          mediaType: 'audio',
          deliveryStatus: 'sending',
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, tempMsg]);
        setTimeout(scrollToBottom, 50);

        try {
          const res = await sendChatAudioMessage({
            phone: selectedPhone,
            audioBase64,
            mimeType,
            contactName: currentConv?.contactName
          });

          if (!res.success) {
            alert(`Aviso ao enviar áudio: ${res.error || 'Erro na Meta WhatsApp API'}`);
          }

          setMessages(prev => prev.map(m =>
            m.id === tempId
              ? { ...m, deliveryStatus: res.deliveryStatus || (res.success ? 'sent' : 'failed'), mediaUrl: res.mediaUrl || localAudioUrl }
              : m
          ));

          setConversations(prev => prev.map(c =>
            c.phone === selectedPhone
              ? { ...c, lastMessage: '🎵 Áudio de voz', timestamp: new Date().toISOString() }
              : c
          ));
        } catch (err: any) {
          console.error('Erro ao enviar áudio:', err);
          alert('Erro na requisição de áudio: ' + (err.message || 'Falha de rede'));
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, deliveryStatus: 'failed' } : m));
        } finally {
          setSending(false);
        }
      };
    };

    recorder.stop();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedConv = conversations.find(c => c.phone === selectedPhone);
  const currentStage = CRM_STAGES.find(s => s.id === (selectedConv?.leadStatus || 'novo')) || CRM_STAGES[0];

  const filteredConvs = conversations.filter(c => {
    const matchesSearch =
      !searchFilter ||
      c.contactName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.phone?.includes(searchFilter);
    const matchesStage =
      stageFilter === 'all' || (c.leadStatus || 'novo') === stageFilter;
    return matchesSearch && matchesStage;
  });

  const handleSelectConv = (phone: string) => {
    if (isRecording) cancelRecording();
    setSelectedPhone(phone);
    setMobileView('chat');
  };

  return (
    <div className="chat-layout">
      {/* Conversations Sidebar */}
      <div className={`chat-sidebar ${mobileView === 'chat' ? 'hidden-mobile' : ''}`}>
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

          <div style={{ position: 'relative', marginBottom: 10 }}>
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

          {/* CRM Stage Filters */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
            <button
              onClick={() => setStageFilter('all')}
              style={{
                background: stageFilter === 'all' ? 'var(--green)' : 'var(--bg-4)',
                color: stageFilter === 'all' ? '#000' : 'var(--text-2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Todos ({conversations.length})
            </button>
            {CRM_STAGES.map(stage => {
              const count = conversations.filter(c => (c.leadStatus || 'novo') === stage.id).length;
              if (count === 0 && stageFilter !== stage.id) return null;
              return (
                <button
                  key={stage.id}
                  onClick={() => setStageFilter(stage.id)}
                  style={{
                    background: stageFilter === stage.id ? 'var(--bg-3)' : 'var(--bg-4)',
                    color: 'var(--text)',
                    border: stageFilter === stage.id ? '1px solid var(--green)' : '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '2px 8px',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <span>{stage.icon}</span> {stage.label.split(' ')[0]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="chat-list">
          {filteredConvs.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              <MessageSquare size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p>Nenhuma conversa nesta categoria.</p>
            </div>
          ) : (
            filteredConvs.map(conv => {
              const stage = CRM_STAGES.find(s => s.id === (conv.leadStatus || 'novo')) || CRM_STAGES[0];
              return (
                <div
                  key={conv.phone}
                  className={`chat-item ${selectedPhone === conv.phone ? 'active' : ''}`}
                  onClick={() => handleSelectConv(conv.phone)}
                >
                  <div className="chat-avatar">{(conv.contactName || 'C')[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="chat-item-name">{conv.contactName || formatPhone(conv.phone)}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{formatTime(conv.timestamp)}</span>
                    </div>
                    <span className="chat-item-preview">{conv.lastMessage}</span>
                    <div style={{ marginTop: 4 }}>
                      <span className={`badge ${stage.color}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                        {stage.icon} {stage.label}
                      </span>
                    </div>
                  </div>
                  {conv.unreadCount > 0 && selectedPhone !== conv.phone && (
                    <span className="nav-badge" style={{ flexShrink: 0, fontSize: 9 }}>{conv.unreadCount}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className={`chat-main ${mobileView === 'list' ? 'hidden-mobile' : ''}`}>
        {selectedPhone ? (
          <>
          {/* Header */}
          <div className="chat-main-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setMobileView('list')}
                style={{ marginRight: 2, display: 'none' }}
                id="chat-back-btn"
              >
                <ArrowLeft size={16} />
              </button>
              <style>{`@media(max-width:768px){#chat-back-btn{display:flex!important}}`}</style>
              <div className="chat-avatar" style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0 }}>
                {(selectedConv?.contactName || 'C')[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedConv?.contactName || 'Cliente'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={10} /> {formatPhone(selectedPhone)}
                </div>
              </div>
            </div>

            {/* CRM Stage Selector Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag size={12} color="var(--text-3)" />
                <select
                  className={`crm-pill-select ${currentStage.color}`}
                  value={selectedConv?.leadStatus || 'novo'}
                  onChange={e => handleStatusChange(e.target.value)}
                >
                  {CRM_STAGES.map(stage => (
                    <option key={stage.id} value={stage.id} style={{ background: '#111213', color: '#fff' }}>
                      {stage.icon} {stage.label}
                    </option>
                  ))}
                </select>
              </div>

              <button className="btn btn-ghost btn-sm" onClick={() => loadMessages(selectedPhone)} title="Recarregar mensagens">
                <RefreshCw size={13} />
              </button>
            </div>
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

                      {/* Renderização de mídias e áudio player */}
                      {msg.mediaUrl && msg.mediaType === 'image' && (
                        <img
                          src={msg.mediaUrl}
                          alt="Imagem"
                          style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, marginTop: 6, display: 'block' }}
                        />
                      )}

                      {msg.mediaUrl && msg.mediaType === 'sticker' && (
                        <img
                          src={msg.mediaUrl}
                          alt="Figurinha"
                          style={{ width: 130, height: 130, objectFit: 'contain', marginTop: 6, display: 'block' }}
                        />
                      )}

                      {msg.mediaUrl && msg.mediaType === 'audio' && (
                        <audio
                          controls
                          src={msg.mediaUrl}
                          style={{ marginTop: 6, maxWidth: '100%', height: 36 }}
                        />
                      )}

                      {msg.mediaUrl && msg.mediaType === 'video' && (
                        <video
                          controls
                          src={msg.mediaUrl}
                          style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, marginTop: 6, display: 'block' }}
                        />
                      )}

                      {msg.mediaUrl && msg.mediaType === 'document' && (
                        <a
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ marginTop: 6, display: 'inline-flex' }}
                        >
                          📄 Abrir Documento
                        </a>
                      )}

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

          {/* Input & Voice Recorder Bar */}
          <div className="chat-input-bar">
            {isRecording ? (
              /* Interface durante a gravação de áudio */
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 600, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                  <span>Gravando áudio: {formatSeconds(recordingTime)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={cancelRecording} style={{ color: 'var(--text-2)' }}>
                    <Trash2 size={14} /> Cancelar
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={stopAndSendRecording} disabled={sending}>
                    <Send size={14} /> Enviar Áudio
                  </button>
                </div>
              </div>
            ) : (
              /* Interface padrão de digitação de texto + Botão de Microfone */
              <>
                <input
                  className="input"
                  style={{ flex: 1, fontSize: 13 }}
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua resposta… (Enter para enviar)"
                />
                
                {/* Botão de Gravar Áudio */}
                <button
                  className="btn btn-secondary"
                  onClick={startRecording}
                  title="Gravar Mensagem de Áudio"
                  style={{ padding: '8px 12px', background: 'var(--bg-4)', borderColor: 'var(--border)' }}
                >
                  <Mic size={15} color="var(--green)" />
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || sending}
                  style={{ padding: '8px 14px' }}
                >
                  <Send size={14} />
                  {sending ? 'Enviando…' : 'Enviar'}
                </button>
              </>
            )}
          </div>
          </>
        ) : (
          <div style={{ flex: 1, alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-3)' }}>
            <MessageSquare size={44} style={{ opacity: 0.15 }} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', textAlign: 'center' }}>Caixa de Entrada & CRM</p>
              <p style={{ fontSize: 12, marginTop: 4, textAlign: 'center' }}>Selecione uma conversa para visualizar, gravar áudios e mudar categorias</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginTop: 8 }}>
              <span className="online-dot" style={{ background: sseConnected ? 'var(--green)' : '#f59e0b' }} />
              {sseConnected ? 'Conectado ao vivo — novas mensagens chegam automaticamente' : 'Conectando ao stream de mensagens...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
