document.addEventListener('DOMContentLoaded', () => {
  // ── HEADER SCROLL EFFECT ──
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // ── REVEAL ON SCROLL ──
  const revealElements = document.querySelectorAll('.reveal');
  const checkReveal = () => {
    const triggerBottom = (window.innerHeight / 5) * 4.5;
    revealElements.forEach(el => {
      const elTop = el.getBoundingClientRect().top;
      if (elTop < triggerBottom) {
        el.classList.add('active');
      }
    });
  };
  
  // Initial check and event listener
  setTimeout(checkReveal, 200);
  window.addEventListener('scroll', checkReveal);

  // ── FAQ ACCORDION ──
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      
      // Close all other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.faq-content').style.maxHeight = null;
        }
      });

      // Toggle current item
      if (isOpen) {
        item.classList.remove('active');
        content.style.maxHeight = null;
      } else {
        item.classList.add('active');
        // Set max-height to the scrollHeight of the content
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });

  // ── INTERACTIVE SIMULATED PLAYER ──
  const playBtn = document.getElementById('play-btn');
  const disk = document.getElementById('player-disk');
  const diskCenter = document.getElementById('player-disk-center');
  const waveBars = document.querySelectorAll('.wave-bar');
  const trackTitle = document.getElementById('track-title');
  const trackSubtitle = document.getElementById('track-subtitle');
  
  let isPlaying = false;
  let waveInterval = null;
  let trackIndex = 0;

  // Mock playlist of tracks matching the theme
  const playlist = [
    { title: 'Mega Eletrofunk Vol. 42', subtitle: 'Remix Oficial Abelvolks - Grave Forte', brand: 'abelvolks' },
    { title: 'Deboxe Bass Test - Subwoofer Monster', subtitle: 'Exclusiva Pasta de Lançamento', brand: 'deboxe' },
    { title: 'Trio Goiano Hardcore Beats', subtitle: 'Abelvolks Oficial Sound System', brand: 'abelvolks' },
    { title: 'Mega Eletro de Boteco 2026', subtitle: 'Deboxe Rebaixados Hits', brand: 'deboxe' }
  ];

  // Function to animate wave bars
  const startWaveAnimation = () => {
    waveInterval = setInterval(() => {
      waveBars.forEach((bar, idx) => {
        // Generate a random height percentage for each bar when playing
        const randomHeight = Math.floor(Math.random() * 85) + 15; // 15% to 100%
        bar.style.height = `${randomHeight}%`;
        bar.classList.add('active');
      });
    }, 120);
  };

  const stopWaveAnimation = () => {
    if (waveInterval) {
      clearInterval(waveInterval);
      waveInterval = null;
    }
    // Return bars to default height and deactivate
    waveBars.forEach(bar => {
      bar.style.height = '3px';
      bar.classList.remove('active');
    });
  };

  const togglePlay = () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      // Play state
      playBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      `;
      disk.classList.add('playing');
      startWaveAnimation();
      
      // Simulate track changes every 6 seconds while playing
      setTimeout(changeTrackSimulated, 5000);
    } else {
      // Pause state
      playBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
      disk.classList.remove('playing');
      stopWaveAnimation();
    }
  };

  const changeTrackSimulated = () => {
    if (!isPlaying) return;
    
    // Move to next track in playlist
    trackIndex = (trackIndex + 1) % playlist.length;
    const currentTrack = playlist[trackIndex];
    
    // Apply changes with quick fade-out/in text effect
    trackTitle.style.opacity = '0';
    trackSubtitle.style.opacity = '0';
    
    setTimeout(() => {
      trackTitle.textContent = currentTrack.title;
      trackSubtitle.textContent = currentTrack.subtitle;
      
      // Adjust brand color style of the disk center
      if (currentTrack.brand === 'deboxe') {
        diskCenter.className = 'player-disk-center deboxe';
      } else {
        diskCenter.className = 'player-disk-center';
      }
      
      trackTitle.style.opacity = '1';
      trackSubtitle.style.opacity = '1';
    }, 300);

    // Schedule next transition
    setTimeout(changeTrackSimulated, 6000);
  };

  playBtn.addEventListener('click', togglePlay);
});
