document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic Footer Year
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // 2. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Close all other FAQ items for a clean accordion behavior
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        const otherContent = otherItem.querySelector('.faq-content');
        otherContent.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('active');
        // Set dynamic height for smooth CSS transition
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        item.classList.remove('active');
        content.style.maxHeight = null;
      }
    });
  });

  // 3. Scroll Reveal Animations
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  const revealOnScrollObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Stop observing once animated
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => {
    revealOnScrollObserver.observe(el);
  });

  // 4. Interactive Checkout CTA Simulator (Toast Alert)
  const checkoutBtn = document.getElementById('checkout-cta');
  const heroCta = document.getElementById('hero-cta-primary');

  [checkoutBtn, heroCta].forEach(btn => {
    if (!btn) return;
    
    btn.addEventListener('click', (e) => {
      if (btn.id === 'checkout-cta' || btn.id === 'hero-cta-primary') {
        // Scroll to pricing section if it's the hero CTA (so they see the value card)
        if (btn.id === 'hero-cta-primary') {
          e.preventDefault();
          document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' });
          return;
        }

        e.preventDefault();
        showToast('Direcionando para o checkout de R$ 97...');
        
        setTimeout(() => {
          // You can replace this with your actual Kiwify/Hotmart checkout URL
          window.open('https://kiwify.com.br', '_blank');
        }, 1000);
      }
    });
  });

  // 5. Faturamento Carousel Controller
  const carousel = document.getElementById('faturamento-carousel');
  if (carousel) {
    const wrapper = document.getElementById('carousel-wrapper');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const dotsContainer = document.getElementById('carousel-dots');
    
    let currentIndex = 0;

    // Generate pagination dots dynamically
    slides.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.classList.add('carousel-dot');
      if (index === 0) dot.classList.add('active');
      dot.addEventListener('click', () => {
        goToSlide(index);
      });
      dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.carousel-dot');

    function updateCarousel() {
      wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
      
      // Update dots status
      dots.forEach((dot, index) => {
        if (index === currentIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });

      // Handle video play/pause on slide change
      slides.forEach((slide, index) => {
        const video = slide.querySelector('video');
        if (video) {
          if (index === currentIndex) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      });
    }

    function goToSlide(index) {
      currentIndex = index;
      if (currentIndex >= slides.length) {
        currentIndex = 0;
      } else if (currentIndex < 0) {
        currentIndex = slides.length - 1;
      }
      updateCarousel();
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex - 1);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
      });
    }

    // Touch and Drag swipe handling
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let isScrollGesture = false;
    let startTranslate = 0;

    wrapper.addEventListener('touchstart', dragStart, { passive: true });
    wrapper.addEventListener('touchend', dragEnd);
    wrapper.addEventListener('touchmove', dragAction, { passive: false });

    wrapper.addEventListener('mousedown', dragStart);
    wrapper.addEventListener('mouseup', dragEnd);
    wrapper.addEventListener('mouseleave', dragEnd);
    wrapper.addEventListener('mousemove', dragAction);

    // Prevent default browser dragging of images inside the carousel
    const carouselImages = wrapper.querySelectorAll('img');
    carouselImages.forEach(img => {
      img.addEventListener('dragstart', (e) => e.preventDefault());
    });

    function dragStart(e) {
      isDragging = true;
      isScrollGesture = false;
      
      startX = getPositionX(e);
      startY = getPositionY(e);
      
      wrapper.style.transition = 'none';
      startTranslate = -currentIndex * wrapper.offsetWidth;
    }

    function dragAction(e) {
      if (!isDragging) return;
      
      currentX = getPositionX(e);
      currentY = getPositionY(e);
      
      const diffX = currentX - startX;
      const diffY = currentY - startY;
      
      if (!isScrollGesture) {
        // If vertical movement is greater than horizontal, it's a page scroll gesture
        if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
          isScrollGesture = true;
          isDragging = false;
          wrapper.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
          updateCarousel(); // snap back
          return;
        }
      }
      
      if (!isScrollGesture) {
        // Prevent default screen scrolling when swiping horizontally inside the carousel
        if (Math.abs(diffX) > 10) {
          if (e.cancelable) e.preventDefault();
        }
        const currentTranslate = startTranslate + diffX;
        wrapper.style.transform = `translateX(${currentTranslate}px)`;
      }
    }

    function dragEnd() {
      if (!isDragging) return;
      isDragging = false;
      
      const diffX = currentX - startX;
      wrapper.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      
      const threshold = wrapper.offsetWidth * 0.15; // 15% swipe threshold
      
      if (diffX < -threshold && currentIndex < slides.length - 1) {
        currentIndex++;
      } else if (diffX > threshold && currentIndex > 0) {
        currentIndex--;
      }
      
      updateCarousel();
    }

    function getPositionX(e) {
      return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }

    function getPositionY(e) {
      return e.type.includes('mouse') ? e.pageY : e.touches[0].clientY;
    }

    // Video Audio toggle (mute/unmute controller)
    const soundToggles = carousel.querySelectorAll('.video-sound-toggle');
    soundToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent slide click/drag trigger
        const slide = toggle.closest('.carousel-slide');
        const video = slide.querySelector('video');
        if (video) {
          video.muted = !video.muted;
          const iconMute = toggle.querySelector('.icon-mute');
          const iconSound = toggle.querySelector('.icon-sound');
          if (video.muted) {
            iconMute.style.display = 'block';
            iconSound.style.display = 'none';
          } else {
            iconMute.style.display = 'none';
            iconSound.style.display = 'block';
          }
        }
      });
    });

    // Initial check for video on the first slide
    const firstVideo = slides[0].querySelector('video');
    if (firstVideo) {
      firstVideo.play().catch(() => {});
    }
  }

  // Helper function to show sleek tech-style toast notification
  function showToast(message) {
    let toast = document.getElementById('checkout-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'checkout-toast';
      
      const style = document.createElement('style');
      style.textContent = `
        #checkout-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #0a0a0a;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.85rem 1.25rem;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          z-index: 9999;
          transform: translateY(10px);
          opacity: 0;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        }
        #checkout-toast.visible {
          transform: translateY(0);
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('visible');

    setTimeout(() => {
      toast.classList.remove('visible');
    }, 2500);
  }
});
