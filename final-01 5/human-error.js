/* =============================================================
   CHICAGO 2050 — PARTE B · HUMAN ERROR — human-error.js
   Módulos: navegación · cinta · reloj · revelado · memorias · regreso
   ============================================================= */
(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const STORE = 'c2050-human-error-memories';

  /* ---------- 1. Navegación ---------- */
  function initNav() {
    const list = $('#nav-list');
    // El botón >_ MENU (móvil) abre el overlay de menu.js

    const links = $$('a.tab-btn', list);
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.remove('is-active'));
      map.get(e.target.id)?.classList.add('is-active');
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- 2. Cinta de advertencia ---------- */
  function initTicker() {
    $$('[data-ticker]').forEach(track => {
      const text = track.textContent.trim().replace(/\s+/g, ' ');
      track.innerHTML = `<span>${text}</span>`.repeat(6);
    });
  }

  /* ---------- 3. Reloj de la transmisión ---------- */
  function initClock() {
    const el = $('[data-clock]');
    const pad = n => String(n).padStart(2, '0');
    const tick = () => {
      const d = new Date();
      el.textContent = `2050.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    tick(); setInterval(tick, 1000);
  }

  /* ---------- 4. Revelado al hacer scroll ---------- */
  function initReveal() {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window)) { items.forEach(i => i.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }), { threshold: .2 });
    items.forEach(i => io.observe(i));
  }

  /* ---------- 5. Memorias (archivo local) ---------- */
  const escape = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function readMemories() {
    try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (_) { return []; }
  }
  function saveMemories(list) {
    try { localStorage.setItem(STORE, JSON.stringify(list)); return true; } catch (_) { return false; }
  }
  function renderMemory(m, { prepend = false, highlight = false } = {}) {
    const grid = $('[data-voices]');
    const li = document.createElement('li');
    li.className = 'voice voice--user reveal is-in';
    li.innerHTML = `
      <blockquote>${escape(m.text)}</blockquote>
      <p class="voice__who"><b>${escape(m.name || 'ANONYMOUS').toUpperCase()}</b>${m.place ? ` · ${escape(m.place)}` : ''} · your memory</p>`;
    prepend ? grid.prepend(li) : grid.appendChild(li);
    if (highlight) {
      li.setAttribute('tabindex', '-1');
      li.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      li.focus({ preventScroll: true });
    }
  }

  function initMemories() {
    readMemories().forEach(m => renderMemory(m));

    const form = $('[data-memory-form]');
    const text = $('#m-text', form);
    const count = $('[data-count-chars]', form);
    const status = $('[data-memory-status]', form);

    const update = () => { count.textContent = `${text.value.length} / 280`; };
    text.addEventListener('input', () => { update(); text.removeAttribute('aria-invalid'); status.textContent = ''; status.classList.remove('is-error'); });
    update();

    form.addEventListener('submit', e => {
      e.preventDefault();
      const value = text.value.trim();
      if (value.length < 3) {
        text.setAttribute('aria-invalid', 'true');
        status.textContent = 'Write at least a few words. The archive does not accept silence as data.';
        status.classList.add('is-error');
        text.focus();
        return;
      }
      const memory = {
        name: $('#m-name', form).value.trim().slice(0, 40),
        place: $('#m-place', form).value.trim().slice(0, 40),
        text: value.slice(0, 280),
        at: Date.now()
      };
      const list = readMemories(); list.push(memory);
      const saved = saveMemories(list);
      renderMemory(memory, { highlight: true });
      form.reset(); update();
      status.classList.remove('is-error');
      status.textContent = saved
        ? 'Memory added to the archive. It lives in this browser.'
        : 'Memory added for this visit. Your browser does not allow saving it.';
    });
  }

  /* ---------- 6. Regreso al sistema oficial ---------- */
  function initReturn() {
    $$('[data-return]').forEach(btn => btn.addEventListener('click', () => {
      window.Glitch?.out('index.html#archive', {
        code: '// RESTORING OFFICIAL NARRATIVE',
        title: 'SYSTEM RESTORED',
        sub: 'EVERYTHING IS UNDER CONTROL. (IT IS NOT.)',
        colors: ['#00FF41', '#10E84C', '#2fd3ff', '#ff6b1a'],
        theme: 'green',
        arrive: {
          code: '// PUBLIC INFORMATION SYSTEM',
          title: 'WELCOME BACK',
          sub: 'CERTIFIED NATURE. TIERED ACCESS.',
          colors: ['#00FF41', '#10E84C', '#0F5223'],
          theme: 'green'
        }
      });
    }));
  }


  /* ---------- 7. Credenciales del manifiesto ---------- */
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
    <svg viewBox="0 0 60 60" aria-hidden="true" fill="none" stroke="#FF6B1A">
      <circle cx="30" cy="30" r="17" stroke-width="2.2"/>
      <circle cx="30" cy="30" r="9" stroke-width="1.6"/>
      <path d="M30 4 V18 M30 42 V56 M4 30 H18 M42 30 H56" stroke-width="1.6"/>
      <path d="M50 8 L12 50" stroke-width="3.4" stroke-linecap="round"/>
    </svg>`;

  function initClauses() {
    $$('.idc').forEach(card => {
      const img = $('.idc__img', card);
      const unit = $('.idc__unit', card).textContent.trim();
      const title = $('.idc__title', card);
      const { id = '', filed = '', verdict = '', code = '' } = card.dataset;

      const photo = document.createElement('div');
      photo.className = 'idc__photo';
      photo.appendChild(img);
      card.insertAdjacentHTML('afterbegin', FRAME);
      $('.id__frame', card).after(photo);
      card.insertAdjacentHTML('beforeend', `
        <div class="idc__side" aria-hidden="true">
          <div><span>CLAUSE ID</span><b>${id}</b></div>
          <div><span>FILED</span><b>${filed}</b></div>
          <div class="is-alert"><span>SYSTEM VERDICT</span><b>${verdict}</b></div>
        </div>
        <div class="idc__emblem" aria-hidden="true">${EMBLEM}<p>H/ERR</p></div>
        <div class="idc__name" aria-hidden="true">
          <p class="idc__k">${unit}</p>
          <p class="idc__phrase">${title.textContent.trim()}</p>
          <p class="idc__v">${code}</p>
        </div>`);
      // el h3 original queda como texto accesible
      title.classList.add('sr-only');
    });
  }


  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initClauses();
    initTicker();
    initClock();
    initReveal();
    initMemories();
    initReturn();
  });
})();
