import React, { useState, useEffect } from 'react';
import { Key, MessageSquare, Save, CheckCircle2, XCircle, Eye, EyeOff, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';
import { DEFAULT_MESSAGE } from '../lib/utils';
import { getSettings, updateSettings, testWhatsAppApi } from '../lib/api';

const Settings = () => {
  const [googleKey, setGoogleKey] = useState('');
  const [showGoogle, setShowGoogle] = useState(false);
  const [whatsappToken, setWhatsappToken] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [showWa, setShowWa] = useState(false);
  const [waStatus, setWaStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [template, setTemplate] = useState(DEFAULT_MESSAGE);
  const [toast, setToast] = useState('');

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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleTestWa = async () => {
    setWaStatus('testing');
    try {
      const res = await testWhatsAppApi().catch(() => null);
      setWaStatus(res?.success ? 'success' : 'error');
    } catch {
      setWaStatus('error');
    }
  };

  const handleSaveAll = async () => {
    await updateSettings({
      googleMapsApiKey: googleKey,
      whatsappToken,
      whatsappPhoneNumberId: phoneId,
      whatsappWabaId: wabaId,
      defaultMessage: template
    }).catch(() => {});
    showToast('Configurações salvas com sucesso!');
  };

  const SectionCard = ({ children, accent }: { children: React.ReactNode; accent?: string }) => (
    <div className="card" style={{ padding: 24, borderColor: accent ? `${accent}30` : undefined }}>
      {children}
    </div>
  );

  const SectionHeader = ({ icon, title, subtitle, iconBg }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{subtitle}</div>
      </div>
    </div>
  );

  return (
    <div>
      {toast && (
        <div className="toast success">
          <CheckCircle2 size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
          {toast}
        </div>
      )}

      <div className="page-header" style={{ paddingBottom: 24 }}>
        <div className="page-eyebrow"><SettingsIcon size={12} /> Sistema</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Configurações</h1>
            <p className="page-subtitle">Credenciais das APIs e template de mensagem.</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleSaveAll}>
            <Save size={15} /> Salvar Tudo
          </button>
        </div>
      </div>

      <div style={{ padding: '0 32px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>

        {/* WhatsApp API */}
        <SectionCard accent="var(--green)">
          <SectionHeader
            icon={<ShieldCheck size={18} style={{ color: 'var(--green)' }} />}
            iconBg="var(--green-dim)"
            title="WhatsApp Business Cloud API"
            subtitle="Credenciais geradas no Meta for Developers"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Phone Number ID</label>
              <input
                className="input"
                type="text"
                value={phoneId}
                onChange={e => setPhoneId(e.target.value)}
                placeholder="Ex: 1280543321810380"
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Token de Acesso (Access Token)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    className="input"
                    type={showWa ? 'text' : 'password'}
                    value={whatsappToken}
                    onChange={e => setWhatsappToken(e.target.value)}
                    placeholder="EAAxxxxxxx..."
                    style={{ fontFamily: 'monospace', fontSize: 12, paddingRight: 36 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowWa(!showWa)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
                  >
                    {showWa ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button className="btn btn-secondary" onClick={handleTestWa} style={{ flexShrink: 0 }}>
                  {waStatus === 'testing' ? 'Testando…' : 'Testar'}
                </button>
              </div>
              {waStatus === 'success' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--green)', marginTop: 4 }}>
                  <CheckCircle2 size={13} /> API conectada com sucesso!
                </div>
              )}
              {waStatus === 'error' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--red)', marginTop: 4 }}>
                  <XCircle size={13} /> Falha — verifique o Token e o Phone Number ID.
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">WABA ID (WhatsApp Business Account ID) — Opcional</label>
              <input
                className="input"
                type="text"
                value={wabaId}
                onChange={e => setWabaId(e.target.value)}
                placeholder="Ex: 1394332478791215"
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>
          </div>
        </SectionCard>

        {/* Google Maps API */}
        <SectionCard>
          <SectionHeader
            icon={<Key size={18} style={{ color: 'var(--blue)' }} />}
            iconBg="rgba(59,130,246,0.12)"
            title="Google Maps API"
            subtitle="Opcional — sem chave, usa busca gratuita via OpenStreetMap"
          />
          <div className="form-group">
            <label className="form-label">API Key</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showGoogle ? 'text' : 'password'}
                value={googleKey}
                onChange={e => setGoogleKey(e.target.value)}
                placeholder="AIzaSyB..."
                style={{ fontFamily: 'monospace', fontSize: 12, paddingRight: 36 }}
              />
              <button
                type="button"
                onClick={() => setShowGoogle(!showGoogle)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
              >
                {showGoogle ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Template */}
        <SectionCard>
          <SectionHeader
            icon={<MessageSquare size={18} style={{ color: '#f59e0b' }} />}
            iconBg="rgba(245,158,11,0.12)"
            title="Template de Mensagem Padrão"
            subtitle="Pré-carregado ao enviar propostas via campanha"
          />
          <div className="form-group">
            <label className="form-label">Mensagem</label>
            <textarea
              className="input textarea"
              value={template}
              onChange={e => setTemplate(e.target.value)}
              style={{ minHeight: 120, fontSize: 13 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', color: 'var(--green)' }}>{'{nome}'}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>= Nome da empresa prospectada</span>
            </div>
          </div>
        </SectionCard>

        <button className="btn btn-primary btn-lg" onClick={handleSaveAll} style={{ width: '100%', justifyContent: 'center' }}>
          <Save size={16} /> Salvar Configurações
        </button>
      </div>
    </div>
  );
};

export default Settings;
