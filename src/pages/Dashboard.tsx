import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Send,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { getLeadStats, getLeads, getCampaigns } from '../lib/api';

/* ── Types ──────────────────────────────────────────────── */
interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
}

interface Lead {
  id: number;
  name: string;
  category: string;
  phone: string;
  status: string;
  rating?: number;
  created_at?: string;
}

interface Campaign {
  id: number;
  name: string;
  status: string;
  sent_count?: number;
  replied_count?: number;
}

/* ── Niche config ────────────────────────────────────────── */
const NICHES = [
  { label: 'Dentista', type: 'dentist', icon: '🦷' },
  { label: 'Advogado', type: 'lawyer', icon: '⚖️' },
  { label: 'Cabelereiro', type: 'hair_care', icon: '✂️' },
  { label: 'Fisioterapeuta', type: 'physiotherapist', icon: '🏥' },
  { label: 'Psicólogo', type: 'psychologist', icon: '🧠' },
  { label: 'Arquiteto', type: 'architect', icon: '📐' },
  { label: 'Contador', type: 'accountant', icon: '📊' },
  { label: 'Imobiliária', type: 'real_estate_agency', icon: '🏠' },
];

/* ── Funnel steps ────────────────────────────────────────── */
const FUNNEL_STEPS = [
  { label: 'Maps', sub: 'Prospecção', color: '#3b82f6' },
  { label: 'Lead', sub: 'Salvo', color: '#8b5cf6' },
  { label: 'Proposta', sub: 'Enviada', color: '#f59e0b' },
  { label: 'Resposta', sub: 'Recebida', color: '#22c55e' },
  { label: 'Fechamento', sub: 'Contrato', color: '#22c55e' },
];

/* ── Status badge helper ─────────────────────────────────── */
function statusBadgeClass(status: string): string {
  switch (status) {
    case 'fechado': return 'badge badge-green';
    case 'respondeu': return 'badge badge-blue';
    case 'contatado': return 'badge badge-yellow';
    default: return 'badge badge-gray';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'novo': return 'Novo';
    case 'contatado': return 'Contatado';
    case 'respondeu': return 'Respondeu';
    case 'fechado': return 'Fechado';
    default: return status;
  }
}

/* ── Component ───────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<LeadStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, leadsData, campaignsData] = await Promise.all([
          getLeadStats(),
          getLeads(),
          getCampaigns(),
        ]);
        setStats(statsData);
        setRecentLeads(Array.isArray(leadsData) ? leadsData.slice(0, 5) : []);
        setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* Derived numbers */
  const totalLeads = stats?.total ?? 0;
  const propostas = campaigns.reduce((acc, c) => acc + (c.sent_count ?? 0), 0);
  const responderam = (stats?.byStatus?.respondeu ?? 0) + (stats?.byStatus?.fechado ?? 0);
  const contratos = stats?.byStatus?.fechado ?? 0;

  /* Funnel counts */
  const funnelCounts = [
    totalLeads,
    totalLeads,
    propostas,
    responderam,
    contratos,
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Page header ── */}
      <div className="page-header">
        <div className="page-eyebrow">
          <LayoutDashboard size={12} />
          VISÃO GERAL
        </div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Acompanhe sua operação de prospecção em tempo real</p>
      </div>

      <div className="p-page" style={{ paddingTop: 24 }}>

        {/* ── Stat cards ── */}
        {loading ? (
          <div className="stats-grid" style={{ marginBottom: 28 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="stat-card">
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 11, width: '50%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="stats-grid" style={{ marginBottom: 28 }}>
            {/* Leads Salvos */}
            <div className="stat-card">
              <div className="stat-icon-wrap" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <Users size={16} color="#3b82f6" />
              </div>
              <div className="stat-label">Leads Salvos</div>
              <div className="stat-value">{totalLeads.toLocaleString('pt-BR')}</div>
              <div className="stat-change neutral">total no banco</div>
            </div>

            {/* Propostas Enviadas */}
            <div className="stat-card">
              <div className="stat-icon-wrap" style={{ background: 'rgba(245,158,11,0.12)' }}>
                <Send size={16} color="#f59e0b" />
              </div>
              <div className="stat-label">Propostas Enviadas</div>
              <div className="stat-value">{propostas.toLocaleString('pt-BR')}</div>
              <div className="stat-change neutral">via campanhas</div>
            </div>

            {/* Responderam */}
            <div className="stat-card">
              <div className="stat-icon-wrap" style={{ background: 'rgba(34,197,94,0.12)' }}>
                <CheckCircle2 size={16} color="#22c55e" />
              </div>
              <div className="stat-label">Responderam</div>
              <div className="stat-value">{responderam.toLocaleString('pt-BR')}</div>
              <div
                className="stat-change positive"
                style={{ display: propostas > 0 ? 'block' : 'none' }}
              >
                {propostas > 0 ? `${Math.round((responderam / propostas) * 100)}% de conversão` : ''}
              </div>
              {propostas === 0 && <div className="stat-change neutral">sem campanhas ainda</div>}
            </div>

            {/* Contratos */}
            <div className="stat-card">
              <div
                className="stat-icon-wrap"
                style={{ background: 'rgba(34,197,94,0.15)', boxShadow: '0 0 12px rgba(34,197,94,0.2)' }}
              >
                <TrendingUp size={16} color="#22c55e" />
              </div>
              <div className="stat-label">Contratos</div>
              <div className="stat-value" style={{ color: 'var(--green)' }}>
                {contratos.toLocaleString('pt-BR')}
              </div>
              <div className="stat-change positive">leads fechados</div>
            </div>
          </div>
        )}

        {/* ── Funnel Visual ── */}
        <div className="card" style={{ marginBottom: 28, padding: 24 }}>
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: 20 }}
          >
            <div>
              <h2 className="font-bold" style={{ fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>
                Funil Visual
              </h2>
              <p className="text-sm muted">Jornada do prospecto ao fechamento</p>
            </div>
            <TrendingUp size={16} color="var(--text-3)" />
          </div>

          <div className="funnel-steps">
            {FUNNEL_STEPS.map((step, idx) => (
              <>
                <div key={step.label} className="funnel-step">
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${step.color}18`,
                      border: `1px solid ${step.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px',
                      fontSize: 13,
                      fontWeight: 700,
                      color: step.color,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>
                    {step.sub}
                  </div>
                  {!loading && (
                    <div style={{ fontSize: 18, fontWeight: 800, color: step.color }}>
                      {funnelCounts[idx].toLocaleString('pt-BR')}
                    </div>
                  )}
                  {loading && (
                    <div className="skeleton" style={{ height: 18, width: 40, margin: '0 auto' }} />
                  )}
                </div>
                {idx < FUNNEL_STEPS.length - 1 && (
                  <div key={`arrow-${idx}`} className="funnel-arrow">
                    <ChevronRight size={14} />
                  </div>
                )}
              </>
            ))}
          </div>
        </div>

        {/* ── Bottom row: Niches + Recent Activity ── */}
        <div
          className="flex gap-4"
          style={{ alignItems: 'flex-start' }}
        >
          {/* Nichos Rápidos */}
          <div className="card" style={{ flex: '0 0 340px', padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <h2 className="font-bold" style={{ fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>
                Nichos Rápidos
              </h2>
              <p className="text-sm muted">Prospecte por segmento com um clique</p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {NICHES.map(niche => (
                <button
                  key={niche.type}
                  className="btn btn-secondary"
                  style={{
                    justifyContent: 'flex-start',
                    gap: 8,
                    padding: '9px 12px',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                  onClick={() => navigate(`/prospector?type=${niche.type}`)}
                >
                  <span style={{ fontSize: 15 }}>{niche.icon}</span>
                  {niche.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/prospector')}
              >
                Busca Personalizada
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card" style={{ flex: 1, padding: 24, minWidth: 0 }}>
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: 16 }}
            >
              <div>
                <h2 className="font-bold" style={{ fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>
                  Atividade Recente
                </h2>
                <p className="text-sm muted">Últimos 5 leads salvos</p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/leads')}
              >
                Ver todos
                <ChevronRight size={12} />
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 13, width: '55%', marginBottom: 6 }} />
                      <div className="skeleton" style={{ height: 11, width: '35%' }} />
                    </div>
                    <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 20 }} />
                  </div>
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: 'var(--text-3)',
                }}
              >
                <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, color: 'var(--text-2)' }}>
                  Nenhum lead ainda
                </div>
                <div style={{ fontSize: 12 }}>Prospecte leads no Maps para começar</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentLeads.map(lead => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-3"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      transition: 'background var(--transition)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-4)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                    onClick={() => navigate('/leads')}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #22c55e22, #22c55e11)',
                        border: '1px solid rgba(34,197,94,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--green)',
                        flexShrink: 0,
                      }}
                    >
                      {lead.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="truncate font-semibold"
                        style={{ fontSize: 13, color: 'var(--text)', marginBottom: 1 }}
                      >
                        {lead.name}
                      </div>
                      <div
                        className="truncate text-xs dim"
                      >
                        {lead.category} · {lead.phone}
                      </div>
                    </div>

                    {/* Status */}
                    <span className={statusBadgeClass(lead.status)}>
                      {statusLabel(lead.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
