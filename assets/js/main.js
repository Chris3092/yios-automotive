/* ==========================================================================
   Site interactions — mobile nav, scroll reveal, open/closed indicator
   ========================================================================== */

(function () {
  'use strict';

  // ---- Language switcher dropdown ----
  const langSwitch = document.querySelector('.lang-switch');
  if (langSwitch) {
    const btn = langSwitch.querySelector('button');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      langSwitch.classList.toggle('open');
    });
    document.addEventListener('click', () => langSwitch.classList.remove('open'));
  }

  // ---- Mobile nav toggle ----
  const burger = document.querySelector('.hamburger');
  const links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(isOpen));
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Live open/closed status (i18n) ----
  // Hours: Mon–Fri 07:30 – 19:00 (Cyprus). Sat/Sun closed.
  const i18nStatus = {
    en: { open: 'Open Now', closed: 'Closed' },
    el: { open: 'Ανοικτά Τώρα', closed: 'Κλειστά' },
    ru: { open: 'Открыто', closed: 'Закрыто' }
  };
  const docLang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  const tStatus = i18nStatus[docLang] || i18nStatus.en;

  function updateOpenStatus() {
    document.querySelectorAll('[data-open-status]').forEach(pill => {
      const now = new Date();
      const day = now.getDay(); // 0 Sun .. 6 Sat
      const minutes = now.getHours() * 60 + now.getMinutes();
      const openMin = 7 * 60 + 30;   // 07:30
      const closeMin = 19 * 60;       // 19:00
      const isWeekday = day >= 1 && day <= 5;
      const isOpen = isWeekday && minutes >= openMin && minutes < closeMin;
      pill.classList.toggle('open', isOpen);
      pill.classList.toggle('closed', !isOpen);
      pill.innerHTML = `<span class="dot"></span>${isOpen ? tStatus.open : tStatus.closed}`;
    });
  }
  updateOpenStatus();
  setInterval(updateOpenStatus, 60_000);

  // ---- Reviews scroller (auto-marquee with seamless loop) ----
  // Picks up the existing .testimonials-grid, wraps its cards into a track,
  // duplicates them for a seamless loop, and toggles on the scroller class
  // (which the CSS uses to switch from grid to a horizontal animated lane).
  const reviewsContainer = document.querySelector('.testimonials-grid');
  if (reviewsContainer && reviewsContainer.querySelectorAll('.review').length > 2) {
    const reviews = Array.from(reviewsContainer.children);
    // Reviews live inside the scroller — they don't need the entry-reveal anim
    reviews.forEach(r => r.removeAttribute('data-reveal'));

    const track = document.createElement('div');
    track.className = 'reviews-track';
    reviews.forEach(r => track.appendChild(r));
    reviewsContainer.appendChild(track);
    reviewsContainer.classList.add('reviews-scroller');

    // Clone every card for a seamless infinite loop
    reviews.forEach(r => {
      const clone = r.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  }

  // ---- Scroll reveal ----
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    revealEls.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  // ---- Hero slider (carousel) ----
  const heroSlider = document.querySelector('.hero-slider');
  if (heroSlider) {
    const slides = Array.from(heroSlider.querySelectorAll('.hero-slide'));
    const dots = Array.from(heroSlider.querySelectorAll('.hero-dot'));
    const prevBtn = heroSlider.querySelector('.hero-arrow.prev');
    const nextBtn = heroSlider.querySelector('.hero-arrow.next');
    let idx = slides.findIndex(s => s.classList.contains('is-active'));
    if (idx < 0) idx = 0;
    let timer = null;
    const interval = 6500;

    function go(n) {
      slides[idx].classList.remove('is-active');
      if (dots[idx]) dots[idx].classList.remove('is-active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('is-active');
      if (dots[idx]) dots[idx].classList.add('is-active');
    }
    function next() { go(idx + 1); }
    function prev() { go(idx - 1); }
    function start() {
      stop();
      timer = setInterval(next, interval);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    dots.forEach((d, i) => d.addEventListener('click', () => { go(i); start(); }));
    if (nextBtn) nextBtn.addEventListener('click', () => { next(); start(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); start(); });
    heroSlider.addEventListener('mouseenter', stop);
    heroSlider.addEventListener('mouseleave', start);
    // Pause when tab hidden, resume when visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else start();
    });
    start();
  }

  // ---- Update copyright year ----
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- In-page video lightbox (Facebook plugin embed) ----
  const videoTriggers = document.querySelectorAll('[data-fb-video]');
  if (videoTriggers.length) {
    const i18nClose = { en: 'Close video', el: 'Κλείσιμο βίντεο', ru: 'Закрыть видео' };
    const closeLabel = i18nClose[docLang] || i18nClose.en;

    const overlay = document.createElement('div');
    overlay.className = 'video-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <button type="button" class="video-lightbox__close" aria-label="${closeLabel}">&times;</button>
      <div class="video-lightbox__frame"></div>
    `;
    document.body.appendChild(overlay);

    const frame = overlay.querySelector('.video-lightbox__frame');
    const closeBtn = overlay.querySelector('.video-lightbox__close');

    function openVideo(url) {
      const src = 'https://www.facebook.com/plugins/video.php?href=' +
        encodeURIComponent(url) +
        '&show_text=false&autoplay=true&mute=false';
      frame.innerHTML = '<iframe src="' + src + '" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen scrolling="no" frameborder="0"></iframe>';
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeVideo() {
      frame.innerHTML = '';
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    videoTriggers.forEach(t => {
      t.addEventListener('click', (e) => {
        e.preventDefault();
        const url = t.getAttribute('data-fb-video');
        if (url) openVideo(url);
      });
    });
    closeBtn.addEventListener('click', closeVideo);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeVideo(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeVideo();
    });
  }

  // ---- Contact form (mailto fallback — no backend) ----
  const form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = encodeURIComponent(fd.get('name') || '');
      const phone = encodeURIComponent(fd.get('phone') || '');
      const vehicle = encodeURIComponent(fd.get('vehicle') || '');
      const service = encodeURIComponent(fd.get('service') || '');
      const message = encodeURIComponent(fd.get('message') || '');
      const subject = encodeURIComponent(`Service Enquiry — ${decodeURIComponent(service) || 'General'}`);
      const body = `Name: ${name}%0D%0APhone: ${phone}%0D%0AVehicle: ${vehicle}%0D%0AService: ${service}%0D%0A%0D%0A${message}`;
      window.location.href = `mailto:mvrachimisautomotive@hotmail.com?subject=${subject}&body=${body}`;
    });
  }
})();
