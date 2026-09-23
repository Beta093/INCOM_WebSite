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
  // Show the opening on every page load, including reloads at section anchors.
  // Keep the user's scroll destination; only an explicit replay returns to the hero.
  playOpening();

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
  const handoff = document.querySelector('.origin-handoff');
  const handoffPath = handoff.querySelector('path');
  const handoffRays = [...handoff.querySelectorAll('.handoff-ray')];
  const handoffPrism = handoff.querySelector('.handoff-prism');
  const handoffCursor = handoff.querySelector('.handoff-cursor');
  const handoffTrunk = handoff.querySelector('.handoff-trunk');
  const resultRows = [...document.querySelectorAll('.results li')];
  const resultsHeading = document.querySelector('.results-heading');
  const awards = document.querySelector('.awards');
  const contact = document.querySelector('.contact');
  const journey = document.querySelector('.journey-thread');
  const journeyPaths = [...journey.querySelectorAll('path')];
  const heroSection = document.querySelector('.hero');
  const aboutSection = document.querySelector('.about');
  const specimen = document.querySelector('.collective-specimen');
  const activityRail = document.querySelector('.activity-rail');
  const milestones = [...history.querySelectorAll('.timeline article')];
  const stopButtons = [...history.querySelectorAll('[data-stop]')];
  let flight = null;
  let originStops = [];
  let activeProject = -1;
  let currentStop = -1;
  let scrollFrame = 0;
  let pillarTimer;

  function paintJourney(staticMotion) {
    const entry = history.querySelector('.circuit-entry');
    const enabled = !staticMotion && !!entry;
    journey.style.visibility = enabled ? 'visible' : 'hidden';
    body.classList.toggle('journey-ready', enabled);
    if (!enabled) return;
    const root = journey.getBoundingClientRect();
    const hero = heroSection.getBoundingClientRect();
    const about = aboutSection.getBoundingClientRect();
    const mark = specimen.getBoundingClientRect();
    const rail = activityRail.getBoundingClientRect();
    const column = pillar.getBoundingClientRect();
    const target = entry.getBoundingClientRect();
    const marginX = about.left + parseFloat(getComputedStyle(aboutSection).paddingLeft) / 2 - root.left;
    const railX = rail.left + rail.width / 2 - root.left;
    const startY = hero.bottom - root.top - 28;
    const markY = mark.top - root.top + mark.height * .52;
    const railTop = column.top - root.top;
    const railBottom = column.bottom - root.top;
    const endX = target.left + target.width / 2 - root.left;
    const endY = target.top + target.height / 2 - root.top;
    const stageTop = stage.getBoundingClientRect().top - root.top;
    const entryPath = innerWidth <= 700
      ? `M${railX} ${rail.bottom - root.top} Q${marginX} ${stageTop - 20} ${marginX} ${stageTop} V${endY - 14} Q${marginX} ${endY} ${marginX + 14} ${endY} H${endX}`
      : `M${railX} ${rail.bottom - root.top} V${stageTop - 24} Q${railX} ${stageTop - 8} ${railX + 16} ${stageTop - 8} H${endX - 32} Q${endX - 16} ${stageTop - 8} ${endX - 16} ${stageTop + 8} V${endY - 16} Q${endX - 16} ${endY} ${endX} ${endY}`;
    const scan = innerHeight * .7 - root.top;
    const paths = [
      `M${marginX} ${startY} V${rail.top - root.top - 30} Q${marginX} ${rail.top - root.top} ${railX} ${rail.top - root.top} V${railTop}`,
      `M${marginX} ${markY} H${mark.left - root.left - 5}`,
      `M${railX} ${railBottom} V${rail.bottom - root.top}`,
      entryPath
    ];
    journeyPaths.forEach((path, index) => {
      if (path.getAttribute('d') !== paths[index]) path.setAttribute('d', paths[index]);
      const length = path.getTotalLength();
      let low = 0, high = length;
      for (let step = 0; step < 12; step++) {
        const middle = (low + high) / 2;
        if (path.getPointAtLength(middle).y <= scan) low = middle; else high = middle;
      }
      const progress = index === 1 ? Math.max(0, Math.min(1, (scan - markY) / 70)) : low / Math.max(1, length);
      path.style.strokeDashoffset = String(1 - progress);
      path.style.opacity = progress < .001 ? '0' : index === 1 ? '.6' : '1';
    });
    pillar.style.setProperty('--pillar-arrive', Math.max(0, Math.min(1, (scan - railTop) / 140)));
  }

  function paintChoreography() {
    scrollFrame = 0;
    const staticMotion = paused || reduced.matches;
    const smooth = (a, b, value) => {
      const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    let nearest = 0;
    let distance = Infinity;
    projects.forEach((project, index) => {
      const rect = project.getBoundingClientRect();
      const delta = Math.abs(rect.top + rect.height / 2 - innerHeight * .5);
      const arrival = staticMotion ? 1 : smooth(0, 1, (innerHeight - rect.top) / (innerHeight * .7));
      project.style.setProperty('--arrival', arrival);
      project.style.setProperty('--word-drift', staticMotion ? '0px' : `${Math.max(-22, Math.min(22, (innerHeight * .5 - rect.top) * .04))}px`);
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
    const stop = Math.max(0, originStops.filter(point => progress >= point).length - 1);
    if (stop !== currentStop) {
      currentStop = stop;
      milestones.forEach((el, index) => el.classList.toggle('is-current', index === stop));
      stopButtons.forEach((el, index) => el.setAttribute('aria-current', String(index === stop)));
      history.querySelector('.flight-count').textContent = String(stop + 1).padStart(2, '0') + ' / 03';
    }
    // Continue the schematic into the results without adding another pinned scene.
    const handoffProgress = staticMotion ? 1 : smooth(stage.offsetHeight, innerHeight * .16, awards.getBoundingClientRect().top);
    const inputProgress = Math.min(1, handoffProgress / .65);
    const rayProgress = Math.max(0, (handoffProgress - .65) / .35);
    flight?.update(progress, staticMotion, handoffProgress > 0);
    handoff.style.setProperty('--handoff-undrawn', String(1 - inputProgress));
    handoff.style.setProperty('--rays-undrawn', String(1 - rayProgress));
    handoffRays.forEach(ray => { ray.style.opacity = rayProgress > 0 ? '1' : '0'; });
    history.querySelector('.flight-count').style.opacity = String(1 - smooth(0, .15, handoffProgress));
    handoff.style.setProperty('--prism-opacity', String(smooth(.45, .65, handoffProgress) * .65));
    resultsHeading.style.setProperty('--results-rise', `${staticMotion ? 0 : (1 - handoffProgress) * 24}px`);
    const exit = history.querySelector('.circuit-exit');
    if (exit && !staticMotion) {
      const root = handoff.getBoundingClientRect();
      const start = exit.getBoundingClientRect();
      const x = start.left + start.width / 2 - root.left;
      const y = start.top + start.height / 2 - root.top;
      const rows = resultRows.map(row => row.getBoundingClientRect());
      const railX = (rows[0].left - root.left) / 2;
      const prismY = awards.getBoundingClientRect().top - root.top - 8;
      const size = innerWidth < 700 ? 15 : 23;
      const prismX = Math.max(railX, size + 4);
      const drop = Math.max(0, prismY - y);
      // A descending diagonal, with soft entry and exit instead of a horizontal elbow.
      handoffPath.setAttribute('d', `M${x} ${y} C${x} ${y + drop * .25} ${prismX} ${y + drop * .8} ${prismX} ${prismY}`);
      handoffPrism.setAttribute('d', `M${prismX} ${prismY - size} L${prismX + size} ${prismY} L${prismX} ${prismY + size} L${prismX - size} ${prismY} Z M${prismX} ${prismY - size} V${prismY + size} M${prismX - size} ${prismY} H${prismX + size}`);
      // Descend through the left gutter, then branch right into each result.
      const contactRect = contact.getBoundingClientRect();
      const endY = contactRect.top - root.top;
      handoffTrunk.setAttribute('d', `M${prismX} ${prismY} C${prismX} ${prismY + 24} ${railX} ${prismY + 24} ${railX} ${prismY + 48} V${endY}`);
      const trunkLength = handoffTrunk.getTotalLength();
      // Start at the prism exactly when the incoming head arrives, with no jump.
      const joinT = .5 - Math.sin(Math.asin(1 - 2 * .65) / 3);
      const joinTop = stage.offsetHeight + (innerHeight * .16 - stage.offsetHeight) * joinT;
      const trunkDistance = Math.max(0, Math.min(trunkLength, joinTop - awards.getBoundingClientRect().top));
      const trunkProgress = inputProgress < 1 ? 0 : trunkDistance / trunkLength;
      handoffTrunk.style.strokeDashoffset = String(1 - trunkProgress);
      handoffTrunk.style.opacity = trunkProgress > 0 ? '1' : '0';
      const head = handoffTrunk.getPointAtLength(trunkProgress * trunkLength);
      handoffRays.forEach((ray, index) => {
        const row = rows[index];
        const endX = row.left - root.left;
        const endY = row.top + row.height / 2 - root.top;
        ray.setAttribute('d', `M${railX} ${endY} H${endX}`);
        const reach = trunkProgress > 0 ? smooth(endY - 12, endY + 12, head.y) : 0;
        // The last branch finishes when the descending head reaches its endpoint.
        const drawn = reach;
        ray.style.opacity = drawn > 0 ? '1' : '0';
        ray.style.strokeDashoffset = String(1 - drawn);
        resultRows[index].classList.toggle('is-connected', drawn > .5);
      });
      const activePath = inputProgress < 1 ? handoffPath : handoffTrunk;
      const distance = activePath.getTotalLength() * (inputProgress < 1 ? inputProgress : trunkProgress);
      const point = activePath.getPointAtLength(distance);
      const next = activePath.getPointAtLength(Math.min(activePath.getTotalLength(), distance + 2));
      const radius = Math.max(7, Math.min(14, history.querySelector('.circuit-cursor').getBoundingClientRect().height / 2));
      handoffPath.style.strokeWidth = String(radius / 14 * 5);
      const squeeze = Math.max(0, 1 - Math.abs(handoffProgress - .65) / .09);
      handoffCursor.setAttribute('cx', point.x);
      handoffCursor.setAttribute('cy', point.y);
      handoffCursor.setAttribute('rx', radius * (1 + squeeze * .4));
      handoffCursor.setAttribute('ry', radius * (1 - squeeze * .3));
      handoffCursor.setAttribute('transform', `rotate(${Math.atan2(next.y - point.y, next.x - point.x) * 180 / Math.PI} ${point.x} ${point.y})`);
      handoffCursor.style.opacity = handoffProgress > 0 ? String(1 - smooth(.97, 1, trunkProgress)) : '0';
      const fillStart = joinTop + contactRect.top - awards.getBoundingClientRect().top - trunkLength;
      const fillProgress = smooth(fillStart, Math.min(20, fillStart - 1), contactRect.top);
      contact.style.setProperty('--fill-x', `${railX}px`);
      contact.style.setProperty('--fill-radius', `${2 + fillProgress * Math.hypot(contactRect.width, contactRect.height)}px`);
      contact.style.setProperty('--fill-copy', String(smooth(.72, .94, fillProgress)));
    }
    handoff.style.visibility = staticMotion || !exit ? 'hidden' : 'visible';
    contact.classList.toggle('spill-ready', !staticMotion && !!exit);
    paintJourney(staticMotion);
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
    const progress = Math.min(1, originStops[index] + .045);
    window.scrollTo({ top: history.getBoundingClientRect().top + scrollY + travel * progress, behavior: 'instant' });
    paintChoreography();
  }));
  paintChoreography();
  import('./origin-scene.js').then(module => {
    originStops = module.ORIGIN_STOPS;
    flight = module.mountOrigin(history.querySelector('.origin-space'), paused);
    history.classList.add('flight-ready');
    paintChoreography();
  }).catch(() => {
    // The full chronological text remains visible if the schematic cannot load.
    history.classList.remove('flight-ready');
  });

  // Keep the page and all content usable if WebGL or the module cannot load.
  import('./scene.js').then(module => module.mountScene(document.querySelector('#scene'), paused))
    .catch(() => {
      document.querySelector('.drag-hint').textContent = 'FIG. 01 / THE CONNECTION';
    });
})();
