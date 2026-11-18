// A7: "One contractor, every trade." with three columns.
import { esc, title, reveal } from './util.js';

export function initContractor(root, content, opts) {
  const { contractor } = content;
  const section = document.createElement('section');
  section.className = 'wrap contractor';
  section.setAttribute('aria-labelledby', 'contractor-title');
  section.innerHTML = `
    <h2 class="h2" id="contractor-title" data-reveal>${title(contractor.title)}</h2>
    <div class="contractor-cols" data-reveal>
      ${contractor.columns
        .map((c) => `<div class="contractor-col"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></div>`)
        .join('')}
    </div>`;
  root.appendChild(section);
  reveal(section.querySelectorAll('[data-reveal]'), opts);
}
