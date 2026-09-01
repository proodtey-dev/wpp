import React, { useState, useEffect } from 'react';
import {
  Users, Send, TrendingUp, Zap, ArrowRight, Search,
  MapPin, MessageSquare, CheckCircle, Globe, Star,
  ChevronRight, DollarSign, Clock, Target
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { DEMO_LEADS, NICHE_TYPES } from '../lib/utils';

const chartData = [
  { dia: 'Seg', mensagens: 0 },
  { dia: 'Ter', mensagens: 0 },
  { dia: 'Qua', mensagens: 0 },
  { dia: 'Qui', mensagens: 0 },
  { dia: 'Sex', mensagens: 0 },
  { dia: 'Sáb', mensagens: 0 },
  { dia: 'Dom', mensagens: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1a1a2e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: '10px 16px',
        fontSize: 13,
        color: '#fff'
      }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: '#25D366', fontWeight: 700 }}>{payload[0].value} mensagens</div>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalMensagens, setTotalMensagens] = useState(0);

  useEffect(() => {
    fetch('/api/leads/stats').then(r => r.json()).then(d => {
      if (d.total !== undefined) setTotalLeads(d.total);
    }).catch(() => {});
    fetch('/api/whatsapp/campaigns').then(r => r.json()).then(d => {
      if (Array.isArray(d)) {
        const total = d.reduce((acc: number, c: any) => acc + (c.sent || 0), 0);
        setTotalMensagens(total);
      }
    }).catch(() => {});
  }, []);

  const niches = NICHE_TYPES.slice(0, 6);

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{
            background: 'rgba(37,211,102,0.12)',
            border: '1px solid rgba(37,211,102,0.25)',
            color: '#25D366',
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 999,
            letterSpacing: 0.5,
          }}>● ATIVO</span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: -0.5 }}>
          Bom dia, Guilherme 👋
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
          Encontre negócios sem site e feche contratos pagos só após aprovação.
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Leads Salvos', value: totalLeads || '0', icon: Users, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Mensagens Enviadas', value: totalMensagens || '0', icon: Send, color: '#25D366', bg: 'rgba(37,211,102,0.1)' },
          { label: 'Taxa de Retorno', value: '—', icon: TrendingUp, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
          { label: 'Contratos Fechados', value: '0', icon: DollarSign, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            padding: '20px 24px',
            transition: 'all 0.2s',
            cursor: 'default',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</span>
              <div style={{ background: bg, borderRadius: 8, padding: 8, color }}>
                <Icon size={16} />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>

        {/* Left: Começar agora */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          padding: 28,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
            🎯 Prospectar Agora
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 22 }}>
            Escolha um nicho e encontre empresas sem site na sua cidade
          </p>

          {/* Niche quick-select grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 22 }}>
            {niches.map(n => (
              <button
                key={n.value}
                onClick={() => navigate(`/prospector?type=${n.value}`)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '14px 12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  color: '#fff',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(37,211,102,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(37,211,102,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{n.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{n.label}</div>
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/prospector')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 20px rgba(37,211,102,0.25)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 28px rgba(37,211,102,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,211,102,0.25)')}
          >
            <Search size={18} /> Buscar Empresas sem Site
          </button>
        </div>

        {/* Right: Como funciona */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          padding: 28,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 20 }}>
            💡 Como funciona
          </h2>
          {[
            { step: '1', text: 'Busque empresas sem site no Google Maps', icon: Search, color: '#3B82F6' },
            { step: '2', text: 'Mande mensagem no WhatsApp com sua proposta', icon: MessageSquare, color: '#25D366' },
            { step: '3', text: 'Crie o site e mostre para o cliente', icon: Globe, color: '#8B5CF6' },
            { step: '4', text: 'Receba o pagamento só após aprovação', icon: DollarSign, color: '#F59E0B' },
          ].map(({ step, text, icon: Icon, color }) => (
            <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: `${color}18`,
                border: `1px solid ${color}30`,
                color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={15} />
              </div>
              <div style={{ paddingTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                {text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Atividade semanal */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          padding: 28,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Mensagens esta semana</h2>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Últimos 7 dias</span>
          </div>
          {totalMensagens === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <Send size={36} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Nenhuma mensagem enviada ainda</p>
              <button
                onClick={() => navigate('/prospector')}
                style={{ marginTop: 12, color: '#25D366', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, margin: '12px auto 0' }}
              >
                Começar agora <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gWpp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="dia" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="mensagens" stroke="#25D366" strokeWidth={2} fill="url(#gWpp)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Últimos leads */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          padding: 28,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Leads Recentes</h2>
            <button
              onClick={() => navigate('/leads')}
              style={{ color: '#25D366', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Ver todos <ChevronRight size={13} />
            </button>
          </div>

          {totalLeads === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <Target size={36} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Nenhum lead salvo ainda</p>
              <button
                onClick={() => navigate('/prospector')}
                style={{ marginTop: 12, color: '#25D366', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, margin: '12px auto 0' }}
              >
                Prospectar agora <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_LEADS.slice(0, 5).map(lead => (
                <div key={lead.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{lead.type}</div>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 99,
                    background: 'rgba(59,130,246,0.12)',
                    color: '#3B82F6',
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                  }}>
                    {lead.status}
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
