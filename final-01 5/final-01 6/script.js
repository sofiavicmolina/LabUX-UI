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
     1. NAVEGACIÓN
     ----------------------------------------------------------- */
  function initNav() {
    const list = $('#nav-list');
    const links = $$('.tab-btn', list);

    // El botón >_ MENU (móvil) abre el overlay de menu.js

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
     3. CARRUSEL DE CREDENCIALES
     ----------------------------------------------------------- */

  // Marco en capas (viewBox 300×400): panel de foto con pestaña, columna lateral y bloque de nombre
  const FRAME = `
    <svg class="id__frame" viewBox="0 0 300 400" aria-hidden="true">
      <path class="id__panel" d="M14 22 H74 L84 10 H146 L156 22 H212 L222 32 V282 L212 292 H14 L6 284 V30 Z"/>
      <path class="id__panel" d="M234 6 H286 L296 16 V384 L286 394 H258 L232 368 V280 L226 272 V14 Z"/>
      <path class="id__panel" d="M14 300 H136 L146 310 H214 L222 318 V368 L236 382 V394 H14 L6 386 V308 Z"/>
      <path class="id__panel--inner" d="M240 44 H290 M240 296 H290"/>
      <circle class="id__accent" cx="17" cy="16" r="2.4"/><circle class="id__accent" cx="25" cy="16" r="2.4"/>
      <circle class="id__accent" cx="17" cy="387" r="2.4"/><circle class="id__accent" cx="25" cy="387" r="2.4"/>
      <path class="id__accent" d="M264 14 Q265 24 274 25 Q265 26 264 36 Q263 26 254 25 Q263 24 264 14 Z"/>
    </svg>`;

  const EMBLEM = `
    <svg viewBox="0 0 60 60" aria-hidden="true" fill="none" stroke="#00FF41">
      <circle cx="30" cy="30" r="17" stroke-width="2.2"/>
      <circle cx="30" cy="30" r="9" stroke-width="1.6"/>
      <path d="M30 4 V18 M30 42 V56 M4 30 H18 M42 30 H56" stroke-width="1.6"/>
      <path d="M50 8 L12 50" stroke-width="3.4" stroke-linecap="round"/>
    </svg>`;

  function buildCard(card) {
    const img = $('.card__img', card);
    const title = $('.card__title', card).textContent.trim();
    const unit = $('.card__unit', card).textContent.trim();
    const { id = '', issue = '', tier = '', code = '' } = card.dataset;
    const photo = document.createElement('div');
    photo.className = 'id__photo';
    photo.appendChild(img);

    card.insertAdjacentHTML('afterbegin', FRAME);
    $('.id__frame', card).after(photo);
    card.insertAdjacentHTML('beforeend', `
      <p class="id__brand" aria-hidden="true">CHICAGO 2050</p>
      <div class="id__side">
        <div><span>UNIT ID</span><b>${id}</b></div>
        <div><span>ISSUE DATE</span><b>${issue}</b></div>
        <div><span>ACCESS TIER</span><b>${tier}</b></div>
      </div>
      <div class="id__emblem">${EMBLEM}<p>C2050</p></div>
      <div class="id__name">
        <p class="id__k">${unit}</p>
        <p class="id__title">${title}:</p>
        <p class="id__k">MISSION CODE</p>
        <p class="id__v">${code}</p>
        <p class="id__legal">©&amp;© CHICAGO 2050 PUBLIC SYSTEM INC.</p>
      </div>`);
    // Títulos largos: se reduce el tamaño para que quepan en una línea
    const label = `${title}:`;
    if (label.length > 12) $('.id__title', card).style.fontSize = `${Math.min(6.6, 50 / (label.length * 0.6)).toFixed(2)}cqw`;
    // El h3 original queda oculto visualmente pero sirve de título accesible
    $('.card__title', card).classList.add('sr-only');
  }

  function initCarousel() {
    const root   = $('[data-carousel]');
    const stage  = $('[data-stage]', root);
    const dotsEl = $('[data-dots]', root);
    const tab    = $('[data-click-tab]', root);
    const tabLabel = $('[data-click-label]', root);

    const originals = $$('.card', stage);
    const COUNT = originals.length;
    originals.forEach(buildCard);

    // Se clona el set (4 → 8) para que siempre haya 5 visibles en el bucle infinito
    originals.forEach(c => {
      const clone = c.cloneNode(true);
      clone.setAttribute('data-clone', '');
      stage.appendChild(clone);
    });
    const cards = $$('.card', stage);
    const N = cards.length;
    let active = 0;
    cards.forEach((c, i) => {
      c.dataset.index = i;
      c.setAttribute('aria-roledescription', 'slide');
      c.setAttribute('aria-label', `${$('.card__title', c).textContent} (${(i % COUNT) + 1} of ${COUNT})`);
    });

    dotsEl.innerHTML = originals.map((c, i) =>
      `<button role="tab" aria-label="${$('.card__title', c).textContent}" data-dot="${i}"></button>`).join('');
    const dots = $$('[data-dot]', dotsEl);

    function layout() {
      cards.forEach((card, i) => {
        let off = ((i - active) % N + N) % N;
        if (off > N / 2) off -= N;
        card.dataset.pos = Math.abs(off) <= 2 ? String(off) : (off < 0 ? 'hidden-l' : 'hidden-r');
        card.classList.toggle('is-active', off === 0);
        card.tabIndex = off === 0 ? 0 : -1;
        card.setAttribute('aria-hidden', Math.abs(off) > 2 ? 'true' : 'false');
      });
      const real = active % COUNT;
      dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === real)));
    }

    const go = step => { if (panel.isOpen()) return; active = ((active + step) % N + N) % N; layout(); };
    const goTo = idx => {
      let diff = ((idx - active) % N + N) % N;
      if (diff > N / 2) diff -= N;
      go(diff);
    };
    const dist = idx => { const d = ((idx - active) % N + N) % N; return Math.abs(d > N / 2 ? d - N : d); };

    /* ---------- Panel de servicio ---------- */
    const panel = (() => {
      const el = $('[data-svc]', root);
      const titleEl = $('[data-svc-title]', el);
      const listEl = $('[data-svc-list]', el);
      const reserve = $('[data-svc-reserve]', el);
      let open = false, timer = null, scrambleTimer = null;

      // Posiciona el panel para que su línea base quede justo encima del botón
      const place = () => {
        const stem = parseFloat(getComputedStyle(el).getPropertyValue('--stem')) || 44;
        const bottom = root.clientHeight - tab.offsetTop + stem;
        el.style.setProperty('--svc-bottom', `${bottom}px`);
      };

      // Efecto "decodificar": caracteres aleatorios que se resuelven en el texto final
      const scramble = text => {
        const glyphs = '01<>/\\[]#%&*+=ABCDEFGHJKLMNPRSTUVWXYZ';
        let frame = 0;
        clearInterval(scrambleTimer);
        scrambleTimer = setInterval(() => {
          const reveal = Math.floor(frame / 2);
          titleEl.textContent = [...text].map((ch, i) =>
            ch === ' ' ? ' ' : i < reveal ? ch : glyphs[Math.floor(Math.random() * glyphs.length)]).join('');
          frame++;
          if (reveal >= text.length) clearInterval(scrambleTimer);
        }, 28);
      };

      const fill = card => {
        const tpl = $('.card__details', card);
        const frag = tpl.content.cloneNode(true);
        const unit = $('.card__unit', card).textContent.trim();
        $('[data-svc-unit]', el).textContent = `SERVICE // ${unit}`;
        $('[data-svc-lead]', el).textContent = $('.lead', frag)?.textContent || '';
        $('[data-svc-price]', el).textContent = $('.price', frag)?.textContent || '';
        listEl.innerHTML = '';
        $$('li', frag).forEach((li, i) => { li.style.setProperty('--i', i + 2); listEl.appendChild(li); });
        $('[data-svc-lead]', el).style.setProperty('--i', 1);
        $('.svc__foot', el).style.setProperty('--i', $$('li', listEl).length + 2);
        reserve.textContent = 'RESERVE ACCESS';
        reserve.classList.remove('is-done');
        titleEl.textContent = '';
        return $('h4', frag)?.textContent || '';
      };

      const show = () => {
        if (open) return;
        const card = cards[active];
        const title = fill(card);
        clearTimeout(timer);
        el.classList.remove('is-closing', 'is-open');
        el.hidden = false;
        place();
        void el.offsetWidth;                    // reinicia las transiciones
        el.classList.add('is-open');
        root.classList.add('svc-open');
        tab.setAttribute('aria-expanded', 'true');
        tabLabel.textContent = '↓ close';
        open = true;
        // el título se decodifica cuando el panel termina de crecer
        timer = setTimeout(() => scramble(title), 900);
        setTimeout(() => $('[data-svc-close]', el).focus({ preventScroll: true }), 950);
      };

      const hide = (returnFocus = true) => {
        if (!open) return;
        open = false;
        clearTimeout(timer); clearInterval(scrambleTimer);
        el.classList.add('is-closing');
        el.classList.remove('is-open');
        root.classList.remove('svc-open');
        tab.setAttribute('aria-expanded', 'false');
        tabLabel.textContent = '↑ click here';
        timer = setTimeout(() => { el.hidden = true; el.classList.remove('is-closing'); }, 650);
        if (returnFocus) tab.focus({ preventScroll: true });
      };

      $('[data-svc-close]', el).addEventListener('click', () => hide());
      reserve.addEventListener('click', () => {
        reserve.textContent = 'REQUEST LOGGED ✓';
        reserve.classList.add('is-done');
      });
      window.addEventListener('resize', () => { if (open) place(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) hide(); });
      // clic fuera del panel lo cierra
      document.addEventListener('pointerdown', e => {
        if (open && !el.contains(e.target) && !tab.contains(e.target)) hide(false);
      });

      return { show, hide, toggle: () => (open ? hide() : show()), isOpen: () => open };
    })();

    /* ---------- Controles ---------- */
    $('[data-prev]', root).addEventListener('click', () => go(-1));
    $('[data-next]', root).addEventListener('click', () => go(1));
    dots.forEach(d => d.addEventListener('click', () => {
      const t = Number(d.dataset.dot), alt = t + COUNT;
      goTo(dist(t) <= dist(alt) ? t : alt);
    }));

    tab.addEventListener('click', () => panel.toggle());

    // Clic en tarjetas laterales → se centran; en la central → abre el panel
    stage.addEventListener('click', e => {
      if (moved) return;
      const card = e.target.closest('.card');
      if (!card) return;
      const idx = Number(card.dataset.index);
      if (idx === active) panel.show();
      else goTo(idx);
    });

    root.addEventListener('keydown', e => {
      if (panel.isOpen()) return;
      if (e.key === 'ArrowLeft')  { go(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(1);  e.preventDefault(); }
      if (e.key === 'Enter' && e.target.classList.contains('card')) panel.show();
    });

    // Arrastre / swipe
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
     MAPA EN PANTALLAS TÁCTILES: el iframe 3D no atrapa el dedo
     al hacer scroll. Se activa con un toque y se bloquea al salir.
     ----------------------------------------------------------- */
  function initMapTouch() {
    const frame = $('[data-map-frame]');
    if (!frame || !window.matchMedia('(pointer: coarse)').matches) return;
    frame.classList.add('is-locked');
    frame.insertAdjacentHTML('beforeend', `
      <div class="map-lock"><button class="map-lock__btn" type="button">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 11V5a2 2 0 0 1 4 0v6m0-1a2 2 0 0 1 4 0v3a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-3a1.6 1.6 0 0 1 2.6-1.8L9 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        TAP TO EXPLORE THE MAP</button></div>
      <button class="map-relock" type="button" hidden>✕ DONE · BACK TO SCROLL</button>`);
    const lock = $('.map-lock', frame), relock = $('.map-relock', frame);
    const setLocked = v => { frame.classList.toggle('is-locked', v); lock.hidden = !v; relock.hidden = v; };
    $('.map-lock__btn', frame).addEventListener('click', () => setLocked(false));
    relock.addEventListener('click', () => setLocked(true));
    new IntersectionObserver(([e]) => { if (!e.isIntersecting) setLocked(true); }, { threshold: 0 }).observe(frame);
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
        `<iframe src="${src}" title="Chicago 2050 — full-screen 3D map" allow="fullscreen" allowfullscreen></iframe>`;
    });

    // ACCESS RESTRICTED FILES → glitch y paso a la parte B (HUMAN ERROR)
    $('[data-restricted]').addEventListener('click', () => {
      window.Glitch?.out('human-error.html', {
        code: '// ACCESS DENIED → OVERRIDE DETECTED',
        title: 'SIGNAL INTERRUPTED',
        sub: 'OPENING THE BLACK BOX…',
        colors: ['#ff6b1a', '#2fd3ff', '#00FF41', '#1e5bff'],
        arrive: {
          code: '// TRANSMISSION 07 · UNIT A-7 “SHEPHERD”',
          title: 'HUMAN ERROR',
          sub: 'THIS IS THE CHICAGO THEY DO NOT SELL',
          colors: ['#ff6b1a', '#2fd3ff', '#1e5bff']
        }
      });
    });
  }


  /* -----------------------------------------------------------
     ESPÉCIMEN: hepática (Hepatica, hojas trilobuladas) que se abre
     cuando se carga la página. Todo dibujado con código.
     ----------------------------------------------------------- */
  function initSpecimen() {
    const host = $('[data-specimen]');
    if (!host) return;

    // tépalo ovalado que nace en el origen y apunta hacia arriba
    const tepal = (len, w) =>
      `M0 0 C${-w * .95} ${-len * .22} ${-w} ${-len * .78} 0 ${-len} C${w} ${-len * .78} ${w * .95} ${-len * .22} 0 0 Z`;

    // flor completa: tépalos (con ángulo de botón cerrado), estambres y pistilos
    const flower = (cx, cy, size, n, delay, id) => {
      let petals = '';
      for (let i = 0; i < n; i++) {
        const ang = -90 + i * (360 / n) + (i % 2 ? 6 : 0);          // reparto radial, con leve irregularidad
        const len = size * (i % 2 ? .92 : 1);
        const closed = (90 + ang) * -.88;                           // gira hacia arriba = botón cerrado
        petals += `
          <g transform="rotate(${(ang + 90).toFixed(1)})">
            <g class="hep__tepal" style="--close:${closed.toFixed(1)}deg; --d:${(delay + i * .07).toFixed(2)}s">
              <path d="${tepal(len, size * .36)}" fill="url(#hep-tepal)"/>
              <path d="M0 -4 Q1 ${(-len * .5).toFixed(1)} 0 ${(-len + 8).toFixed(1)}" class="hep__vein"/>
            </g>
          </g>`;
      }
      let stamens = '';
      for (let i = 0; i < 22; i++) {
        const a = i * 137.5 * Math.PI / 180, r = size * (.1 + (i % 5) * .03);
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        stamens += `<line x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="hep__filament"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(size * .028).toFixed(1)}" class="hep__anther"/>`;
      }
      return `
        <g class="hep__flower" id="${id}" transform="translate(${cx} ${cy}) scale(1 .86)">
          <g class="hep__petals">${petals}</g>
          <g class="hep__center" style="--d:${(delay + 1.1).toFixed(2)}s">
            ${stamens}
            <circle r="${(size * .1).toFixed(1)}" class="hep__pistil"/>
          </g>
        </g>`;
    };

    // hoja de hepática: tres lóbulos redondeados
    const leaf = (x, y, s, rot, delay) => `
      <g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
        <g class="hep__leaf" style="--d:${delay}s">
          <path d="M0 0 C-30 -6 -64 -20 -60 -48 C-57 -70 -34 -74 -24 -62 C-30 -88 -8 -104 8 -96 C24 -104 44 -88 36 -62 C48 -74 70 -68 70 -46 C72 -20 34 -6 0 0 Z" fill="url(#hep-leaf)"/>
          <path d="M0 0 L-40 -50 M0 0 L6 -84 M0 0 L48 -50" class="hep__vein hep__vein--leaf"/>
        </g>
      </g>`;

    host.innerHTML = `
      <svg viewBox="0 0 600 340" aria-hidden="true">
        <defs>
          <linearGradient id="hep-tepal" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stop-color="#157a35"/><stop offset=".5" stop-color="#49d873"/><stop offset="1" stop-color="#bfffd0"/>
          </linearGradient>
          <linearGradient id="hep-leaf" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stop-color="#063a1a"/><stop offset="1" stop-color="#2fae55"/>
          </linearGradient>
          <radialGradient id="hep-glow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stop-color="#f2fff5" stop-opacity=".9"/><stop offset="1" stop-color="#7dffa2" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <path d="M60 332 H540 M120 338 H480" class="hep__ground"/>
        <!-- tallos -->
        <path d="M300 332 C298 280 304 220 300 158" class="hep__stem" style="--d:.1s"/>
        <path d="M300 300 C330 280 380 262 404 214" class="hep__stem hep__stem--b" style="--d:.5s"/>
        <path d="M300 318 C260 300 216 290 196 246" class="hep__stem hep__stem--b" style="--d:.4s"/>
        <!-- hojas trilobuladas -->
        ${leaf(214, 332, 1.05, -28, .45)}
        ${leaf(388, 334, .95, 30, .6)}
        ${leaf(300, 336, .7, 4, .75)}
        <!-- flores -->
        <circle cx="300" cy="150" r="96" fill="url(#hep-glow)" class="hep__halo"/>
        ${flower(300, 150, 92, 8, .5, 'hep-main')}
        ${flower(404, 206, 40, 7, 1.2, 'hep-small')}
        ${flower(196, 240, 26, 6, 1.6, 'hep-bud')}
      </svg>`;

    // La flor se abre al cargar; si se llega con el glitch, espera a que termine
    const bloom = () => requestAnimationFrame(() => host.classList.add('is-open'));
    if (document.documentElement.dataset.arriving === 'true') {
      document.addEventListener('glitch:arrived', bloom, { once: true });
      setTimeout(bloom, 2500);                 // por si acaso
    } else bloom();
  }

  /* ----------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initSpecimen();
    initTickers();
    initCarousel();
    initMapHud();
    initMapTouch();
    initModals();
  });
})();
