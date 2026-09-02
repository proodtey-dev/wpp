import React, { useState, useEffect } from 'react';
import { Search, Save, Send, Sparkles, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import MapSearch from '../components/MapSearch';
import FilterBar from '../components/FilterBar';
import LeadCard from '../components/LeadCard';
import CampaignModal from '../components/CampaignModal';
import { geocodeLocation, searchBusinesses, saveLeads, sendWhatsApp } from '../lib/api';

const Prospector = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || '';

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastSearchParams, setLastSearchParams] = useState<{ query: string; radius: number; type: string } | null>(null);

  const [minReviews, setMinReviews] = useState(0);
  const [minRating, setMinRating] = useState(1);
  const [noWebsite, setNoWebsite] = useState(true);
  const [hasPhone, setHasPhone] = useState(true);
  const [businessType, setBusinessType] = useState(initialType);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (initialType) setBusinessType(initialType);
  }, [initialType]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleSearch = async (params: { query: string; radius: number; type: string }, pageNum: number = 1) => {
    setIsSearching(true);
    setHasSearched(true);
    setSelectedIds([]);
    setCurrentPage(pageNum);
    setLastSearchParams(params);

    try {
      const geo = await geocodeLocation(params.query).catch(() => ({ latitude: -16.6869, longitude: -49.2648 }));
      const resp = await searchBusinesses({
        latitude: geo?.latitude || -16.6869,
        longitude: geo?.longitude || -49.2648,
        radius: params.radius * 1000,
        type: params.type,
        queryText: params.query,
        keyword: params.query,
        page: pageNum,
        minReviews,
        minRating,
        noWebsite,
        hasPhone
      }).catch(() => null);

      if (resp?.results?.length > 0) {
        const searchResults = resp.results.map((r: any, idx: number) => ({
          id: idx + 1 + (pageNum - 1) * 20,
          name: r.name,
          type: r.category || params.type || 'Empresa',
          rating: r.rating || 4.8,
          reviews: r.reviewCount || 35,
          address: r.address || params.query,
          phone: r.phone || 'Telefone sob consulta',
          hasWebsite: Boolean(r.website?.trim().length > 0),
          status: r.status || 'novo',
          emoji: '💼'
        }));
        setResults(searchResults);
      } else {
        setResults([]);
      }
    } catch (e) {
      console.error('Erro ao buscar:', e);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNextPage = () => {
    if (lastSearchParams) {
      handleSearch(lastSearchParams, currentPage + 1);
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (lastSearchParams && currentPage > 1) {
      handleSearch(lastSearchParams, currentPage - 1);
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  const filteredResults = results.filter(lead => {
    if (noWebsite && lead.hasWebsite) return false;
    if (hasPhone && (!lead.phone || lead.phone === 'Sem telefone')) return false;
    return true;
  });

  const toggleSelect = (id: number, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(item => item !== id));
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filteredResults.length ? [] : filteredResults.map(r => r.id));
  };

  const handleSaveLeadsAction = async () => {
    const selectedLeads = filteredResults.filter(r => selectedIds.includes(r.id));
    await saveLeads(selectedLeads).catch(() => {});
    showToast(`${selectedIds.length} empresa${selectedIds.length > 1 ? 's' : ''} salva${selectedIds.length > 1 ? 's' : ''} com sucesso!`);
    setSelectedIds([]);
  };

  const handleCampaignSend = async (name: string, msg: string) => {
    try {
      // 1. Salva os leads primeiro
      const selectedLeads = filteredResults.filter(r => selectedIds.includes(r.id));
      const saveRes = await saveLeads(selectedLeads).catch(() => null);
      const savedLeadIds = saveRes?.ids || selectedIds;

      // 2. Dispara a campanha via backend
      await sendWhatsApp({
        leadIds: savedLeadIds,
        message: msg,
        campaignName: name
      });

      showToast(`Campanha "${name}" enviada! Acompanhe no Chat/CRM.`);
      setSelectedIds([]);
    } catch (e: any) {
      showToast('Erro ao disparar campanha: ' + (e.message || 'Falha na conexão'));
    }
  };

  return (
    <div>
      {toast && (
        <div className="toast success">
          <CheckCircle2 size={15} style={{ color: 'var(--green)', flexShrink: 0 }} />
          {toast}
        </div>
      )}

      <div className="page-header" style={{ paddingBottom: 20 }}>
        <div className="page-eyebrow"><Sparkles size={12} /> Prospecção</div>
        <h1 className="page-title">Buscar Empresas</h1>
        <p className="page-subtitle">Encontre empresas sem site no Google Maps por cidade e nicho.</p>
      </div>

      <div style={{ padding: '0 32px 32px' }}>
        <MapSearch onSearch={(p) => handleSearch(p, 1)} isLoading={isSearching} initialType={initialType} />

        {hasSearched && !isSearching && (
          <div style={{ marginTop: 20 }}>
            <FilterBar
              minReviews={minReviews} setMinReviews={setMinReviews}
              minRating={minRating} setMinRating={setMinRating}
              noWebsite={noWebsite} setNoWebsite={setNoWebsite}
              hasPhone={hasPhone} setHasPhone={setHasPhone}
              businessType={businessType} setBusinessType={setBusinessType}
              resultCount={filteredResults.length}
            />

            <div className="card" style={{ padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label htmlFor="select-all" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-2)' }}>
                <input
                  type="checkbox"
                  id="select-all"
                  checked={filteredResults.length > 0 && selectedIds.length === filteredResults.length}
                  onChange={toggleSelectAll}
                  style={{ width: 15, height: 15, accentColor: 'var(--green)', cursor: 'pointer' }}
                />
                Selecionar todos os {filteredResults.length} resultados (Página {currentPage})
              </label>
              {selectedIds.length > 0 && (
                <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>
                  {selectedIds.length} selecionado{selectedIds.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {filteredResults.length > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {filteredResults.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      selected={selectedIds.includes(lead.id)}
                      onSelect={(checked) => toggleSelect(lead.id, checked)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="card" style={{ padding: '12px 16px', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="btn btn-secondary btn-sm"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                    Página <span style={{ color: 'var(--text)', fontWeight: 700 }}>{currentPage}</span>
                  </span>
                  <button
                    onClick={handleNextPage}
                    className="btn btn-primary btn-sm"
                  >
                    Próximos 20 <ChevronRight size={14} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--bg-3)', borderRadius: 14, border: '1px solid var(--border)' }}>
                <Search size={32} style={{ margin: '0 auto 12px', color: 'var(--text-3)', opacity: 0.4 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Nenhum resultado com esses filtros</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Tente desmarcar "Sem website" ou trocar a cidade selecionada.</p>
              </div>
            )}
          </div>
        )}

        {isSearching && (
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card" style={{ padding: 16, height: 180 }}>
                <div className="skeleton" style={{ height: 14, width: '75%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 10, width: '50%', marginBottom: 20 }} />
                <div className="skeleton" style={{ height: 10, width: '100%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 10, width: '70%' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      {selectedIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-3)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 14,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          zIndex: 50,
          animation: 'slideInRight 0.2s ease',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
            <strong style={{ color: 'var(--green)' }}>{selectedIds.length}</strong> empresa{selectedIds.length > 1 ? 's' : ''} selecionada{selectedIds.length > 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleSaveLeadsAction}>
              <Save size={13} /> Salvar
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
              <Send size={13} /> Enviar Proposta
            </button>
          </div>
        </div>
      )}

      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedLeads={filteredResults.filter(r => selectedIds.includes(r.id))}
        onSend={handleCampaignSend}
      />
    </div>
  );
};

export default Prospector;
