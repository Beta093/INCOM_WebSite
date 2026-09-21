(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const body = document.body;
  const opening = document.querySelector('.opening');
  const skip = document.querySelector('.opening-skip');
  const toggle = document.querySelector('.motion-toggle');
  let paused = reduced.matches;
  let openingTimers = [];
  let openingActive = false;
  let returnFocus = null;

  function closeOpening() {
    if (!openingActive) return;
    openingActive = false;
    openingTimers.forEach(clearTimeout);
    opening.classList.add('depart');
    document.querySelectorAll('header, main, footer').forEach(el => { el.inert = false; });
    body.classList.add('arriving');
    const focusedSkip = document.activeElement === skip;
    if (returnFocus || focusedSkip) (returnFocus || document.querySelector('.hero-bottom .pill')).focus({ preventScroll: true });
    returnFocus = null;
    openingTimers = [setTimeout(() => { opening.hidden = true; }, reduced.matches ? 0 : 1100)];
  }

  function playOpening(replay = false) {
    openingTimers.forEach(clearTimeout);
    if (reduced.matches || paused) {
      opening.hidden = true;
      return;
    }
    returnFocus = replay ? document.querySelector('.replay') : null;
    openingActive = true;
    body.classList.remove('arriving');
    opening.classList.remove('depart');
    opening.hidden = false;
    document.querySelectorAll('header, main, footer').forEach(el => { el.inert = true; });
    if (replay) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      skip.focus({ preventScroll: true });
    }
    // The opening is an editorial transition, not a simulated loading meter.
    openingTimers = [setTimeout(closeOpening, 800)];
  }
  skip.addEventListener('click', closeOpening);
  document.querySelector('.replay').addEventListener('click', () => playOpening(true));
  if (!location.hash) playOpening();

  function syncMotion() {
    body.classList.toggle('motion-paused', paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? '모션 재생 ▷' : '모션 일시정지 Ⅱ';
    document.dispatchEvent(new CustomEvent('gallery-motion', { detail: { paused } }));
    if (paused) closeOpening();
  }
  toggle.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; syncMotion(); });
  syncMotion();

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeOpening();
    }
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('waiting');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => {
      if (!reduced.matches) el.classList.add('waiting');
      observer.observe(el);
    });
  }
  // Keep the page and all content usable if WebGL or the module cannot load.
  import('./scene.js').then(module => module.mountScene(document.querySelector('#scene'), paused))
    .catch(() => {
      document.querySelector('.drag-hint').textContent = 'FIG. 01 / THE CONNECTION';
    });
})();
