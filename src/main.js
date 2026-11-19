// Entry point: loads styles, boots smooth scroll (A2) and the film (A3, A4).
import 'lenis/dist/lenis.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/nav.css';
import './styles/film.css';
import './styles/sections.css';

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import content from './content.json';
import { initNav } from './nav.js';
import { initFilm } from './film.js';
import { initContractor } from './sections/contractor.js';
import { initTrades } from './sections/trades.js';

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A2: smooth scroll. Lenis drives ScrollTrigger; skipped entirely for reduced motion.
export let lenis = null;
if (!reduce) {
  lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Smooth scroll to a selector or a pixel position. If the target doesn't exist yet
// (e.g. #contact before A8), scroll to the bottom of the page.
function scrollTo(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : null;
  const dest = el || (typeof target === 'number' ? target : document.documentElement.scrollHeight);
  if (lenis) lenis.scrollTo(dest);
  else if (el) el.scrollIntoView();
  else window.scrollTo(0, dest);
}

const app = document.getElementById('app');
initNav({ reduce, scrollTo });
initFilm(app, content, { reduce, scrollTo });
initContractor(app, content, { reduce });
initTrades(app, content, { reduce });
