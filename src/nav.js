// A5.5: fixed nav. Cream over the film, solid paper once the film has passed.
let navEl = null;
let solid = null;

export function setSolid(on) {
  if (!navEl || on === solid) return; // only touch the DOM when the state changes
  solid = on;
  navEl.classList.toggle('solid', on);
}

export function initNav({ reduce, scrollTo }) {
  navEl = document.createElement('header');
  navEl.className = 'nav';
  navEl.innerHTML = `
    <nav class="nav-inner" aria-label="Main">
      <a href="#film" class="nav-mark" aria-label="HPZ Renovation Construction, back to top">HPZ</a>
      <a class="pill nav-cta" href="#contact">Contact</a>
    </nav>`;
  document.body.prepend(navEl);

  navEl.querySelector('.nav-mark').addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo(0);
  });
  navEl.querySelector('.nav-cta').addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo('#contact');
  });

  setSolid(Boolean(reduce));
}
