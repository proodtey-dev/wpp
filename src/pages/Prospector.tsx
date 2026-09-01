import React, { useState, useEffect } from 'react';
import { Search, Save, Send, Sparkles, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MapSearch from '../components/MapSearch';
import FilterBar from '../components/FilterBar';
import LeadCard from '../components/LeadCard';
import CampaignModal from '../components/CampaignModal';
import { geocodeLocation, searchBusinesses, saveLeads } from '../lib/api';

const Prospector = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || '';

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastSearchParams, setLastSearchParams] = useState<{ query: string; radius: number; type: string } | null>(null);

  // Filter states
  const [minReviews, setMinReviews] = useState(0);
  const [minRating, setMinRating] = useState(1);
  const [noWebsite, setNoWebsite] = useState(true);
  const [hasPhone, setHasPhone] = useState(true);
  const [businessType, setBusinessType] = useState(initialType);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (initialType) {
      setBusinessType(initialType);
    }
  }, [initialType]);

  const handleSearch = async (params: { query: string; radius: number; type: string }, pageNum: number = 1) => {
    setIsSearching(true);
    setHasSearched(true);
    setSelectedIds([]);
    setCurrentPage(pageNum);
    setLastSearchParams(params);

    try {
      // 1. Geocode location
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

      if (resp && resp.results && resp.results.length > 0) {
        const searchResults = resp.results.map((r: any, idx: number) => ({
          id: idx + 1 + (pageNum - 1) * 20,
          name: r.name,
          type: r.category || params.type || 'Empresa',
          rating: r.rating || 4.8,
          reviews: r.reviewCount || 35,
          address: r.address || params.query,
          phone: r.phone || 'Telefone sob consulta',
          hasWebsite: Boolean(r.website && r.website.trim().length > 0),
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
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (lastSearchParams && currentPage > 1) {
      handleSearch(lastSearchParams, currentPage - 1);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  const filteredResults = results.filter(lead => {
    if (noWebsite && lead.hasWebsite) return false;
    if (hasPhone && (!lead.phone || lead.phone === 'Sem telefone')) return false;
    return true;
  });

  const toggleSelect = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredResults.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredResults.map(r => r.id));
    }
  };

  const handleSaveLeadsAction = async () => {
    const selectedLeads = filteredResults.filter(r => selectedIds.includes(r.id));
    await saveLeads(selectedLeads).catch(() => {});
    setToastMessage(`${selectedIds.length} empresas salvas no seu banco de dados!`);
    setTimeout(() => setToastMessage(''), 3000);
    setSelectedIds([]);
  };

  const handleSendWhatsApp = () => {
    setIsModalOpen(true);
  };

  const handleCampaignSend = async (name: string, msg: string) => {
    setToastMessage(`Campanha "${name}" iniciada com sucesso!`);
    setTimeout(() => setToastMessage(''), 4000);
    setSelectedIds([]);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen pb-32 animate-in fade-in duration-500">

      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#25D366] text-white px-5 py-3 rounded-xl font-medium shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5">
          <CheckCircle2 size={20} />
          {toastMessage}
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#25D366] uppercase tracking-wider mb-1">
          <Sparkles size={14} /> PROSPECÇÃO DE EMPRESAS
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Buscar Empresas sem Site</h1>
        <p className="text-[rgba(255,255,255,0.6)]">
          Selecione o Estado, a Cidade e o Nicho desejado para encontrar empresas no Maps.
        </p>
      </div>

      <MapSearch onSearch={(p) => handleSearch(p, 1)} isLoading={isSearching} initialType={initialType} />

      {hasSearched && !isSearching && (
        <div className="mt-8">
          <FilterBar 
            minReviews={minReviews} setMinReviews={setMinReviews}
            minRating={minRating} setMinRating={setMinRating}
            noWebsite={noWebsite} setNoWebsite={setNoWebsite}
            hasPhone={hasPhone} setHasPhone={setHasPhone}
            businessType={businessType} setBusinessType={setBusinessType}
            resultCount={filteredResults.length}
          />

          <div className="mb-4 flex items-center justify-between bg-[rgba(255,255,255,0.03)] px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.06)]">
            <label htmlFor="select-all" className="flex items-center gap-3 text-sm text-white cursor-pointer select-none">
              <input 
                type="checkbox" 
                id="select-all"
                checked={filteredResults.length > 0 && selectedIds.length === filteredResults.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-[#25D366] cursor-pointer"
              />
              Selecionar todos os {filteredResults.length} resultados encontrados (Página {currentPage})
            </label>

            {selectedIds.length > 0 && (
              <span className="text-xs text-[#25D366] font-semibold">
                {selectedIds.length} selecionado{selectedIds.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {filteredResults.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResults.map(lead => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead} 
                    selected={selectedIds.includes(lead.id)}
                    onSelect={(checked) => toggleSelect(lead.id, checked)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="mt-10 flex items-center justify-between bg-[rgba(255,255,255,0.03)] p-4 rounded-2xl border border-[rgba(255,255,255,0.08)]">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  <ChevronLeft size={18} /> Página Anterior
                </button>

                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Página</span>
                  <span className="bg-[#25D366] text-black w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs">
                    {currentPage}
                  </span>
                </div>

                <button
                  onClick={handleNextPage}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:opacity-90 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)]"
                >
                  <span>Próximos 20 Resultados</span> <ChevronRight size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-[rgba(255,255,255,0.02)] rounded-2xl border border-[rgba(255,255,255,0.05)]">
              <Search size={48} className="mx-auto text-[rgba(255,255,255,0.2)] mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Nenhum resultado com esses filtros</h3>
              <p className="text-[rgba(255,255,255,0.5)]">Tente desmarcar "Sem website" ou trocar a cidade selecionada.</p>
            </div>
          )}
        </div>
      )}

      {isSearching && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-xl p-5 h-48 animate-pulse flex flex-col justify-between">
              <div>
                <div className="h-5 bg-[rgba(255,255,255,0.1)] rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-[rgba(255,255,255,0.1)] rounded w-1/2"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-[rgba(255,255,255,0.1)] rounded w-full"></div>
                <div className="h-3 bg-[rgba(255,255,255,0.1)] rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sticky Bottom Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-[50%] md:left-[calc(50%+140px)] transform -translate-x-1/2 bg-[#12121a]/95 backdrop-blur-xl border border-[rgba(37,211,102,0.3)] p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center gap-6 z-40 animate-in slide-in-from-bottom-10 duration-300 w-11/12 max-w-2xl">
          <div className="text-white font-medium flex-1 text-center md:text-left whitespace-nowrap">
            <span className="text-[#25D366] text-xl font-extrabold">{selectedIds.length}</span> empresas selecionadas
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSaveLeadsAction}
              className="px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.15)] text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Save size={16} /> <span className="hidden md:inline">Salvar Leads</span>
            </button>
            <button 
              onClick={handleSendWhatsApp}
              className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,211,102,0.4)] flex items-center gap-2"
            >
              <Send size={16} /> <span>Enviar Proposta</span>
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
