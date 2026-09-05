import React, { useState, useEffect } from 'react';
import { Key, MessageSquare, Save, CheckCircle2, XCircle, Eye, EyeOff, ShieldCheck, Settings as SettingsIcon, RefreshCw, Bell, Smartphone, Share2, PlusSquare, Send, Check } from 'lucide-react';
import { DEFAULT_MESSAGE } from '../lib/utils';
import { getSettings, updateSettings, testWhatsAppApi } from '../lib/api';
import { checkPushStatus, subscribeUserToPush, sendTestPush } from '../lib/push';

const Settings = () => {
  const [googleKey, setGoogleKey] = useState('');
  const [showGoogle, setShowGoogle] = useState(false);
  const [whatsappToken, setWhatsappToken] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [templateName, setTemplateName] = useState('proposta_site_v1');
  const [showWa, setShowWa] = useState(false);
  const [waStatus, setWaStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [template, setTemplate] = useState(DEFAULT_MESSAGE);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [aiTone, setAiTone] = useState('consultivo e focado em converter');
  const [showAiKey, setShowAiKey] = useState(false);
  const [toast, setToast] = useState('');
  const [metaTemplates, setMetaTemplates] = useState<{name: string; status: string; language: string}[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [pushInfo, setPushInfo] = useState({
    isSupported: false,
    permission: 'default' as NotificationPermission,
    isSubscribed: false,
    isStandalone: false,
    isIOS: false
  });
  const [activatingPush, setActivatingPush] = useState(false);

  useEffect(() => {
    getSettings().then(data => {
      if (data) {
        if (data.googleMapsApiKey) setGoogleKey(data.googleMapsApiKey);
        if (data.whatsappToken) setWhatsappToken(data.whatsappToken);
        if (data.whatsappPhoneNumberId) setPhoneId(data.whatsappPhoneNumberId);
        if (data.whatsappWabaId) setWabaId(data.whatsappWabaId);
        if (data.defaultMessage) setTemplate(data.defaultMessage);
        if (data.defaultTemplateName) setTemplateName(data.defaultTemplateName);
        if (data.openaiApiKey) setOpenaiApiKey(data.openaiApiKey);
        if (data.aiTone) setAiTone(data.aiTone);
      }
    }).catch(() => {});

    refreshPushStatus();
  }, []);

  const refreshPushStatus = async () => {
    const status = await checkPushStatus();
    setPushInfo(status);
  };

  const handleEnablePush = async () => {
    setActivatingPush(true);
    try {
      const res = await subscribeUserToPush();
      showToast(res.message);
      await refreshPushStatus();
    } catch (e: any) {
      showToast(e.message || 'Erro ao ativar notificações');
    } finally {
      setActivatingPush(false);
    }
  };

  const handleTestPushClick = async () => {
    const res = await sendTestPush();
    showToast(res.message);
  };

  const fetchMetaTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/settings/debug-meta').then(r => r.json());
      const templates = res.metaResponse?.data || [];
      setMetaTemplates(templates);
      if (templates.length === 0) {
        showToast('Nenhum template encontrado — verifique seu Token e WABA ID.');
      }
    } catch {
      showToast('Erro ao buscar templates da Meta.');
    } finally {
      setLoadingTemplates(false);
    }
  };

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
      defaultTemplateName: templateName,
      defaultMessage: template,
      openaiApiKey,
      aiTone
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
              <label className="form-label">WABA ID (WhatsApp Business Account ID)</label>
              <input
                className="input"
                type="text"
                value={wabaId}
                onChange={e => setWabaId(e.target.value)}
                placeholder="Ex: 1394332478791215"
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nome do Template Aprovado na Meta</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="Ex: proposta_site_v1"
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={fetchMetaTemplates}
                  disabled={loadingTemplates}
                  style={{ flexShrink: 0, gap: 6 }}
                  title="Buscar templates reais da sua conta Meta"
                >
                  <RefreshCw size={14} style={{ animation: loadingTemplates ? 'spin 1s linear infinite' : 'none' }} />
                  {loadingTemplates ? 'Buscando…' : 'Ver Templates'}
                </button>
              </div>
              {metaTemplates.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Templates aprovados na sua conta — clique para selecionar:</div>
                  {metaTemplates.map(t => (
                    <div
                      key={t.name}
                      onClick={() => setTemplateName(t.name)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                        background: templateName === t.name ? 'var(--green-dim)' : 'var(--bg-3)',
                        border: `1px solid ${templateName === t.name ? 'var(--green)' : 'var(--border)'}`,
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text)' }}>{t.name}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.language}</span>
                        <span style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 4,
                          background: t.status === 'APPROVED' ? 'var(--green-dim)' : 'rgba(245,158,11,0.12)',
                          color: t.status === 'APPROVED' ? 'var(--green)' : '#f59e0b'
                        }}>{t.status}</span>
                        {templateName === t.name && <CheckCircle2 size={13} style={{ color: 'var(--green)' }} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Agente de Inteligência por IA (Estilo Comp AI) */}
        <SectionCard accent="#a855f7">
          <SectionHeader
            icon={<Zap size={18} style={{ color: '#a855f7' }} />}
            iconBg="rgba(168,85,247,0.12)"
            title="Agente de Inteligência e Prospecção por IA (Comp AI Style)"
            subtitle="Geração de Pitches Personalizados e Copiloto de Vendas no Chat"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Chave da API de IA (OpenAI / Groq)</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showAiKey ? 'text' : 'password'}
                  value={openaiApiKey}
                  onChange={e => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-... ou gsk_... (Deixe em branco para usar o gerador gratuito)"
                  style={{ fontFamily: 'monospace', fontSize: 12, paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowAiKey(!showAiKey)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
                >
                  {showAiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                Aceita chaves da OpenAI (sk-...) ou chaves gratúitas e ultra-rápidas da Groq (gsk_...).
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tom de Voz da IA para Abordagem</label>
              <select
                className="input"
                value={aiTone}
                onChange={e => setAiTone(e.target.value)}
                style={{ fontSize: 13 }}
              >
                <option value="consultivo e focado em converter">🎯 Consultivo & Focado em Vendas (Recomendado)</option>
                <option value="direto, curto e sem rodeios">⚡ Direto & Rápido</option>
                <option value="amigável e informal">💬 Amigável & Informal</option>
                <option value="formal e corporativo">💼 Formal & Corporativo</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Notificações Push (iPhone & Android PWA) */}
        <SectionCard accent="#22c55e">
          <SectionHeader
            icon={<Bell size={18} style={{ color: 'var(--green)' }} />}
            iconBg="var(--green-dim)"
            title="Notificações Push no Celular (iPhone & Android)"
            subtitle="Receba alertas com som quando clientes responderem no WhatsApp"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Passos para iPhone se não estiver na tela de início */}
            {pushInfo.isIOS && !pushInfo.isStandalone && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.06)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: 12,
                padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, color: 'var(--green)', marginBottom: 8 }}>
                  <Smartphone size={16} /> Como instalar no iPhone (iOS):
                </div>
                <ol style={{ paddingLeft: 18, fontSize: 12, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.5 }}>
                  <li>No Safari do iPhone, toque no botão <strong>Compartilhar <Share2 size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></strong> (rodapé).</li>
                  <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início" <PlusSquare size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></strong>.</li>
                  <li>Abra o app direto pelo ícone criado na Tela de Início do iPhone.</li>
                  <li>Volte aqui nesta tela e clique no botão <strong>"Ativar Notificações"</strong> abaixo.</li>
                </ol>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <div style={{ background: 'var(--bg-4)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600 }}>Permissão</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: pushInfo.permission === 'granted' ? 'var(--green)' : '#f59e0b' }}>
                  {pushInfo.permission === 'granted' ? 'Concedida ✅' : pushInfo.permission === 'denied' ? 'Negada ❌' : 'Pendente ⚠️'}
                </div>
              </div>
              <div style={{ background: 'var(--bg-4)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600 }}>Status do Dispositivo</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: pushInfo.isSubscribed ? 'var(--green)' : 'var(--text-2)' }}>
                  {pushInfo.isSubscribed ? 'Notificações Ativas 🔔' : 'Não Inscrito 🔕'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={handleEnablePush}
                disabled={activatingPush}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Bell size={14} />
                {activatingPush ? 'Ativando…' : pushInfo.isSubscribed ? 'Re-ativar Notificações' : 'Ativar Notificações Push'}
              </button>

              {pushInfo.isSubscribed && (
                <button
                  className="btn btn-secondary"
                  onClick={handleTestPushClick}
                  style={{ justifyContent: 'center' }}
                >
                  <Send size={14} /> Enviar Notificação de Teste
                </button>
              )}
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
