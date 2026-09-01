import React, { useState, useEffect } from 'react';
import { Megaphone, Send, Check, CheckCheck, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCampaigns } from '../lib/api';

const formatDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
};

const statusMap: Record<string, { label: string; cls: string }> = {
  'enviando': { label: 'Enviando', cls: 'badge-yellow' },
  'concluído': { label: 'Concluído', cls: 'badge-green' },
  'rascunho': { label: 'Rascunho', cls: 'badge-gray' },
  'erro': { label: 'Com erros', cls: 'badge-red' },
};

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCampaigns()
      .then(data => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header" style={{ paddingBottom: 24 }}>
        <div className="page-eyebrow"><Megaphone size={12} /> Disparos</div>
        <h1 className="page-title">Campanhas</h1>
        <p className="page-subtitle">Histórico de disparos via WhatsApp Business API.</p>
      </div>

      <div style={{ padding: '0 32px 32px' }}>
        {loading ? (
          <div className="table-wrap">
            {[1, 2, 3].map(i => (
              <div key={i} style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 140, height: 14 }} />
                <div className="skeleton" style={{ width: 80, height: 14 }} />
                <div className="skeleton" style={{ width: 60, height: 14 }} />
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-3)', borderRadius: 14, border: '1px solid var(--border)' }}>
            <Send size={36} style={{ margin: '0 auto 12px', color: 'var(--text-3)', opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Nenhuma campanha ainda</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: 360, margin: '0 auto 20px' }}>
              Selecione empresas na aba Prospectar e clique em "Enviar Proposta" para criar sua primeira campanha.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/prospector')}>
              Prospectar Empresas <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Enviados</th>
                  <th>Entregues</th>
                  <th>Falhas</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => {
                  const s = statusMap[c.status] || { label: c.status, cls: 'badge-gray' };
                  const rate = c.totalLeads > 0 ? Math.round((c.sent / c.totalLeads) * 100) : 0;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                        {c.templateName && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.templateName}</div>}
                      </td>
                      <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                      <td style={{ color: 'var(--text)' }}>{c.totalLeads}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: 'var(--text)' }}>{c.sent}</span>
                          {rate > 0 && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{rate}%</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCheck size={12} style={{ color: 'var(--green)' }} />
                          <span style={{ color: 'var(--green)' }}>{c.delivered}</span>
                        </div>
                      </td>
                      <td>
                        {c.failed > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertCircle size={12} style={{ color: 'var(--red)' }} />
                            <span style={{ color: 'var(--red)' }}>{c.failed}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{formatDate(c.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;
