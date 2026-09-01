import React, { useState, useEffect } from 'react';
import {
  Users, Send, TrendingUp, Zap, ArrowRight, Search,
  MapPin, MessageSquare, CheckCircle2, Globe, Star,
  ChevronRight, DollarSign, Clock, Target, Sparkles, ShieldCheck, Rocket
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { DEMO_LEADS, NICHE_TYPES } from '../lib/utils';

const chartData = [
  { dia: 'Seg', mensagens: 12, lidas: 8 },
  { dia: 'Ter', mensagens: 19, lidas: 15 },
  { dia: 'Qua', mensagens: 28, lidas: 22 },
  { dia: 'Qui', mensagens: 34, lidas: 29 },
  { dia: 'Sex', mensagens: 42, lidas: 35 },
  { dia: 'Sáb', mensagens: 25, lidas: 20 },
  { dia: 'Dom', mensagens: 18, lidas: 14 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#12121a] border border-[rgba(255,255,255,0.12)] rounded-xl p-3 shadow-2xl text-xs text-white">
        <div className="text-[rgba(255,255,255,0.5)] mb-1 font-medium">{label}</div>
        <div className="text-[#25D366] font-bold">{payload[0].value} enviadas</div>
        <div className="text-[#3B82F6] font-bold">{payload[1]?.value} lidas</div>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [totalLeads, setTotalLeads] = useState(12);
  const [totalMensagens, setTotalMensagens] = useState(178);

  useEffect(() => {
    fetch('/api/leads/stats').then(r => r.json()).then(d => {
      if (d.total !== undefined && d.total > 0) setTotalLeads(d.total);
    }).catch(() => {});
    fetch('/api/whatsapp/campaigns').then(r => r.json()).then(d => {
      if (Array.isArray(d)) {
        const total = d.reduce((acc: number, c: any) => acc + (c.sent || 0), 0);
        if (total > 0) setTotalMensagens(total);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen pb-24">

      {/* ── Top Glow Banner Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1f18] via-[#12121a] to-[#121a2e] border border-[rgba(37,211,102,0.25)] p-8 shadow-[0_0_50px_rgba(37,211,102,0.08)]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-[radial-gradient(circle,rgba(37,211,102,0.15)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(37,211,102,0.15)] border border-[rgba(37,211,102,0.3)] text-[#25D366] text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} /> Sitemaker Prospecção Automática
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Transforme Empresas Sem Site em <span className="bg-gradient-to-r from-[#25D366] to-[#60EFFF] bg-clip-text text-transparent">Clientes Pagantes</span>
            </h1>
            <p className="text-sm md:text-base text-[rgba(255,255,255,0.65)] leading-relaxed">
              Encontre profissionais com boas avaliações no Maps que ainda não possuem site. Ofereça a criação sem risco inicial: <strong className="text-white">paga só após aprovar!</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => navigate('/prospector')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-extrabold text-sm transition-all hover:scale-105 shadow-[0_0_25px_rgba(37,211,102,0.4)] flex items-center justify-center gap-2"
            >
              <Search size={18} /> Prospectar Agora
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="px-6 py-3.5 rounded-2xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-white hover:bg-[rgba(255,255,255,0.12)] font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare size={18} /> Abrir Chat CRM
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Leads no Radar', value: totalLeads, icon: Users, color: '#3B82F6', change: '+24 esta semana', tag: 'Disponíveis' },
          { label: 'Propostas Enviadas', value: totalMensagens, icon: Send, color: '#25D366', change: '+18% taxa de envio', tag: 'API Oficial' },
          { label: 'Taxa de Abertura', value: '76.4%', icon: TrendingUp, color: '#8B5CF6', change: 'Alta conversão', tag: 'WhatsApp' },
          { label: 'Propostas Aceitas', value: 'R$ 3.800', icon: DollarSign, color: '#F59E0B', change: 'Estimativa mensal', tag: 'Aprovados' },
        ].map((item, idx) => (
          <div 
            key={idx}
            className="group relative bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider">{item.label}</span>
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${item.color}18`, color: item.color, border: `1px solid ${item.color}30` }}
              >
                <item.icon size={20} />
              </div>
            </div>

            <div className="text-3xl font-extrabold text-white tracking-tight mb-2">{item.value}</div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-[rgba(255,255,255,0.4)]">{item.change}</span>
              <span className="px-2 py-0.5 rounded-full font-bold text-[10px]" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                {item.tag}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Nichos Recomendados (8 cols) */}
        <div className="lg:col-span-7 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-3xl p-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Target size={20} className="text-[#25D366]" /> Nichos de Alto Valor
              </h2>
              <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">
                Profissionais liberais com maior orçamento e alta taxa de conversão
              </p>
            </div>
            <button 
              onClick={() => navigate('/prospector')}
              className="text-xs text-[#25D366] hover:underline font-bold flex items-center gap-1"
            >
              Ver todos <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {NICHE_TYPES.slice(0, 6).map((niche) => (
              <div
                key={niche.value}
                onClick={() => navigate(`/prospector?type=${niche.value}`)}
                className="group cursor-pointer bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(37,211,102,0.1)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(37,211,102,0.3)] rounded-2xl p-4 text-center transition-all duration-300 hover:scale-[1.03]"
              >
                <div className="text-3xl mb-2 transition-transform group-hover:scale-110">{niche.emoji}</div>
                <div className="text-xs font-bold text-white group-hover:text-[#25D366] transition-colors">{niche.label}</div>
                <div className="text-[10px] text-[rgba(255,255,255,0.4)] mt-1 font-medium">Buscar no Maps</div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-[rgba(37,211,102,0.1)] to-[rgba(59,130,246,0.1)] border border-[rgba(37,211,102,0.2)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold">
                💡
              </div>
              <div>
                <div className="text-xs font-bold text-white">Proposta sem Risco (Ticket R$ 800 - R$ 1.500)</div>
                <div className="text-[11px] text-[rgba(255,255,255,0.6)]">Você só cobra após o cliente aprovar a prévia pronta!</div>
              </div>
            </div>
            <button
              onClick={() => navigate('/prospector')}
              className="px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#128C7E] transition-all whitespace-nowrap shadow-lg"
            >
              Começar
            </button>
          </div>
        </div>

        {/* Right: Funil de Prospecção (5 cols) */}
        <div className="lg:col-span-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-3xl p-7 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mb-1">
              <Rocket size={20} className="text-[#3B82F6]" /> Funil: Do Maps ao PIX
            </h2>
            <p className="text-xs text-[rgba(255,255,255,0.5)]">4 passos para fechar contratos todos os dias</p>
          </div>

          <div className="space-y-4">
            {[
              { step: '01', title: 'Localize no Google Maps', desc: 'Encontre comércios com 5+ estrelas e sem site', color: '#3B82F6' },
              { step: '02', title: 'Dispare a Proposta Sem Risco', desc: 'Mande a oferta irrecusável pelo WhatsApp Meta API', color: '#25D366' },
              { step: '03', title: 'Monte o Site no Mesmo Dia', desc: 'Crie um site rápido em poucas horas', color: '#8B5CF6' },
              { step: '04', title: 'Receba o Pagamento na Aprovação', desc: 'Envie o link do site pronto e receba no PIX', color: '#F59E0B' },
            ].map((f) => (
              <div key={f.step} className="flex items-start gap-4 p-3.5 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] transition-all">
                <span className="text-xs font-black px-2.5 py-1 rounded-lg shrink-0" style={{ backgroundColor: `${f.color}20`, color: f.color }}>
                  {f.step}
                </span>
                <div>
                  <div className="text-xs font-bold text-white">{f.title}</div>
                  <div className="text-[11px] text-[rgba(255,255,255,0.5)] mt-0.5 leading-snug">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/prospector')}
            className="w-full py-3 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.1)] text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            Iniciar Busca de Clientes <ArrowRight size={14} />
          </button>
        </div>

      </div>

      {/* ── Bottom Performance Chart & Leads ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Chart */}
        <div className="lg:col-span-7 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-3xl p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Disparos & Retorno Semanal</h2>
              <p className="text-xs text-[rgba(255,255,255,0.4)]">Acompanhamento das mensagens enviadas</p>
            </div>
            <span className="text-xs font-bold text-[#25D366] bg-[rgba(37,211,102,0.1)] px-3 py-1 rounded-full border border-[rgba(37,211,102,0.2)]">
              ● API Oficial Meta Ativa
            </span>
          </div>

          <div className="h-60 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEnviadas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="dia" stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 11}} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="mensagens" name="Enviadas" stroke="#25D366" strokeWidth={2.5} fill="url(#colorEnviadas)" />
                <Area type="monotone" dataKey="lidas" name="Lidas" stroke="#3B82F6" strokeWidth={2.5} fill="url(#colorLidas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="lg:col-span-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-3xl p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Empresas sem Site no Radar</h2>
            <button onClick={() => navigate('/leads')} className="text-xs text-[#25D366] hover:underline font-bold">
              Ver todas
            </button>
          </div>

          <div className="space-y-3">
            {DEMO_LEADS.slice(0, 4).map(lead => (
              <div 
                key={lead.id} 
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer"
                onClick={() => navigate('/prospector')}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lead.emoji || '💼'}</span>
                  <div>
                    <div className="text-xs font-bold text-white truncate max-w-[160px]">{lead.name}</div>
                    <div className="text-[11px] text-[rgba(255,255,255,0.4)] capitalize">{lead.type}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[rgba(37,211,102,0.1)] border border-[rgba(37,211,102,0.2)] text-[#25D366] text-[10px] font-extrabold uppercase">
                  Sem Website
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
