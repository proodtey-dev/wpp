import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import WhatsAppPreview from './WhatsAppPreview';
import { DEFAULT_MESSAGE } from '../lib/utils';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: any[];
  onSend: (campaignName: string, message: string, templateName?: string) => Promise<void>;
}

const CampaignModal: React.FC<CampaignModalProps> = ({ isOpen, onClose, selectedLeads, onSend }) => {
  const [name, setName] = useState('Campanha Prospector - ' + new Date().toLocaleDateString('pt-BR'));
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [selectedTemplate, setSelectedTemplate] = useState('auto');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onSend(name, message, selectedTemplate);
      onClose();
    } catch (e) {
      console.error('Erro ao enviar modal:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const previewName = selectedLeads[0]?.name || 'Nome do Comércio';

  return (
    <div className="modal-overlay" id="campaign-modal">
      <div className="modal" style={{ maxWidth: 700 }}>
        
        <div className="modal-header">
          <span className="modal-title">Disparar Campanha WhatsApp</span>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 20 }}>
          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Send size={14} /> Enviando para {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selecionado{selectedLeads.length > 1 ? 's' : ''}
            </div>

            <div className="form-group">
              <label className="form-label">Template de Envio na Meta (WhatsApp)</label>
              <select
                className="input"
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value)}
                style={{ fontSize: 12 }}
              >
                <option value="auto">⚡ Seleção Automática por Nicho (Recomendado)</option>
                <option value="arquiteto">🏛️ arquiteto (Arquitetura, Engenharia, Reformas)</option>
                <option value="contabilidade">📊 contabilidade (Escritórios Contábeis)</option>
                <option value="odonto">🦷 odonto (Dentistas & Odontologia)</option>
                <option value="advocacia">⚖️ advocacia (Advogados & Escritórios)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nome da Campanha</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Proposta Dentistas"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mensagem da Proposta</label>
              <textarea
                className="input textarea"
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{ minHeight: 140, fontSize: 12 }}
                placeholder="Digite a mensagem..."
              />
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: 'var(--bg-4)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 600 }}>Pré-visualização</span>
            <WhatsAppPreview message={message} businessName={previewName} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || !message.trim() || selectedLeads.length === 0}
            className="btn btn-primary"
          >
            {isLoading ? (
              <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enviando…</>
            ) : (
              <><Send size={14} /> Confirmar Disparo ({selectedLeads.length})</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignModal;
