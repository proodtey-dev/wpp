import React from 'react';
import { Star, MapPin, Phone, Globe, Save, MessageSquare } from 'lucide-react';
import { formatPhone, DEFAULT_MESSAGE } from '../lib/utils';

interface LeadCardProps {
  lead: any;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onSave?: () => void;
  onSend?: () => void;
}

const statusColors: Record<string, string> = {
  'novo': '#3B82F6',
  'contatado': '#F59E0B',
  'respondeu': '#22C55E',
  'convertido': '#8B5CF6',
  'ignorado': '#6B7280'
};

const LeadCard: React.FC<LeadCardProps> = ({ lead, selected, onSelect, onSave, onSend }) => {
  const cleanPhone = (lead.phone || '').replace(/\D/g, '');
  const filledMessage = DEFAULT_MESSAGE.replace(/{nome}/g, lead.name);
  const waUrl = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(filledMessage)}` : null;

  return (
    <div 
      className={`relative bg-[rgba(255,255,255,0.03)] backdrop-blur-sm rounded-2xl p-5 border transition-all duration-300 hover:bg-[rgba(255,255,255,0.05)] hover:scale-[1.01] ${selected ? 'border-[#25D366] shadow-[0_0_20px_rgba(37,211,102,0.15)] bg-[rgba(37,211,102,0.02)]' : 'border-[rgba(255,255,255,0.08)]'}`}
      id={`lead-card-${lead.id}`}
    >
      <div className="absolute top-4 right-4">
        <input 
          type="checkbox" 
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-5 h-5 accent-[#25D366] cursor-pointer"
        />
      </div>

      <div className="flex items-start gap-3 mb-3 pr-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{lead.emoji || '💼'}</span>
            <h3 className="text-base font-bold text-white line-clamp-1">{lead.name}</h3>
            {lead.status && (
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: statusColors[lead.status] || '#3B82F6' }}
                title={`Status: ${lead.status}`}
              />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-yellow-500 font-bold">
              <Star size={13} fill="currentColor" />
              {lead.rating}
            </span>
            <span className="text-[rgba(255,255,255,0.4)]">({lead.reviews} avaliações)</span>
            <span className="px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.08)] text-[11px] text-white font-medium">
              {lead.type}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.7)]">
          <MapPin size={13} className="text-[rgba(255,255,255,0.4)] flex-shrink-0" />
          <span className="line-clamp-1">{lead.address}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.7)]">
          <Phone size={13} className="text-[rgba(255,255,255,0.4)] flex-shrink-0" />
          <span>{formatPhone(lead.phone || 'Sem telefone')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Globe size={13} className="text-[rgba(255,255,255,0.4)] flex-shrink-0" />
          {lead.hasWebsite ? (
            <span className="text-[rgba(255,255,255,0.5)]">Possui site</span>
          ) : (
            <span className="text-[#25D366] font-semibold bg-[rgba(37,211,102,0.12)] px-2 py-0.5 rounded text-[11px] border border-[rgba(37,211,102,0.2)]">
              ⚡ Sem website (Oportunidade)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.08)]">
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(37,211,102,0.25)]"
          >
            <MessageSquare size={14} /> Chamar no Wpp
          </a>
        ) : (
          <button 
            onClick={onSend}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold transition-all"
          >
            <MessageSquare size={14} /> Enviar Proposta
          </button>
        )}
      </div>
    </div>
  );
};

export default LeadCard;
