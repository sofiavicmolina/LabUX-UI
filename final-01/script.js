/* =============================================================
   CHICAGO 2050 — script.js
   Módulos: navegación · tickers · carrusel · HUD del mapa · modales
   ============================================================= */
(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

  /* -----------------------------------------------------------
     DATOS DE LAS TARJETAS
     Reemplaza `img` por tus imágenes locales, p. ej. 'img/e-sheep.jpg'
     ----------------------------------------------------------- */
  const CARDS = [
    {
      unit: 'UNIT 001 / ANIMALS',
      title: 'E-SHEEP',
      sub: 'Schedule your visit hassle-free',
      text: 'Flock monitored 24 hours a day.',
      img: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=900&q=80',
      alt: 'Ovejas pastando en una pradera'
    },
    {
      unit: 'UNIT 002 / CONTROL',
      title: 'LIFE CONTROL',
      sub: 'Controlled resources',
      text: 'Every organism, resource and process under permanent supervision.',
      img: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=80',
      alt: 'Científica trabajando frente a pantallas en un laboratorio'
    },
    {
      unit: 'UNIT 003 / BIO-SYSTEM',
      title: 'CHICAGO TOURISM',
      sub: 'Animals, playgrounds and more',
      text: 'Climate-controlled, measured and optimized parks. Entry by advance reservation only.',
      img: 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=900&q=80',
      alt: 'Jirafa en un recinto'
    },
    {
      unit: 'UNIT 004 / ORIGEN',
      title: 'ORIGEN',
      sub: '0 SIMULATORS',
      text: 'Original nature, no simulation. By invitation only. Spots available today: 3',
      img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=900&q=80',
      alt: 'Ciudad futurista con rascacielos'
    }
  ];

  /* -----------------------------------------------------------
     1. NAVEGACIÓN
     ----------------------------------------------------------- */
  function initNav() {
    const toggle = $('.nav-toggle');
    const list = $('#nav-list');
    const links = $$('.tab-btn', list);

    toggle.addEventListener('click', () => {
      const open = list.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.forEach(a => a.addEventListener('click', () => {
      list.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }));

    // Pestaña activa según la sección visible
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(l => l.classList.remove('is-active'));
        map.get(e.target.id)?.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* -----------------------------------------------------------
     2. TICKERS (marquesina infinita)
     El texto se duplica para que el bucle sea continuo.
     ----------------------------------------------------------- */
  function initTickers() {
    $$('[data-ticker]').forEach(track => {
      const text = track.textContent.trim().replace(/\s+/g, ' ');
      const chunk = `<span>${text}</span>`;
      // 4 copias por mitad → la animación desplaza -50%
      track.innerHTML = chunk.repeat(8);
    });
  }

  /* -----------------------------------------------------------
     3. CARRUSEL
     ----------------------------------------------------------- */
  function initCarousel() {
    const root  = $('[data-carousel]');
    const stage = $('[data-stage]', root);
    const dotsEl = $('[data-dots]', root);
    const tab = $('[data-click-tab]', root);

    // Se duplica el set (4 → 8) para tener siempre 5 tarjetas visibles con simetría
    const items = [...CARDS, ...CARDS];
    const N = items.length;
    let active = 0;

    // Render
    stage.innerHTML = items.map((c, i) => `
      <article class="card" tabindex="-1" data-index="${i}" aria-roledescription="slide"
               aria-label="${c.title} (${(i % CARDS.length) + 1} de ${CARDS.length})">
        <div class="card__inner">
          <div class="card__ph" aria-hidden="true">${c.unit}</div>
          <img class="card__img" src="${c.img}" alt="${c.alt}" loading="lazy" draggable="false"
               onerror="this.remove()">
          <div class="card__info">
            <p class="card__unit">${c.unit}</p>
            <h3 class="card__title">${c.title}</h3>
            <p class="card__sub">${c.sub}</p>
            <p class="card__text">${c.text}</p>
          </div>
        </div>
      </article>`).join('');
    const cards = $$('.card', stage);

    dotsEl.innerHTML = CARDS.map((c, i) =>
      `<button role="tab" aria-label="${c.title}" data-dot="${i}"></button>`).join('');
    const dots = $$('[data-dot]', dotsEl);

    function layout() {
      cards.forEach((card, i) => {
        let off = ((i - active) % N + N) % N;   // 0..N-1
        if (off > N / 2) off -= N;               // -N/2..N/2
        const pos = Math.abs(off) <= 2 ? String(off) : (off < 0 ? 'hidden-l' : 'hidden-r');
        card.dataset.pos = pos;
        card.classList.toggle('is-active', off === 0);
        card.tabIndex = off === 0 ? 0 : -1;
        card.setAttribute('aria-hidden', Math.abs(off) > 2 ? 'true' : 'false');
        if (off !== 0) card.classList.remove('show-info');
      });
      const real = active % CARDS.length;
      dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === real)));
    }

    const go = step => { active = ((active + step) % N + N) % N; layout(); };
    const goTo = idx => {
      // ruta más corta hacia la tarjeta idx
      let diff = ((idx - active) % N + N) % N;
      if (diff > N / 2) diff -= N;
      go(diff);
    };

    $('[data-prev]', root).addEventListener('click', () => go(-1));
    $('[data-next]', root).addEventListener('click', () => go(1));
    // Cada punto apunta a la copia más cercana de esa tarjeta
    const dist = idx => { let d = ((idx - active) % N + N) % N; return Math.abs(d > N / 2 ? d - N : d); };
    dots.forEach(d => d.addEventListener('click', () => {
      const t = Number(d.dataset.dot), alt = t + CARDS.length;
      goTo(dist(t) <= dist(alt) ? t : alt);
    }));

    // Clic en tarjetas laterales → se centran; en la central (táctil) → muestra info
    stage.addEventListener('click', e => {
      if (moved) return;
      const card = e.target.closest('.card');
      if (!card) return;
      const idx = Number(card.dataset.index);
      if (idx === active) card.classList.toggle('show-info');
      else goTo(idx);
    });

    // "↑ click here" alterna la información de la tarjeta activa
    tab.addEventListener('click', () => cards[active].classList.toggle('show-info'));

    // Teclado
    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { go(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(1);  e.preventDefault(); }
      if (e.key === 'Enter' && e.target.classList.contains('card')) cards[active].classList.toggle('show-info');
    });

    // Drag / swipe
    let startX = 0, dx = 0, dragging = false, moved = false;
    stage.addEventListener('pointerdown', e => {
      dragging = true; moved = false; startX = e.clientX; dx = 0;
      stage.setPointerCapture?.(e.pointerId);
    });
    stage.addEventListener('pointermove', e => {
      if (!dragging) return;
      dx = e.clientX - startX;
      if (Math.abs(dx) > 8) { moved = true; stage.classList.add('is-dragging'); }
    });
    const end = () => {
      if (!dragging) return;
      dragging = false; stage.classList.remove('is-dragging');
      const threshold = isMobile() ? 40 : 70;
      if (dx > threshold) go(-1);
      else if (dx < -threshold) go(1);
      // `moved` se limpia después del click que genera el navegador
      setTimeout(() => { moved = false; }, 0);
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('pointerleave', end);

    layout();
  }

  /* -----------------------------------------------------------
     4. HUD DEL MAPA (métricas en vivo)
     ----------------------------------------------------------- */
  function initMapHud() {
    const bars = $('[data-bars]');
    const nodes = $('[data-nodes]');
    const flux = $('[data-flux]');
    const BARS = 22;
    bars.innerHTML = '<i></i>'.repeat(BARS);
    const items = $$('i', bars);

    let t = 0;
    const tick = () => {
      t += 0.35;
      items.forEach((b, i) => {
        const h = 3 + Math.abs(Math.sin(t + i * 0.55)) * 9 + Math.random() * 4;
        b.style.height = `${h.toFixed(1)}px`;
      });
      nodes.textContent = String(4809 + Math.round(Math.sin(t * 0.4) * 22 + (Math.random() - 0.5) * 8));
      flux.textContent = `${(2.34 + Math.sin(t * 0.6) * 0.18 + Math.random() * 0.03).toFixed(2)} TB/S`;
    };
    tick();
    setInterval(tick, 700);
  }

  /* -----------------------------------------------------------
     5. MODALES
     ----------------------------------------------------------- */
  function initModals() {
    let lastFocus = null;

    const open = name => {
      const modal = $(`[data-modal="${name}"]`);
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      $('[data-close]', modal)?.focus();
      return modal;
    };
    const close = modal => {
      modal.hidden = true;
      document.body.style.overflow = '';
      if (modal.dataset.modal === 'map') $('[data-map-slot]', modal).innerHTML = '';
      lastFocus?.focus();
    };

    $$('.modal').forEach(m => {
      m.addEventListener('click', e => {
        if (e.target === m || e.target.closest('[data-close]')) close(m);
      });
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const openModal = $$('.modal').find(m => !m.hidden);
      if (openModal) close(openModal);
    });

    // OPEN 3D MAP → modal a pantalla completa con el mismo proyecto
    $('[data-open-map]').addEventListener('click', () => {
      const modal = open('map');
      const src = $('.map-frame__iframe').src;
      $('[data-map-slot]', modal).innerHTML =
        `<iframe src="${src}" title="Chicago 2050 — mapa 3D a pantalla completa" allow="fullscreen" allowfullscreen></iframe>`;
    });

    // ACCESS RESTRICTED FILES → terminal "Acceso denegado"
    $('[data-restricted]').addEventListener('click', () => {
      const modal = open('denied');
      const out = $('[data-terminal]', modal);
      const title = $('.terminal__denied', modal);
      const note = $('.terminal__note', modal);
      $('[data-incident]', modal).textContent = Math.floor(100000 + Math.random() * 899999);
      title.hidden = true; note.hidden = true; out.textContent = '';

      const lines = [
        '> connect archive.chicago2050.gov --classified',
        '> handshake ............ OK',
        '> verifying credentials ...',
        '> clearance level: CIVILIAN / TIER-3',
        '> required level:  ORIGEN / TIER-0',
        '> request rejected.'
      ];
      let li = 0, ci = 0;
      const type = () => {
        if (modal.hidden) return;
        if (li >= lines.length) { title.hidden = false; note.hidden = false; return; }
        out.textContent += lines[li][ci++] ?? '';
        if (ci > lines[li].length) { out.textContent += '\n'; li++; ci = 0; setTimeout(type, 180); }
        else setTimeout(type, 14);
      };
      type();
    });
  }

  /* ----------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initTickers();
    initCarousel();
    initMapHud();
    initModals();
  });
})();
