import React from 'react';
import { Send, Trash2, Edit } from 'lucide-react';
import { formatPhone } from '../lib/utils';

interface LeadTableProps {
  leads: any[];
  onEdit?: (lead: any) => void;
  onDelete?: (id: number) => void;
  onSend?: (lead: any) => void;
  selectedIds: number[];
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

const statusColors: Record<string, { bg: string, text: string }> = {
  'novo': { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6' },
  'contatado': { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B' },
  'respondeu': { bg: 'rgba(34,197,94,0.1)', text: '#22C55E' },
  'convertido': { bg: 'rgba(139,92,246,0.1)', text: '#8B5CF6' },
  'ignorado': { bg: 'rgba(107,114,128,0.1)', text: '#9CA3AF' }
};

const LeadTable: React.FC<LeadTableProps> = ({ 
  leads, onEdit, onDelete, onSend, selectedIds, onSelect, onSelectAll 
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12121a]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.08)]">
            <th className="p-4 w-12">
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-[#25D366] cursor-pointer"
                checked={leads.length > 0 && selectedIds.length === leads.length}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </th>
            <th className="p-4 text-xs font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider">Nome do Comércio</th>
            <th className="p-4 text-xs font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider">Contato</th>
            <th className="p-4 text-xs font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider">Avaliação</th>
            <th className="p-4 text-xs font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider">Status</th>
            <th className="p-4 text-xs font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, idx) => (
            <tr 
              key={lead.id} 
              className={`border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[rgba(0,0,0,0.1)]'}`}
            >
              <td className="p-4">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-[#25D366] cursor-pointer"
                  checked={selectedIds.includes(lead.id)}
                  onChange={(e) => onSelect(lead.id, e.target.checked)}
                />
              </td>
              <td className="p-4">
                <div className="font-medium text-white">{lead.name}</div>
                <div className="text-xs text-[rgba(255,255,255,0.5)] capitalize">{lead.type}</div>
              </td>
              <td className="p-4">
                <div className="text-sm text-white">{formatPhone(lead.phone)}</div>
                <div className="text-xs text-[rgba(255,255,255,0.5)] max-w-[200px] truncate">{lead.address}</div>
              </td>
              <td className="p-4">
                <div className="text-sm text-yellow-500 font-medium">{lead.rating} ★</div>
                <div className="text-xs text-[rgba(255,255,255,0.5)]">{lead.reviews} rev.</div>
              </td>
              <td className="p-4">
                <span 
                  className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                  style={{ 
                    backgroundColor: statusColors[lead.status || 'novo']?.bg, 
                    color: statusColors[lead.status || 'novo']?.text 
                  }}
                >
                  {lead.status || 'Novo'}
                </span>
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => onSend && onSend(lead)}
                    className="p-1.5 rounded bg-[rgba(37,211,102,0.1)] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
                    title="Enviar WhatsApp"
                  >
                    <Send size={16} />
                  </button>
                  <button 
                    onClick={() => onEdit && onEdit(lead)}
                    className="p-1.5 rounded bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete && onDelete(lead.id)}
                    className="p-1.5 rounded bg-[rgba(239,68,68,0.1)] text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-[rgba(255,255,255,0.5)]">
                Nenhum lead encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeadTable;
