import * as THREE from './assets/vendor/three.module.js';

export function mountScene(host, initiallyPaused) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0.3, 9.5);
  camera.lookAt(0, 0, 0);

  // Procedural studio light cards give the chrome real reflections, without a remote HDR asset.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#acada6');
  const lightCard = (color, x, y, z, width, height) => {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    card.position.set(x, y, z);
    card.lookAt(0, 0, 0);
    studio.add(card);
  };
  lightCard('#ffffff', -4, 4, 3, 4, 9);
  lightCard('#ffffff', 5, 1, 2, 2, 10);
  lightCard('#1b1c1b', -3, 0, -4, 5, 12);
  lightCard('#ffffff', 0, 6, 0, 10, 3);
  lightCard('#24251f', 2, -4, 0, 12, 4);
  lightCard('#a6bfff', 5, -1, -3, 2, 6);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(studio, 0.04);
  scene.environment = env.texture;
  studio.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x79776b, 2));
  const sun = new THREE.DirectionalLight(0xffffff, 4);
  sun.position.set(-3, 5, 6);
  scene.add(sun);
  const blueLight = new THREE.DirectionalLight(0x98baff, 1);
  blueLight.position.set(4, -1, 1);
  scene.add(blueLight);

  const group = new THREE.Group();
  scene.add(group);
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd4d5d2, metalness: 1, roughness: 0.15, envMapIntensity: 1.7 });
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.1, 0.32, 220, 32, 2, 3), chrome);
  knot.rotation.set(0.5, -0.4, -0.4);
  group.add(knot);

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.53, 48, 32), new THREE.MeshStandardMaterial({ color: 0x164bea, roughness: 0.27, metalness: 0.12 }));
  sphere.position.set(2.5, -0.1, 0.55);
  group.add(sphere);
  const smallSphere = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), chrome);
  smallSphere.position.set(-1.65, -1.0, 0.8);
  group.add(smallSphere);
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.55, 0)), new THREE.LineBasicMaterial({ color: 0x393a31 }));
  wire.position.set(-1.9, 0.85, -0.1);
  wire.rotation.set(0.1, 0.2, 0.3);
  group.add(wire);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.008, 8, 100), new THREE.MeshBasicMaterial({ color: 0x817f73, transparent: true, opacity: 0.4 }));
  ring.rotation.set(1.1, 0.2, -0.35);
  group.add(ring);

  host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  let paused = initiallyPaused;
  let visible = true;
  let lost = false;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let yaw = 0;
  let pitch = 0;
  let targetYaw = 0;
  let targetPitch = 0;
  let time = 0;
  let lastTime = performance.now();
  let frame = 0;
  const sphereAnchor = new THREE.Vector3();

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = camera.aspect < 1.2 ? 11.5 : 9.5;
    camera.updateProjectionMatrix();
    renderOnce();
  }
  function renderOnce() {
    if (lost) return;
    renderer.render(scene, camera);
    // Project the moving sphere's lower surface into the DOM thread's coordinates.
    sphere.getWorldPosition(sphereAnchor);
    sphereAnchor.y -= .49;
    sphereAnchor.project(camera);
    host.dispatchEvent(new CustomEvent('sphere-anchor', { detail: {
      x: (sphereAnchor.x + 1) / 2, y: (1 - sphereAnchor.y) / 2
    } }));
  }
  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || lost || paused) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    time += dt;
    yaw += (targetYaw - yaw) * 0.09;
    pitch += (targetPitch - pitch) * 0.09;
    group.rotation.y = yaw;
    group.rotation.x = pitch;
    knot.rotation.y += dt * 0.13;
    group.position.y = Math.sin(time * 0.7) * 0.10;
    sphere.position.y = -0.1 + Math.sin(time * 0.9 + 1) * 0.2;
    wire.rotation.y += dt * 0.22;
    renderOnce();
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    if (frame || paused || !visible || document.hidden || lost) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }
  document.addEventListener('gallery-motion', event => {
    paused = event.detail.paused;
    if (paused) { cancelAnimationFrame(frame); frame = 0; }
    else resume();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else resume();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) { cancelAnimationFrame(frame); frame = 0; }
    else resume();
  }).observe(host);
  new ResizeObserver(resize).observe(host);
  host.addEventListener('pointerdown', event => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener('pointermove', event => {
    if (!dragging) return;
    targetYaw += (event.clientX - lastX) * 0.012;
    targetPitch = THREE.MathUtils.clamp(targetPitch + (event.clientY - lastY) * 0.006, -0.5, 0.5);
    lastX = event.clientX;
    lastY = event.clientY;
    if (paused) {
      group.rotation.set(targetPitch, targetYaw, 0);
      yaw = targetYaw;
      pitch = targetPitch;
      renderOnce();
    }
  });
  const endDrag = () => { dragging = false; };
  host.addEventListener('pointerup', endDrag);
  host.addEventListener('pointercancel', endDrag);
  host.addEventListener('lostpointercapture', endDrag);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    host.classList.remove('scene-ready');
    renderer.domElement.hidden = true;
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    lost = false;
    renderer.domElement.hidden = false;
    renderOnce();
    host.classList.add('scene-ready');
    resume();
  });
  resize();
  host.classList.add('scene-ready');
  resume();
}
