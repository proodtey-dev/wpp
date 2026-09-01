import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import WhatsAppPreview from './WhatsAppPreview';
import { DEFAULT_MESSAGE } from '../lib/utils';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: any[];
  onSend: (campaignName: string, message: string) => Promise<void>;
}

const CampaignModal: React.FC<CampaignModalProps> = ({ isOpen, onClose, selectedLeads, onSend }) => {
  const [name, setName] = useState('Campanha Prospector - ' + new Date().toLocaleDateString('pt-BR'));
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    setIsLoading(true);
    try {
      await onSend(name, message);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const previewName = selectedLeads[0]?.name || 'Nome do Comércio';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="campaign-modal">
      <div className="bg-[#12121a] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.08)]">
          <h2 className="text-xl font-bold text-white">Nova Campanha WhatsApp</h2>
          <button onClick={onClose} className="text-[rgba(255,255,255,0.5)] hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Form Side */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-[rgba(255,255,255,0.08)] space-y-6">
            <div className="bg-[rgba(37,211,102,0.1)] text-[#25D366] px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
              <Send size={16} />
              Enviando para {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selecionado{selectedLeads.length > 1 ? 's' : ''}
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgba(255,255,255,0.7)] mb-2">Nome da Campanha</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 text-white outline-none focus:border-[#25D366] transition-colors"
                placeholder="Ex: Contatos Restaurantes Centro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgba(255,255,255,0.7)] mb-2">Mensagem</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 text-white outline-none focus:border-[#25D366] transition-colors h-48 resize-none"
                placeholder="Digite sua mensagem..."
              />
              <p className="mt-2 text-xs text-[rgba(255,255,255,0.5)]">
                Dica: Use <strong className="text-white">{`{nome}`}</strong> para inserir o nome do comércio dinamicamente.
              </p>
            </div>
          </div>

          {/* Preview Side */}
          <div className="flex-1 p-6 bg-[#0a0a0f] flex flex-col items-center justify-center relative">
            <div className="w-full max-w-sm">
              <h3 className="text-sm font-medium text-[rgba(255,255,255,0.5)] mb-4 text-center">Pré-visualização</h3>
              <WhatsAppPreview message={message} businessName={previewName} />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[rgba(255,255,255,0.08)] bg-[#12121a] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSend}
            disabled={isLoading || !message.trim() || selectedLeads.length === 0}
            className="px-6 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#128C7E] text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,211,102,0.2)]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Send size={18} /> Enviar Campanha</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignModal;
