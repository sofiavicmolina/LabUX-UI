/* =============================================================
   CHICAGO 2050 — menu.js
   Abre/cierra el overlay de navegación ([data-menu]) desde cualquier
   botón con [data-menu-open]. Accesible: Esc cierra, el foco queda
   dentro del menú y vuelve al botón al cerrar.
   ============================================================= */
(() => {
  'use strict';

  // Baja a una sección compensando el encabezado fijo y actualiza la URL
  function goTo(hash) {
    const id = (hash || '').replace('#', '');
    const target = id === 'top' ? null : document.getElementById(id);
    const header = document.querySelector('.site-header');
    const offset = (header?.offsetHeight || 0) + 8;
    const y = target ? target.getBoundingClientRect().top + window.scrollY - offset : 0;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => window.scrollTo({ top: Math.max(0, y), behavior: smooth ? 'smooth' : 'auto' }));
    try { history.replaceState(null, '', `#${id}`); } catch (_) {}
    if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  }

  function init() {
    const menu = document.querySelector('[data-menu]');
    if (!menu) return;
    const openers = [...document.querySelectorAll('[data-menu-open]')];
    const links = [...menu.querySelectorAll('.menu__link')];
    let lastFocus = null, timer = null;

    links.forEach((l, i) => l.closest('.menu__item')?.style.setProperty('--i', i));

    const setExpanded = v => openers.forEach(b => b.setAttribute('aria-expanded', String(v)));

    const open = () => {
      clearTimeout(timer);
      lastFocus = document.activeElement;
      menu.classList.remove('is-closing');
      menu.hidden = false;
      void menu.offsetWidth;                 // reinicia las transiciones
      menu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setExpanded(true);
      markCurrent();
      setTimeout(() => (links[0] || menu.querySelector('[data-menu-close]'))?.focus({ preventScroll: true }), 400);
    };

    const close = (restoreFocus = true) => {
      if (menu.hidden) return;
      menu.classList.add('is-closing');
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
      setExpanded(false);
      timer = setTimeout(() => { menu.hidden = true; menu.classList.remove('is-closing'); }, 520);
      if (restoreFocus) lastFocus?.focus({ preventScroll: true });
    };

    // Marca la sección en la que está el usuario
    const markCurrent = () => {
      let current = null;
      links.forEach(l => {
        const id = l.getAttribute('href')?.slice(1);
        const sec = id && document.getElementById(id);
        if (sec && sec.getBoundingClientRect().top <= window.innerHeight * .4) current = l;
        l.removeAttribute('aria-current');
      });
      current?.setAttribute('aria-current', 'true');
    };

    openers.forEach(b => b.addEventListener('click', () => (menu.hidden ? open() : close())));
    menu.querySelectorAll('[data-menu-close]').forEach(b => b.addEventListener('click', () => close()));
    menu.addEventListener('click', e => { if (e.target === menu) close(); });

    // Enlaces a secciones: cierra el menú y baja a la sección
    links.forEach(l => l.addEventListener('click', e => {
      e.preventDefault();
      const trigger = l.dataset.menuTrigger;
      close(false);
      if (trigger) {                          // salto a la otra parte (glitch)
        setTimeout(() => document.querySelector(trigger)?.click(), 300);
        return;
      }
      goTo(l.getAttribute('href'));
    }));

    document.addEventListener('keydown', e => {
      if (menu.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const focusables = [...menu.querySelectorAll('a, button')].filter(el => !el.disabled);
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }


  /* -----------------------------------------------------------
     Tarjetas de vista previa en los botones del encabezado:
     una línea baja del botón y se despliega la tarjeta.
     ----------------------------------------------------------- */
  function initPreviews() {
    const tabs = [...document.querySelectorAll('[data-preview]')];
    if (!tabs.length) return;

    const card = document.createElement('div');
    card.className = 'pv';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-labelledby', 'pv-title');
    card.hidden = true;
    card.innerHTML = `
      <span class="pv__stem" aria-hidden="true"></span>
      <div class="pv__reveal">
        <div class="pv__frame">
          <div class="pv__inner">
            <div class="pv__bar" aria-hidden="true"><span class="pv__bars"></span><span>ACCESS FILE</span><span data-pv-id></span></div>
            <div class="pv__content" data-pv-content></div>
            <div class="pv__actions">
              <a class="pv__go" href="#" data-pv-go></a>
              <button class="pv__close" type="button" data-pv-close>CLOSE</button>
            </div>
            <span class="pv__stripes" aria-hidden="true"></span>
          </div>
        </div>
      </div>`;
    document.body.appendChild(card);

    const content = card.querySelector('[data-pv-content]');
    const go = card.querySelector('[data-pv-go]');
    const fileId = card.querySelector('[data-pv-id]');
    let current = null, timer = null;

    const place = tab => {
      const r = tab.getBoundingClientRect();
      const header = document.querySelector('.site-header');
      const top = (header ? header.getBoundingClientRect().bottom : r.bottom) + 30;
      const width = Math.min(380, window.innerWidth - 24);
      const center = r.left + r.width / 2;
      const left = Math.max(12, Math.min(window.innerWidth - width - 12, center - width / 2));
      card.style.setProperty('--pv-top', `${top}px`);
      card.style.setProperty('--pv-left', `${left}px`);
      card.style.setProperty('--pv-w', `${width}px`);
      card.style.setProperty('--pv-stem-x', `${center - left}px`);
      card.style.setProperty('--pv-stem-h', `${top - r.bottom}px`);
    };

    const open = tab => {
      const tpl = document.getElementById(tab.dataset.preview);
      if (!tpl) return;
      clearTimeout(timer);
      content.replaceChildren(tpl.content.cloneNode(true));
      content.querySelector('.pv__t')?.setAttribute('id', 'pv-title');
      content.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--i', i));
      go.textContent = tpl.dataset.pvGo || 'ENTER SECTION →';
      go.setAttribute('href', tab.getAttribute('href') || '#');
      go.dataset.trigger = tpl.dataset.pvTrigger || '';
      fileId.textContent = `#${String(tabs.indexOf(tab) + 1).padStart(2, '0')}`;
      card.classList.toggle('pv--hot', tab.classList.contains('tab-btn--return'));

      tabs.forEach(t => t.setAttribute('aria-expanded', String(t === tab)));
      current = tab;
      place(tab);
      card.classList.remove('is-open', 'is-closing');
      card.hidden = false;
      void card.offsetWidth;
      card.classList.add('is-open');
      setTimeout(() => go.focus({ preventScroll: true }), 650);
    };

    const close = (restore = true) => {
      if (card.hidden || !current) return;
      const tab = current; current = null;
      tab.setAttribute('aria-expanded', 'false');
      card.classList.add('is-closing');
      card.classList.remove('is-open');
      timer = setTimeout(() => { card.hidden = true; card.classList.remove('is-closing'); }, 420);
      if (restore) tab.focus({ preventScroll: true });
    };

    tabs.forEach(tab => tab.addEventListener('click', e => {
      e.preventDefault();
      if (current === tab) close(); else open(tab);
    }));
    card.querySelector('[data-pv-close]').addEventListener('click', () => close());
    go.addEventListener('click', e => {
      e.preventDefault();
      const trigger = go.dataset.trigger;
      const href = go.getAttribute('href');
      close(false);
      if (trigger) setTimeout(() => document.querySelector(trigger)?.click(), 250);
      else goTo(href);
    });
    document.addEventListener('pointerdown', e => {
      if (current && !card.contains(e.target) && !current.contains(e.target)) close(false);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && current) close(); });
    window.addEventListener('resize', () => { if (current) place(current); });
    window.addEventListener('scroll', () => { if (current) place(current); }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', () => { init(); initPreviews(); });
})();
