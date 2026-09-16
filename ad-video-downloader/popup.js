// AdSaver Popup Scripts

document.addEventListener('DOMContentLoaded', () => {
  const videoListEl = document.getElementById('video-list');
  const emptyStateEl = document.getElementById('empty-state');
  const statusTextEl = document.getElementById('status-text');
  
  // Find current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      statusTextEl.textContent = 'Guia ativa não encontrada';
      showEmptyState();
      return;
    }

    const activeTab = tabs[0];
    loadVideosForTab(activeTab.id);
  });

  // Query background worker for detected videos
  function loadVideosForTab(tabId) {
    chrome.runtime.sendMessage({ action: 'getVideos', tabId: tabId }, (res) => {
      if (res && res.success && res.videos && res.videos.length > 0) {
        renderVideoList(res.videos);
      } else {
        showEmptyState();
      }
    });
  }

  // Show empty screen
  function showEmptyState() {
    videoListEl.style.display = 'none';
    emptyStateEl.style.display = 'flex';
    statusTextEl.textContent = 'Nenhum vídeo detectado';
    statusTextEl.style.color = '#9ca3af';
    
    const dot = document.querySelector('.status-dot');
    if (dot) {
      dot.className = 'status-dot'; // Remove pulsing animation
      dot.style.backgroundColor = '#9ca3af';
      dot.style.boxShadow = 'none';
    }
  }

  // Helper to extract hostname
  function getDomain(urlStr) {
    try {
      const url = new URL(urlStr);
      return url.hostname;
    } catch (e) {
      return 'Servidor de vídeo';
    }
  }

  // Render video card elements
  function renderVideoList(videos) {
    // Hide empty state and show list
    emptyStateEl.style.display = 'none';
    videoListEl.style.display = 'flex';
    videoListEl.innerHTML = ''; // clear

    // Update status text
    const count = videos.length;
    statusTextEl.textContent = `${count} ${count === 1 ? 'vídeo detectado' : 'vídeos detectados'}`;
    statusTextEl.style.color = '#34d399'; // green text
    
    const dot = document.querySelector('.status-dot');
    if (dot) {
      dot.className = 'status-dot'; // reset
      dot.style.backgroundColor = '#10b981'; // green dot
      dot.style.boxShadow = '0 0 8px #10b981';
    }

    // Process from newest to oldest
    const reversedList = [...videos].reverse();

    reversedList.forEach((video) => {
      const card = document.createElement('div');
      card.className = 'video-card';
      
      const domain = getDomain(video.url);
      
      card.innerHTML = `
        <div class="video-info">
          <div class="video-preview-container">
            <video src="${escapeHtml(video.url)}" muted preload="metadata" class="video-preview-el" playsinline></video>
            <div class="video-preview-play-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
          </div>
          <div class="video-details">
            <div class="video-title" title="${escapeHtml(video.title)}">${escapeHtml(video.title)}</div>
            <div class="video-domain" title="${escapeHtml(video.url)}">${domain}</div>
          </div>
        </div>
        <div class="video-actions">
          <button class="btn-copy" data-url="${escapeHtml(video.url)}">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copiar URL</span>
          </button>
          <button class="btn-download" data-url="${escapeHtml(video.url)}" data-title="${escapeHtml(video.title)}">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Baixar</span>
          </button>
        </div>
      `;

      videoListEl.appendChild(card);

      // Play video preview on hover
      card.addEventListener('mouseenter', () => {
        const videoEl = card.querySelector('.video-preview-el');
        if (videoEl) {
          videoEl.play().catch(() => {});
        }
      });

      card.addEventListener('mouseleave', () => {
        const videoEl = card.querySelector('.video-preview-el');
        if (videoEl) {
          videoEl.pause();
          videoEl.currentTime = 0;
        }
      });
      
      // Bind copy button
      const copyBtn = card.querySelector('.btn-copy');
      copyBtn.addEventListener('click', () => {
        const url = copyBtn.getAttribute('data-url');
        navigator.clipboard.writeText(url).then(() => {
          const btnText = copyBtn.querySelector('span');
          const originalText = btnText.textContent;
          btnText.textContent = 'Copiado!';
          copyBtn.style.borderColor = '#10b981';
          copyBtn.style.color = '#34d399';
          
          setTimeout(() => {
            btnText.textContent = originalText;
            copyBtn.style.borderColor = '';
            copyBtn.style.color = '';
          }, 1500);
        }).catch(err => {
          console.error('Copy failed:', err);
        });
      });

      // Bind download button
      const downloadBtn = card.querySelector('.btn-download');
      downloadBtn.addEventListener('click', () => {
        const url = downloadBtn.getAttribute('data-url');
        const title = downloadBtn.getAttribute('data-title');
        
        const btnText = downloadBtn.querySelector('span');
        const originalText = btnText.textContent;
        
        btnText.textContent = 'Baixando...';
        downloadBtn.style.background = 'linear-gradient(135deg, #10b981, #047857)';
        downloadBtn.style.pointerEvents = 'none';

        chrome.runtime.sendMessage({
          action: 'downloadVideo',
          url: url,
          title: title
        }, (res) => {
          setTimeout(() => {
            btnText.textContent = originalText;
            downloadBtn.style.background = '';
            downloadBtn.style.pointerEvents = '';
          }, 2000);
        });
      });
    });
  }

  // Simple HTML escaping helper
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
