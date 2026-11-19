// A8: Contact section ("Start yours.") and footer, all details from content.json.
import { esc, title, reveal } from './util.js';

const EMBLEM = `
  <svg class="footer-emblem" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <circle cx="32" cy="32" r="30" fill="none" stroke="#D6B88E" stroke-width="1"/>
    <circle cx="32" cy="32" r="26" fill="none" stroke="#D6B88E" stroke-width=".5" opacity=".6"/>
    <text x="32" y="38" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif"
      font-weight="600" font-size="17" letter-spacing="1.5" fill="#E2C9A6">HPZ</text>
  </svg>`;

const tel = ({ label, tel: number }) => `<a href="tel:${esc(number)}">${esc(label)}</a>`;

function detail(label, valueHtml, extraClass = '') {
  return `<div class="contact-item"><span class="label">${esc(label)}</span><p class="contact-value ${extraClass}">${valueHtml}</p></div>`;
}

export function initContact(root, content, opts) {
  const c = content;
  const items = [
    detail('Proprietor', esc(c.proprietor)),
    detail('Mobile', tel(c.mobile)),
    detail('Office', c.office.map(tel).join('<br>')),
    detail('Email', `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`),
    detail('Address', c.address.map(esc).join('<br>')),
  ];
  if (c.showGstin) items.push(detail('GSTIN', esc(c.gstin), 'contact-value--mono'));

  const section = document.createElement('section');
  section.id = 'contact';
  section.className = 'contact';
  section.setAttribute('aria-labelledby', 'contact-title');
  section.innerHTML = `
    <div class="contact-bg" aria-hidden="true"></div>
    <div class="wrap contact-inner">
      <h2 class="h2" id="contact-title" data-reveal>${title(c.contactTitle)}</h2>
      <address class="contact-details" data-reveal>
        ${items.join('')}
      </address>
    </div>`;
  root.appendChild(section);

  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-mark">
        ${EMBLEM}
        <div><b>HPZ</b><small>RENOVATION CONSTRUCTION</small></div>
      </div>
      <div class="footer-text">
        <p>${esc(c.footer)}</p>
        <p>${esc(c.conceptNote)}</p>
      </div>
    </div>`;
  root.after(footer); // footer sits after <main>

  reveal(section.querySelectorAll('[data-reveal]'), opts);
}
