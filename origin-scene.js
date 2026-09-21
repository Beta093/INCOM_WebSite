// Quiet schematic: a gently panning circuit board, not a fly-through.
export function mountOrigin(host, initiallyPaused) {
  const board = document.createElement('div');
  board.className = 'origin-board';
  board.setAttribute('aria-hidden', 'true');
  board.innerHTML = `<svg viewBox="0 0 780 610" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="circuit-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" stroke="#ccd3dd" stroke-width=".65"/></pattern></defs>
    <rect x="40" y="45" width="700" height="520" rx="8" fill="#f8fafc" stroke="#bcc7d7"/>
    <rect x="40" y="45" width="700" height="520" rx="8" fill="url(#circuit-grid)"/>
    <g stroke="#c4cfdf" stroke-width="2">
      <path d="M40 140H115L145 170H210 M40 400H120L190 330H310V275 M740 120H630L590 160H530V230 M740 460H635L585 410H510 M300 45V115L335 150V210 M480 565V485L445 450V360"/>
      <path d="M40 480H210L270 420H330 M740 320H630L580 270H545 M180 45V90 M660 565V520H575 M80 565V505"/>
    </g>
    <path class="circuit-route" d="M40 240H160V180H255V290H390V425H550V320H740" stroke="#2457ed" stroke-width="3"/>
    <g class="circuit-node" data-node="0"><rect x="208" y="133" width="94" height="94" rx="5"/><rect x="222" y="147" width="66" height="66" rx="2"/><text x="255" y="181">01</text><text class="node-date" x="255" y="252">1981</text></g>
    <g class="circuit-node" data-node="1"><rect x="343" y="243" width="94" height="94" rx="5"/><rect x="357" y="257" width="66" height="66" rx="2"/><text x="390" y="291">02</text><text class="node-date" x="390" y="363">1983</text></g>
    <g class="circuit-node" data-node="2"><rect x="503" y="378" width="94" height="94" rx="5"/><rect x="517" y="392" width="66" height="66" rx="2"/><text x="550" y="426">03</text><text class="node-date" x="550" y="500">NOW</text></g>
    <g fill="#8191a8" font-family="monospace" font-size="10"><text x="65" y="75">INCOM / CONNECTION ARCHIVE</text><text x="65" y="541">EST.1981 — STILL BUILDING.</text><text x="600" y="541">REV. 03</text></g>
    <g class="circuit-pulse" fill="#2457ed"><rect width="7" height="7" rx="1"/><rect width="7" height="7" rx="1"/></g>
  </svg>`;
  host.append(board);
  const route = board.querySelector('.circuit-route');
  const length = route.getTotalLength();
  const nodes = [...board.querySelectorAll('.circuit-node')];
  const pulses = [...board.querySelectorAll('.circuit-pulse rect')];
  let progress = 0, target = 0, paused = initiallyPaused, visible = false;
  let frame = 0, last = 0, time = 0;
  function render(now) {
    frame = 0;
    if (!visible || document.hidden) return;
    const dt = Math.max(0, Math.min((now - last) / 1000 || 0, .05));
    last = now;
    if (!paused) {
      time += dt;
      progress += (target - progress) * (1 - Math.exp(-dt * 9));
    }
    // Deliberately small camera travel; no banking, tunnels, stars or orbiting objects.
    board.style.transform = paused ? 'none' : `perspective(1100px) rotateX(8deg) rotateY(-12deg) translate3d(${18 - progress * 36}px, ${12 - progress * 24}px, 0) scale(${1 + progress * .035})`;
    const active = Math.min(2, Math.floor(target * 3));
    nodes.forEach((node, index) => node.classList.toggle('is-active', index === active));
    pulses.forEach((pulse, index) => {
      const point = route.getPointAtLength(((time * .045 + index * .5) % 1) * length);
      pulse.setAttribute('x', point.x - 3.5);
      pulse.setAttribute('y', point.y - 3.5);
    });
    if (!paused) frame = requestAnimationFrame(render);
  }
  function schedule() {
    if (!frame && visible && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(render); }
  }
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) { cancelAnimationFrame(frame); frame = 0; }
    schedule();
  }).observe(host);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    schedule();
  });
  return { update(value, stopMotion) {
    target = value;
    paused = stopMotion;
    if (paused || !visible) progress = target;
    schedule();
  }};
}
