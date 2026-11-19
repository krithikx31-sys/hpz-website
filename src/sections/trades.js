// A7: "Fourteen trades. One team." two-column list.
import { esc, title, reveal } from './util.js';

export function initTrades(root, content, opts) {
  const section = document.createElement('section');
  section.className = 'wrap trades';
  section.setAttribute('aria-labelledby', 'trades-title');
  section.innerHTML = `
    <h2 class="h2" id="trades-title" data-reveal>${title(content.tradesTitle)}</h2>
    <ul class="trades-list" data-reveal>
      ${content.trades
        .map(([name, desc]) => `<li class="trade"><span class="trade-name">${esc(name)}</span><span class="trade-desc">${esc(desc)}</span></li>`)
        .join('')}
    </ul>`;
  root.appendChild(section);
  reveal(section.querySelectorAll('[data-reveal]'), opts);
}
