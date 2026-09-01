import { useEffect, useState, useMemo } from 'react';
import { Users, Search, Trash2, Star, Phone } from 'lucide-react';
import { getLeads, deleteLead } from '../lib/api';

/* ── Types ──────────────────────────────────────────────── */
interface Lead {
  id: number;
  name: string;
  category: string;
  phone: string;
  status: string;
  rating?: number;
  created_at?: string;
}

type StatusFilter = 'all' | 'novo' | 'contatado' | 'respondeu' | 'fechado';

/* ── Helpers ─────────────────────────────────────────────── */
function statusBadgeClass(status: string): string {
  switch (status) {
    case 'fechado':   return 'badge badge-green';
    case 'respondeu': return 'badge badge-blue';
    case 'contatado': return 'badge badge-yellow';
    default:          return 'badge badge-gray';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'novo':      return 'Novo';
    case 'contatado': return 'Contatado';
    case 'respondeu': return 'Respondeu';
    case 'fechado':   return 'Fechado';
    default:          return status ?? 'Novo';
  }
}

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

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

  /* ── Toast helper ── */
  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
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
        lead.phone?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  /* ── Counts per status ── */
  const counts: Record<StatusFilter, number> = useMemo(() => ({
    all:        leads.length,
    novo:       leads.filter(l => l.status === 'novo' || !l.status).length,
    contatado:  leads.filter(l => l.status === 'contatado').length,
    respondeu:  leads.filter(l => l.status === 'respondeu').length,
    fechado:    leads.filter(l => l.status === 'fechado').length,
  }), [leads]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Toast ── */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.msg}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="page-header">
        <div className="page-eyebrow">
          <Users size={12} />
          GERENCIAMENTO
        </div>
        <h1 className="page-title">Leads</h1>
        <p className="page-subtitle">
          {loading ? 'Carregando...' : `${leads.length} leads no banco de dados`}
        </p>
      </div>

      <div className="p-page" style={{ paddingTop: 24 }}>

        {/* ── Filters bar ── */}
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
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div style={{ flex: '0 0 auto' }}>
            <select
              className="input"
              style={{ width: 'auto', minWidth: 160 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">Todos os status ({counts.all})</option>
              <option value="novo">Novo ({counts.novo})</option>
              <option value="contatado">Contatado ({counts.contatado})</option>
              <option value="respondeu">Respondeu ({counts.respondeu})</option>
              <option value="fechado">Fechado ({counts.fechado})</option>
            </select>
          </div>

          {/* Result count */}
          {(search || statusFilter !== 'all') && (
            <span className="text-xs dim">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th>Avaliação</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j}>
                        <div
                          className="skeleton"
                          style={{ height: 14, width: j === 5 ? 60 : j === 0 ? '70%' : '80%' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          /* ── Empty state ── */
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
                {search || statusFilter !== 'all'
                  ? 'Nenhum lead encontrado'
                  : 'Nenhum lead ainda'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                {search || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Vá ao Prospector para buscar e salvar leads do Google Maps'}
              </div>
            </div>
            {(search || statusFilter !== 'all') && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setSearch(''); setStatusFilter('all'); }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th>Avaliação</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
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
                            maxWidth: 200,
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
                        <Phone size={11} color="var(--text-3)" />
                        <span style={{ fontSize: 12, fontFamily: 'monospace', letterSpacing: 0.3 }}>
                          {lead.phone || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={statusBadgeClass(lead.status)}>
                        {statusLabel(lead.status)}
                      </span>
                    </td>

                    {/* Avaliação */}
                    <td>
                      {renderStars(lead.rating)}
                    </td>

                    {/* Ação */}
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={deletingId === lead.id}
                        onClick={() => handleDelete(lead.id)}
                        title="Excluir lead"
                      >
                        <Trash2 size={12} />
                        {deletingId === lead.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Footer count ── */}
        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <span className="text-xs dim">
              Exibindo {filtered.length} de {leads.length} leads
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
