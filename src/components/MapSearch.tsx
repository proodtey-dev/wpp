import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { NICHE_TYPES } from '../lib/utils';

interface MapSearchProps {
  onSearch: (params: { query: string; radius: number; type: string }) => void;
  isLoading: boolean;
  initialType?: string;
}

const ESTADOS_BR = [
  { uf: 'GO', nome: 'Goiás' }, { uf: 'SP', nome: 'São Paulo' }, { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'RJ', nome: 'Rio de Janeiro' }, { uf: 'DF', nome: 'Distrito Federal' }, { uf: 'PR', nome: 'Paraná' },
  { uf: 'RS', nome: 'Rio Grande do Sul' }, { uf: 'SC', nome: 'Santa Catarina' }, { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' }, { uf: 'PE', nome: 'Pernambuco' }, { uf: 'MA', nome: 'Maranhão' },
  { uf: 'ES', nome: 'Espírito Santo' }, { uf: 'MT', nome: 'Mato Grosso' }, { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'PA', nome: 'Pará' }, { uf: 'PB', nome: 'Paraíba' }, { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'AL', nome: 'Alagoas' }, { uf: 'PI', nome: 'Piauí' }, { uf: 'SE', nome: 'Sergipe' },
  { uf: 'AM', nome: 'Amazonas' }, { uf: 'TO', nome: 'Tocantins' },
];

const MapSearch: React.FC<MapSearchProps> = ({ onSearch, isLoading, initialType = '' }) => {
  const [selectedUf, setSelectedUf] = useState('GO');
  const [cidades, setCidades] = useState<string[]>(['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde']);
  const [selectedCidade, setSelectedCidade] = useState('Goiânia');
  const [bairro, setBairro] = useState('');
  const [radius, setRadius] = useState(5);
  const [type, setType] = useState(initialType);
  const [loadingCidades, setLoadingCidades] = useState(false);

  useEffect(() => {
    if (!selectedUf) return;
    setLoadingCidades(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const nomes = data.map((c: any) => c.nome);
          setCidades(nomes);
          if (nomes.length > 0) setSelectedCidade(nomes[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCidades(false));
  }, [selectedUf]);

  useEffect(() => {
    if (initialType) setType(initialType);
  }, [initialType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryLocation = bairro.trim()
      ? `${bairro}, ${selectedCidade}, ${selectedUf}, Brasil`
      : `${selectedCidade}, ${selectedUf}, Brasil`;
    onSearch({ query: queryLocation, radius, type });
  };

  return (
    <form onSubmit={handleSearch} className="card" style={{ padding: 20, marginBottom: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, alignItems: 'end' }}>

        <div className="form-group">
          <label className="form-label">Estado</label>
          <select className="input" value={selectedUf} onChange={e => setSelectedUf(e.target.value)}>
            {ESTADOS_BR.map(e => (
              <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Cidade {loadingCidades && <span style={{ color: 'var(--green)', fontSize: 10 }}>(carregando…)</span>}
          </label>
          <select className="input" value={selectedCidade} onChange={e => setSelectedCidade(e.target.value)}>
            {cidades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Bairro (Opcional)</label>
          <input
            className="input"
            type="text"
            value={bairro}
            onChange={e => setBairro(e.target.value)}
            placeholder="Ex: Setor Bueno..."
          />
        </div>

        <div className="form-group" style={{ minWidth: 180 }}>
          <label className="form-label">Tipo de Negócio</label>
          <select className="input" value={type} onChange={e => setType(e.target.value)}>
            <option value="">Todos os nichos</option>
            {NICHE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
            ))}
          </select>
        </div>

        <div style={{ alignSelf: 'end' }}>
          <button
            type="submit"
            disabled={isLoading || !selectedCidade}
            className="btn btn-primary"
            style={{ width: '100%', height: 36, justifyContent: 'center', fontSize: 13 }}
          >
            {isLoading
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Buscando…</>
              : <><Search size={13} /> Buscar</>
            }
          </button>
        </div>
      </div>
    </form>
  );
};

export default MapSearch;
