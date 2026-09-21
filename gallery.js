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
  // Shared scroll choreography: one activity pillar and a short camera flight.
  const projects = [...document.querySelectorAll('.project')];
  const pillar = document.querySelector('.activity-pillar');
  const activityLinks = [...document.querySelectorAll('.activity-nav a')];
  const history = document.querySelector('.history');
  const stage = document.querySelector('.origin-stage');
  const milestones = [...history.querySelectorAll('.timeline article')];
  const stopButtons = [...history.querySelectorAll('[data-stop]')];
  let flight = null;
  let activeProject = -1;
  let currentStop = -1;
  let scrollFrame = 0;
  let pillarTimer;

  function paintChoreography() {
    scrollFrame = 0;
    const staticMotion = paused || reduced.matches;
    let nearest = 0;
    let distance = Infinity;
    projects.forEach((project, index) => {
      const rect = project.getBoundingClientRect();
      const delta = Math.abs(rect.top + rect.height / 2 - innerHeight * .5);
      if (delta < distance) { nearest = index; distance = delta; }
      project.style.setProperty('--image-drift', staticMotion ? '0px' : Math.max(-16, Math.min(16, (innerHeight * .5 - rect.top) * .035)) + 'px');
    });
    if (nearest !== activeProject) {
      activeProject = nearest;
      pillar.querySelector('.pillar-number').textContent = String(nearest + 1).padStart(2, '0');
      pillar.querySelector('.pillar-key').textContent = projects[nearest].querySelector('.project-key').textContent;
      pillar.style.setProperty('--activity-progress', (nearest + 1) / projects.length);
      pillar.classList.remove('switching');
      if (!staticMotion) {
        void pillar.offsetWidth;
        pillar.classList.add('switching');
        clearTimeout(pillarTimer);
        pillarTimer = setTimeout(() => pillar.classList.remove('switching'), 500);
      }
      projects.forEach((el, index) => el.classList.toggle('is-current', index === nearest));
      activityLinks.forEach((el, index) => el.setAttribute('aria-current', String(index === nearest)));
    }
    history.classList.toggle('is-static', staticMotion);
    const rect = history.getBoundingClientRect();
    const travel = Math.max(1, history.offsetHeight - stage.offsetHeight);
    const progress = Math.max(0, Math.min(1, -rect.top / travel));
    const stop = Math.min(2, Math.floor(progress * 3));
    if (stop !== currentStop) {
      currentStop = stop;
      milestones.forEach((el, index) => el.classList.toggle('is-current', index === stop));
      stopButtons.forEach((el, index) => el.setAttribute('aria-current', String(index === stop)));
      history.querySelector('.flight-count').textContent = String(stop + 1).padStart(2, '0') + ' / 03';
    }
    flight?.update(progress, staticMotion);
  }
  function queueChoreography() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(paintChoreography);
  }
  window.addEventListener('scroll', queueChoreography, { passive: true });
  window.addEventListener('resize', queueChoreography);
  document.addEventListener('gallery-motion', queueChoreography);
  stopButtons.forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.stop);
    const travel = Math.max(1, history.offsetHeight - stage.offsetHeight);
    const progress = [.02, .5, .99][index];
    window.scrollTo({ top: history.getBoundingClientRect().top + scrollY + travel * progress, behavior: 'instant' });
    paintChoreography();
  }));
  paintChoreography();
  import('./origin-scene.js').then(module => {
    flight = module.mountOrigin(history.querySelector('.origin-space'), paused);
    history.classList.add('flight-ready');
    paintChoreography();
  }).catch(() => {
    // The full chronological text remains visible if WebGL is unavailable.
    history.classList.remove('flight-ready');
  });

  // Keep the page and all content usable if WebGL or the module cannot load.
  import('./scene.js').then(module => module.mountScene(document.querySelector('#scene'), paused))
    .catch(() => {
      document.querySelector('.drag-hint').textContent = 'FIG. 01 / THE CONNECTION';
    });
})();
