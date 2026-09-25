(() => {
  const root = document.querySelector('.corner-nav');
  const toggle = root.querySelector('.corner-toggle');
  const shortcuts = root.querySelector('.corner-shortcuts');
  const panel = root.querySelector('.corner-panel');
  let open = false, queued = false;
  function sync() {
    const compact = scrollY > 90;
    root.classList.toggle('is-compact', compact);
    shortcuts.inert = compact || open || innerWidth <= 700;
    queued = false;
  }
  function setOpen(value, restoreFocus = false) {
    open = value;
    root.classList.toggle('is-open', value);
    toggle.setAttribute('aria-expanded', String(value));
    root.querySelector('.corner-label').textContent = value ? '닫기' : '메뉴';
    panel.inert = !value;
    panel.setAttribute('aria-hidden', String(!value));
    if (restoreFocus) toggle.focus({preventScroll:true});
    sync();
  }
  toggle.addEventListener('click', () => setOpen(!open));
  root.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false, panel.contains(event.target));
  });
  document.addEventListener('pointerdown', event => { if (open && !root.contains(event.target)) setOpen(false, panel.contains(document.activeElement)); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && open) {event.preventDefault();setOpen(false,true);} });
  root.addEventListener('focusout', () => {queueMicrotask(() => {if(open && !root.contains(document.activeElement))setOpen(false);});});
  window.addEventListener('scroll', () => {if(!queued){queued=true;requestAnimationFrame(sync);}}, {passive:true});
  window.addEventListener('resize', sync);
  sync();
})();
