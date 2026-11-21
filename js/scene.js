// Title-screen world, built entirely from code (no model files):
// a cel-shaded wish orb with stars, six orbiting mini orbs, a floating
// island with low-poly trees and crystals, drifting clouds and ki sparks.
// Anime look = MeshToonMaterial with a 3-step ramp + inverted-hull ink outlines.
// "Pixel mode" renders the same scene at 1/N resolution and upscales it crisp.

import * as THREE from 'three';

export function createWorld(canvas, { reducedMotion = false, onOrbTap = () => {}, onHover = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.6, 11);

  // --- light + toon ramp -------------------------------------------------
  scene.add(new THREE.HemisphereLight(0xfff1d6, 0x1b2a4a, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-4, 6, 6);
  scene.add(sun);

  const ramp = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;

  const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...extra });
  // faceted low-poly look: split shared vertices so each face gets its own normal
  const facet = (g) => { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; };
  const inkMat = new THREE.MeshBasicMaterial({ color: 0x1b1528, side: THREE.BackSide });

  // inverted hull outline: a slightly fatter black copy drawn back-faces only
  function inked(mesh, t = 0.04) {
    const hull = new THREE.Mesh(mesh.geometry, inkMat);
    hull.scale.setScalar(1 + t);
    hull.raycast = () => {};
    mesh.add(hull);
    return mesh;
  }

  const world = new THREE.Group();
  scene.add(world);

  // --- the wish orb ------------------------------------------------------
  const orbRig = new THREE.Group();          // position + squash (does not spin)
  const orbSpin = new THREE.Group();         // spins, carries the stars
  orbRig.add(orbSpin);
  world.add(orbRig);

  const orb = inked(new THREE.Mesh(new THREE.SphereGeometry(1.3, 64, 40), toon(0xff8a1f, { emissive: 0x6a1d00, emissiveIntensity: 0.35 })), 0.035);
  orbSpin.add(orb);

  const starShape = (outer, inner) => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? inner : outer;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    return s;
  };
  const bigStarGeo = new THREE.ExtrudeGeometry(starShape(0.24, 0.1), { depth: 0.04, bevelEnabled: false });
  const starMat = toon(0xd62828, { emissive: 0x400000 });
  const starDirs = [[-0.32, 0.3], [0.3, 0.28], [0, -0.05], [-0.25, -0.38]];
  for (const [x, y] of starDirs) {
    const dir = new THREE.Vector3(x, y, 1).normalize();
    const star = new THREE.Mesh(bigStarGeo, starMat);
    star.position.copy(dir.clone().multiplyScalar(1.29));
    star.lookAt(dir.clone().multiplyScalar(3));
    orbSpin.add(star);
  }
  // anime glint: stays put relative to the light while the orb spins
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  glint.scale.set(1.5, 0.75, 0.3);
  glint.position.set(-0.55, 0.72, 1.0);
  glint.rotation.z = 0.6;
  orbRig.add(glint);
  const glint2 = glint.clone();
  glint2.scale.set(0.45, 0.45, 0.2);
  glint2.position.set(-0.22, 0.98, 0.82);
  orbRig.add(glint2);

  // soft aura
  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(1.75, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false })
  );
  orbRig.add(aura);

  // --- six mini orbs on a tilted orbit ----------------------------------
  const orbit = new THREE.Group();
  orbit.rotation.set(0.45, 0, 0.18);
  world.add(orbit);
  const miniGeo = new THREE.SphereGeometry(0.26, 24, 16);
  const miniStarGeo = new THREE.ExtrudeGeometry(starShape(0.08, 0.035), { depth: 0.02, bevelEnabled: false });
  const minis = [];
  for (let i = 0; i < 6; i++) {
    const m = inked(new THREE.Mesh(miniGeo, toon(0xffa53c, { emissive: 0x5a1800, emissiveIntensity: 0.3 })), 0.08);
    const st = new THREE.Mesh(miniStarGeo, starMat);
    st.position.z = 0.255;
    m.add(st);
    const a = (i / 6) * Math.PI * 2;
    m.userData.a = a;
    orbit.add(m);
    minis.push(m);
  }

  // --- floating island -------------------------------------------------
  const island = new THREE.Group();
  island.position.y = -2.25;
  world.add(island);

  const grass = inked(new THREE.Mesh(facet(new THREE.CylinderGeometry(2.3, 2.15, 0.42, 10)), toon(0x40c057)), 0.03);
  island.add(grass);
  const rockGeo = new THREE.ConeGeometry(2.15, 2.6, 10, 3);
  // roughen the rock so it reads as stone, not a perfect cone
  const pos = rockGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < 1.2) {
      const k = 1 + (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.18;
      pos.setX(i, pos.getX(i) * k);
      pos.setZ(i, pos.getZ(i) * k);
    }
  }
  rockGeo.computeVertexNormals();
  const rock = inked(new THREE.Mesh(facet(rockGeo), toon(0x8d5a3b)), 0.025);
  rock.rotation.x = Math.PI;
  rock.position.y = -1.5;
  island.add(rock);

  const tree = (x, z, s) => {
    const g = new THREE.Group();
    const trunk = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.5, 6), toon(0x6b3f23)), 0.12);
    trunk.position.y = 0.25;
    const top = inked(new THREE.Mesh(facet(new THREE.ConeGeometry(0.38, 0.9, 7)), toon(0x2f9e44)), 0.06);
    top.position.y = 0.9;
    const top2 = inked(new THREE.Mesh(facet(new THREE.ConeGeometry(0.3, 0.6, 7)), toon(0x51cf66)), 0.06);
    top2.position.y = 1.3;
    g.add(trunk, top, top2);
    g.position.set(x, 0.2, z);
    g.scale.setScalar(s);
    island.add(g);
  };
  tree(-1.45, 0.4, 1);
  tree(-1.0, -0.9, 0.8);
  tree(1.55, -0.3, 0.9);

  const crystalGeo = new THREE.OctahedronGeometry(0.22, 0);
  const crystalMat = toon(0x3bc9db, { emissive: 0x0b5260, emissiveIntensity: 0.6 });
  const crystals = [];
  for (const [x, z, s] of [[0.9, 0.9, 1], [1.2, 0.6, 0.6], [-0.4, 1.3, 0.7]]) {
    const c = inked(new THREE.Mesh(crystalGeo, crystalMat), 0.1);
    c.scale.set(s * 0.8, s * 1.6, s * 0.8);
    c.position.set(x, 0.45, z);
    island.add(c);
    crystals.push(c);
  }

  // hanging rocks under the island
  for (const [x, y, s] of [[-2.6, -1.4, 0.35], [2.5, -2.2, 0.25], [-1.9, -3.1, 0.2]]) {
    const r = inked(new THREE.Mesh(facet(new THREE.DodecahedronGeometry(s, 0)), toon(0x8d5a3b)), 0.08);
    r.position.set(x, y, 0.3);
    r.userData.base = y;
    island.add(r);
    crystals.push(r);
  }

  // --- clouds ----------------------------------------------------------
  const cloudMat = toon(0xffffff);
  const cloudGeo = new THREE.SphereGeometry(1, 16, 12);
  const clouds = [];
  const makeCloud = (x, y, z, s, speed) => {
    const g = new THREE.Group();
    for (const [cx, cy, cs] of [[0, 0, 0.55], [0.55, -0.08, 0.42], [-0.55, -0.1, 0.4], [0.25, 0.22, 0.38]]) {
      const puff = inked(new THREE.Mesh(cloudGeo, cloudMat), 0.06);
      puff.scale.setScalar(cs);
      puff.position.set(cx, cy, 0);
      g.add(puff);
    }
    g.scale.setScalar(s);
    g.position.set(x, y, z);
    g.userData.speed = speed;
    g.userData.base = x;
    world.add(g);
    clouds.push(g);
  };
  // clouds hover around the island (they ride with the world, so they never cross the title text)
  makeCloud(-1.6, 2.9, -2.5, 1.0, 0.5);
  makeCloud(2.6, 2.2, -3.5, 1.2, 0.35);
  makeCloud(3.4, -1.6, -1.5, 0.8, 0.6);
  makeCloud(-3.0, -2.9, -2.5, 0.9, 0.45);

  // --- ki sparks (points spiralling up around the orb) ----------------
  const SPARKS = 140;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(SPARKS * 3);
  const sparkSeed = new Float32Array(SPARKS * 3);
  for (let i = 0; i < SPARKS; i++) {
    sparkSeed[i * 3] = Math.random() * Math.PI * 2;
    sparkSeed[i * 3 + 1] = Math.random();
    sparkSeed[i * 3 + 2] = 1.7 + Math.random() * 1.4;
  }
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({ color: 0xffd23f, size: 0.07, transparent: true, opacity: 0.9, depthWrite: false });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  world.add(sparks);

  // background pixel stars
  const starsGeo = new THREE.BufferGeometry();
  const sp = new Float32Array(240 * 3);
  for (let i = 0; i < 240; i++) {
    sp[i * 3] = (Math.random() - 0.5) * 40;
    sp[i * 3 + 1] = (Math.random() - 0.5) * 24;
    sp[i * 3 + 2] = -12 - Math.random() * 10;
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xf6eedc, size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.7 })));

  // --- layout: scene sits right of the text on wide screens, below it on phones
  let pixel = 1;
  let w = 1, h = 1;
  function layout() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    camera.aspect = w / h;
    const wide = camera.aspect > 1.05;
    world.position.set(wide ? 2.9 : 0, wide ? 0.25 : -2.6, 0);
    world.scale.setScalar(wide ? 1 : 0.66);
    // on phones the upper clouds would sit on the text
    clouds.forEach((c) => { c.visible = wide || c.position.y < 0; });
    camera.position.z = wide ? 11 : 13;
    camera.updateProjectionMatrix();
    applySize();
  }
  function applySize() {
    const dpr = pixel === 1 ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    renderer.setPixelRatio(dpr);
    renderer.setSize(Math.ceil(w / pixel), Math.ceil(h / pixel), false);
    canvas.classList.toggle('is-pixel', pixel > 1);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
  }

  // pixelate in steps so the switch itself is an animation
  let pixelAnim = 0;
  function setPixel(target) {
    cancelAnimationFrame(pixelAnim);
    const steps = target > 1 ? [2, 3, 4, 5, 6] : [5, 4, 3, 2, 1];
    if (reducedMotion) { pixel = target > 1 ? 6 : 1; applySize(); render(); return; }
    let i = 0, last = 0;
    const tick = (t) => {
      if (t - last > 45) { pixel = steps[i++]; applySize(); last = t; if (!running) render(); }
      if (i < steps.length) pixelAnim = requestAnimationFrame(tick);
    };
    pixelAnim = requestAnimationFrame(tick);
  }

  // --- pointer: parallax + orb hit test --------------------------------
  const pointer = new THREE.Vector2(0, 0);
  const target = new THREE.Vector2(0, 0);
  const ray = new THREE.Raycaster();
  let hovering = false;
  const toNdc = (e) => {
    const r = canvas.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  const hitsOrb = (ndc) => { ray.setFromCamera(ndc, camera); return ray.intersectObject(orb, false).length > 0; };

  const onMove = (e) => {
    const n = toNdc(e);
    target.copy(n);
    const over = hitsOrb(n);
    if (over !== hovering) { hovering = over; onHover(over); }
  };
  const onDown = (e) => { if (hitsOrb(toNdc(e))) tapOrb(); };
  window.addEventListener('pointermove', onMove, { passive: true });
  canvas.addEventListener('pointerdown', onDown);

  // squash, then spring back with a spin burst
  let squashT = -1, spinBoost = 0, burst = 0;
  function tapOrb() {
    squashT = 0;
    spinBoost = 9;
    burst = 1;
    onOrbTap();
    if (!running) { squashT = -1; render(); }
  }

  // --- loop --------------------------------------------------------------
  const clock = new THREE.Clock();
  let running = false, raf = 0, inView = true;
  const tmp = new THREE.Vector3();

  function update(dt, t) {
    pointer.lerp(target, 1 - Math.pow(0.001, dt));
    world.rotation.y = pointer.x * 0.25;
    world.rotation.x = -pointer.y * 0.08;

    orbRig.position.y = 0.35 + Math.sin(t * 1.4) * 0.12;
    spinBoost *= Math.pow(0.04, dt);
    orbSpin.rotation.y += dt * (0.5 + spinBoost);
    orbSpin.rotation.z = Math.sin(t * 0.7) * 0.08;

    // squash and stretch: volume stays roughly constant
    if (squashT >= 0) {
      squashT += dt;
      const k = squashT / 0.55;
      const s = k < 0.18 ? (k / 0.18) * 0.22 : 0.22 * Math.exp(-(k - 0.18) * 6) * Math.cos((k - 0.18) * 16);
      orbRig.scale.set(1 + s, 1 - s, 1 + s);
      if (k >= 1) { squashT = -1; orbRig.scale.set(1, 1, 1); }
    }

    aura.scale.setScalar(1 + Math.sin(t * 2.2) * 0.04 + burst * 0.35);
    aura.material.opacity = 0.14 + burst * 0.3;
    burst *= Math.pow(0.02, dt);

    orbit.rotation.y += dt * 0.35;
    minis.forEach((m, i) => {
      const a = m.userData.a;
      m.position.set(Math.cos(a) * 2.5, Math.sin(t * 2 + i) * 0.12, Math.sin(a) * 2.5);
      m.rotation.y = Math.PI / 2 - a; // keep the star facing outward
    });

    island.position.y = -2.25 + Math.sin(t * 0.9) * 0.08;
    crystals.forEach((c, i) => {
      if (c.userData.base !== undefined) c.position.y = c.userData.base + Math.sin(t * 1.3 + i) * 0.1;
      else c.rotation.y += dt * (0.8 + i * 0.2);
    });

    clouds.forEach((c, i) => {
      c.position.x = c.userData.base + Math.sin(t * c.userData.speed + i * 2) * 0.5;
    });

    for (let i = 0; i < SPARKS; i++) {
      const life = (sparkSeed[i * 3 + 1] + t * 0.18 * (1 + burst * 3)) % 1;
      const a = sparkSeed[i * 3] + t * 0.6 + life * 3;
      const r = sparkSeed[i * 3 + 2] * (1 + burst * 0.6);
      tmp.set(Math.cos(a) * r, -1.6 + life * 4.2, Math.sin(a) * r);
      sparkPos.set([tmp.x, tmp.y + 0.35, tmp.z], i * 3);
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparkMat.size = 0.07 + burst * 0.06;
  }

  function render() { renderer.render(scene, camera); }

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    update(dt, clock.elapsedTime);
    render();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || reducedMotion || !inView || document.hidden) return;
    running = true;
    clock.getDelta();
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  // only render while the title screen is on screen and the tab is visible
  const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; inView ? start() : stop(); }, { threshold: 0.01 });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  const ro = new ResizeObserver(() => { layout(); if (!running) render(); });
  ro.observe(canvas);

  layout();
  update(0.016, 0.5);
  render();
  start();

  return { setPixel, tapOrb };
}
