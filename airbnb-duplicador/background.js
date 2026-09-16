// Airbnb Listing Duplicator - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('Airbnb Listing Duplicator instalado com sucesso!');
  // Clean up any stale tab logs
  chrome.storage.local.get(null, (items) => {
    const keysToRemove = Object.keys(items).filter(key => key.startsWith('logs_ab_dup_tab_'));
    if (keysToRemove.length > 0) {
      chrome.storage.local.remove(keysToRemove);
      console.log(`Removidos ${keysToRemove.length} logs de abas antigas.`);
    }
  });
});

// Listener for logging/status messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'log') {
    console.log('[Content Log]:', request.message);
    sendResponse({ success: true });
  }
  return true;
});
