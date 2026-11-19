// A3 + A4 + A5: scroll-driven frame film, overlays and the card ending.
// Frame count, file pattern and stages always come from /frames/manifest.json.
import gsap from 'gsap';
import { setSolid } from './nav.js';

const FALLBACK_IMG = '/img/room-finished.jpg';
const BUILD_START = 0.04; // film plays between 4% and 74% of the section
const BUILD_END = 0.74;
const MOBILE = 760;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function frameUrl(pattern, i) {
  // "f{0000}.jpg" -> f0001.jpg for i = 0
  return '/frames/' + pattern.replace(/\{(0+)\}/, (_, zeros) => String(i + 1).padStart(zeros.length, '0'));
}

function loadImage(src, priority) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    if (priority) img.fetchPriority = priority;
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function buildMarkup(film) {
  const section = document.createElement('section');
  section.id = 'film';
  section.className = 'film';
  section.setAttribute('aria-label', 'A bare room becomes a finished living room');
  section.innerHTML = `
    <div class="film-pin">
      <div class="film-frame">
        <canvas class="film-canvas" role="img"
          aria-label="A bare concrete room is renovated step by step: walls plastered and painted, a marble floor laid, a false ceiling fitted, furniture added and the lights turned on."></canvas>
        <div class="film-title">
          <h1>${esc(film.title[0])}<br><i>${esc(film.title[1])}</i></h1>
        </div>
        <span class="pill film-tag" aria-hidden="true">${esc(film.tag)}</span>
        <ol class="film-stages" aria-hidden="true"></ol>
      </div>
      <div class="film-side">
        <h2>${esc(film.sideTitle[0])}<br><i>${esc(film.sideTitle[1])}</i></h2>
        <p>${esc(film.sideText)}</p>
        <a class="pill pill--lg" href="#contact">${esc(film.sideButton)}</a>
      </div>
      <div class="film-float film-float--marble" aria-hidden="true"></div>
      <div class="film-float film-float--sofa" aria-hidden="true"></div>
    </div>`;
  return section;
}

// Swap the canvas for the finished-room photo (frames missing or reduced motion).
function useFallbackImage(canvas) {
  const img = document.createElement('img');
  img.className = 'film-fallback';
  img.src = FALLBACK_IMG;
  img.alt = canvas.getAttribute('aria-label');
  img.fetchPriority = 'high';
  canvas.replaceWith(img);
}

export async function initFilm(root, content, { reduce, scrollTo }) {
  const section = buildMarkup(content.film);
  root.prepend(section);

  const $ = (sel) => section.querySelector(sel);
  const frameEl = $('.film-frame');
  const canvas = $('.film-canvas');
  const side = $('.film-side');
  const sideBtn = side.querySelector('a');
  const [float1, float2] = section.querySelectorAll('.film-float');
  const overlay = [$('.film-title'), $('.film-stages'), $('.film-tag')];

  sideBtn.addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo('#contact');
  });

  // Reduced motion: one static screen, side text below the photo, nav solid.
  if (reduce) {
    section.classList.add('film--static');
    useFallbackImage(canvas);
    setSolid(true);
    return;
  }

  // ---------- Frame drawing (A3) ----------
  let frames = [];
  let count = 0;
  let current = 0; // index we want to show
  let drawn = -1;  // index actually on the canvas
  let pills = [];
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    if (!canvas.isConnected) return;
    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < MOBILE ? 1.5 : 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      drawn = -1;
      render();
    }
  }

  // Nearest frame that has finished loading, so the canvas never goes blank
  function nearestLoaded(i) {
    for (let d = 0; d < count; d++) {
      if (frames[i - d]) return i - d;
      if (frames[i + d]) return i + d;
    }
    return -1;
  }

  function render() {
    if (!count || !canvas.isConnected) return;
    const i = nearestLoaded(current);
    if (i < 0 || i === drawn) return; // redraw only when the index changes
    const img = frames[i];
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight); // cover-fit
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    drawn = i;
  }

  // ---------- Card ending (A5) ----------
  // On phones the card shrinks to fit below the side text, so they never overlap.
  let mobileShrink = 0.46;
  function measure() {
    if (window.innerWidth >= MOBILE) return;
    const pinH = section.querySelector('.film-pin').clientHeight;
    const sideBottom = side.offsetTop + side.offsetHeight + 16;
    const originY = pinH * 0.96;
    const maxScale = (originY - sideBottom) / originY;
    mobileShrink = 1 - clamp(Math.min(0.54, maxScale), 0.25, 0.54);
  }

  const state = { p: 0 };
  function apply() {
    const p = state.p;
    const mob = window.innerWidth < MOBILE;

    // Film frame index + stage pills
    const build = seg(p, BUILD_START, BUILD_END);
    current = Math.round(build * Math.max(0, count - 1));
    render();
    pills.forEach((pill) => pill.el.classList.toggle('on', build > 0.02 && build >= pill.start));

    // A5.2: overlay fades out
    gsap.set(overlay, { opacity: 1 - seg(p, 0.76, 0.82) });

    // A5.1: frame shrinks into a rounded card (corner stays visually 18px)
    const shrink = ease(seg(p, 0.78, 0.97));
    const s = 1 - shrink * (mob ? mobileShrink : 0.5);
    gsap.set(frameEl, { scale: s, borderRadius: (shrink * 18) / s });

    // A5.3: side text fades in (and rises 30px on desktop)
    const si = seg(p, 0.86, 0.97);
    gsap.set(side, {
      opacity: si,
      yPercent: mob ? 0 : -50,
      y: mob ? 0 : (1 - si) * 30,
      pointerEvents: si < 0.05 ? 'none' : 'auto',
      visibility: si < 0.01 ? 'hidden' : 'visible', // keeps the hidden button out of the Tab order
    });

    // A5.4: floating photos (hidden on phones by CSS)
    const fl = seg(p, 0.88, 1);
    gsap.set(float1, { opacity: fl, y: (1 - fl) * 60 - p * 30, rotation: 4 - fl * 2 });
    gsap.set(float2, { opacity: fl, y: (1 - fl) * 80, rotation: -3 + fl * 1.5 });

    // A5.5: nav turns solid once the card has formed (and stays solid after the film)
    setSolid(shrink > 0.5);
  }

  measure();
  apply();
  // Fonts change the side text's height, so measure again once they've loaded
  document.fonts?.ready.then(() => { measure(); apply(); });
  gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true },
    onUpdate: apply,
  });

  // Recalculate everything for the new size, so nothing stays stuck mid-scroll
  window.addEventListener('resize', () => {
    measure();
    resizeCanvas();
    apply();
  });

  // ---------- Load manifest + frames ----------
  let manifest;
  try {
    const res = await fetch('/frames/manifest.json');
    if (!res.ok) throw new Error(res.status);
    manifest = await res.json();
  } catch {
    useFallbackImage(canvas); // the ending above still works on the <img>
    return;
  }

  const list = $('.film-stages');
  pills = (manifest.stages || []).map((stage) => {
    const li = document.createElement('li');
    li.textContent = stage.label;
    list.appendChild(li);
    return { el: li, start: stage.start };
  });

  const pattern = manifest.pattern;
  frames = new Array(manifest.count);

  // Loading order: frame 1 first, then 2-10, then the rest in small batches
  try {
    frames[0] = await loadImage(frameUrl(pattern, 0), 'high');
  } catch {
    useFallbackImage(canvas);
    return;
  }
  count = manifest.count;
  resizeCanvas();
  apply();

  const load = (i) =>
    loadImage(frameUrl(pattern, i), 'low')
      .then((img) => {
        frames[i] = img;
        if (Math.abs(i - current) < Math.abs(drawn - current)) render();
      })
      .catch(() => {});

  await Promise.all(Array.from({ length: Math.min(9, count - 1) }, (_, k) => load(k + 1)));
  for (let i = 10; i < count; i += 8) {
    await Promise.all(Array.from({ length: Math.min(8, count - i) }, (_, k) => load(i + k)));
  }
}
