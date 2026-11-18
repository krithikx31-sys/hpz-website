// Small helpers shared by the sections.
import gsap from 'gsap';

// Escape text from content.json before putting it into HTML.
export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Two-line title: second line italic.
export const title = ([a, b]) => `${esc(a)}<br><i>${esc(b)}</i>`;

// Fade-up reveal when an element scrolls into view (skipped for reduced motion).
export function reveal(elements, { reduce }) {
  if (reduce) return;
  elements.forEach((el) => {
    gsap.from(el, {
      y: 26,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}
