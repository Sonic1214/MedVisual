// Procedural 3D heart driven by the simulation.
// Cutaway view: left atrium, left ventricle and aorta cut open along the
// plane of the mitral and aortic valves (like an echo long-axis view), with
// leaflets, wall thickening and blood particles that move with the flows.
// Whole view: the outside of the heart, including the right side.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const V_LV_ED = 128, LV_WALL = 150, LA_WALL_T = 0.32;
const MITRAL = { x: -1.2, r: 1.25 }, AORTIC = { x: 1.35, r: 1.0 };

// ---------- geometry helpers ----------

function lvDims(v) {
  const b = 7.0 * Math.pow(Math.max(v, 8) / 130, 0.25);
  const a = Math.sqrt((3 * v) / (2 * Math.PI * b));
  // wall thickness from constant wall volume (half ellipsoid shell)
  const k = (2 / 3) * Math.PI, inner = a * a * b;
  let w = 1;
  for (let i = 0; i < 8; i++) {
    const f = k * ((a + w) ** 2 * (b + w) - inner) - LV_WALL;
    const df = k * (2 * (a + w) * (b + w) + (a + w) ** 2);
    w -= f / df;
  }
  return { a, b, w };
}

function laDims(v) {
  const a = Math.cbrt((3 * Math.max(v, 8)) / (4 * Math.PI * 1.1));
  return { a, b: a * 1.1, w: LA_WALL_T };
}

/** Closed wall profile [r, y] pairs: inner surface thB..thT, then outer surface thT..thB. */
function profile(out, a, b, w, thB, thT, n) {
  let k = 0;
  for (let i = 0; i <= n; i++) {
    const th = thB + ((thT - thB) * i) / n;
    out[k++] = a * Math.sin(th); out[k++] = -b * Math.cos(th);
  }
  for (let i = 0; i <= n; i++) {
    const th = thT - ((thT - thB) * i) / n;
    out[k++] = (a + w) * Math.sin(th); out[k++] = -(b + w) * Math.cos(th);
  }
  return out;
}

/** A surface of revolution whose profile can change every frame, with optional cut caps. */
class Shell {
  constructor({ n, segs, phiStart, phiLen, mats, capMat }) {
    this.n = n; this.m = 2 * n + 2; this.segs = segs; this.phiStart = phiStart; this.phiLen = phiLen;
    this.prof = new Float32Array(this.m * 2);
    const cols = segs + 1;
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(cols * this.m * 3);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const idx = { endo: [], myo: [] };
    const m = this.m;
    for (let s = 0; s < segs; s++) {
      for (let j = 0; j < m; j++) {
        const j2 = (j + 1) % m;
        const a = s * m + j, b = (s + 1) * m + j, c = (s + 1) * m + j2, d = s * m + j2;
        const list = j < n ? idx.endo : idx.myo;
        list.push(a, b, d, b, c, d);
      }
    }
    this.geo.setIndex([...idx.endo, ...idx.myo]);
    this.geo.addGroup(0, idx.endo.length, 1);
    this.geo.addGroup(idx.endo.length, idx.myo.length, 0);
    this.mesh = new THREE.Mesh(this.geo, mats);
    this.cos = []; this.sin = [];
    for (let s = 0; s <= segs; s++) { const p = phiStart + (phiLen * s) / segs; this.cos.push(Math.cos(p)); this.sin.push(Math.sin(p)); }
    this.caps = null;
    if (capMat) {
      this.capGeo = new THREE.BufferGeometry();
      this.capPos = new Float32Array(m * 2 * 3);
      this.capGeo.setAttribute('position', new THREE.BufferAttribute(this.capPos, 3));
      this.caps = new THREE.Mesh(this.capGeo, capMat);
      this.mesh.add(this.caps);
    }
  }
  update(a, b, w, thB, thT) {
    profile(this.prof, a, b, w, thB, thT, this.n);
    const { m, prof, pos } = this;
    let k = 0;
    for (let s = 0; s <= this.segs; s++) {
      const c = this.cos[s], sn = this.sin[s];
      for (let j = 0; j < m; j++) {
        const r = prof[j * 2], y = prof[j * 2 + 1];
        pos[k++] = r * sn; pos[k++] = y; pos[k++] = r * c;
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.computeVertexNormals();
    this.geo.computeBoundingSphere();
    if (this.caps) {
      const cp = this.capPos;
      const s0 = Math.sin(this.phiStart), c0 = Math.cos(this.phiStart);
      for (let j = 0; j < m; j++) {
        const r = prof[j * 2], y = prof[j * 2 + 1];
        cp[j * 3] = r * s0; cp[j * 3 + 1] = y; cp[j * 3 + 2] = r * c0 + 0.002;
        cp[(m + j) * 3] = -r * s0; cp[(m + j) * 3 + 1] = y; cp[(m + j) * 3 + 2] = -r * c0 + 0.002;
      }
      if (!this.capIndexed) {
        const contour = [];
        for (let j = 0; j < m; j++) contour.push(new THREE.Vector2(prof[j * 2], prof[j * 2 + 1]));
        const tris = THREE.ShapeUtils.triangulateShape(contour, []);
        const index = [];
        for (const [x, y, z] of tris) { index.push(x, y, z, m + z, m + y, m + x); }
        this.capGeo.setIndex(index);
        this.capIndexed = true;
      }
      this.capGeo.attributes.position.needsUpdate = true;
      this.capGeo.computeVertexNormals();
      this.capGeo.computeBoundingSphere();
    }
  }
}

/** A valve cusp hinged along a tangent of its ring. span = angle of the sector. */
function cuspGeometry(r, span) {
  const shape = new THREE.Shape();
  shape.moveTo(r, 0);
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const phi = Math.PI - span / 2 + (span * i) / steps;
    shape.lineTo(r + r * Math.cos(phi), r * Math.sin(phi));
  }
  shape.lineTo(r, 0);
  const g = new THREE.ShapeGeometry(shape, 6);
  g.rotateX(Math.PI / 2);
  return g;
}

function makeValve(parent, { x, r, cusps, mat, dir }) {
  const ring = new THREE.Group();
  ring.position.set(x, 0, 0);
  parent.add(ring);
  const leaves = [];
  const span = (2 * Math.PI) / cusps;
  for (let i = 0; i < cusps; i++) {
    const psi = cusps === 2 ? (i ? 0 : Math.PI) : Math.PI / 2 + i * span;
    const hinge = new THREE.Group();
    hinge.position.set(r * Math.cos(psi), 0, r * Math.sin(psi));
    hinge.rotation.y = Math.PI - psi;
    const pivot = new THREE.Group();
    const leaf = new THREE.Mesh(cuspGeometry(r * 0.99, span * 0.98), mat);
    pivot.add(leaf);
    hinge.add(pivot);
    ring.add(hinge);
    leaves.push(pivot);
  }
  return { ring, set(open) { for (const p of leaves) p.rotation.z = dir * open; } };
}

function spriteTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.85)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function label(text, cls = '') {
  const d = document.createElement('div');
  d.className = `h3-label ${cls}`;
  d.textContent = text;
  return new CSS2DObject(d);
}

// ---------- main ----------

export function createHeart3D(container) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.localClippingEnabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.className = 'h3-canvas';

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'h3-labels';
  container.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  camera.position.set(4, 1.6, 33);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0.6, -0.6, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.7;
  controls.minPolarAngle = 0.35; controls.maxPolarAngle = Math.PI - 0.35;

  scene.add(new THREE.HemisphereLight(0xfff4f0, 0x40202a, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(6, 10, 12); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc9c0, 1.2); rim.position.set(-8, 4, -10); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.6); fill.position.set(-6, -6, 8); scene.add(fill);

  // clipping plane: keeps the back half (local z < 0) of cut structures
  const cutLocal = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  const cutWorld = new THREE.Plane();
  const clip = [cutWorld];

  const M = {
    myo: new THREE.MeshPhysicalMaterial({ color: 0xa3302c, roughness: 0.48, clearcoat: 0.55, clearcoatRoughness: 0.35, sheen: 0.5, sheenColor: new THREE.Color(0xff9a8a), side: THREE.DoubleSide }),
    endo: new THREE.MeshPhysicalMaterial({ color: 0xd8695c, roughness: 0.42, clearcoat: 0.3, side: THREE.DoubleSide }),
    cut: new THREE.MeshStandardMaterial({ color: 0x8a1c22, roughness: 0.85, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 }),
    laMyo: new THREE.MeshPhysicalMaterial({ color: 0xb0453a, roughness: 0.5, clearcoat: 0.4, side: THREE.DoubleSide }),
    right: new THREE.MeshPhysicalMaterial({ color: 0x86354b, roughness: 0.5, clearcoat: 0.45, sheen: 0.4, sheenColor: new THREE.Color(0xb98aff) }),
    aorta: new THREE.MeshPhysicalMaterial({ color: 0xe2a197, roughness: 0.4, clearcoat: 0.5, side: THREE.DoubleSide, clippingPlanes: clip }),
    aortaWhole: new THREE.MeshPhysicalMaterial({ color: 0xe2a197, roughness: 0.4, clearcoat: 0.5 }),
    pa: new THREE.MeshPhysicalMaterial({ color: 0x6f8fd8, roughness: 0.45, clearcoat: 0.5 }),
    vein: new THREE.MeshPhysicalMaterial({ color: 0xc4564c, roughness: 0.5, clearcoat: 0.3 }),
    vena: new THREE.MeshPhysicalMaterial({ color: 0x5d79c9, roughness: 0.5, clearcoat: 0.3 }),
    valve: new THREE.MeshPhysicalMaterial({ color: 0xfff1d6, roughness: 0.5, clearcoat: 0.4, emissive: 0x3a2a10, side: THREE.DoubleSide }),
    plate: new THREE.MeshStandardMaterial({ color: 0xeed3bd, roughness: 0.7, side: THREE.DoubleSide, clippingPlanes: clip }),
    plateWhole: new THREE.MeshStandardMaterial({ color: 0xc8857a, roughness: 0.6, side: THREE.DoubleSide }),
  };

  const heart = new THREE.Group();
  heart.rotation.set(0.24, -0.38, 0.34);
  heart.position.set(0.2, 0.2, 0);
  scene.add(heart);

  // --- left ventricle (cut and whole versions)
  const lvCut = new Shell({ n: 26, segs: 40, phiStart: Math.PI / 2, phiLen: Math.PI, mats: [M.myo, M.endo], capMat: M.cut });
  const lvWhole = new Shell({ n: 26, segs: 64, phiStart: 0, phiLen: Math.PI * 2, mats: [M.myo, M.endo] });
  heart.add(lvCut.mesh, lvWhole.mesh);

  // --- left atrium
  const la = new THREE.Group();
  heart.add(la);
  const laCut = new Shell({ n: 22, segs: 36, phiStart: Math.PI / 2, phiLen: Math.PI, mats: [M.laMyo, M.endo], capMat: M.cut });
  const laWhole = new Shell({ n: 22, segs: 56, phiStart: 0, phiLen: Math.PI * 2, mats: [M.laMyo, M.endo] });
  la.add(laCut.mesh, laWhole.mesh);

  // --- fibrous base plate with mitral and aortic openings
  const base = new THREE.Group();
  heart.add(base);
  const lv0 = lvDims(V_LV_ED);
  const la0 = laDims(55);
  const laY0 = la0.b * Math.cos(Math.asin(Math.min(MITRAL.r * 0.95, la0.a * 0.8) / la0.a));
  {
    const s = new THREE.Shape();
    s.absarc(0, 0, lv0.a + 0.05, 0, Math.PI * 2, false);
    const h1 = new THREE.Path(); h1.absarc(MITRAL.x, 0, MITRAL.r, 0, Math.PI * 2, true);
    const h2 = new THREE.Path(); h2.absarc(AORTIC.x, 0, AORTIC.r, 0, Math.PI * 2, true);
    s.holes.push(h1, h2);
    const g = new THREE.ShapeGeometry(s, 32);
    g.rotateX(Math.PI / 2);
    base.add(new THREE.Mesh(g, M.plate));
    // a solid lid for the whole-heart view
    const lid = new THREE.Mesh(new THREE.CircleGeometry(lv0.a + lv0.w, 48).rotateX(Math.PI / 2), M.plateWhole);
    lid.name = 'lid';
    heart.add(lid);
  }
  const lidMesh = heart.getObjectByName('lid');
  const mitral = makeValve(base, { x: MITRAL.x, r: MITRAL.r, cusps: 2, mat: M.valve, dir: -1 });
  const aortic = makeValve(base, { x: AORTIC.x, r: AORTIC.r, cusps: 3, mat: M.valve, dir: 1 });

  // --- vessels
  const tube = (pts, r, mat, seg = 80) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, 28, false), mat);
  const aortaPts = [[AORTIC.x, -0.05, 0], [1.5, 2.4, 0], [1.45, 4.8, -0.3], [0.3, 6.6, -1.2], [-1.3, 6.3, -2.2], [-1.85, 3.6, -2.8], [-1.95, -2.5, -3.0]];
  const aortaCut = tube(aortaPts, 1.05, M.aorta, 120);
  const aortaWhole = tube(aortaPts, 1.05, M.aortaWhole, 120);
  heart.add(aortaCut, aortaWhole);
  const branches = [[[0.6, 6.4, -0.9], [0.9, 8.6, -0.8]], [[-0.1, 6.7, -1.5], [-0.1, 8.8, -1.6]], [[-0.8, 6.6, -1.9], [-1.2, 8.6, -2.1]]];
  for (const b of branches) heart.add(tube(b, 0.36, M.aortaWhole, 12));
  const pvs = [[[-1.9, 2.4, -1.5], [-3.2, 2.9, -2.6], [-4.4, 3.2, -3.0]], [[-1.7, 1.4, -1.6], [-3.0, 1.2, -2.8], [-4.2, 0.9, -3.2]], [[-0.6, 2.4, -1.6], [0.2, 2.8, -2.8], [0.8, 3.2, -3.8]], [[-0.6, 1.3, -1.7], [0.1, 1.1, -3.0], [0.7, 0.9, -3.9]]];
  for (const p of pvs) heart.add(tube(p, 0.42, M.vein, 16));

  // --- right heart (whole view only)
  const right = new THREE.Group();
  heart.add(right);
  const rv = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), M.right);
  rv.position.set(-1.3, -1.9, 1.75); rv.rotation.z = -0.32;
  const ra = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), M.right);
  ra.position.set(-3.5, 2.0, 1.0);
  right.add(rv, ra);
  right.add(tube([[-0.9, 0.2, 3.3], [-0.2, 3.4, 3.1], [0.7, 5.2, 1.7], [0.3, 5.9, 0.0], [-0.9, 5.7, -0.8]], 1.0, M.pa, 60));
  right.add(tube([[0.7, 5.3, 1.5], [2.6, 5.5, 0.5], [4.0, 5.2, -0.4]], 0.6, M.pa, 20));
  right.add(tube([[-3.5, 3.6, 0.9], [-3.4, 6.0, 0.6], [-3.3, 8.6, 0.4]], 0.85, M.vena, 20));
  right.add(tube([[-3.5, 0.4, 1.0], [-3.4, -2.5, 0.9], [-3.2, -5.0, 0.8]], 0.95, M.vena, 20));

  // --- blood particles
  const N = window.matchMedia('(max-width: 600px)').matches ? 240 : 360;
  const segDefs = [
    { pts: [[-4.4, 3.2, -3.0], [-3.2, 2.9, -2.6], [-2.0, 2.5, -1.0], [-1.2, 2.2, -0.3]], area: 9, rad: 0.9, flow: (p) => p.qpv },
    { pts: [[-1.2, 2.2, -0.3], [-1.2, 1.0, -0.1], [-1.2, 0.0, 0], [-1.0, -2.4, 0]], area: 5, rad: 0.85, flow: (p) => p.qmv },
    { pts: [[-1.0, -2.4, 0], [-0.4, -4.8, 0], [0.4, -5.2, 0], [1.0, -3.0, 0], [1.3, -0.8, 0]], area: 16, rad: 1.5, flow: (p) => Math.max(p.qmv, p.qav) },
    { pts: aortaPts.slice(0), area: 4.5, rad: 0.62, flow: (p) => 0.65 * p.qav + 0.35 * p.q12 },
  ];
  segDefs[3].pts[0] = [1.3, -0.8, 0];
  segDefs[3].pts.splice(1, 0, [AORTIC.x, 0.1, 0]);
  const curves = segDefs.map((s) => new THREE.CatmullRomCurve3(s.pts.map((p) => new THREE.Vector3(...p))));
  const lens = curves.map((c) => c.getLength());
  const pPos = new Float32Array(N * 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.34, map: spriteTexture(), color: 0xff3b3b, transparent: true, depthWrite: false, sizeAttenuation: true }));
  heart.add(particles);
  const parts = [];
  const totalLen = lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < N; i++) {
    let u = Math.random() * totalLen, seg = 0;
    while (u > lens[seg] && seg < 3) { u -= lens[seg]; seg++; }
    const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    parts.push({ seg, s: Math.min(u, lens[seg]), dir: v, rf: Math.sqrt(Math.random()), spd: 0.8 + Math.random() * 0.4 });
  }
  const tmp = new THREE.Vector3(), tan = new THREE.Vector3(), off = new THREE.Vector3();

  // --- labels
  const labels = [];
  const addLabel = (obj, text, pos, mode) => { const l = label(text); l.position.set(...pos); obj.add(l); labels.push({ l, mode }); return l; };
  const labLA = addLabel(la, 'Left atrium', [0, 3, 0], 'both');
  addLabel(heart, 'Left ventricle', [-2.4, -4.2, 0.4], 'both');
  addLabel(heart, 'Aorta', [2.9, 3.2, 0], 'both');
  addLabel(base, 'Mitral valve', [MITRAL.x - 0.4, -0.9, 0.2], 'cut');
  addLabel(base, 'Aortic valve', [AORTIC.x + 1.9, 0.5, 0], 'cut');
  addLabel(heart, 'Pulmonary veins', [-5.0, 1.4, -3.3], 'cut');
  addLabel(right, 'Right ventricle', [-2.2, -3.6, 3.8], 'whole');
  addLabel(right, 'Right atrium', [-4.6, 2.6, 2.0], 'whole');
  addLabel(right, 'Pulmonary trunk', [-0.2, 4.4, 3.6], 'whole');

  // --- state
  let mode = 'cut', showLabels = true, mvOpen = 0, avOpen = 0, size = [0, 0];

  function applyMode() {
    const cut = mode === 'cut';
    lvCut.mesh.visible = cut; lvWhole.mesh.visible = !cut;
    laCut.mesh.visible = cut; laWhole.mesh.visible = !cut;
    aortaCut.visible = cut; aortaWhole.visible = !cut;
    base.visible = cut;
    heart.getObjectByName('lid').visible = !cut;
    right.visible = !cut;
    particles.visible = cut;
    for (const { l, mode: m } of labels) l.visible = showLabels && (m === 'both' || m === mode);
  }
  applyMode();

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h || (w === size[0] && h === size[1])) return;
    size = [w, h];
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    // keep the whole heart in view on narrow screens
    camera.position.setLength(w / h < 0.9 ? (33 / Math.max(0.6, w / h)) * 0.9 : 33);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  function updateParticles(p, dt) {
    const k = 0.55;
    for (const q of parts) {
      const sd = segDefs[q.seg];
      const v = (sd.flow(p) / sd.area) * k * q.spd;
      q.s += v * dt;
      while (q.s > lens[q.seg]) {
        q.s -= lens[q.seg];
        q.seg = (q.seg + 1) % 4;
      }
      if (q.s < 0) q.s = 0;
    }
  }

  function placeParticles(lvd, lad, laY, cut) {
    const sa = lvd.a / lv0.a, sb = lvd.b / lv0.b;
    const sl = lad.a / la0.a;
    for (let i = 0; i < parts.length; i++) {
      const q = parts[i];
      const c = curves[q.seg];
      const u = Math.min(1, q.s / lens[q.seg]);
      c.getPointAt(u, tmp); c.getTangentAt(u, tan);
      off.copy(q.dir).addScaledVector(tan, -q.dir.dot(tan));
      if (off.lengthSq() < 1e-6) off.set(0, 0, -1);
      off.normalize().multiplyScalar(q.rf * segDefs[q.seg].rad * (q.seg === 1 && u > 0.4 && u < 0.7 ? 0.7 : 1));
      if (cut && off.z > 0) off.z = -off.z;
      tmp.add(off);
      if (q.seg === 0 || (q.seg === 1 && tmp.y > 0.3)) {
        // left atrium: scale about its centre, which moves with the mitral ring
        tmp.x = MITRAL.x * sa + (tmp.x - MITRAL.x) * sl;
        tmp.y = laY + (tmp.y - laY0) * sl;
        tmp.z *= sl;
      } else if (tmp.y < 0) {
        tmp.x *= sa; tmp.z *= sa; tmp.y *= sb;
      }
      pPos[i * 3] = tmp.x; pPos[i * 3 + 1] = tmp.y; pPos[i * 3 + 2] = tmp.z;
    }
    pGeo.attributes.position.needsUpdate = true;
  }

  function update(p, dtSim, opts) {
    resize();
    // ventricle
    const lvd = lvDims(p.vlv);
    if (mode === 'cut') lvCut.update(lvd.a, lvd.b, lvd.w, 0.0001, Math.PI / 2);
    else lvWhole.update(lvd.a, lvd.b, lvd.w, 0.0001, Math.PI / 2);
    // base plate follows the ventricle's base
    const bs = lvd.a / lv0.a;
    base.scale.set(bs, 1, bs);
    const ls = (lvd.a + lvd.w) / (lv0.a + lv0.w);
    lidMesh.scale.set(ls, 1, ls);
    // atrium sits on the mitral ring
    const lad = laDims(p.vla);
    const ob = Math.min(MITRAL.r * bs * 0.95, lad.a * 0.8);
    const thB = Math.asin(ob / lad.a);
    if (mode === 'cut') laCut.update(lad.a, lad.b, lad.w, thB, Math.PI - 0.0001);
    else laWhole.update(lad.a, lad.b, lad.w, thB, Math.PI - 0.0001);
    const laY = lad.b * Math.cos(thB);
    la.position.set(MITRAL.x * bs, laY, 0);
    labLA.position.set(0, lad.b + lad.w + 0.5, 0);
    // right side follows the left, roughly
    const rs = Math.cbrt(p.vlv / V_LV_ED);
    rv.scale.set(3.1 * rs, 5.3 * Math.pow(rs, 0.6), 2.5 * rs);
    const rs2 = Math.cbrt(p.vla / 55);
    ra.scale.set(2.1 * rs2, 2.3 * rs2, 1.9 * rs2);

    // valves: open with forward flow, smoothed in simulated time
    const a = 1 - Math.exp(-Math.abs(dtSim) / 0.02);
    const mvT = p.qmv > 1 ? 0.45 + 0.55 * Math.min(1, p.qmv / 260) : 0;
    const avT = p.qav > 1 ? 0.45 + 0.55 * Math.min(1, p.qav / 380) : 0;
    mvOpen += (mvT - mvOpen) * (dtSim === 0 ? 1 : a);
    avOpen += (avT - avOpen) * (dtSim === 0 ? 1 : a);
    const o = opts || {};
    mitral.set((mvOpen * 1.35 * (1 - 0.55 * (o.ms || 0))) + 0.12 * (o.mr || 0));
    aortic.set((avOpen * 1.4 * (1 - 0.6 * (o.as || 0))) + 0.12 * (o.ar || 0));

    // particles
    if (mode === 'cut') {
      updateParticles(p, Math.max(0, dtSim));
      placeParticles(lvd, lad, laY, true);
    }

    controls.update();
    heart.updateMatrixWorld();
    cutWorld.copy(cutLocal).applyMatrix4(heart.matrixWorld);
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  return {
    update,
    setMode(m) { mode = m; applyMode(); },
    setLabels(v) { showLabels = v; applyMode(); },
    setInteractive(v) {
      controls.enabled = v;
      renderer.domElement.style.touchAction = v ? 'none' : 'pan-y';
    },
    resetView() { camera.position.set(4, 1.6, 33); size = [0, 0]; resize(); controls.target.set(0.6, -0.6, 0); controls.update(); },
    dispose() { ro.disconnect(); renderer.dispose(); },
  };
}
