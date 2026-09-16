// AdSaver Content Script

// Keep track of processed video elements and their URLs
const processedVideos = new Map(); // videoElement -> url

// Helper to find parent ad card/container text
function findAdText(videoEl) {
  let parent = videoEl.parentElement;
  let textFound = '';
  
  // Traverse up to find a container card
  for (let i = 0; i < 12 && parent; i++) {
    // Check if parent matches typical ad card container structures
    const className = (parent.className || '').toString().toLowerCase();
    const role = parent.getAttribute('role') || '';
    
    // Check common patterns for Facebook Ad Library, TikTok, and general ad cards
    const isAdCard = 
      role === 'article' ||
      className.includes('card') ||
      className.includes('adcard') ||
      className.includes('ad-card') ||
      className.includes('item-wrapper') ||
      className.includes('ad-layout') ||
      className.includes('tiktok-ad') ||
      parent.tagName === 'ARTICLE';
      
    if (isAdCard) {
      // Look for text paragraphs or divs that contain the primary ad copy
      // Usually paragraphs or specific headings
      const textElements = parent.querySelectorAll('p, h2, h3, [class*="copy"], [class*="text"], span');
      for (const el of textElements) {
        const txt = el.innerText || el.textContent || '';
        const cleanTxt = txt.trim();
        // Get the first paragraph with decent length
        if (cleanTxt.length > 15 && cleanTxt.length < 250) {
          textFound = cleanTxt;
          break;
        }
      }
      if (textFound) break;
    }
    parent = parent.parentElement;
  }
  
  // Fallback: search nearby siblings of the video container
  if (!textFound) {
    let sibling = videoEl.parentElement;
    for (let i = 0; i < 4 && sibling; i++) {
      const paragraphs = sibling.querySelectorAll('p, span');
      for (const p of paragraphs) {
        const txt = (p.innerText || p.textContent || '').trim();
        if (txt.length > 10 && txt.length < 150) {
          textFound = txt;
          break;
        }
      }
      if (textFound) break;
      sibling = sibling.nextElementSibling || sibling.previousElementSibling;
    }
  }

  // Fallback to tab title
  if (!textFound) {
    textFound = document.title || 'video_ad';
  }

  // Slice first 50 chars and make filename safe
  return textFound.substring(0, 50).trim();
}

// Check and process a video element
function processVideo(videoEl) {
  // Try to find video URL from src attribute or source elements
  let videoUrl = videoEl.src;
  
  if (!videoUrl || videoUrl.startsWith('blob:')) {
    // Check sources
    const sources = videoEl.querySelectorAll('source');
    for (const source of sources) {
      if (source.src && !source.src.startsWith('blob:')) {
        videoUrl = source.src;
        break;
      }
    }
  }

  // If still no direct url (could be a blob URL, we still report it so the user can try download)
  if (!videoUrl) {
    videoUrl = videoEl.getAttribute('src');
  }

  if (!videoUrl) return;

  // If URL has changed or is new
  if (processedVideos.get(videoEl) !== videoUrl) {
    processedVideos.set(videoEl, videoUrl);
    
    const title = findAdText(videoEl);
    
    // Send message to background script
    chrome.runtime.sendMessage({
      action: 'videoDetected',
      url: videoUrl,
      title: title
    }).catch((err) => {
      console.warn('AdSaver background messaging failed:', err.message);
    });

    // Inject hover button overlay
    injectDownloadButton(videoEl, videoUrl, title);
  }
}

// Inject visual download button overlay
function injectDownloadButton(videoEl, videoUrl, title) {
  // Check if wrapper parent is valid
  const parent = videoEl.parentElement;
  if (!parent) return;

  // If button already exists in this parent, just update it
  let existingBtn = parent.querySelector('.adsaver-download-overlay');
  if (existingBtn) {
    existingBtn.setAttribute('data-url', videoUrl);
    existingBtn.setAttribute('data-title', title);
    return;
  }

  // Create the floating button
  const btn = document.createElement('div');
  btn.className = 'adsaver-download-overlay';
  btn.setAttribute('data-url', videoUrl);
  btn.setAttribute('data-title', title);
  btn.title = 'Baixar este vídeo (AdSaver)';
  
  // HTML SVG for download arrow
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    <span class="adsaver-btn-text">Download</span>
  `;

  // Set parent container to position: relative to hold our absolute button correctly
  const computedStyle = window.getComputedStyle(parent);
  if (computedStyle.position === 'static') {
    parent.style.position = 'relative';
  }

  // Inject
  parent.appendChild(btn);

  // Download Action
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Add downloading feedback class
    btn.classList.add('downloading');
    btn.querySelector('.adsaver-btn-text').textContent = 'Baixando...';
    
    const urlToDownload = btn.getAttribute('data-url');
    const titleToDownload = btn.getAttribute('data-title');

    chrome.runtime.sendMessage({
      action: 'downloadVideo',
      url: urlToDownload,
      title: titleToDownload
    }, (res) => {
      // Revert feedback
      setTimeout(() => {
        btn.classList.remove('downloading');
        btn.querySelector('.adsaver-btn-text').textContent = 'Download';
      }, 1500);
    });
  });
}

// Scan the page for videos
function scanForVideos() {
  const videos = document.querySelectorAll('video');
  videos.forEach(processVideo);
}

// Main initializer
function init() {
  // Scan initial load
  setTimeout(scanForVideos, 1000);
  setTimeout(scanForVideos, 3000);

  // Continuous observer for infinite scroll / ajax loading
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      scanForVideos();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Fallback Polling every 2.5 seconds to cover lazy loads or player switches
  setInterval(scanForVideos, 2500);
}

// Start
init();
console.log('AdSaver: Content Script Injected! ✦');
