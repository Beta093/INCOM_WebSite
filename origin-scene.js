import * as THREE from './assets/vendor/three.module.js';

// A physical perspective camera, not a scaled screenshot or a 2D line reveal.
export function mountOrigin(host, initiallyPaused) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x050b19, 0);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x071023, .012);
  const camera = new THREE.PerspectiveCamera(54, 1, .1, 300);
  const route = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -2, 20), new THREE.Vector3(7, 1, -5),
    new THREE.Vector3(-9, 7, -36), new THREE.Vector3(12, -3, -70),
    new THREE.Vector3(-8, -6, -104), new THREE.Vector3(6, 4, -139),
    new THREE.Vector3(0, 0, -175)
  ]);
  const line = new THREE.Mesh(new THREE.TubeGeometry(route, 380, .065, 8, false), new THREE.MeshBasicMaterial({ color: 0x9bc5ff }));
  const glow = new THREE.Mesh(new THREE.TubeGeometry(route, 380, .28, 8, false), new THREE.MeshBasicMaterial({ color: 0x2457ed, transparent: true, opacity: .13, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(line, glow);
  scene.add(new THREE.HemisphereLight(0xe2efff, 0x162d66, 3));
  const light = new THREE.DirectionalLight(0xffffff, 5);
  light.position.set(-8, 20, 12);
  scene.add(light);
  const fill = new THREE.DirectionalLight(0x5189ff, 4);
  fill.position.set(20, -10, -80);
  scene.add(fill);
  const silver = new THREE.MeshStandardMaterial({ color: 0xc9d5e8, metalness: .72, roughness: .26 });
  const rings = [];
  for (let i = 0; i < 9; i++) {
    const t = .06 + i * .103;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.4 + (i % 3), .055, 10, 90), silver);
    ring.position.copy(route.getPointAt(t));
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), route.getTangentAt(t));
    ring.rotation.z += i * .6;
    scene.add(ring);
    rings.push(ring);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(.38 + (i % 2) * .2, 20, 16), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x2457ed : 0xd4e0f5, metalness: .5, roughness: .2 }));
    orb.position.copy(ring.position).add(new THREE.Vector3(i % 2 ? 4 : -4, 2, -1));
    scene.add(orb);
  }
  // Sparse, round depth particles; no decorative star-shaped symbols.
  const positions = [];
  let seed = 47;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < 380; i++) positions.push((random() - .5) * 95, (random() - .5) * 70, 30 - random() * 230);
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0x9ab7e5, size: .07, transparent: true, opacity: .5, sizeAttenuation: true }));
  scene.add(dust);
  const pulses = Array.from({ length: 8 }, () => {
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), new THREE.MeshBasicMaterial({ color: 0xe3f2ff }));
    scene.add(pulse);
    return pulse;
  });
  host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  let target = 0;
  let progress = 0;
  let paused = initiallyPaused;
  let visible = false;
  let lost = false;
  let frame = 0;
  let last = 0;
  let time = 0;
  const look = new THREE.Vector3();
  function render(now = 0) {
    frame = 0;
    if (lost || document.hidden || !visible) return;
    const delta = Math.max(0, Math.min((now - last) / 1000 || 0, .05));
    last = now;
    if (!paused) {
      time += delta;
      progress += (target - progress) * (1 - Math.exp(-delta * 11));
    }
    const t = .035 + progress * .83;
    const point = route.getPointAt(t);
    camera.position.copy(point).add(new THREE.Vector3(-2.5, 3.2, 12));
    look.copy(route.getPointAt(Math.min(.995, t + .075)));
    // Keep the line to the right of the editorial text and gently bank through bends.
    camera.lookAt(look.x - 5, look.y + 1, look.z);
    camera.rotateZ(paused ? 0 : Math.sin(progress * Math.PI * 2) * .045);
    camera.fov = 54 - progress * 9;
    camera.updateProjectionMatrix();
    pulses.forEach((pulse, index) => pulse.position.copy(route.getPointAt((index / pulses.length + time * .035) % 1)));
    rings.forEach((ring, index) => { ring.scale.setScalar(1 + (paused ? 0 : Math.sin(time * .6 + index) * .025)); });
    renderer.render(scene, camera);
    if (!paused) frame = requestAnimationFrame(render);
  }
  function schedule() {
    if (!frame && visible && !lost && !document.hidden) frame = requestAnimationFrame(render);
  }
  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    schedule();
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
    last = performance.now();
    schedule();
  });
  observer.observe(host);
  new ResizeObserver(resize).observe(host);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
    last = performance.now();
    schedule();
  });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    host.closest('.history').classList.remove('flight-ready');
  });
  resize();
  return {
    update(value, stopMotion) {
      target = value;
      paused = stopMotion;
      if (paused || !visible) progress = target;
      schedule();
    }
  };
}
