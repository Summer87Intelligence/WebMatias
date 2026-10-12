// Carrusel 3D de videos. Los datos vienen de media/galeria.js (window.GALERIA).
(() => {
  const items = window.GALERIA || [];
  const section = document.getElementById('galeria');
  const root = document.getElementById('g3d');
  if (!section || !root) return;
  if (!items.length) { section.hidden = true; return; }

  // --- Tiras de fotos que pasan arriba y abajo ---
  const fillStrip = (id, fotos) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!fotos || !fotos.length) { el.hidden = true; return; }
    const track = el.firstElementChild;
    // se duplica el contenido para que el loop sea continuo
    fotos.concat(fotos).forEach(src => {
      const f = document.createElement('figure');
      const img = document.createElement('img');
      img.src = src; img.alt = ''; img.loading = 'lazy'; img.draggable = false;
      f.appendChild(img);
      track.appendChild(f);
    });
    track.style.animationDuration = fotos.length * 4.5 + 's';
  };
  fillStrip('stripTop', window.FOTOS_ARRIBA);
  fillStrip('stripBottom', window.FOTOS_ABAJO);

  const stage = document.getElementById('g3dStage');
  const curEl = document.getElementById('g3dCur');
  const bar = document.getElementById('g3dBar');
  const N = items.length;
  const pad = n => String(n).padStart(2, '0');
  const mod = n => ((n % N) + N) % N;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('g3dTot').textContent = pad(N);

  // --- Tarjetas ---
  const cards = items.map((it, i) => {
    const c = document.createElement('div');
    c.className = 'g3d__card';
    c.dataset.i = i;
    c.innerHTML = '<img alt="Video de entrenamiento ' + (i + 1) + '" draggable="false"><span class="g3d__play"></span>';
    stage.appendChild(c);
    return c;
  });

  let cur = 0;        // índice activo
  let pos = 0;        // posición fraccional (para arrastre)
  let inView = false;
  let lbOpen = false;
  let playTimer, autoTimer;

  const metrics = () => {
    const w = root.clientWidth;
    const cardW = cards[0].offsetWidth || 280;
    return { vis: w < 700 ? 2 : w < 1100 ? 3 : 4, first: cardW * 0.78, step: cardW * 0.46 };
  };

  function layout() {
    const m = metrics();
    cards.forEach((c, i) => {
      let d = i - pos;
      d -= Math.round(d / N) * N;               // camino más corto (carrusel infinito)
      const a = Math.abs(d);
      if (a > m.vis + 1) { c.style.display = 'none'; return; }
      c.style.display = '';
      const img = c.firstChild;
      if (!img.src) img.src = items[i].poster;
      const s = Math.sign(d);
      const x = s * (Math.min(a, 1) * m.first + Math.max(a - 1, 0) * m.step);
      const z = -Math.min(a, 1) * 220 - Math.max(a - 1, 0) * 120;
      const ry = -s * Math.min(a, 1) * 48;
      c.style.transform = `translate(-50%,-50%) translateX(${x}px) translateZ(${z}px) rotateY(${ry}deg)`;
      c.style.zIndex = 100 - Math.round(a * 10);
      c.style.opacity = a > m.vis ? 0 : 1;
      c.style.setProperty('--dim', Math.min(a * 0.34, 0.8));
      c.classList.toggle('is-active', i === mod(Math.round(pos)));
    });
  }

  function stopVideo() {
    stage.querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); });
    cards.forEach(c => c.classList.remove('is-playing'));
  }

  function playActive() {
    clearTimeout(playTimer);
    stopVideo();
    if (!inView || lbOpen) return;
    playTimer = setTimeout(() => {
      const c = cards[cur];
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      v.src = items[cur].src;
      v.addEventListener('playing', () => c.classList.add('is-playing'), { once: true });
      c.insertBefore(v, c.lastChild);
      v.play().catch(() => {});
    }, 450);
  }

  function go(i) {
    cur = mod(i);
    // mantener pos cerca del destino por el camino más corto
    let d = cur - pos; d -= Math.round(d / N) * N;
    pos += d;
    root.classList.remove('is-dragging');
    layout();
    pos = cur;
    curEl.textContent = pad(cur + 1);
    bar.style.transform = `scaleX(${(cur + 1) / N})`;
    playActive();
    restartAuto();
  }

  function restartAuto() {
    clearInterval(autoTimer);
    if (reduced) return;
    autoTimer = setInterval(() => {
      if (inView && !lbOpen && !root.matches(':hover') && !root.classList.contains('is-dragging')) go(cur + 1);
    }, 6000);
  }

  // --- Controles ---
  document.getElementById('g3dPrev').addEventListener('click', e => { e.stopPropagation(); go(cur - 1); });
  document.getElementById('g3dNext').addEventListener('click', e => { e.stopPropagation(); go(cur + 1); });
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') go(cur - 1);
    if (e.key === 'ArrowRight') go(cur + 1);
    if (e.key === 'Enter') openLb(cur);
  });

  // Arrastre / swipe
  let drag = null;
  root.addEventListener('pointerdown', e => {
    if (e.target.closest('.g3d__arrow')) return;
    drag = { x: e.clientX, start: pos, moved: 0, card: e.target.closest('.g3d__card') };
  });
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    if (drag.moved > 6) {
      root.classList.add('is-dragging');
      pos = drag.start - dx / (metrics().first * 0.9);
      layout();
    }
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.moved > 6) { go(Math.round(pos)); return; }
    if (!d.card) return;
    const i = +d.card.dataset.i;
    if (i === cur) openLb(i); else go(i);
  });
  root.addEventListener('dragstart', e => e.preventDefault());

  // Inclinación 3D siguiendo el mouse
  if (!reduced && matchMedia('(hover: hover)').matches) {
    root.addEventListener('pointermove', e => {
      const r = root.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      stage.style.setProperty('--tx', (-py * 7).toFixed(2) + 'deg');
      stage.style.setProperty('--ty', (px * 9).toFixed(2) + 'deg');
    });
    root.addEventListener('pointerleave', () => {
      stage.style.setProperty('--tx', '0deg');
      stage.style.setProperty('--ty', '0deg');
    });
  }

  // Reproducir solo cuando la sección está en pantalla
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView) playActive(); else { clearTimeout(playTimer); stopVideo(); }
  }, { threshold: 0.35 }).observe(root);

  window.addEventListener('resize', layout);

  // --- Visor (lightbox) ---
  const lb = document.getElementById('lightbox');
  const lbVideo = document.getElementById('lbVideo');
  let lbIndex = 0;
  function openLb(i) {
    lbIndex = mod(i);
    lbOpen = true;
    stopVideo();
    lbVideo.poster = items[lbIndex].poster;
    lbVideo.src = items[lbIndex].src;
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lbVideo.play().catch(() => {});
  }
  function closeLb() {
    lbOpen = false;
    lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load();
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    go(lbIndex);
  }
  document.getElementById('lbClose').addEventListener('click', closeLb);
  document.getElementById('lbPrev').addEventListener('click', () => openLb(lbIndex - 1));
  document.getElementById('lbNext').addEventListener('click', () => openLb(lbIndex + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  window.addEventListener('keydown', e => {
    if (!lbOpen) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') openLb(lbIndex - 1);
    if (e.key === 'ArrowRight') openLb(lbIndex + 1);
  });

  go(0);
})();
