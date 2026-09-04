import React from 'react';
import { BUSINESS_TYPES } from '../lib/utils';

interface FilterBarProps {
  minReviews: number;
  setMinReviews: (v: number) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  noWebsite: boolean;
  setNoWebsite: (v: boolean) => void;
  hasPhone: boolean;
  setHasPhone: (v: boolean) => void;
  hideAlreadyContacted?: boolean;
  setHideAlreadyContacted?: (v: boolean) => void;
  businessType: string;
  setBusinessType: (v: string) => void;
  resultCount: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  minReviews, setMinReviews,
  minRating, setMinRating,
  noWebsite, setNoWebsite,
  hasPhone, setHasPhone,
  hideAlreadyContacted = true, setHideAlreadyContacted,
  businessType, setBusinessType,
  resultCount
}) => {
  return (
    <div className="bg-[#12121a] p-4 rounded-xl border border-[rgba(255,255,255,0.08)] flex flex-wrap items-center gap-6 mb-6" id="filter-bar">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[rgba(255,255,255,0.6)]">Min. Avaliações: {minReviews}</label>
        <input 
          type="range" 
          min="0" max="100" 
          value={minReviews} 
          onChange={(e) => setMinReviews(Number(e.target.value))}
          className="w-32 accent-[#25D366]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[rgba(255,255,255,0.6)]">Min. Estrelas</label>
        <select 
          value={minRating} 
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md px-2 py-1 text-white text-sm outline-none focus:border-[#25D366]"
        >
          <option value="1">1+ Estrelas</option>
          <option value="2">2+ Estrelas</option>
          <option value="3">3+ Estrelas</option>
          <option value="4">4+ Estrelas</option>
          <option value="4.5">4.5+ Estrelas</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[rgba(255,255,255,0.6)]">Tipo de Comércio</label>
        <select 
          value={businessType} 
          onChange={(e) => setBusinessType(e.target.value)}
          className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md px-2 py-1 text-white text-sm outline-none focus:border-[#25D366]"
        >
          <option value="">Todos</option>
          {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-4 border-l border-[rgba(255,255,255,0.1)] pl-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-white">
          <input 
            type="checkbox" 
            checked={noWebsite} 
            onChange={(e) => setNoWebsite(e.target.checked)}
            className="accent-[#25D366] w-4 h-4 cursor-pointer"
          />
          Sem website
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-white">
          <input 
            type="checkbox" 
            checked={hasPhone} 
            onChange={(e) => setHasPhone(e.target.checked)}
            className="accent-[#25D366] w-4 h-4 cursor-pointer"
          />
          Com telefone
        </label>
        {setHideAlreadyContacted && (
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#25D366] font-medium" title="Oculta empresas que você já salvou ou mandou mensagem">
            <input 
              type="checkbox" 
              checked={hideAlreadyContacted} 
              onChange={(e) => setHideAlreadyContacted(e.target.checked)}
              className="accent-[#25D366] w-4 h-4 cursor-pointer"
            />
            🛡️ Ocultar já prospectados
          </label>
        )}
      </div>

      <div className="ml-auto text-sm text-[rgba(255,255,255,0.6)]">
        <span className="text-white font-medium">{resultCount}</span> resultados novos
      </div>
    </div>
  );
};

export default FilterBar;
