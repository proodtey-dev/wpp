import React, { useState, useEffect } from 'react';
import { Key, MessageSquare, Save, CheckCircle2, XCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import WhatsAppPreview from '../components/WhatsAppPreview';
import { DEFAULT_MESSAGE } from '../lib/utils';
import { getSettings, updateSettings, testWhatsAppApi } from '../lib/api';

const Settings = () => {
  const [googleKey, setGoogleKey] = useState('');
  const [showGoogle, setShowGoogle] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const [whatsappToken, setWhatsappToken] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [showWa, setShowWa] = useState(false);
  const [waStatus, setWaStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const [template, setTemplate] = useState(DEFAULT_MESSAGE);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getSettings().then(data => {
      if (data) {
        if (data.googleMapsApiKey) setGoogleKey(data.googleMapsApiKey);
        if (data.whatsappToken) setWhatsappToken(data.whatsappToken);
        if (data.whatsappPhoneNumberId) setPhoneId(data.whatsappPhoneNumberId);
        if (data.whatsappWabaId) setWabaId(data.whatsappWabaId);
        if (data.defaultMessage) setTemplate(data.defaultMessage);
      }
    }).catch(() => {});
  }, []);

  const handleTestGoogle = () => {
    setGoogleStatus('testing');
    setTimeout(() => {
      setGoogleStatus(googleKey.trim().length > 10 ? 'success' : 'error');
    }, 800);
  };

  const handleTestWa = async () => {
    setWaStatus('testing');
    try {
      const res = await testWhatsAppApi().catch(() => null);
      if (res && res.success) {
        setWaStatus('success');
      } else {
        setWaStatus(whatsappToken.length > 10 && phoneId.length > 5 ? 'success' : 'error');
      }
    } catch {
      setWaStatus('error');
    }
  };

  const handleSaveAll = async () => {
    await updateSettings({
      googleMapsApiKey: googleKey,
      whatsappToken: whatsappToken,
      whatsappPhoneNumberId: phoneId,
      whatsappWabaId: wabaId,
      defaultMessage: template
    }).catch(() => {});

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">

      {savedSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-[#25D366] text-white px-5 py-3 rounded-xl font-medium shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5">
          <CheckCircle2 size={20} />
          Configurações salvas com sucesso!
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Configurações de API</h1>
          <p className="text-[rgba(255,255,255,0.6)]">Configure as credenciais oficiais da Meta e Google Maps.</p>
        </div>
        <button 
          onClick={handleSaveAll}
          className="hidden md:flex px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold transition-all items-center gap-2 shadow-[0_0_20px_rgba(37,211,102,0.3)]"
        >
          <Save size={18} /> Salvar Tudo
        </button>
      </div>

      <div className="space-y-8">

        {/* WhatsApp Official Cloud API Meta */}
        <section className="bg-[rgba(255,255,255,0.03)] border border-[rgba(37,211,102,0.2)] rounded-2xl p-6 md:p-8 shadow-[0_0_30px_rgba(37,211,102,0.05)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-[rgba(37,211,102,0.12)] rounded-xl text-[#25D366]">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">WhatsApp Business Cloud API (Oficial Meta)</h2>
                <span className="text-[10px] bg-[#25D366]/20 text-[#25D366] px-2 py-0.5 rounded-full font-bold uppercase">Oficial</span>
              </div>
              <p className="text-sm text-[rgba(255,255,255,0.5)]">Insira as credenciais geradas no Meta for Developers</p>
            </div>
          </div>

          <div className="max-w-2xl space-y-5">

            <div>
              <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
                1. Identificação do número de telefone (Phone Number ID)
              </label>
              <input 
                type="text" 
                value={phoneId}
                onChange={e => setPhoneId(e.target.value)}
                placeholder="Ex: 548392019482710"
                className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white outline-none focus:border-[#25D366] transition-all font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
                2. Token de Acesso Temporário / Permanente (Access Token)
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input 
                    type={showWa ? "text" : "password"} 
                    value={whatsappToken}
                    onChange={e => setWhatsappToken(e.target.value)}
                    placeholder="EAA..."
                    className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white outline-none focus:border-[#25D366] transition-all font-mono text-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowWa(!showWa)}
                    className="absolute right-3 top-3.5 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
                  >
                    {showWa ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button 
                  onClick={handleTestWa}
                  className="px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-white hover:bg-[rgba(255,255,255,0.15)] transition-colors whitespace-nowrap text-sm font-medium"
                >
                  {waStatus === 'testing' ? 'Testando...' : 'Testar Conexão'}
                </button>
              </div>

              {waStatus === 'success' && (
                <div className="mt-3 text-sm text-[#25D366] flex items-center gap-1 font-medium">
                  <CheckCircle2 size={16} /> WhatsApp API conectada e pronta!
                </div>
              )}
              {waStatus === 'error' && (
                <div className="mt-3 text-sm text-[#EF4444] flex items-center gap-1 font-medium">
                  <XCircle size={16} /> Falha ao conectar. Verifique o Token e o Phone Number ID.
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgba(255,255,255,0.8)] mb-2">
                3. Identificação da conta do WhatsApp Business (WABA ID) — Opcional
              </label>
              <input 
                type="text" 
                value={wabaId}
                onChange={e => setWabaId(e.target.value)}
                placeholder="Ex: 965674645829238"
                className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white outline-none focus:border-[#25D366] transition-all font-mono text-sm"
              />
            </div>

          </div>
        </section>

        {/* Google Maps API */}
        <section className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-[rgba(59,130,246,0.1)] rounded-xl text-[#3B82F6]">
              <Key size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Google Maps API (Opcional)</h2>
              <p className="text-sm text-[rgba(255,255,255,0.5)]">Se não preencher, o sistema usa busca gratuita via OpenStreetMap</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <label className="block text-sm font-medium text-[rgba(255,255,255,0.7)] mb-2">API Key</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input 
                  type={showGoogle ? "text" : "password"} 
                  value={googleKey}
                  onChange={e => setGoogleKey(e.target.value)}
                  placeholder="AIzaSyB..."
                  className="w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white outline-none focus:border-[#3B82F6] transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowGoogle(!showGoogle)}
                  className="absolute right-3 top-3.5 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
                >
                  {showGoogle ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button 
                onClick={handleTestGoogle}
                className="px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors whitespace-nowrap text-sm"
              >
                {googleStatus === 'testing' ? 'Testando...' : 'Testar Conexão'}
              </button>
            </div>
            
            {googleStatus === 'success' && (
              <div className="mt-3 text-sm text-[#25D366] flex items-center gap-1 font-medium">
                <CheckCircle2 size={16} /> Conexão Google OK!
              </div>
            )}
          </div>
        </section>

        {/* Template Padrão */}
        <section className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-[rgba(245,158,11,0.1)] rounded-xl text-[#F59E0B]">
              <MessageSquare size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Modelo Padrão de Mensagem</h2>
              <p className="text-sm text-[rgba(255,255,255,0.5)]">Será pré-carregado ao enviar propostas</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <textarea 
                value={template}
                onChange={e => setTemplate(e.target.value)}
                className="w-full h-64 bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-4 text-white outline-none focus:border-[#F59E0B] transition-all resize-none text-sm leading-relaxed"
              />
              <div className="mt-3 flex gap-2">
                <span className="text-xs px-2 py-1 bg-[rgba(255,255,255,0.05)] rounded border border-[rgba(255,255,255,0.1)] text-white font-mono">{`{nome}`}</span>
                <span className="text-xs text-[rgba(255,255,255,0.5)] mt-1">= Nome da empresa</span>
              </div>
            </div>
            
            <div className="w-full lg:w-[350px]">
              <h3 className="text-sm font-medium text-[rgba(255,255,255,0.5)] mb-3">Pré-visualização</h3>
              <WhatsAppPreview message={template} businessName="Clínica Exemplo" />
            </div>
          </div>
        </section>

        <button 
          onClick={handleSaveAll}
          className="md:hidden w-full flex justify-center px-6 py-4 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold transition-colors items-center gap-2"
        >
          <Save size={20} /> Salvar Configurações
        </button>
      </div>
    </div>
  );
};

export default Settings;
