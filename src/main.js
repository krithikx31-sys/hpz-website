// Entry point: loads styles, boots smooth scroll (A2) and the film (A3, A4).
import 'lenis/dist/lenis.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/film.css';
import './styles/sections.css';

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import content from './content.json';
import { initFilm } from './film.js';
import { initContractor } from './sections/contractor.js';
import { initTrades } from './sections/trades.js';

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A2: smooth scroll. Lenis drives ScrollTrigger; skipped entirely for reduced motion.
if (!reduce) {
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

const app = document.getElementById('app');
initFilm(app, content, { reduce });
initContractor(app, content, { reduce });
initTrades(app, content, { reduce });
