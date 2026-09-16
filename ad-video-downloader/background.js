// AdSaver Background Service Worker

// Map to store detected videos: tabId -> Array of { url, title, timestamp }
const detectedVideos = new Map();

// Helper to sanitize filename
function sanitizeFilename(text) {
  if (!text) return 'adsaver_video';
  // Remove accents
  const cleanText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Replace non-alphanumeric with spaces, keep basic chars
  let sanitized = cleanText.replace(/[^a-zA-Z0-9\s-_]/g, '');
  // Replace multiple spaces with a single underscore
  sanitized = sanitized.trim().replace(/\s+/g, '_');
  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  return sanitized || 'adsaver_video';
}

// Listen to messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const tabId = sender.tab ? sender.tab.id : null;

  if (request.action === 'videoDetected') {
    if (!tabId) {
      sendResponse({ success: false, error: 'No tab ID' });
      return;
    }

    const { url, title } = request;
    if (!url) {
      sendResponse({ success: false, error: 'No URL provided' });
      return;
    }

    // Initialize list for the tab if it doesn't exist
    if (!detectedVideos.has(tabId)) {
      detectedVideos.set(tabId, []);
    }

    const videoList = detectedVideos.get(tabId);
    
    // Check if the video URL is already detected for this tab
    const alreadyExists = videoList.some(v => v.url === url);
    if (!alreadyExists) {
      videoList.push({
        url,
        title: title || 'Sem título',
        timestamp: Date.now()
      });
      // Limit to 50 videos per tab to avoid memory bloat
      if (videoList.length > 50) {
        videoList.shift();
      }
      
      // Update extension badge text to show count of detected videos
      chrome.action.setBadgeText({
        tabId: tabId,
        text: videoList.length.toString()
      }).catch(() => {});
      
      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: '#8b5cf6' // Premium purple
      }).catch(() => {});
    }

    sendResponse({ success: true });
    return;
  }

  if (request.action === 'getVideos') {
    const targetTabId = request.tabId;
    const list = detectedVideos.get(targetTabId) || [];
    sendResponse({ success: true, videos: list });
    return;
  }

  if (request.action === 'downloadVideo') {
    const { url, title } = request;
    const cleanName = sanitizeFilename(title);
    
    // Attempt to determine file extension from URL or fallback to mp4
    let ext = 'mp4';
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
      if (match && ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(match[1].toLowerCase())) {
        ext = match[1].toLowerCase();
      }
    } catch (e) {
      // Ignore URL parsing errors
    }

    const filename = `${cleanName}.${ext}`;

    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true // Open save-as dialog so user can choose destination and confirm name
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId });
      }
    });
    return true; // async response
  }
});

// Clean up tab data when tab is updated or closed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    detectedVideos.delete(tabId);
    chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  detectedVideos.delete(tabId);
});
