/* ============================================
   THREE.JS — Field + Road
   ============================================ */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060b14, .012);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 600);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x060b14);

const CAM_START = { x: 0, y: 5, z: 18, lx: 0, ly: 0, lz: 0 };
const CAM_END   = { x: 0, y: 45, z: 0.1, lx: 0, ly: 0, lz: 0 };

camera.position.set(CAM_START.x, CAM_START.y, CAM_START.z);
camera.lookAt(CAM_START.lx, CAM_START.ly, CAM_START.lz);

const fieldColor = new THREE.Color(0x1a6b3a);
const fieldColor2 = new THREE.Color(0x2d8a4e);

/* ---- Field planes (ground) ---- */
const planeW = 120, segW = 90;
const fieldGeo1 = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
fieldGeo1.rotateX(-Math.PI / 2);
const fieldMat1 = new THREE.MeshBasicMaterial({ color: fieldColor, wireframe: true, transparent: true, opacity: .09 });
const fieldMat1Solid = new THREE.MeshBasicMaterial({ color: fieldColor, wireframe: false, transparent: true, opacity: .6 });
const fieldPlane1 = new THREE.Mesh(fieldGeo1, fieldMat1);
fieldPlane1.position.y = -3;
scene.add(fieldPlane1);

const fieldGeo2 = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
fieldGeo2.rotateX(-Math.PI / 2);
const fieldMat2 = new THREE.MeshBasicMaterial({ color: fieldColor2, wireframe: true, transparent: true, opacity: .06 });
const fieldMat2Solid = new THREE.MeshBasicMaterial({ color: fieldColor2, wireframe: false, transparent: true, opacity: .5 });
const fieldPlane2 = new THREE.Mesh(fieldGeo2, fieldMat2);
fieldPlane2.position.y = -3.8;
scene.add(fieldPlane2);

/* ---- Road strip (hidden initially) ---- */
const roadGeo = new THREE.PlaneGeometry(6, 300, 1, 1);
roadGeo.rotateX(-Math.PI / 2);
const roadMat = new THREE.MeshBasicMaterial({ color: 0x15152a, transparent: true, opacity: 0 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.position.y = -2.95;
scene.add(road);

const edgeGeoL = new THREE.PlaneGeometry(.15, 300, 1, 1);
edgeGeoL.rotateX(-Math.PI / 2);
const edgeMatL = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
const roadEdgeL = new THREE.Mesh(edgeGeoL, edgeMatL);
roadEdgeL.position.set(-3, -2.94, 0);
scene.add(roadEdgeL);
const roadEdgeR = new THREE.Mesh(edgeGeoL.clone(), edgeMatL.clone());
roadEdgeR.position.set(3, -2.94, 0);
scene.add(roadEdgeR);

const dashGeo = new THREE.PlaneGeometry(.15, 1.8, 1, 1);
dashGeo.rotateX(-Math.PI / 2);
const dashes = [];
for (let i = 0; i < 60; i++) {
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const dash = new THREE.Mesh(dashGeo, dashMat);
  dash.position.set(0, -2.93, -i * 4 + 30);
  scene.add(dash);
  dashes.push(dash);
}

/* ---- Floating low-poly shapes ---- */
const geos = [
  new THREE.IcosahedronGeometry(1, 0),
  new THREE.OctahedronGeometry(1, 0),
  new THREE.TetrahedronGeometry(1, 0),
  new THREE.DodecahedronGeometry(1, 0)
];
const palette = [0x64ffda, 0x48b1ff, 0xa78bfa, 0x3fb950, 0xd2a8ff];
const shapes = [];

for (let i = 0; i < 20; i++) {
  const geo = geos[Math.floor(Math.random() * geos.length)];
  const color = palette[Math.floor(Math.random() * palette.length)];
  const baseOpacity = .1 + Math.random() * .12;
  const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: baseOpacity });
  const matSolid = new THREE.MeshBasicMaterial({ color, wireframe: false, transparent: true, opacity: 0.55 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set((Math.random() - .5) * 35, (Math.random() - .5) * 15 + 2, (Math.random() - .5) * 20 - 5);
  mesh.scale.setScalar(.4 + Math.random() * 1.8);
  mesh.userData = {
    rotSpeed: { x: (Math.random() - .5) * .008, y: (Math.random() - .5) * .008, z: (Math.random() - .5) * .004 },
    floatSpeed: .2 + Math.random() * .4,
    floatAmp: .2 + Math.random() * .6,
    baseY: mesh.position.y,
    baseOpacity
  };
  mesh.userData.matWire = mat;
  mesh.userData.matSolid = matSolid;
  scene.add(mesh);
  shapes.push(mesh);
}

/* ---- Stars (dark mode + contact section only, with subtle light) ---- */
const starGeo = new THREE.BufferGeometry();
const starCount = 180;
const starPos = new Float32Array(starCount * 3);
const starCol = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - .5) * 80;
  starPos[i * 3 + 1] = Math.random() * 35 + 8;
  starPos[i * 3 + 2] = (Math.random() - .5) * 80;
  const b = 0.85 + Math.random() * 0.15;
  starCol[i * 3] = b; starCol[i * 3 + 1] = b; starCol[i * 3 + 2] = b + Math.random() * 0.1;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
const starMat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
const stars = new THREE.Points(starGeo, starMat);
stars.visible = false;
scene.add(stars);

const edgeShapes = [];
for (let i = 0; i < 6; i++) {
  const geo = geos[Math.floor(Math.random() * geos.length)];
  const edges = new THREE.EdgesGeometry(geo);
  const color = palette[Math.floor(Math.random() * palette.length)];
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: .05 });
  const line = new THREE.LineSegments(edges, mat);
  line.position.set((Math.random() - .5) * 30, (Math.random() - .5) * 12, (Math.random() - .5) * 15 - 8);
  line.scale.setScalar(2.5 + Math.random() * 4);
  line.userData = { rotSpeed: { x: (Math.random() - .5) * .002, y: (Math.random() - .5) * .002 }, baseOpacity: .05 };
  scene.add(line);
  edgeShapes.push(line);
}

/* ---- Ambient particles ---- */
const pGeo = new THREE.BufferGeometry();
const pCount = 600;
const pPos = new Float32Array(pCount * 3);
const pCol = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
  pPos[i * 3] = (Math.random() - .5) * 70;
  pPos[i * 3 + 1] = Math.random() * 20 - 3;
  pPos[i * 3 + 2] = (Math.random() - .5) * 70;
  const c = new THREE.Color().setHSL(.45 + Math.random() * .2, .5, .5 + Math.random() * .2);
  pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const pMat = new THREE.PointsMaterial({ size: .07, vertexColors: true, transparent: true, opacity: .35, depthWrite: false });
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

/* ---- Projects “airport lounge” scene (projects section only) ---- */
const projAccentA = new THREE.Color(0x7dd3fc);   // window grid / glass
const projAccentB = new THREE.Color(0xfbbf24);   // warm interior strips
const projAccentW = new THREE.Color(0xe2e8f0);   // soft white
const projFogDark = new THREE.Color(0x05070f);
const projFogDefaultDark = new THREE.Color(0x060b14);
const projFogStarsDark = new THREE.Color(0x0a121c);
const projFogTmp = new THREE.Color();

const projectsGroup = new THREE.Group();
projectsGroup.visible = false;
scene.add(projectsGroup);

const LOUNGE_FLOOR_Y = -2.945;

// Glossy floor base
const loungeFloorGeo = new THREE.PlaneGeometry(160, 300, 1, 1);
loungeFloorGeo.rotateX(-Math.PI / 2);
const loungeFloorMatWire = new THREE.MeshBasicMaterial({ color: 0x0b1222, wireframe: true, transparent: true, opacity: 0, depthWrite: false });
const loungeFloorMatSolid = new THREE.MeshBasicMaterial({ color: 0x070b12, wireframe: false, transparent: true, opacity: 0, depthWrite: false });
const loungeFloor = new THREE.Mesh(loungeFloorGeo, loungeFloorMatWire);
loungeFloor.position.set(0, LOUNGE_FLOOR_Y, -110);
loungeFloor.userData.matWire = loungeFloorMatWire;
loungeFloor.userData.matSolid = loungeFloorMatSolid;
projectsGroup.add(loungeFloor);

// Fake “shine” layer (subtle gradient)
const sheenGeo = new THREE.PlaneGeometry(160, 300, 1, 2);
sheenGeo.rotateX(-Math.PI / 2);
const sheenCols = new Float32Array(6 * 3);
for (let i = 0; i < 6; i++) {
  const v = i % 2 === 0 ? 0.12 : 0.06;
  sheenCols[i * 3] = v;
  sheenCols[i * 3 + 1] = v;
  sheenCols[i * 3 + 2] = v + 0.02;
}
sheenGeo.setAttribute("color", new THREE.BufferAttribute(sheenCols, 3));
const sheenMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const floorSheen = new THREE.Mesh(sheenGeo, sheenMat);
floorSheen.position.set(0, LOUNGE_FLOOR_Y + 0.01, -110);
projectsGroup.add(floorSheen);

// Floor tile grid lines
const tileGrid = new THREE.GridHelper(180, 44, projAccentW.getHex(), 0x223047);
tileGrid.position.set(0, LOUNGE_FLOOR_Y + 0.012, -110);
tileGrid.rotation.y = Math.PI / 4;
projectsGroup.add(tileGrid);
const tileMats = Array.isArray(tileGrid.material) ? tileGrid.material : [tileGrid.material];
tileMats.forEach(m => { m.transparent = true; m.opacity = 0; m.depthWrite = false; m.blending = THREE.AdditiveBlending; });

// Big window wall (frame + grid)
const windowGroup = new THREE.Group();
windowGroup.position.set(0, 10, -58);
projectsGroup.add(windowGroup);

const windowFrameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(130, 44, 2));
const windowFrameMat = new THREE.LineBasicMaterial({ color: projAccentA, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
const windowFrame = new THREE.LineSegments(windowFrameGeo, windowFrameMat);
windowGroup.add(windowFrame);

const gridLinesGeoPoints = [];
const gridCols = 7;
const gridRows = 4;
const W = 128, H = 42;
for (let i = 1; i < gridCols; i++) {
  const x = -W / 2 + (W / gridCols) * i;
  gridLinesGeoPoints.push(new THREE.Vector3(x, -H / 2, 0), new THREE.Vector3(x, H / 2, 0));
}
for (let j = 1; j < gridRows; j++) {
  const y = -H / 2 + (H / gridRows) * j;
  gridLinesGeoPoints.push(new THREE.Vector3(-W / 2, y, 0), new THREE.Vector3(W / 2, y, 0));
}
const windowGridGeo = new THREE.BufferGeometry().setFromPoints(gridLinesGeoPoints);
const windowGridMat = new THREE.LineBasicMaterial({ color: projAccentW, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
const windowGrid = new THREE.LineSegments(windowGridGeo, windowGridMat);
windowGroup.add(windowGrid);

// Outside “sky” gradient plane + sun glow
const outsideGeo = new THREE.PlaneGeometry(220, 120, 1, 3);
const outsideCols = new Float32Array(8 * 3);
for (let i = 0; i < 8; i++) {
  const t0 = (i % 2) / 1;
  const br = 0.10 + 0.18 * t0;
  outsideCols[i * 3] = br;
  outsideCols[i * 3 + 1] = br + 0.03;
  outsideCols[i * 3 + 2] = br + 0.08;
}
outsideGeo.setAttribute("color", new THREE.BufferAttribute(outsideCols, 3));
const outsideMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false });
const outsidePlane = new THREE.Mesh(outsideGeo, outsideMat);
outsidePlane.position.set(0, 0, -2.2);
windowGroup.add(outsidePlane);

const sunGeo = new THREE.SphereGeometry(2.4, 18, 18);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.set(34, 14, -2.15);
windowGroup.add(sun);

const sunGlowGeo = new THREE.PlaneGeometry(18, 18, 1, 1);
const sunGlowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
sunGlow.position.set(34, 14, -2.14);
windowGroup.add(sunGlow);

// Warm strip lights on ceiling
const stripGeo = new THREE.PlaneGeometry(34, 1.6, 1, 1);
stripGeo.rotateX(Math.PI / 2);
const stripMat = new THREE.MeshBasicMaterial({ color: projAccentB, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const strips = [];
for (let i = 0; i < 6; i++) {
  const s = new THREE.Mesh(stripGeo, stripMat);
  s.position.set(0, 20, -38 - i * 32);
  s.rotation.z = (i % 2 ? 0.12 : -0.12);
  strips.push(s);
  projectsGroup.add(s);
}

// Airplanes (outside the windows)
const planeMatWire = new THREE.MeshBasicMaterial({ color: projAccentW, wireframe: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const planeMatSolid = new THREE.MeshBasicMaterial({ color: projAccentW, wireframe: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });

function makeAirplane(material) {
  const g = new THREE.Group();
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 10.5, 10, 1), material);
  fuselage.rotation.z = Math.PI / 2;
  g.add(fuselage);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.2, 10, 1), material);
  nose.rotation.z = Math.PI / 2;
  nose.position.x = 6.2;
  g.add(nose);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 8.5), material);
  wing.position.set(0.5, 0.05, 0);
  g.add(wing);
  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 3.2), material);
  tailWing.position.set(-4.8, 0.25, 0);
  g.add(tailWing);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.8), material);
  fin.position.set(-5.4, 0.75, 0);
  g.add(fin);
  return g;
}

const airplanes = [];
for (let i = 0; i < 7; i++) {
  const a = makeAirplane(planeMatWire);
  a.rotation.y = Math.PI * (0.90 + Math.random() * 0.10);
  const size = 0.55 + Math.random() * 0.9;
  a.scale.setScalar(size);
  a.userData = {
    phase: Math.random() * Math.PI * 2,
    speed: 0.12 + Math.random() * 0.18,
    y: 12 + Math.random() * 9,
    z: -82 - Math.random() * 18,
    bank: (Math.random() - 0.5) * 0.14
  };
  a.position.set(-90 - Math.random() * 70, a.userData.y, a.userData.z);
  airplanes.push(a);
  projectsGroup.add(a);
}

/* ---- Scroll + animation ---- */
let mouseX = 0, mouseY = 0, t = 0;
let contactProgress = 0;
let lastTheme = '';
let lastViewMode = '';

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function easeInOut(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

document.addEventListener('mousemove', e => {
  mouseX = (e.clientX / innerWidth - .5) * 2;
  mouseY = (e.clientY / innerHeight - .5) * 2;
});
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const lookTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  t += .01;

  const wh = innerHeight;

  const contactSpacer = document.getElementById('contact-spacer');
  if (contactSpacer) {
    const sRect = contactSpacer.getBoundingClientRect();
    const cRaw = clamp((wh - sRect.top) / sRect.height, 0, 1);
    contactProgress = easeInOut(cRaw);
  }

  const inContactSection = contactProgress > 0.2;

  const focusFor = (el) => {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const center = r.top + r.height * 0.5;
    const dist = Math.abs(center - wh * 0.5);
    return easeInOut(clamp(1 - dist / (wh * 0.9), 0, 1));
  };

  const eduTitle = document.querySelector('#education .road-section-title');
  const postsEl = document.getElementById('posts');
  let landness = 0;
  if (eduTitle && postsEl) {
    const titleRect = eduTitle.getBoundingClientRect();
    const postsRect = postsEl.getBoundingClientRect();
    const transitionStart = titleRect.top;
    const transitionEnd = postsRect.top;
    const rawLand = clamp((wh - transitionStart) / (wh + transitionEnd - transitionStart), 0, 1);
    landness = easeInOut(rawLand) * (1 - contactProgress);
  }
  const inv = 1 - landness;
  const educationMix = landness;
  const projectsMix = 0;

  /* Camera transition — About → Education (top-down road) */
  const cx = lerp(CAM_START.x, CAM_END.x, landness) + mouseX * 1.5 * inv;
  const cy = lerp(CAM_START.y, CAM_END.y, landness) - mouseY * .5 * inv;
  const cz = lerp(CAM_START.z, CAM_END.z, landness);
  camera.position.x += (cx - camera.position.x) * .06;
  camera.position.y += (cy - camera.position.y) * .06;
  camera.position.z += (cz - camera.position.z) * .06;

  lookTarget.set(
    lerp(CAM_START.lx, CAM_END.lx, landness),
    lerp(CAM_START.ly, CAM_END.ly, landness),
    lerp(CAM_START.lz, CAM_END.lz, landness)
  );
  camera.lookAt(lookTarget);

  const isLight = (document.documentElement.getAttribute('data-theme') || 'dark') === 'light';
  const isNoneMode = document.documentElement.getAttribute('data-viewmode') === 'none';

  if (isNoneMode) {
    scene.children.forEach(c => { c.visible = false; });
    lastTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    lastViewMode = 'none';
    const clearHex = isLight ? 0xeaf0f6 : 0x060b14;
    renderer.setClearColor(clearHex);
    renderer.render(scene, camera);
    return;
  }

  /* Field planes: opacity by scroll */
  fieldMat1.opacity = isLight ? lerp(.18, .25, landness) : lerp(.09, .12, landness);
  fieldMat2.opacity = isLight ? lerp(.12, .18, landness) : lerp(.06, .09, landness);
  fieldMat1Solid.opacity = isLight ? lerp(.6, .7, landness) : lerp(.6, .65, landness);
  fieldMat2Solid.opacity = isLight ? lerp(.5, .6, landness) : lerp(.5, .55, landness);

  /* Road ONLY in education — completely hidden otherwise */
  const isSolidMode = document.documentElement.getAttribute('data-viewmode') === 'solid';
  const roadAlpha = clamp((landness - 0.25) / 0.55, 0, 1);
  const roadVisible = roadAlpha > 0.001;
  road.visible = roadVisible;
  roadEdgeL.visible = roadVisible;
  roadEdgeR.visible = roadVisible;
  dashes.forEach(d => { d.visible = roadVisible; });
  if (roadVisible) {
    roadMat.opacity = roadAlpha * .4;
    edgeMatL.opacity = roadAlpha * .15;
    roadEdgeR.material.opacity = roadAlpha * .15;
    dashes.forEach(d => { d.material.opacity = roadAlpha * .25; });
  }

  /* Projects “airport lounge”: projects-only environment */
  projectsGroup.visible = false;
  if (projectsGroup.visible) {
    const baseOp = (isLight ? 0.35 : 0.55) * projIntensity;

    // Lounge materials
    loungeFloor.material = isSolidMode ? loungeFloor.userData.matSolid : loungeFloor.userData.matWire;
    loungeFloor.material.opacity = baseOp * (isLight ? 0.55 : 0.72);
    sheenMat.opacity = baseOp * (isLight ? 0.10 : 0.18);
    tileMats.forEach(m => { m.opacity = baseOp * (isLight ? 0.14 : 0.22); });

    windowFrameMat.opacity = baseOp * (isLight ? 0.26 : 0.36);
    windowGridMat.opacity = baseOp * (isLight ? 0.18 : 0.28);
    outsideMat.opacity = baseOp * (isLight ? 0.22 : 0.24);
    sunMat.opacity = baseOp * (isLight ? 0.30 : 0.22);
    sunGlowMat.opacity = baseOp * (isLight ? 0.10 : 0.06);
    stripMat.opacity = baseOp * (isLight ? 0.20 : 0.32);

    // Airplanes outside the windows
    const planeOp = baseOp * (isLight ? 0.35 : 0.55);
    planeMatWire.opacity = planeOp;
    planeMatSolid.opacity = planeOp;
    airplanes.forEach((p) => {
      p.traverse(obj => { if (obj && obj.isMesh) obj.material = isSolidMode ? planeMatSolid : planeMatWire; });
      const fly = (t * (p.userData.speed + projIntensity * 0.06) + p.userData.phase) % 1;
      p.position.x = lerp(-110, 110, fly);
      p.position.y = p.userData.y + Math.sin(t * 0.65 + p.userData.phase) * 0.7;
      p.position.z = p.userData.z + Math.sin(t * 0.35 + p.userData.phase) * 2.4;
      p.rotation.z = p.userData.bank + Math.sin(t * 0.55 + p.userData.phase) * 0.06;
      p.rotation.x = Math.sin(t * 0.4 + p.userData.phase) * 0.04;
    });

    // Subtle parallax: strip lights drift a touch for “transport”
    strips.forEach((s, i) => {
      s.position.z = (-30 - i * 26) + Math.sin(t * 0.25 + i) * 0.6;
    });
  } else {
    loungeFloorMatWire.opacity = 0; loungeFloorMatSolid.opacity = 0;
    windowFrameMat.opacity = 0;
    windowGridMat.opacity = 0;
    outsideMat.opacity = 0;
    sunMat.opacity = 0;
    sunGlowMat.opacity = 0;
    stripMat.opacity = 0;
    sheenMat.opacity = 0;
    tileMats.forEach(m => { m.opacity = 0; });
    planeMatWire.opacity = 0;
    planeMatSolid.opacity = 0;
  }

  /* Shapes: hidden in contact section; in solid mode force solid materials, hide edge outlines */
  const hideInContact = 1 - contactProgress;
  shapes.forEach(s => {
    if (isSolidMode && s.material !== s.userData.matSolid) s.material = s.userData.matSolid;
    else if (!isSolidMode && s.material !== s.userData.matWire) s.material = s.userData.matWire;
    s.visible = !inContactSection;
    if (s.visible) {
      s.rotation.x += s.userData.rotSpeed.x;
      s.rotation.y += s.userData.rotSpeed.y;
      s.rotation.z += s.userData.rotSpeed.z;
      s.position.y = s.userData.baseY + Math.sin(t * s.userData.floatSpeed) * s.userData.floatAmp * inv;
      const shapeOp = isSolidMode ? (isLight ? 0.7 : 0.55) : (isLight ? s.userData.baseOpacity * 3 : s.userData.baseOpacity);
      s.material.opacity = shapeOp * inv * hideInContact;
    }
  });
  edgeShapes.forEach(s => {
    s.visible = !isSolidMode && !inContactSection;
    if (s.visible) {
      s.rotation.x += s.userData.rotSpeed.x;
      s.rotation.y += s.userData.rotSpeed.y;
      s.material.opacity = (isLight ? s.userData.baseOpacity * 2.5 : s.userData.baseOpacity) * inv * hideInContact;
    }
  });

  /* Fog density shifts — lighter in top-down view; less fog in light theme */
  scene.fog.density = isLight ? lerp(.006, .002, landness) : lerp(.012, .004, landness);

  /* Stars: dark mode + contact section only; additive blending brightens the scene */
  const showStars = !isLight && inContactSection && inv > 0.1;
  stars.visible = showStars;
  if (showStars) starMat.opacity = 0.85 * contactProgress;

  /* In solid mode hide particles; in contact section hide particles too */
  pMat.opacity = isSolidMode ? 0 : (isLight ? .55 : .35);
  particles.visible = !isSolidMode && !inContactSection;

  /* Adapt clear color and fog to theme; stars add subtle brightness in dark mode contact */
  const curTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  if (curTheme !== lastTheme || (isSolidMode ? 'solid' : 'wire') !== lastViewMode) {
    lastTheme = curTheme;
    lastViewMode = isSolidMode ? 'solid' : 'wire';
    const clearHex = isLight ? 0xeaf0f6 : 0x060b14;
    renderer.setClearColor(clearHex);
    scene.fog.color.setHex(clearHex);
  }
  if (!isLight) {
    projFogTmp.copy(showStars ? projFogStarsDark : projFogDefaultDark);
    
    scene.fog.color.copy(projFogTmp);
  }

  particles.rotation.y += .00015;
  renderer.render(scene, camera);
}
animate();

window.applySceneViewMode = function (mode) {
  if (mode === "none") {
    scene.children.forEach(c => { c.visible = false; });
    return;
  }
  scene.children.forEach(c => { c.visible = true; });
  const isSolid = mode === "solid";
  fieldPlane1.material = isSolid ? fieldMat1Solid : fieldMat1;
  fieldPlane2.material = isSolid ? fieldMat2Solid : fieldMat2;
  shapes.forEach((s) => {
    s.material = isSolid ? s.userData.matSolid : s.userData.matWire;
  });
  edgeShapes.forEach((s) => {
    s.material.opacity = isSolid ? 0 : s.userData.baseOpacity;
  });
};
try {
  const stored = localStorage.getItem("ko-settings-viewmode");
  if (stored) window.applySceneViewMode(stored);
} catch (_) {}

/* ---- Scroll-triggered card reveal ---- */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: .15 });

/* ---- Live Discord presence ---- */
(function () {
  const DISCORD_USER_ID = "798619259206500365";

  const STATUS_LABELS = { online: "Online", idle: "Idle", dnd: "Do Not Disturb", offline: "Offline" };
  const BADGE_LABELS  = { online: "Online", idle: "Idle", dnd: "DND", offline: "Offline" };
  const ACTIVITY_TYPES = { 0: "Playing", 1: "Streaming", 2: "Listening to", 3: "Watching", 4: "", 5: "Competing in" };

  const workApps = ["Cursor", "Blender", "Visual Studio Code", "VS Code"];
  const musicApps = ["YouTube Music", "Spotify", "Apple Music", "SoundCloud", "Deezer", "Tidal"];

  const isWorkApp = (a) => workApps.some(w => a.name.toLowerCase().includes(w.toLowerCase()));
  const isMusicApp = (a) => musicApps.some(m => a.name.toLowerCase().includes(m.toLowerCase())) || a.type === 2;

  function parseTitleArtist(details) {
    if (!details) return { title: "", artist: "" };
    const primary = details.split(",")[0].trim();
    let idx = primary.indexOf(" - ");
    if (idx !== -1) return { title: primary.slice(0, idx).trim(), artist: primary.slice(idx + 3).trim() };
    idx = primary.toLowerCase().indexOf(" by ");
    if (idx !== -1) return { title: primary.slice(0, idx).trim(), artist: primary.slice(idx + 4).trim() };
    return { title: primary, artist: "" };
  }

  function getActivityDisplay(a) {
    if (isWorkApp(a)) return "Working on a project";
    if (isMusicApp(a)) {
      const d = (a.details || "").trim(), s = (a.state || "").trim();
      let title = "", artist = "";
      if (a.name.toLowerCase().includes("spotify") && d) { title = d; artist = s; }
      else if (a.name.toLowerCase().includes("youtube music") && d) {
        const p = parseTitleArtist(d); title = p.title; artist = p.artist;
        if (!artist && s && s.toLowerCase() !== title.toLowerCase()) artist = s;
      } else if (d) { const p = parseTitleArtist(d); title = p.title; artist = p.artist || s; }
      else { title = s || a.name; }
      const song = [title, artist].filter(Boolean).join(" — ");
      return song ? `Song: ${song}` : "Song: Unknown";
    }
    const prefix = ACTIVITY_TYPES[a.type] || "Playing";
    return prefix ? `${prefix} ${a.name}` : a.name;
  }

  const esc = (str) => String(str ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);

  function applyMarquee(container) {
    container.querySelectorAll(".discord-activity-line").forEach(line => {
      const span = line.querySelector(".discord-activity-text-inner");
      if (!span) return;
      const original = line.getAttribute("data-text") || span.textContent || "";
      span.textContent = original;
      line.classList.remove("is-marquee");
      if (span.scrollWidth > line.clientWidth) {
        line.classList.add("is-marquee");
        span.textContent = `${original}   •   ${original}`;
      }
    });
  }

  function updatePresence(data) {
    const user = data.discord_user;
    const status = data.discord_status || "offline";

    // Avatar + favicon
    if (user.avatar) {
      const ext = user.avatar.startsWith("a_") ? "gif" : "png";
      const avatarUrl = `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${user.avatar}.${ext}?size=512`;
      document.querySelectorAll(".discord-avatar").forEach(img => { img.src = avatarUrl; });
      const favUrl = `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${user.avatar}.png?size=64`;
      const fav = document.getElementById("favicon");
      const apple = document.getElementById("apple-icon");
      if (fav) fav.href = favUrl;
      if (apple) apple.href = favUrl;
    }

    // Status badge
    const badge = document.getElementById("status-badge");
    if (badge) { badge.textContent = BADGE_LABELS[status] || status; badge.className = "status-badge is-" + status; }

    // Status pill
    const sp = document.getElementById("status-pill-skill");
    if (sp) sp.textContent = "Discord: " + (STATUS_LABELS[status] || status);

    // Status dots
    document.querySelectorAll(".discord-status-dot").forEach(dot => { dot.setAttribute("data-status", status); });

    // Activity
    const activities = data.activities || [];
    const customStatus = activities.find(a => a.type === 4);
    const realActivities = activities.filter(a => a.type !== 4);

    let lines = [];
    if (status === "offline") {
      // Offline: show custom status if set, otherwise fallback
      if (customStatus) {
        lines = [`${customStatus.emoji?.name || ""} ${customStatus.state || ""}`.trim()];
      } else {
        lines = ["Sleeping 💤"];
      }
    } else if (realActivities.length > 0) {
      // Online/Idle/DND with real activities: show rich activity
      const seen = new Set();
      for (const a of realActivities) {
        const line = getActivityDisplay(a);
        if (!line || seen.has(line)) continue;
        seen.add(line);
        lines.push(line);
      }
    } else {
      // Online/Idle/DND but no real activity: show custom status or fallback
      if (customStatus) {
        lines = [`${customStatus.emoji?.name || ""} ${customStatus.state || ""}`.trim()];
      } else {
        lines = ["Chilling ✨"];
      }
    }

    const html = lines.slice(0, 3).map(t => {
      const safe = esc(t);
      return `<div class="discord-activity-line" data-text="${safe}"><span class="discord-activity-text-inner">${safe}</span></div>`;
    }).join("");

    document.querySelectorAll(".discord-activity-text").forEach(el => {
      el.innerHTML = html || `<div class="discord-activity-line" data-text="Chilling ✨"><span class="discord-activity-text-inner">Chilling ✨</span></div>`;
      requestAnimationFrame(() => applyMarquee(el));
    });
  }

  function fetchPresence() {
    fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(d => { if (d.success && d.data) updatePresence(d.data); })
      .catch(() => {
        document.querySelectorAll(".discord-activity-text").forEach(el => {
          el.innerHTML = `<div class="discord-activity-line"><span class="discord-activity-text-inner">Unavailable</span></div>`;
        });
      });
  }

  fetchPresence();
  setInterval(fetchPresence, 30000);
})();
