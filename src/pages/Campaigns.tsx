import React, { useState, useEffect } from 'react';
import { MessageCircle, Check, CheckCheck, Eye, AlertCircle, Clock, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../lib/utils';
import { getCampaigns } from '../lib/api';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCampaigns().then(data => {
      if (Array.isArray(data)) {
        setCampaigns(data);
      } else {
        setCampaigns([]);
      }
    }).catch(() => {
      setCampaigns([]);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Histórico de Campanhas</h1>
        <p className="text-[rgba(255,255,255,0.6)]">Acompanhe o disparo real das suas mensagens no WhatsApp Meta API.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-[rgba(255,255,255,0.5)]">
          Carregando campanhas do banco de dados...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-16 text-center bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <Send size={48} className="mx-auto text-[rgba(255,255,255,0.2)] mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Nenhuma campanha realizada ainda</h3>
          <p className="text-sm text-[rgba(255,255,255,0.5)] max-w-md mx-auto mb-6">
            Quando você selecionar empresas na aba de prospecção e clicar em "Enviar Proposta", o histórico de disparos e relatórios aparecerão aqui.
          </p>
          <button
            onClick={() => navigate('/prospector')}
            className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)] inline-flex items-center gap-2"
          >
            Prospectar Novas Empresas
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {campaigns.map(campaign => {
            const sent = campaign.sent || 0;
            const total = campaign.totalLeads || 1;
            const progress = (sent / total) * 100;
            const readRate = campaign.delivered > 0 ? Math.round(((campaign.read || 0) / campaign.delivered) * 100) : 0;
            
            return (
              <div key={campaign.id} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 transition-all hover:bg-[rgba(255,255,255,0.03)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold text-white">{campaign.name}</h2>
                      {campaign.status === 'enviando' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(59,130,246,0.1)] text-[#3B82F6] uppercase tracking-wider flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" /> Enviando
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(37,211,102,0.1)] text-[#25D366] uppercase tracking-wider">
                          Concluído
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)]">
                      <Clock size={14} />
                      {campaign.createdAt ? formatDate(campaign.createdAt) : 'Recentemente'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{total}</div>
                    <div className="text-xs text-[rgba(255,255,255,0.5)]">destinatários</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[rgba(255,255,255,0.6)]">Progresso de envio</span>
                    <span className="text-white font-medium">{sent} / {total}</span>
                  </div>
                  <div className="w-full h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#25D366] transition-all duration-1000 ease-out" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-[rgba(255,255,255,0.08)]">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-sm text-[rgba(255,255,255,0.6)]">
                      <Check size={16} className="text-gray-400" /> Enviadas
                    </div>
                    <div className="text-lg font-semibold text-white">{sent}</div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-sm text-[rgba(255,255,255,0.6)]">
                      <CheckCheck size={16} className="text-gray-400" /> Entregues
                    </div>
                    <div className="text-lg font-semibold text-white">{campaign.delivered || 0}</div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-sm text-[rgba(255,255,255,0.6)]">
                      <Eye size={16} className="text-[#3B82F6]" /> Lidas
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold text-white">{campaign.read || 0}</span>
                      <span className="text-xs text-[#25D366]">({readRate}%)</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-sm text-[rgba(255,255,255,0.6)]">
                      <AlertCircle size={16} className="text-[#EF4444]" /> Falhas
                    </div>
                    <div className="text-lg font-semibold text-white">{campaign.failed || 0}</div>
                  </div>
                </div>

                {/* Message preview snippet */}
                {campaign.message && (
                  <div className="mt-4 p-3 bg-[rgba(0,0,0,0.2)] rounded-lg border border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-start gap-2">
                      <MessageCircle size={16} className="text-[rgba(255,255,255,0.4)] mt-0.5 shrink-0" />
                      <p className="text-sm text-[rgba(255,255,255,0.7)] truncate font-mono">
                        {campaign.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Campaigns;
