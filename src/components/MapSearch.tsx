import React, { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { NICHE_TYPES } from '../lib/utils';

interface MapSearchProps {
  onSearch: (params: { query: string; radius: number; type: string }) => void;
  isLoading: boolean;
  initialType?: string;
}

const ESTADOS_BR = [
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'TO', nome: 'Tocantins' },
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'RR', nome: 'Roraima' },
];

const MapSearch: React.FC<MapSearchProps> = ({ onSearch, isLoading, initialType = '' }) => {
  const [selectedUf, setSelectedUf] = useState('GO');
  const [cidades, setCidades] = useState<string[]>(['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde']);
  const [selectedCidade, setSelectedCidade] = useState('Goiânia');
  const [bairro, setBairro] = useState('');
  const [radius, setRadius] = useState(5);
  const [type, setType] = useState(initialType);
  const [loadingCidades, setLoadingCidades] = useState(false);

  // Buscar cidades do estado selecionado usando a API oficial do IBGE
  useEffect(() => {
    if (!selectedUf) return;
    setLoadingCidades(true);

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const nomes = data.map((c: any) => c.nome);
          setCidades(nomes);
          if (nomes.length > 0) {
            setSelectedCidade(nomes[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCidades(false));
  }, [selectedUf]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryLocation = bairro.trim() 
      ? `${bairro}, ${selectedCidade}, ${selectedUf}, Brasil` 
      : `${selectedCidade}, ${selectedUf}, Brasil`;
      
    onSearch({ query: queryLocation, radius, type });
  };

  return (
    <form 
      onSubmit={handleSearch}
      className="bg-[rgba(255,255,255,0.02)] backdrop-blur-md rounded-2xl p-6 border border-[rgba(255,255,255,0.08)] shadow-lg"
      id="map-search"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        
        {/* Estado (UF) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[rgba(255,255,255,0.7)] mb-2">Estado</label>
          <select
            value={selectedUf}
            onChange={(e) => setSelectedUf(e.target.value)}
            className="w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-3 text-white outline-none focus:border-[#25D366] transition-all text-sm font-semibold"
          >
            {ESTADOS_BR.map(e => (
              <option key={e.uf} value={e.uf} className="bg-[#12121a]">{e.uf} - {e.nome}</option>
            ))}
          </select>
        </div>

        {/* Cidade */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-[rgba(255,255,255,0.7)] mb-2">
            Cidade {loadingCidades && <span className="text-[10px] text-[#25D366]">(carregando...)</span>}
          </label>
          <select
            value={selectedCidade}
            onChange={(e) => setSelectedCidade(e.target.value)}
            className="w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-3 text-white outline-none focus:border-[#25D366] transition-all text-sm font-semibold"
          >
            {cidades.map(c => (
              <option key={c} value={c} className="bg-[#12121a]">{c}</option>
            ))}
          </select>
        </div>

        {/* Bairro (opcional) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[rgba(255,255,255,0.7)] mb-2">Bairro (Opcional)</label>
          <input
            type="text"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            className="w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-3 text-white outline-none focus:border-[#25D366] transition-all text-sm"
            placeholder="Ex: Bueno, Setor Oeste..."
          />
        </div>

        {/* Tipo de Negócio */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-[rgba(255,255,255,0.7)] mb-2">Tipo de Negócio</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-3 text-white outline-none focus:border-[#25D366] transition-all text-sm font-semibold"
          >
            <option value="" className="bg-[#12121a]">Todos os nichos</option>
            {NICHE_TYPES.map(t => (
              <option key={t.value} value={t.value} className="bg-[#12121a]">{t.emoji} {t.label}</option>
            ))}
          </select>
        </div>

        {/* Botão Buscar */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isLoading || !selectedCidade}
            className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,211,102,0.2)] hover:shadow-[0_0_25px_rgba(37,211,102,0.4)] text-sm"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Search size={18} /> Buscar</>
            )}
          </button>
        </div>

      </div>
    </form>
  );
};

export default MapSearch;
