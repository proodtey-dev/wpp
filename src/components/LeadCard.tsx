import React from 'react';
import { Star, MapPin, Phone, MessageSquare, Map } from 'lucide-react';
import { formatPhone, DEFAULT_MESSAGE } from '../lib/utils';

interface LeadCardProps {
  lead: any;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onSave?: () => void;
  onSend?: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, selected, onSelect, onSave, onSend }) => {
  const cleanPhone = (lead.phone || '').replace(/\D/g, '');
  const filledMessage = DEFAULT_MESSAGE.replace(/{nome}/g, lead.name);
  const waUrl = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(filledMessage)}` : null;

  // URL do Google Maps: usa placeId se disponível, senão busca por nome+endereço
  const mapsUrl = lead.placeId && !lead.placeId.startsWith('place-') && !lead.placeId.startsWith('gen-')
    ? `https://www.google.com/maps/place/?q=place_id:${lead.placeId}`
    : `https://www.google.com/maps/search/${encodeURIComponent(`${lead.name} ${lead.address || ''}`)}`;

  return (
    <div
      className={`lead-card ${selected ? 'selected' : ''}`}
      id={`lead-card-${lead.id}`}
    >
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={e => onSelect(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: 'var(--green)', cursor: 'pointer' }}
        />
      </div>

      <div style={{ paddingRight: 28, marginBottom: 8 }}>
        <div className="lead-card-name">{lead.emoji || '💼'} {lead.name}</div>
        <div className="lead-card-type">{lead.type || lead.category}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {lead.rating > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>
            <Star size={11} fill="currentColor" /> {lead.rating}
          </span>
        )}
        {lead.reviews > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>({lead.reviews} avaliações)</span>
        )}
        {!lead.hasWebsite && (
          <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: 10 }}>⚡ Sem site</span>
        )}
      </div>

      <div className="lead-card-row">
        <MapPin size={11} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.address}</span>
      </div>
      <div className="lead-card-row">
        <Phone size={11} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
        <span>{formatPhone(lead.phone || 'Sem telefone')}</span>
      </div>

      <div className="lead-card-footer">
        {/* Botão Ver no Maps */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          title="Ver no Google Maps"
          style={{ flexShrink: 0, paddingLeft: 10, paddingRight: 10 }}
        >
          <Map size={12} />
        </a>

        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <MessageSquare size={12} /> Chamar no Wpp
          </a>
        ) : (
          <button
            onClick={onSend}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <MessageSquare size={12} /> Enviar Proposta
          </button>
        )}
      </div>
    </div>
  );
};

export default LeadCard;

