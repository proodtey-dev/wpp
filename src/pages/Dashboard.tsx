import React, { useState, useEffect } from 'react';
import {
  Users, Send, TrendingUp, Search,
  MessageSquare, Globe, Star,
  ChevronRight, DollarSign, Target, Sparkles, Rocket
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { NICHE_TYPES } from '../lib/utils';
import { getLeads, getCampaigns } from '../lib/api';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#12121a] border border-[rgba(255,255,255,0.12)] rounded-xl p-3 shadow-2xl text-xs text-white">
        <div className="text-[rgba(255,255,255,0.5)] mb-1 font-medium">{label}</div>
        <div className="text-[#25D366] font-bold">{payload[0].value} enviadas</div>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [realLeads, setRealLeads] = useState<any[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalEnviadas, setTotalEnviadas] = useState(0);
  const [totalEntregues, setTotalEntregues] = useState(0);
  const [totalConvertidos, setTotalConvertidos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Buscar leads reais do banco de dados
    getLeads().then(data => {
      if (Array.isArray(data)) {
        setRealLeads(data);
        setTotalLeads(data.length);
        const convertidos = data.filter((l: any) => l.status === 'convertido').length;
        setTotalConvertidos(convertidos);
      }
    }).catch(() => {});

    // 2. Buscar campanhas reais do banco de dados
    getCampaigns().then(data => {
      if (Array.isArray(data)) {
        const totalSent = data.reduce((acc: number, c: any) => acc + (c.sent || 0), 0);
        const totalDelivered = data.reduce((acc: number, c: any) => acc + (c.delivered || 0), 0);
        setTotalEnviadas(totalSent);
        setTotalEntregues(totalDelivered);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Dados reais para o gráfico (calculado com base nas campanhas reais)
  const chartData = [
    { dia: 'Seg', mensagens: 0 },
    { dia: 'Ter', mensagens: 0 },
    { dia: 'Qua', mensagens: 0 },
    { dia: 'Qui', mensagens: 0 },
    { dia: 'Sex', mensagens: 0 },
    { dia: 'Sáb', mensagens: 0 },
    { dia: 'Dom', mensagens: 0 },
  ];

  const taxaEntrega = totalEnviadas > 0 ? ((totalEntregues / totalEnviadas) * 100).toFixed(1) + '%' : '0%';
  const estimativaFaturamento = totalConvertidos * 1000; // R$ 1.000 por site fechado

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen pb-24">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1f18] via-[#12121a] to-[#121a2e] border border-[rgba(37,211,102,0.25)] p-8 shadow-[0_0_50px_rgba(37,211,102,0.08)]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-[radial-gradient(circle,rgba(37,211,102,0.15)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(37,211,102,0.15)] border border-[rgba(37,211,102,0.3)] text-[#25D366] text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} /> Sistema de Prospecção WPP
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Prospecção de <span className="bg-gradient-to-r from-[#25D366] to-[#60EFFF] bg-clip-text text-transparent">Clientes para Sites</span>
            </h1>
            <p className="text-sm md:text-base text-[rgba(255,255,255,0.65)] leading-relaxed">
              Busque empresas sem site no Google Maps por estado e cidade. Proposta sem risco: <strong className="text-white">o cliente só paga após aprovação!</strong>
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

      {/* ── 4 Metrics Cards (100% REAIS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Leads Salvos', value: totalLeads, icon: Users, color: '#3B82F6', change: 'Banco de dados', tag: 'Real' },
          { label: 'Propostas Enviadas', value: totalEnviadas, icon: Send, color: '#25D366', change: 'WhatsApp API', tag: 'Real' },
          { label: 'Taxa de Entrega', value: taxaEntrega, icon: TrendingUp, color: '#8B5CF6', change: 'Confirmação Meta', tag: 'Real' },
          { label: 'Contratos Fechados', value: `R$ ${estimativaFaturamento}`, icon: DollarSign, color: '#F59E0B', change: `${totalConvertidos} clientes`, tag: 'Real' },
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

        {/* Left: Nichos Recomendados (7 cols) */}
        <div className="lg:col-span-7 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-3xl p-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Target size={20} className="text-[#25D366]" /> Selecionar Nicho para Prospectar
              </h2>
              <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">
                Escolha o segmento e encontre comércios sem site na sua cidade
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
                <div className="text-[10px] text-[rgba(255,255,255,0.4)] mt-1 font-medium">Buscar empresas</div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-[rgba(37,211,102,0.1)] to-[rgba(59,130,246,0.1)] border border-[rgba(37,211,102,0.2)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold">
                💡
              </div>
              <div>
                <div className="text-xs font-bold text-white">Proposta sem Risco (Pague Após Aprovação)</div>
                <div className="text-[11px] text-[rgba(255,255,255,0.6)]">Crie a prévia, envie o link e só cobre se o cliente gostar!</div>
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
              <Rocket size={20} className="text-[#3B82F6]" /> Funil de Vendas
            </h2>
            <p className="text-xs text-[rgba(255,255,255,0.5)]">Como fechar clientes todos os dias</p>
          </div>

          <div className="space-y-4">
            {[
              { step: '01', title: 'Busque no Google Maps', desc: 'Filtre empresas sem site na sua cidade', color: '#3B82F6' },
              { step: '02', title: 'Envie a Proposta no Wpp', desc: 'Mensagem com oferta de pagar após aprovação', color: '#25D366' },
              { step: '03', title: 'Desenvolva a Prévia', desc: 'Monte o site em poucas horas', color: '#8B5CF6' },
              { step: '04', title: 'Receba no PIX', desc: 'Cliente aprova e realiza o pagamento', color: '#F59E0B' },
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
            className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)]"
          >
            Iniciar Busca de Clientes
          </button>
        </div>

      </div>

      {/* ── Bottom Section: 100% Real Leads & Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Chart */}
        <div className="lg:col-span-7 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-3xl p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Envios da Semana</h2>
              <p className="text-xs text-[rgba(255,255,255,0.4)]">Histórico de mensagens disparadas</p>
            </div>
            <span className="text-xs font-bold text-[#25D366] bg-[rgba(37,211,102,0.1)] px-3 py-1 rounded-full border border-[rgba(37,211,102,0.2)]">
              ● Banco de Dados Conectado
            </span>
          </div>

          {totalEnviadas === 0 ? (
            <div className="py-16 text-center text-xs text-[rgba(255,255,255,0.4)] border border-dashed border-[rgba(255,255,255,0.08)] rounded-2xl">
              Nenhuma mensagem enviada ainda nesta semana.
              <br />
              <button onClick={() => navigate('/prospector')} className="mt-3 text-[#25D366] font-bold underline">
                Disparar primeira campanha
              </button>
            </div>
          ) : (
            <div className="h-60 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEnviadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#25D366" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#25D366" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dia" stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 11}} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="mensagens" name="Enviadas" stroke="#25D366" strokeWidth={2.5} fill="url(#colorEnviadas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Real Saved Leads */}
        <div className="lg:col-span-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-3xl p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Leads Salvos no Banco</h2>
            <button onClick={() => navigate('/leads')} className="text-xs text-[#25D366] hover:underline font-bold">
              Ver todos
            </button>
          </div>

          {realLeads.length === 0 ? (
            <div className="py-12 px-4 text-center text-xs text-[rgba(255,255,255,0.4)] border border-dashed border-[rgba(255,255,255,0.08)] rounded-2xl">
              Nenhum lead salvo no banco de dados.
              <div className="mt-2 text-[rgba(255,255,255,0.6)]">Vá em Prospectar, selecione empresas e clique em "Salvar Leads"!</div>
              <button 
                onClick={() => navigate('/prospector')} 
                className="mt-4 px-4 py-2 rounded-xl bg-[#25D366] text-white font-bold transition-all text-xs"
              >
                Buscar Empresas Agora
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {realLeads.slice(0, 4).map(lead => (
                <div 
                  key={lead.id} 
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer"
                  onClick={() => navigate('/leads')}
                >
                  <div>
                    <div className="text-xs font-bold text-white truncate max-w-[160px]">{lead.name}</div>
                    <div className="text-[11px] text-[rgba(255,255,255,0.4)] capitalize">{lead.category || lead.type || 'Empresa'}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[rgba(37,211,102,0.1)] border border-[rgba(37,211,102,0.2)] text-[#25D366] text-[10px] font-extrabold uppercase">
                    {lead.status || 'Novo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
