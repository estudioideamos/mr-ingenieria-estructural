(() => {
  'use strict';

  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

  /* ---------------- Year ---------------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Active nav link (per-page, not scroll-based) ---------------- */
  const currentPage = document.body.dataset.page;
  if (currentPage) {
    $$('.main-nav a[data-nav], .mobile-nav a[data-nav]').forEach(a => {
      a.classList.toggle('active', a.dataset.nav === currentPage);
    });
  }

  /* ---------------- Header scroll state ---------------- */
  const header = $('#siteHeader');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');

    // scroll progress bar
    const doc = document.documentElement;
    const pct = (window.scrollY / (doc.scrollHeight - doc.clientHeight)) * 100;
    const bar = $('#scrollProgress');
    if (bar) bar.style.width = `${pct}%`;

    // hero parallax
    const heroImg = $('#heroBg img');
    if (heroImg && window.scrollY < window.innerHeight) {
      heroImg.style.transform = `scale(1.12) translateY(${window.scrollY * 0.12}px)`;
    }

    // floating back-to-top visibility
    const floatBtn = $('.back-top-float');
    if (floatBtn) floatBtn.classList.toggle('is-visible', window.scrollY > 560);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- Mobile nav ---------------- */
  const burger = $('#burger');
  const mobileNav = $('#mobileNav');
  const toggleNav = (open) => {
    const isOpen = open ?? !mobileNav.classList.contains('is-open');
    mobileNav.classList.toggle('is-open', isOpen);
    burger.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };
  burger?.addEventListener('click', () => toggleNav());
  $$('.mobile-nav a').forEach(a => a.addEventListener('click', () => toggleNav(false)));

  /* ---------------- Smooth anchor scroll (offset for fixed header) ---------------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      const offset = 96;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ---------------- Deep-link scroll on load (accounts for fixed header) ---------------- */
  if (location.hash.length > 1) {
    const target = $(location.hash);
    if (target) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const top = target.getBoundingClientRect().top + window.scrollY - 96;
          window.scrollTo({ top, behavior: 'auto' });
        }, 60);
      });
    }
  }

  /* ---------------- Scroll reveal ---------------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------------- Counters ---------------- */
  const counters = $$('.count[data-count]');
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const isFloat = !Number.isInteger(target);
    const dur = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = isFloat ? val.toFixed(1) : Math.round(val);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && counters.length) {
    const ioCount = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          ioCount.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(el => ioCount.observe(el));
  }

  /* ---------------- Project filters ---------------- */
  const filterBtns = $$('.filters button');
  const projectCards = $$('.proj-card');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      projectCards.forEach(card => {
        const show = f === 'all' || card.dataset.cat === f;
        card.classList.toggle('hide', !show);
      });
    });
  });

  /* ---------------- Lightbox (simple card grid + per-project galleries) ---------------- */
  const lightbox = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbTitle = $('#lbTitle');
  const lbMeta = $('#lbMeta');
  let lbIndex = 0;
  let visibleCards = [];
  let navMode = 'cards'; // 'cards' | 'project'
  let galleryImages = [];
  let galleryTitle = '';
  let galleryMeta = '';

  const refreshVisible = () => visibleCards = projectCards.filter(c => !c.classList.contains('hide'));

  const openLightbox = (card) => {
    navMode = 'cards';
    refreshVisible();
    lbIndex = visibleCards.indexOf(card);
    renderLightbox();
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  const openGallery = (key, idx) => {
    const data = window.PROJECT_GALLERIES && window.PROJECT_GALLERIES[key];
    if (!data) return;
    navMode = 'project';
    galleryImages = data.images;
    galleryTitle = data.title;
    galleryMeta = data.meta;
    lbIndex = idx || 0;
    renderLightbox();
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  const renderLightbox = () => {
    if (navMode === 'project') {
      const img = galleryImages[lbIndex];
      if (!img) return;
      lbImg.src = img.src;
      lbImg.alt = img.alt || galleryTitle;
      lbTitle.textContent = galleryTitle;
      lbMeta.textContent = `${galleryMeta} · ${lbIndex + 1}/${galleryImages.length}`;
    } else {
      const card = visibleCards[lbIndex];
      if (!card) return;
      lbImg.src = card.dataset.full;
      lbImg.alt = card.dataset.title;
      lbTitle.textContent = card.dataset.title;
      lbMeta.textContent = card.dataset.meta;
    }
  };
  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  };
  const lightboxLen = () => navMode === 'project' ? galleryImages.length : visibleCards.length;

  projectCards.forEach(card => card.addEventListener('click', () => openLightbox(card)));

  /* ---------------- In-place project carousels (arrows + dots) ---------------- */
  $$('.pd-carousel').forEach(carousel => {
    const key = carousel.dataset.project;
    const data = window.PROJECT_GALLERIES && window.PROJECT_GALLERIES[key];
    if (!data || !data.images.length) return;
    const frame = $('.pd-carousel-frame', carousel);
    const img = $('img', frame);
    const dots = $$('.pd-dot', carousel);
    let idx = 0;

    const show = (i, animate) => {
      idx = (i + data.images.length) % data.images.length;
      const target = data.images[idx];
      const apply = () => {
        img.src = target.src;
        img.alt = target.alt || data.title;
        img.classList.remove('is-out');
      };
      if (animate) { img.classList.add('is-out'); setTimeout(apply, 180); }
      else apply();
      frame.dataset.idx = idx;
      dots.forEach((d, di) => d.classList.toggle('is-active', di === idx));
    };

    $('.pd-carousel-prev', carousel)?.addEventListener('click', (e) => { e.stopPropagation(); show(idx - 1, true); });
    $('.pd-carousel-next', carousel)?.addEventListener('click', (e) => { e.stopPropagation(); show(idx + 1, true); });
    dots.forEach((d, di) => d.addEventListener('click', (e) => { e.stopPropagation(); show(di, true); }));
    frame.addEventListener('click', () => openGallery(key, idx));
  });

  $$('.action-main[data-project]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openGallery(btn.dataset.project, parseInt(btn.dataset.idx, 10) || 0);
    });
  });

  $('#lbClose')?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  $('#lbNext')?.addEventListener('click', () => { const len = lightboxLen(); if (!len) return; lbIndex = (lbIndex + 1) % len; renderLightbox(); });
  $('#lbPrev')?.addEventListener('click', () => { const len = lightboxLen(); if (!len) return; lbIndex = (lbIndex - 1 + len) % len; renderLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') $('#lbNext').click();
    if (e.key === 'ArrowLeft') $('#lbPrev').click();
  });

  /* ---------------- Footer accordion (mobile only, CSS-gated) ---------------- */
  $$('.footer-col-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const col = btn.closest('.footer-col');
      const isOpen = col.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });

  /* ---------------- Back to top (works regardless of href/page) ---------------- */
  $$('.back-top').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* ---------------- Contact form -> WhatsApp ---------------- */
  window.sendToWhatsapp = (e) => {
    e.preventDefault();
    const form = e.target;
    const nombre = form.nombre.value.trim();
    const telefono = form.telefono.value.trim();
    const email = form.email.value.trim();
    const tipo = form.tipo.value;
    const mensaje = form.mensaje.value.trim();

    const lines = [
      `Hola, soy ${nombre}.`,
      `Quiero consultar sobre un proyecto: ${tipo}.`,
      mensaje,
      email ? `Email: ${email}` : '',
      telefono ? `Teléfono: ${telefono}` : ''
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/5491169633168?text=${text}`, '_blank', 'noopener');
    return false;
  };

  /* ---------------- Footer ambient glow (follows pointer) ---------------- */
  const footer = $('#siteFooter');
  if (footer && window.matchMedia('(pointer:fine)').matches) {
    footer.addEventListener('mousemove', (e) => {
      const rect = footer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      footer.style.setProperty('--footer-x', `${x}%`);
      footer.style.setProperty('--footer-y', `${y}%`);
    });
  }

  /* ---------------- Cursor dot (desktop pointer only) ---------------- */
  const cursor = $('#cursorDot');
  if (window.matchMedia('(pointer:fine)').matches && cursor) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; cursor.style.opacity = '1'; });
    const raf = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.left = `${cx}px`;
      cursor.style.top = `${cy}px`;
      requestAnimationFrame(raf);
    };
    raf();
    $$('a, button, .proj-card, .pd-carousel-frame').forEach(el => {
      el.addEventListener('mouseenter', () => { cursor.style.width = '26px'; cursor.style.height = '26px'; cursor.style.opacity = '.6'; });
      el.addEventListener('mouseleave', () => { cursor.style.width = '10px'; cursor.style.height = '10px'; cursor.style.opacity = '1'; });
    });
  }

})();
