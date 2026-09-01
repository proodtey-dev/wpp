import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Search, Phone, User, CheckCheck, Clock, Zap } from 'lucide-react';
import { getConversations, getChatMessages, sendChatMessage } from '../lib/api';
import { formatPhone } from '../lib/utils';

const QUICK_RESPONSES = [
  "Trabalho em até 48 horas! Crio a estrutura completa do site, te envio o link de aprovação e você só paga após aprovar tudo.",
  "Posso criar uma prévia gratuita do site para seu negócio hoje mesmo. Qual seria o principal serviço que você gostaria de destacar?",
  "Perfeito! Vou preparar o modelo do seu site e te envio aqui no WhatsApp assim que estiver pronto para você avaliar."
];

const Chat = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const loadConversations = () => {
    getConversations().then(data => {
      if (Array.isArray(data)) {
        setConversations(data);
      } else {
        setConversations([]);
      }
    }).catch(() => {
      setConversations([]);
    });
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedPhone) {
      setLoading(true);
      getChatMessages(selectedPhone).then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          setMessages([]);
        }
      }).catch(() => {
        setMessages([]);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [selectedPhone]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !selectedPhone) return;

    const currentConv = conversations.find(c => c.phone === selectedPhone);

    const newMsg = {
      id: Date.now(),
      phone: selectedPhone,
      sender: 'me',
      body: text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    if (!textToSend) setInputText('');

    await sendChatMessage({
      phone: selectedPhone,
      body: text,
      contactName: currentConv?.contactName
    }).catch(() => {});

    // Update conversation list last message
    setConversations(prev => prev.map(c => c.phone === selectedPhone ? { ...c, lastMessage: text, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) } : c));
  };

  const selectedConv = conversations.find(c => c.phone === selectedPhone);
  const filteredConvs = conversations.filter(c => 
    c.contactName?.toLowerCase().includes(searchFilter.toLowerCase()) || 
    c.phone?.includes(searchFilter)
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto h-[calc(100vh-40px)] flex flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#25D366] uppercase tracking-wider mb-1">
          <MessageSquare size={14} /> CHAT & CRM DE RESPOSTAS
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Atendimento WhatsApp</h1>
      </div>

      <div className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Left: Conversation List */}
        <div className="w-full md:w-80 border-r border-[rgba(255,255,255,0.08)] flex flex-col bg-[#0a0a0f]">
          <div className="p-3 border-b border-[rgba(255,255,255,0.08)]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-[rgba(255,255,255,0.4)]" />
              <input
                type="text"
                placeholder="Buscar conversa..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[#25D366]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[rgba(255,255,255,0.03)]">
            {filteredConvs.length === 0 ? (
              <div className="p-6 text-center text-xs text-[rgba(255,255,255,0.4)]">
                Nenhuma conversa iniciada ainda.
              </div>
            ) : (
              filteredConvs.map(conv => (
                <div
                  key={conv.phone}
                  onClick={() => setSelectedPhone(conv.phone)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                    selectedPhone === conv.phone 
                      ? 'bg-[rgba(37,211,102,0.1)] border-l-4 border-l-[#25D366]' 
                      : 'hover:bg-[rgba(255,255,255,0.03)]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {conv.contactName?.[0] || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-bold text-white truncate">{conv.contactName || formatPhone(conv.phone)}</div>
                      <div className="text-[10px] text-[rgba(255,255,255,0.4)]">{conv.timestamp}</div>
                    </div>
                    <div className="text-xs text-[rgba(255,255,255,0.5)] truncate">{conv.lastMessage}</div>
                  </div>
                  {conv.unreadCount > 0 && selectedPhone !== conv.phone && (
                    <div className="w-4 h-4 rounded-full bg-[#25D366] text-black font-extrabold text-[10px] flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Active Chat Window */}
        {selectedPhone ? (
          <div className="flex-1 flex flex-col bg-[#12121a]">
            
            {/* Header */}
            <div className="p-4 border-b border-[rgba(255,255,255,0.08)] bg-[#0a0a0f] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold text-sm">
                  {selectedConv?.contactName?.[0] || 'C'}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{selectedConv?.contactName || 'Cliente'}</div>
                  <div className="text-xs text-[#25D366] flex items-center gap-1">
                    <Phone size={11} /> {formatPhone(selectedPhone)}
                  </div>
                </div>
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0a0a0f]/50">
              {messages.map(msg => {
                const isMe = msg.sender === 'me';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-lg ${
                        isMe
                          ? 'bg-[#005c4b] text-white rounded-br-none'
                          : 'bg-[rgba(255,255,255,0.08)] text-white rounded-bl-none border border-[rgba(255,255,255,0.05)]'
                      }`}
                    >
                      <div>{msg.body}</div>
                      <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-[rgba(255,255,255,0.6)]' : 'text-[rgba(255,255,255,0.4)]'}`}>
                        {msg.timestamp || 'Agora'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Templates Bar */}
            <div className="px-4 py-2 bg-[#0a0a0f] border-t border-[rgba(255,255,255,0.05)] flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] text-[#25D366] font-bold uppercase shrink-0 flex items-center gap-1">
                <Zap size={11} /> Resposta Rápida:
              </span>
              {QUICK_RESPONSES.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qr)}
                  className="text-[11px] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(37,211,102,0.12)] hover:text-[#25D366] text-[rgba(255,255,255,0.7)] px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] whitespace-nowrap transition-all"
                >
                  {qr.slice(0, 35)}...
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="p-3 bg-[#0a0a0f] border-t border-[rgba(255,255,255,0.08)] flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Digite sua resposta..."
                className="flex-1 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#25D366]"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_12px_rgba(37,211,102,0.3)]"
              >
                <Send size={16} />
              </button>
            </form>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[rgba(255,255,255,0.4)]">
            <MessageSquare size={48} className="mb-4 text-[rgba(255,255,255,0.1)]" />
            <h3 className="text-base font-bold text-white mb-1">Caixa de Entrada / Chat CRM</h3>
            <p className="text-xs max-w-sm">Selecione uma conversa ao lado para visualizar o histórico de mensagens e responder diretamente por aqui.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Chat;
