/**
 * Fiesta de San Juan / Fiesta Junina Landing Page Controller
 * Use this file to configure your pixel IDs and checkout links.
 */

// --- CONFIGURATION START ---
const CHECKOUT_LINKS = {
  essential: "https://donamaria.salduu.com/p/kit-fiesta-junina-b-sico?pay=true", 
  premium: "https://donamaria.salduu.com/p/kit-fiesta-junina-perfecta-completo1?pay=true"
};

const PIXEL_CONFIG = {
  pixelId: "6a27468dcae3ba78d16a27a6",       // Replace with your UTMify Pixel ID
  googlePixelId: "69f93f1882bb3e210f0b5c00"  // Replace with your Google Pixel ID
};
// --- CONFIGURATION END ---


document.addEventListener("DOMContentLoaded", () => {
  initScrollReveal();
  initCountdownTimer();
  initFaqAccordion();
  initCheckoutLinks();
  initPixels();
});

/**
 * Scroll Reveal Animations (Framer Motion replacement)
 * Smoothly reveals elements with inline opacity:0 styles as they scroll into view.
 */
function initScrollReveal() {
  const animatedElements = [];
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(el => {
    const styleAttr = el.getAttribute('style');
    if (styleAttr && styleAttr.includes('opacity:0')) {
      animatedElements.push(el);
      // Setup transition styles
      el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    }
  });

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px', // Trigger slightly before element is fully visible
    threshold: 0.05
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.style.opacity = '1';
        el.style.transform = 'none';
        observer.unobserve(el);
      }
    });
  }, observerOptions);

  animatedElements.forEach(el => observer.observe(el));
}

/**
 * Countdown Timer (Minutes:Seconds)
 * Persistent across reloads using localStorage.
 */
function initCountdownTimer() {
  const timerSpan = document.querySelector('.font-mono.tabular-nums');
  if (!timerSpan) return;

  const DEFAULT_TIME = 15 * 60; // 15 minutes
  let timeLeft = DEFAULT_TIME;

  const savedTime = localStorage.getItem('sanjuan_timer_seconds');
  const savedTimestamp = localStorage.getItem('sanjuan_timer_timestamp');

  if (savedTime && savedTimestamp) {
    const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp, 10)) / 1000);
    timeLeft = parseInt(savedTime, 10) - elapsed;
    
    // If timer expired, reset to a fresh 15 minutes
    if (timeLeft <= 0) {
      timeLeft = DEFAULT_TIME;
    }
  }

  const updateTimer = () => {
    if (timeLeft <= 0) {
      timeLeft = DEFAULT_TIME; // Infinite loops for offer urgency
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerSpan.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    timeLeft--;
    localStorage.setItem('sanjuan_timer_seconds', timeLeft);
    localStorage.setItem('sanjuan_timer_timestamp', Date.now().toString());
  };

  updateTimer();
  setInterval(updateTimer, 1000);
}

/**
 * FAQ Accordion Toggles
 * Expand and collapse FAQ answers with rotating chevron icons.
 */
function initFaqAccordion() {
  const faqToggles = document.querySelectorAll('.faq-toggle');
  
  faqToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const faqItem = toggle.closest('.faq-item');
      const content = faqItem.querySelector('.faq-content');
      const icon = toggle.querySelector('.faq-icon');
      
      const isExpanded = !content.classList.contains('hidden');
      
      // Close all other FAQs
      document.querySelectorAll('.faq-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.faq-icon').forEach(el => el.classList.remove('rotate-180'));
      
      // Toggle current FAQ
      if (!isExpanded) {
        content.classList.remove('hidden');
        icon.classList.add('rotate-180');
      }
    });
  });
}

/**
 * Connect Checkout Buttons to Configured links
 */
function initCheckoutLinks() {
  // 1. Essential Kit Button
  // Find the button inside the Kit Esencial card
  const essentialButton = document.querySelector('button[type="button"].border-2.border-primary');
  if (essentialButton) {
    // Replace the button element or make it clickable
    essentialButton.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = CHECKOUT_LINKS.essential;
    });
    essentialButton.style.cursor = 'pointer';
  }

  // 2. Premium Kit Links
  // Find all links that originally pointed to the PT-BR checkout pay.wiapy.com
  const premiumLinks = document.querySelectorAll('a[href*="pay.wiapy.com"]');
  premiumLinks.forEach(link => {
    link.href = CHECKOUT_LINKS.premium;
  });
}

/**
 * Initialize Pixels (optional, uses configured values)
 */
function initPixels() {
  // If window.pixelId is defined in HTML, we let the script load.
  // We can update the IDs globally here if needed
  if (window.pixelId) window.pixelId = PIXEL_CONFIG.pixelId;
  if (window.googlePixelId) window.googlePixelId = PIXEL_CONFIG.googlePixelId;
}
