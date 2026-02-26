/* ============================================
   THREE.JS — Ocean → Field + Road transition
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

const oceanColor = new THREE.Color(0x48b1ff);
const fieldColor = new THREE.Color(0x1a6b3a);
const oceanColor2 = new THREE.Color(0x64ffda);
const fieldColor2 = new THREE.Color(0x2d8a4e);

/* ---- Wave planes ---- */
const planeW = 120, segW = 90;
const waveGeo1 = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
waveGeo1.rotateX(-Math.PI / 2);
const waveMat1 = new THREE.MeshBasicMaterial({ color: oceanColor, wireframe: true, transparent: true, opacity: .06 });
const wavePlane1 = new THREE.Mesh(waveGeo1, waveMat1);
wavePlane1.position.y = -3;
scene.add(wavePlane1);

const waveGeo2 = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
waveGeo2.rotateX(-Math.PI / 2);
const waveMat2 = new THREE.MeshBasicMaterial({ color: oceanColor2, wireframe: true, transparent: true, opacity: .03 });
const wavePlane2 = new THREE.Mesh(waveGeo2, waveMat2);
wavePlane2.position.y = -3.8;
scene.add(wavePlane2);

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
  scene.add(mesh);
  shapes.push(mesh);
}

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

/* ---- Scroll + animation ---- */
let mouseX = 0, mouseY = 0, t = 0;
let scrollProgress = 0;
let contactProgress = 0;

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
  const raw = clamp((window.scrollY - wh * .5) / (wh * .8), 0, 1);
  scrollProgress = easeInOut(raw);

  const contactSpacer = document.getElementById('contact-spacer');
  if (contactSpacer) {
    const sRect = contactSpacer.getBoundingClientRect();
    const cRaw = clamp((wh - sRect.top) / sRect.height, 0, 1);
    contactProgress = easeInOut(cRaw);
  }

  const fieldness = scrollProgress * (1 - contactProgress);
  const inv = 1 - fieldness;

  /* Camera transition — follows fieldness so it returns to ocean for contact */
  const cx = lerp(CAM_START.x, CAM_END.x, fieldness) + mouseX * 1.5 * inv;
  const cy = lerp(CAM_START.y, CAM_END.y, fieldness) - mouseY * .5 * inv;
  const cz = lerp(CAM_START.z, CAM_END.z, fieldness);
  camera.position.x += (cx - camera.position.x) * .06;
  camera.position.y += (cy - camera.position.y) * .06;
  camera.position.z += (cz - camera.position.z) * .06;

  lookTarget.set(
    lerp(CAM_START.lx, CAM_END.lx, fieldness),
    lerp(CAM_START.ly, CAM_END.ly, fieldness),
    lerp(CAM_START.lz, CAM_END.lz, fieldness)
  );
  camera.lookAt(lookTarget);

  /* Wave amplitude fades with scroll */
  const waveAmp = inv;
  const p1 = wavePlane1.geometry.attributes.position;
  for (let i = 0; i < p1.count; i++) {
    const x = p1.getX(i), z = p1.getZ(i);
    const wave = (Math.sin(x * .12 + t) * Math.cos(z * .12 + t) * .7 + Math.sin(x * .06 - t * .4) * .4) * waveAmp;
    p1.setY(i, wave);
  }
  p1.needsUpdate = true;

  const p2 = wavePlane2.geometry.attributes.position;
  for (let i = 0; i < p2.count; i++) {
    const x = p2.getX(i), z = p2.getZ(i);
    const wave = (Math.sin(x * .1 + t * 1.1) * Math.cos(z * .1 + t * .7) * .5) * waveAmp;
    p2.setY(i, wave);
  }
  p2.needsUpdate = true;

  /* Color transition: ocean blue → field green → ocean blue */
  waveMat1.color.copy(oceanColor).lerp(fieldColor, fieldness);
  waveMat2.color.copy(oceanColor2).lerp(fieldColor2, fieldness);
  waveMat1.opacity = lerp(.06, .09, fieldness);
  waveMat2.opacity = lerp(.03, .06, fieldness);

  /* Road fades in (stays visible through road section, fades for contact) */
  roadMat.opacity = fieldness * .4;
  edgeMatL.opacity = fieldness * .15;
  roadEdgeR.material.opacity = fieldness * .15;
  dashes.forEach(d => { d.material.opacity = fieldness * .25; });

  /* Shapes fade out */
  shapes.forEach(s => {
    s.rotation.x += s.userData.rotSpeed.x;
    s.rotation.y += s.userData.rotSpeed.y;
    s.rotation.z += s.userData.rotSpeed.z;
    s.position.y = s.userData.baseY + Math.sin(t * s.userData.floatSpeed) * s.userData.floatAmp * inv;
    s.material.opacity = s.userData.baseOpacity * inv;
  });
  edgeShapes.forEach(s => {
    s.rotation.x += s.userData.rotSpeed.x;
    s.rotation.y += s.userData.rotSpeed.y;
    s.material.opacity = s.userData.baseOpacity * inv;
  });

  /* Fog density shifts — lighter in top-down view */
  scene.fog.density = lerp(.012, .004, fieldness);

  particles.rotation.y += .00015;
  renderer.render(scene, camera);
}
animate();

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
