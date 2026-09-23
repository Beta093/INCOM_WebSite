(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('.page-motion');
  let selectorMotion = null;
  const elements = [...document.querySelectorAll('[data-reveal]')];
  let paused = reduced.matches;
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('pending');
      observer.unobserve(entry.target);
    });
  }, { threshold: .08 }) : null;
  elements.forEach(el => {
    if (!paused && observer) { el.classList.add('pending'); observer.observe(el); }
  });
  function sync() {
    document.body.classList.toggle('motion-paused', paused);
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.textContent = paused ? '모션 재생 ▷' : '모션 일시정지 Ⅱ';
    }
    if (selectorMotion) {
      selectorMotion.setAttribute('aria-pressed', String(paused));
      selectorMotion.textContent = paused ? '모션 재생 ▷' : '모션 일시정지 Ⅱ';
    }
    if (paused) elements.forEach(el => { el.classList.remove('pending'); observer?.unobserve(el); });
  }
  toggle?.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; sync(); });
  const hero = document.querySelector('.people-hero');
  const roster = document.querySelector('.people-roster');
  if (hero && roster) {
    const members = [{ name: hero.querySelector('.president-meta h2').textContent,
      role: '회장', image: hero.querySelector('.president-art img').getAttribute('src') },
      ...[...roster.querySelectorAll('.person')].map(person => ({
        name: person.querySelector('h3').textContent,
        role: person.querySelector('.person-info p').textContent,
        image: person.querySelector('img').getAttribute('src')
      }))];
    const selector = document.createElement('section');
    selector.className = 'team-selector';
    selector.setAttribute('aria-label', '46기 운영진 선택');
    selector.innerHTML = `<div class="selector-heading"><div><p class="page-kicker">46TH EXECUTIVE COMMITTEE / 2026</p><h1>DIFFERENT MINDS.<br><span>ONE TEAM.</span></h1></div><p>각자의 역할로 배우고 만들며,<br>사람 사이를 연결합니다.</p></div>
      <div class="selector-stage" tabindex="0" role="group" aria-label="캐릭터 선택. 왼쪽과 오른쪽 방향키로 이동" aria-describedby="selector-hint"><span class="selector-backdrop" aria-hidden="true">INCOM</span><div class="selector-orbit" aria-hidden="true"></div><div class="selector-slides"></div></div>
      <div class="selector-controls"><div class="selector-detail" aria-live="polite" aria-atomic="true"><p class="selector-role"></p><h2 class="selector-name"></h2><span class="selector-count"></span></div></div>
      <p id="selector-hint" class="selector-hint">DRAG TO EXPLORE ↔ <span>드래그하거나 직책을 선택해 보세요.</span></p>
      <nav class="selector-roster" aria-label="운영진 바로 선택"></nav><div class="selector-bottom"><span>ONE TEAM, ELEVEN ROLES</span><button class="selector-motion" type="button" aria-pressed="false">모션 일시정지 Ⅱ</button></div>`;
    const stage = selector.querySelector('.selector-stage');
    const slidesHost = selector.querySelector('.selector-slides');
    const choicesHost = selector.querySelector('.selector-roster');
    let selected = 0, position = 0, animation = 0;
    const wrap = value => ((value % members.length) + members.length) % members.length;
    const offsetFrom = value => wrap(value + members.length / 2) - members.length / 2;
    const slides = [], choices = [];
    members.forEach((member, index) => {
      const slide = document.createElement('button');
      slide.type = 'button';
      slide.className = 'selector-character';
      slide.setAttribute('aria-label', `${member.role} ${member.name} 선택`);
      const img = document.createElement('img');
      img.src = member.image; img.alt = `${member.role} 직책 캐릭터`; img.width = 720; img.height = 405; img.draggable = false;
      slide.append(img); slidesHost.append(slide); slides.push(slide);
      const choice = document.createElement('button');
      choice.type = 'button'; choice.className = 'selector-choice';
      const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0');
      const role = document.createElement('strong'); role.textContent = member.role;
      const name = document.createElement('small'); name.textContent = member.name;
      choice.append(number, role, name); choicesHost.append(choice); choices.push(choice);
      choice.addEventListener('click', () => select(index));
      slide.addEventListener('click', event => { if (!dragged || event.detail === 0) select(index); });
    });
    function select(index) {
      selected = wrap(index);
      choices.forEach((choice, i) => choice.setAttribute('aria-current', String(i === selected)));
      selector.querySelector('.selector-role').textContent = members[selected].role;
      selector.querySelector('.selector-name').textContent = members[selected].name;
      selector.querySelector('.selector-count').textContent = `${String(selected + 1).padStart(2, '0')} / 11 — 46TH INCOM`;
      settle(position + offsetFrom(selected - position));
    }
    function render() {
      slides.forEach((slide, i) => {
        const offset = offsetFrom(i - position);
        const distance = Math.abs(offset);
        slide.style.setProperty('--offset', offset);
        slide.style.setProperty('--distance', distance);
        slide.style.setProperty('--scale', 1 / (1 + distance * .4));
        slide.style.zIndex = String(Math.round(100 - distance * 10));
        slide.style.opacity = String(Math.max(0, 1 - distance * .38));
        slide.style.visibility = distance > 2.65 ? 'hidden' : 'visible';
        slide.tabIndex = distance > 2.65 ? -1 : 0;
        slide.setAttribute('aria-hidden', String(distance > 2.65));
        slide.setAttribute('aria-pressed', String(i === selected));
      });
    }
    function settle(target) {
      cancelAnimationFrame(animation);
      let previous = performance.now();
      function step(now) {
        const dt = Math.min(40, now - previous); previous = now;
        position += (target - position) * (1 - Math.exp(-dt / 65));
        if (paused || reduced.matches || Math.abs(target - position) < .001) {
          position = wrap(target); animation = 0; render(); return;
        }
        render(); animation = requestAnimationFrame(step);
      }
      if (paused || reduced.matches || Math.abs(target - position) < .001) {
        position = wrap(target); render();
      } else animation = requestAnimationFrame(step);
    }
    stage.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); select(selected + (event.key === 'ArrowLeft' ? -1 : 1)); stage.focus({preventScroll:true});
      }
    });
    let startX = 0, startY = 0, startPosition = 0, dragging = false, dragged = false;
    let pointerId = null, lastX = 0, lastTime = 0, speed = 0;
    const spacing = () => innerWidth * (innerWidth <= 700 ? .4 : .23);
    stage.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.isPrimary) return;
      cancelAnimationFrame(animation); animation = 0;
      startX = event.clientX; startY = event.clientY; dragging = true; dragged = false;
      pointerId = event.pointerId; startPosition = position;
      lastX = startX; lastTime = event.timeStamp; speed = 0;
    });
    stage.addEventListener('pointermove', event => {
      if (!dragging || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX, dy = event.clientY - startY;
      if (!dragged && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        dragged = true; stage.setPointerCapture(pointerId); stage.classList.add('is-dragging');
      }
      if (!dragged) return;
      const dt = Math.max(1, event.timeStamp - lastTime);
      speed = .5 * speed + .5 * (event.clientX - lastX) / dt;
      lastX = event.clientX; lastTime = event.timeStamp;
      position = startPosition - dx / spacing(); render();
    });
    const finish = event => {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      if (stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
      if (!dragged) { select(Math.round(position)); return; }
      const momentum = event.timeStamp - lastTime > 90 || paused || reduced.matches ? 0 : Math.max(-.6, Math.min(.6, -speed * 150 / spacing()));
      select(Math.round(position + momentum));
    };
    window.addEventListener('pointerup', finish);
    function cancelDrag(event) {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false; stage.classList.remove('is-dragging'); select(Math.round(position));
    }
    stage.addEventListener('pointercancel', cancelDrag);
    stage.addEventListener('lostpointercapture', cancelDrag);
    window.addEventListener('resize', () => { dragging = false; stage.classList.remove('is-dragging'); select(Math.round(position)); });
    selectorMotion = selector.querySelector('.selector-motion');
    selectorMotion.addEventListener('click', () => { paused = !paused; sync(); });
    select(0);
    hero.before(selector);
    hero.hidden = true; roster.hidden = true;
  }
  sync();
})();
