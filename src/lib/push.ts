// Frontend Push Notification Utility for iOS & Android PWA

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('✅ Service Worker registrado:', reg);
    return reg;
  } catch (err) {
    console.error('❌ Falha ao registrar Service Worker:', err);
    return null;
  }
}

export async function subscribeUserToPush(): Promise<{ success: boolean; message: string }> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, message: 'Seu navegador não suporta Notificações Push' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: 'Permissão de notificação negada no navegador/sistema' };
    }

    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await registerServiceWorker() || undefined;
    }
    if (!registration) {
      return { success: false, message: 'Não foi possível registrar o Service Worker' };
    }

    // Obter VAPID Public Key do servidor
    const res = await fetch('/api/push/vapid-key');
    const { publicKey, error } = await res.json();

    if (error || !publicKey) {
      return { success: false, message: error || 'Não foi possível obter a chave do servidor' };
    }

    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    // Enviar inscrição para o backend
    const subRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription })
    });

    if (!subRes.ok) {
      throw new Error('Falha ao salvar inscrição no servidor');
    }

    return { success: true, message: 'Notificações Push ativadas com sucesso!' };
  } catch (e: any) {
    console.error('Erro ao inscrever push:', e);
    return { success: false, message: e.message || 'Erro ao ativar notificações' };
  }
}

export async function sendTestPush(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/push/test', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      return { success: true, message: data.message || 'Notificação enviada!' };
    }
    return { success: false, message: data.error || 'Erro ao enviar notificação' };
  } catch (e: any) {
    return { success: false, message: e.message || 'Erro de conexão' };
  }
}

export async function checkPushStatus(): Promise<{
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isStandalone: boolean;
  isIOS: boolean;
}> {
  const isSupported = ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window);
  const permission = isSupported ? Notification.permission : 'denied';
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

  let isSubscribed = false;
  if (isSupported) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        isSubscribed = Boolean(sub);
      }
    } catch {}
  }

  return {
    isSupported,
    permission,
    isSubscribed,
    isStandalone,
    isIOS
  };
}
