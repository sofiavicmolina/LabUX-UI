/* =============================================================
   CHICAGO 2050 — glitch.js
   Glitch.out(url, opciones) → rompe la pantalla (~2 s) y navega.
   Glitch.in(opciones)       → al llegar, la imagen se "reconstruye".
   Respeta prefers-reduced-motion: sin parpadeos ni sacudidas.
   ============================================================= */
(() => {
  'use strict';

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const KEY = 'c2050-glitch-in';

  function build({ code = '', title = '', sub = '', colors = ['#ff6b1a', '#2fd3ff', '#1e5bff'], theme = '' } = {}) {
    const fx = document.createElement('div');
    fx.className = `glitch-fx${theme ? ` glitch-fx--${theme}` : ''}`;
    fx.setAttribute('role', 'status');
    fx.setAttribute('aria-live', 'assertive');
    fx.innerHTML = `
      <canvas width="160" height="90" aria-hidden="true"></canvas>
      ${Array.from({ length: 14 }, () => '<span class="glitch-fx__tear" aria-hidden="true"></span>').join('')}
      <div class="glitch-fx__veil"></div>
      <div class="glitch-fx__msg">
        <p class="glitch-fx__code">${code}</p>
        <p class="glitch-fx__title" data-title>${title}</p>
        <p class="glitch-fx__sub">${sub}</p>
      </div>`;
    if (reduced()) fx.classList.add('is-calm');
    document.body.appendChild(fx);

    const canvas = fx.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const tears = [...fx.querySelectorAll('.glitch-fx__tear')];
    const veil = fx.querySelector('.glitch-fx__veil');
    const msg = fx.querySelector('.glitch-fx__msg');
    const titleEl = fx.querySelector('[data-title]');
    let raf = 0, running = false;

    // Ruido de TV + barras de desgarro, a baja resolución
    const noiseFrame = () => {
      const img = ctx.createImageData(160, 90);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = Math.random() * 120;
      }
      ctx.putImageData(img, 0, 0);
      canvas.style.opacity = rand(.08, .55).toFixed(2);
      tears.forEach(t => {
        const on = Math.random() > .45;
        t.style.opacity = on ? rand(.35, .9).toFixed(2) : 0;
        t.style.top = `${rand(0, 100)}%`;
        t.style.height = `${rand(2, 46)}px`;
        t.style.background = colors[Math.floor(Math.random() * colors.length)];
        t.style.transform = `translateX(${rand(-30, 30)}px) scaleX(${rand(.6, 1.4)})`;
      });
    };
    const loop = () => {
      if (!running) return;
      noiseFrame();
      raf = setTimeout(() => requestAnimationFrame(loop), 55);
    };

    // Título que se "decodifica"
    const scramble = (text, ms = 700) => {
      const glyphs = '01<>/\\[]#%&*+=?!ABCDEFGHJKLMNPRSTUVWXYZ';
      const t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / ms);
        const reveal = Math.floor(p * text.length);
        titleEl.textContent = [...text].map((ch, i) =>
          ch === ' ' ? ' ' : i < reveal ? ch : glyphs[Math.floor(Math.random() * glyphs.length)]).join('');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const fade = (el, to, ms) => {
      el.style.transition = `opacity ${ms}ms linear`;
      requestAnimationFrame(() => { el.style.opacity = to; });
    };

    return {
      fx, veil, msg, title,
      start() { if (fx.classList.contains('is-calm')) return; running = true; document.documentElement.classList.add('is-glitching'); loop(); },
      stop() { running = false; clearTimeout(raf); document.documentElement.classList.remove('is-glitching'); canvas.style.opacity = 0; tears.forEach(t => (t.style.opacity = 0)); },
      scramble, fade,
      remove() { this.stop(); fx.remove(); }
    };
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));

  async function out(url, opts = {}) {
    if (document.querySelector('.glitch-fx')) return;
    const g = build(opts);
    try { sessionStorage.setItem(KEY, JSON.stringify(opts.arrive || {})); } catch (_) {}

    if (reduced()) {
      g.fade(g.veil, 1, 400);
      g.fade(g.msg, 1, 300);
      await wait(900);
      window.location.href = url;
      return;
    }
    g.start();
    await wait(450);
    g.fade(g.msg, 1, 120);
    g.scramble(g.title, 700);
    await wait(950);
    g.fade(g.veil, 1, 400);
    await wait(450);
    window.location.href = url;
  }

  async function arrive() {
    let opts = null;
    try { opts = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (_) {}
    if (!opts) { document.dispatchEvent(new CustomEvent('glitch:arrived')); return; }
    document.documentElement.dataset.arriving = 'true';
    const done = () => { delete document.documentElement.dataset.arriving; document.dispatchEvent(new CustomEvent('glitch:arrived')); };
    const g = build(opts);
    g.veil.style.opacity = 1;
    g.msg.style.opacity = 1;
    if (reduced()) {
      await wait(250);
      g.fade(g.msg, 0, 250); g.fade(g.veil, 0, 450);
      await wait(500); g.remove(); done(); return;
    }
    g.start();
    g.scramble(g.title, 450);
    await wait(500);
    g.fade(g.msg, 0, 200);
    g.fade(g.veil, 0, 450);
    await wait(350);
    done();                                   // la página ya se ve: puede empezar a animarse
    await wait(300);
    g.remove();
  }

  window.Glitch = { out, arrive };
  document.addEventListener('DOMContentLoaded', arrive);
})();
