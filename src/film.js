// A3 + A4: scroll-driven frame film with title, tag and stage pills.
// Frame count, file pattern and stages always come from /frames/manifest.json.
import gsap from 'gsap';

const FALLBACK_IMG = '/img/room-finished.jpg';
const BUILD_START = 0.04; // film plays between 4% and 74% of the section
const BUILD_END = 0.74;   // (the rest is kept for the card ending, A5)

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

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

function buildMarkup(content) {
  const { title, tag } = content.film;
  const section = document.createElement('section');
  section.id = 'film';
  section.className = 'film';
  section.setAttribute('aria-label', 'A bare room becomes a finished living room');
  section.innerHTML = `
    <div class="film-pin">
      <div class="film-frame" data-frame>
        <canvas class="film-canvas" role="img"
          aria-label="A bare concrete room is renovated step by step: walls plastered and painted, a marble floor laid, a false ceiling fitted, furniture added and the lights turned on."></canvas>
        <div class="film-title">
          <h1>${title[0]}<br><i>${title[1]}</i></h1>
        </div>
        <span class="pill film-tag" aria-hidden="true">${tag}</span>
        <ol class="film-stages" aria-hidden="true"></ol>
      </div>
    </div>`;
  return section;
}

function showFallback(section) {
  section.classList.add('film--static');
  const frame = section.querySelector('[data-frame]');
  const canvas = frame.querySelector('canvas');
  const img = document.createElement('img');
  img.className = 'film-fallback';
  img.src = FALLBACK_IMG;
  img.alt = canvas.getAttribute('aria-label');
  canvas.replaceWith(img);
}

export async function initFilm(root, content, { reduce }) {
  const section = buildMarkup(content);
  root.prepend(section);

  if (reduce) return showFallback(section);

  let manifest;
  try {
    const res = await fetch('/frames/manifest.json');
    if (!res.ok) throw new Error(res.status);
    manifest = await res.json();
  } catch {
    return showFallback(section);
  }

  const { count, pattern, stages = [] } = manifest;
  const canvas = section.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const frames = new Array(count);
  let current = -1;   // index we want to show
  let drawn = -1;     // index actually on the canvas

  // Stage pills from the manifest (A4)
  const list = section.querySelector('.film-stages');
  const pills = stages.map((s) => {
    const li = document.createElement('li');
    li.textContent = s.label;
    list.appendChild(li);
    return { el: li, start: s.start };
  });

  // Canvas sizing: cap devicePixelRatio at 2 (1.5 on phones)
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      drawn = -1; // force redraw at new size
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
    const i = nearestLoaded(current < 0 ? 0 : current);
    if (i < 0 || i === drawn) return; // redraw only when the index changes
    const img = frames[i];
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight); // cover-fit
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    drawn = i;
  }

  function onLoaded(i, img) {
    frames[i] = img;
    if (drawn < 0 || Math.abs(i - current) < Math.abs(drawn - current)) render();
  }

  // Loading order: frame 1 first, then 2-10, then the rest in small batches
  try {
    onLoaded(0, await loadImage(frameUrl(pattern, 0), 'high'));
  } catch {
    return showFallback(section);
  }
  resize();

  const load = (i) => loadImage(frameUrl(pattern, i), 'low').then((img) => onLoaded(i, img)).catch(() => {});
  (async () => {
    await Promise.all(Array.from({ length: Math.min(9, count - 1) }, (_, k) => load(k + 1)));
    for (let i = 10; i < count; i += 8) {
      await Promise.all(Array.from({ length: Math.min(8, count - i) }, (_, k) => load(i + k)));
    }
  })();

  // Scroll -> frame index (scrubbed by ScrollTrigger)
  const state = { p: 0 };
  gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true },
    onUpdate() {
      const build = clamp((state.p - BUILD_START) / (BUILD_END - BUILD_START));
      current = Math.round(build * (count - 1));
      render();
      pills.forEach((pill) => pill.el.classList.toggle('on', build > 0.02 && build >= pill.start));
    },
  });

  window.addEventListener('resize', resize);
}
