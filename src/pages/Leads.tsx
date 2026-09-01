import React, { useState, useEffect } from 'react';
import { Users, Send, Search as SearchIcon, Filter, Plus, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadTable from '../components/LeadTable';
import CampaignModal from '../components/CampaignModal';
import { getLeads, deleteLead as deleteLeadApi, updateLead as updateLeadApi } from '../lib/api';

const statusTabs = [
  { id: 'todos', label: 'Todos os Leads' },
  { id: 'novo', label: 'Novos' },
  { id: 'contatado', label: 'Contatados' },
  { id: 'respondeu', label: 'Responderam' },
  { id: 'convertido', label: 'Convertidos' }
];

const Leads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadsToMsg, setLeadsToMsg] = useState<any[]>([]);

  const loadRealLeads = () => {
    setLoading(true);
    getLeads().then(data => {
      if (Array.isArray(data)) {
        setLeads(data);
      } else {
        setLeads([]);
      }
    }).catch(() => {
      setLeads([]);
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadRealLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesTab = activeTab === 'todos' || lead.status === activeTab;
    const matchesSearch = (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (lead.phone && lead.phone.includes(searchTerm));
    return matchesTab && matchesSearch;
  });

  const handleSelect = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredLeads.map(l => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      await deleteLeadApi(id).catch(() => {});
      setLeads(prev => prev.filter(l => l.id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Tem certeza que deseja excluir ${selectedIds.length} leads?`)) {
      for (const id of selectedIds) {
        await deleteLeadApi(id).catch(() => {});
      }
      setLeads(prev => prev.filter(l => !selectedIds.includes(l.id)));
      setSelectedIds([]);
    }
  };

  const openCampaignModal = (leadsList: any[]) => {
    setLeadsToMsg(leadsList);
    setIsModalOpen(true);
  };

  const handleCampaignSend = async (name: string, msg: string) => {
    const ids = leadsToMsg.map(l => l.id);
    for (const lead of leadsToMsg) {
      if (lead.id) {
        await updateLeadApi(lead.id, { status: 'contatado' }).catch(() => {});
      }
    }
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: 'contatado' } : l));
    alert(`Mensagem enviada para ${leadsToMsg.length} leads!`);
    setSelectedIds([]);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Meus Leads Salvos</h1>
          <p className="text-[rgba(255,255,255,0.6)]">Gerencie seus contatos do banco de dados SQLite real.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[rgba(255,255,255,0.02)] p-2 rounded-xl border border-[rgba(255,255,255,0.05)]">
          <div className="px-4 py-2 text-center border-r border-[rgba(255,255,255,0.08)]">
            <div className="text-xl font-bold text-white">{leads.length}</div>
            <div className="text-[10px] text-[rgba(255,255,255,0.5)] uppercase tracking-wider">Total</div>
          </div>
          <div className="px-4 py-2 text-center border-r border-[rgba(255,255,255,0.08)]">
            <div className="text-xl font-bold text-[#3B82F6]">{leads.filter(l => l.status === 'novo').length}</div>
            <div className="text-[10px] text-[rgba(255,255,255,0.5)] uppercase tracking-wider">Novos</div>
          </div>
          <div className="px-4 py-2 text-center">
            <div className="text-xl font-bold text-[#22C55E]">{leads.filter(l => l.status === 'respondeu' || l.status === 'convertido').length}</div>
            <div className="text-[10px] text-[rgba(255,255,255,0.5)] uppercase tracking-wider">Ativos</div>
          </div>
        </div>
      </div>

      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden mb-6">
        <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar gap-2">
            {statusTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-[rgba(255,255,255,0.1)] text-white' 
                    : 'text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={16} className="text-[rgba(255,255,255,0.4)]" />
            </div>
            <input
              type="text"
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-[#25D366] transition-all"
            />
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="bg-[rgba(37,211,102,0.1)] px-4 py-3 flex items-center justify-between border-b border-[rgba(37,211,102,0.2)]">
            <span className="text-sm font-medium text-[#25D366]">
              {selectedIds.length} lead(s) selecionado(s)
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleBulkDelete}
                className="px-3 py-1.5 text-xs rounded bg-[rgba(239,68,68,0.1)] text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-colors"
              >
                Excluir
              </button>
              <button 
                onClick={() => openCampaignModal(filteredLeads.filter(l => selectedIds.includes(l.id)))}
                className="px-3 py-1.5 text-xs rounded bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors flex items-center gap-1 shadow-sm font-bold"
              >
                <Send size={14} /> Enviar WhatsApp
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm text-[rgba(255,255,255,0.5)]">
            Carregando banco de dados...
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center">
            <Target size={48} className="mx-auto text-[rgba(255,255,255,0.2)] mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Nenhum lead salvo ainda</h3>
            <p className="text-sm text-[rgba(255,255,255,0.5)] max-w-md mx-auto mb-6">
              Vá na aba de prospecção, busque empresas sem site na sua região e clique em "Salvar Leads" para construir sua lista real.
            </p>
            <button
              onClick={() => navigate('/prospector')}
              className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)] inline-flex items-center gap-2"
            >
              <Plus size={16} /> Prospectar Novas Empresas
            </button>
          </div>
        ) : (
          <LeadTable 
            leads={filteredLeads}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onDelete={handleDelete}
            onSend={(lead) => openCampaignModal([lead])}
          />
        )}
      </div>

      <CampaignModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedLeads={leadsToMsg}
        onSend={handleCampaignSend}
      />
    </div>
  );
};

export default Leads;
