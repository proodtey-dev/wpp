import { useEffect, useState, useMemo } from 'react';
import { Users, Search, Trash2, Star, Phone, LayoutGrid, List, MessageSquare, ExternalLink, Tag } from 'lucide-react';
import { getLeads, deleteLead, updateLead, CRM_STAGES } from '../lib/api';
import { useNavigate } from 'react-router-dom';

/* ── Types ──────────────────────────────────────────────── */
interface Lead {
  id: number;
  name: string;
  category: string;
  phone: string;
  status: string;
  rating?: number;
  created_at?: string;
  website?: string;
}

type ViewMode = 'table' | 'kanban';

/* ── Helpers ─────────────────────────────────────────────── */
function renderStars(rating?: number) {
  if (!rating) return <span className="dim text-xs">—</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          fill={i < Math.round(rating) ? '#f59e0b' : 'transparent'}
          color={i < Math.round(rating) ? '#f59e0b' : 'var(--text-3)'}
        />
      ))}
      <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 3 }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

/* ── Component ───────────────────────────────────────────── */
export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const navigate = useNavigate();

  /* ── Load ── */
  useEffect(() => {
    async function load() {
      try {
        const data = await getLeads();
        setLeads(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Leads load error:', err);
        showToast('Erro ao carregar leads', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  /* ── Update Lead Status ── */
  async function handleStatusChange(leadId: number, newStatus: string) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    try {
      await updateLead(leadId, { status: newStatus });
      showToast('Status do lead atualizado', 'success');
    } catch {
      showToast('Erro ao atualizar status', 'error');
    }
  }

  /* ── Delete ── */
  async function handleDelete(id: number) {
    if (!window.confirm('Excluir este lead?')) return;
    setDeletingId(id);
    try {
      await deleteLead(id);
      setLeads(prev => prev.filter(l => l.id !== id));
      showToast('Lead excluído com sucesso', 'success');
    } catch {
      showToast('Erro ao excluir lead', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  /* ── Filtered leads ── */
  const filtered = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch =
        !search ||
        lead.name?.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone?.toLowerCase().includes(search.toLowerCase()) ||
        lead.category?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || (lead.status || 'novo') === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="page-eyebrow">
            <Users size={12} />
            FUNIL DE VENDAS & CRM
          </div>
          <h1 className="page-title">Gerenciamento de Leads</h1>
          <p className="page-subtitle">
            {loading ? 'Carregando...' : `${leads.length} leads salvos no CRM`}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, gap: 2 }}>
          <button
            onClick={() => setViewMode('kanban')}
            style={{
              background: viewMode === 'kanban' ? 'var(--green)' : 'transparent',
              color: viewMode === 'kanban' ? '#000' : 'var(--text-2)',
              border: 'none',
              borderRadius: 7,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 150ms ease'
            }}
          >
            <LayoutGrid size={13} /> Funil CRM (Kanban)
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              background: viewMode === 'table' ? 'var(--green)' : 'transparent',
              color: viewMode === 'table' ? '#000' : 'var(--text-2)',
              border: 'none',
              borderRadius: 7,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 150ms ease'
            }}
          >
            <List size={13} /> Tabela
          </button>
        </div>
      </div>

      <div className="p-page" style={{ paddingTop: 20 }}>
        {/* Filters bar */}
        <div
          className="card flex items-center gap-3"
          style={{ padding: '12px 16px', marginBottom: 20, flexWrap: 'wrap' }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-3)',
                pointerEvents: 'none',
              }}
            />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder="Buscar por nome, nicho ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter Dropdown */}
          <div style={{ flex: '0 0 auto' }}>
            <select
              className="input"
              style={{ width: 'auto', minWidth: 180 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">Todas as etapas ({leads.length})</option>
              {CRM_STAGES.map(stage => {
                const count = leads.filter(l => (l.status || 'novo') === stage.id).length;
                return (
                  <option key={stage.id} value={stage.id}>
                    {stage.icon} {stage.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {(search || statusFilter !== 'all') && (
            <span className="text-xs dim">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Carregando funil do CRM...
          </div>
        ) : filtered.length === 0 ? (
          /* EMPTY STATE */
          <div
            className="card"
            style={{
              padding: '60px 32px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'var(--bg-4)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={22} color="var(--text-3)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                {search || statusFilter !== 'all' ? 'Nenhum lead encontrado' : 'Nenhum lead salvo ainda'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                {search || statusFilter !== 'all' ? 'Tente ajustar a busca ou o filtro de etapa' : 'Busque novos leads no Prospector para alimentar seu CRM'}
              </div>
            </div>
            {(search || statusFilter !== 'all') && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setSearch(''); setStatusFilter('all'); }}
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : viewMode === 'kanban' ? (
          /* KANBAN CRM BOARD VIEW */
          <div className="kanban-board">
            {CRM_STAGES.map(stage => {
              const stageLeads = filtered.filter(l => (l.status || 'novo') === stage.id);
              if (statusFilter !== 'all' && statusFilter !== stage.id) return null;

              return (
                <div key={stage.id} className="kanban-column">
                  <div className="kanban-column-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{stage.icon}</span>
                      <span>{stage.label}</span>
                    </div>
                    <span className="kanban-column-count">{stageLeads.length}</span>
                  </div>

                  <div className="kanban-cards-list">
                    {stageLeads.length === 0 ? (
                      <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'var(--text-3)' }}>
                        Sem leads nesta etapa
                      </div>
                    ) : (
                      stageLeads.map(lead => {
                        const currentStageObj = CRM_STAGES.find(s => s.id === (lead.status || 'novo')) || CRM_STAGES[0];
                        return (
                          <div key={lead.id} className="kanban-card">
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
                                {lead.name}
                              </span>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: 2, color: 'var(--red)', opacity: 0.7 }}
                                onClick={() => handleDelete(lead.id)}
                                title="Excluir"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>

                            {lead.category && (
                              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
                                🏷️ {lead.category}
                              </div>
                            )}

                            {lead.phone && (
                              <div style={{ fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, fontFamily: 'monospace' }}>
                                <Phone size={10} /> {lead.phone}
                              </div>
                            )}

                            <div style={{ marginBottom: 10 }}>
                              {renderStars(lead.rating)}
                            </div>

                            {/* Move Stage Selector & Actions */}
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <select
                                className={`crm-pill-select ${currentStageObj.color}`}
                                style={{ fontSize: 10, padding: '2px 6px' }}
                                value={lead.status || 'novo'}
                                onChange={e => handleStatusChange(lead.id, e.target.value)}
                              >
                                {CRM_STAGES.map(s => (
                                  <option key={s.id} value={s.id} style={{ background: '#111213', color: '#fff' }}>
                                    {s.icon} {s.label}
                                  </option>
                                ))}
                              </select>

                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: 10 }}
                                onClick={() => navigate('/chat')}
                                title="Abrir no Chat"
                              >
                                <MessageSquare size={10} /> Chat
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome do Lead</th>
                  <th>Nicho / Categoria</th>
                  <th>Telefone</th>
                  <th>Etapa no CRM</th>
                  <th>Avaliação</th>
                  <th style={{ textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => {
                  const currentStageObj = CRM_STAGES.find(s => s.id === (lead.status || 'novo')) || CRM_STAGES[0];
                  return (
                    <tr key={lead.id}>
                      {/* Nome */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 7,
                              background: 'rgba(34,197,94,0.1)',
                              border: '1px solid rgba(34,197,94,0.18)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--green)',
                              flexShrink: 0,
                            }}
                          >
                            {lead.name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'var(--text)',
                              maxWidth: 220,
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {lead.name}
                          </span>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                          {lead.category || '—'}
                        </span>
                      </td>

                      {/* Telefone */}
                      <td>
                        <div className="flex items-center gap-2">
                          <Phone size={11} color="var(--green)" />
                          <span style={{ fontSize: 12, fontFamily: 'monospace', letterSpacing: 0.3 }}>
                            {lead.phone || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Etapa CRM Dropdown Pill */}
                      <td>
                        <select
                          className={`crm-pill-select ${currentStageObj.color}`}
                          value={lead.status || 'novo'}
                          onChange={e => handleStatusChange(lead.id, e.target.value)}
                        >
                          {CRM_STAGES.map(s => (
                            <option key={s.id} value={s.id} style={{ background: '#111213', color: '#fff' }}>
                              {s.icon} {s.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Avaliação */}
                      <td>
                        {renderStars(lead.rating)}
                      </td>

                      {/* Ação */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate('/chat')}
                            title="Abrir no Chat"
                          >
                            <MessageSquare size={12} /> Chat
                          </button>

                          <button
                            className="btn btn-danger btn-sm"
                            disabled={deletingId === lead.id}
                            onClick={() => handleDelete(lead.id)}
                            title="Excluir lead"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <span className="text-xs dim">
              Exibindo {filtered.length} de {leads.length} leads
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
