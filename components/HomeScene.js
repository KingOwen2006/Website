"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const COL = {
  skyHorizon: 0x87ceeb,
  skyZenith: 0x4a90d9,
  skyNightHorizon: 0x1a2744,
  skyNightZenith: 0x050814,
  sun: 0xffd700,
  moon: 0xe8ecf0,
  grassDark: 0x4caf50,
  grassLight: 0x5dbb3f,
  road: 0x3a3a3a,
  roadMark: 0xf5f5f5,
  roadWire: 0x64ffda,
  cloud: 0xffffff,
  trunk: 0x5c3d1e,
  canopy1: 0x2d6a2d,
  canopy2: 0x3a8a3a,
  canopy3: 0x1f4f1f,
};

const ROAD_HALF_W = 3;
const GRASS_HALF_W = 80;
const ROAD_LEN_Z = 520;
const DASH_SPACING = 4;
const DASH_COUNT = Math.ceil(ROAD_LEN_Z / DASH_SPACING) + 8;
const SKY_PLANE_H = 95;

function createSkyGradientPlane(width, height, segX, segY) {
  const geo = new THREE.PlaneGeometry(width, height, segX, segY);
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true,
    opacity: 1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.skyHeight = height;
  return mesh;
}

function paintSkyGradient(mesh, horizonHex, zenithHex) {
  const geo = mesh.geometry;
  const horizon = new THREE.Color(horizonHex);
  const zenith = new THREE.Color(zenithHex);
  const pos = geo.attributes.position;
  const h = mesh.userData.skyHeight || SKY_PLANE_H;
  if (!geo.attributes.color) {
    geo.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3),
    );
  }
  const colors = geo.attributes.color;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = (y + h / 2) / h;
    const c = horizon.clone().lerp(zenith, t);
    colors.setXYZ(i, c.r, c.g, c.b);
  }
  colors.needsUpdate = true;
}

function createCloud() {
  const group = new THREE.Group();
  const n = 3 + Math.floor(Math.random() * 3);
  const mat = new THREE.MeshBasicMaterial({
    color: COL.cloud,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  for (let i = 0; i < n; i++) {
    const r = 0.35 + Math.random() * 0.55;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
    mesh.position.set(
      (Math.random() - 0.5) * 1.1,
      (Math.random() - 0.5) * 0.35,
      (Math.random() - 0.5) * 0.45,
    );
    group.add(mesh);
  }
  const s = 0.6 + Math.random() * 1.4;
  group.scale.setScalar(s);
  return group;
}

function createTriangleCanopy(size, color) {
  const shape = new THREE.Shape();
  shape.moveTo(0, size);
  shape.lineTo(-size * 0.55, 0);
  shape.lineTo(size * 0.55, 0);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function createTree() {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.55, 0.22),
    new THREE.MeshBasicMaterial({ color: COL.trunk }),
  );
  trunk.position.y = 0.28;
  group.add(trunk);

  const canopyColors = [COL.canopy1, COL.canopy2, COL.canopy3];
  const layers = 2 + Math.floor(Math.random() * 2);
  let y = 0.55;
  let size = 0.55 + Math.random() * 0.15;
  for (let i = 0; i < layers; i++) {
    const c = canopyColors[i % canopyColors.length];
    const layer = createTriangleCanopy(size, c);
    layer.position.y = y;
    group.add(layer);
    y += size * 0.35;
    size *= 0.82;
  }
  return group;
}

function createFinishLine() {
  const group = new THREE.Group();
  const w = ROAD_HALF_W * 2;
  const cols = 6;
  const rows = 2;
  const cw = w / cols;
  const depth = 1.05;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = new THREE.Mesh(
        new THREE.PlaneGeometry(cw * 0.97, depth * 0.96),
        new THREE.MeshBasicMaterial({
          color: (r + c) % 2 === 0 ? 0xf5f5f5 : 0x141414,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 1,
        }),
      );
      cell.rotation.x = -Math.PI / 2;
      cell.position.set(-w / 2 + cw * (c + 0.5), -2.915, 11.5 + r * depth);
      group.add(cell);
    }
  }
  group.visible = false;
  return group;
}

function createStarField(count) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 180;
    pos[i * 3 + 1] = Math.random() * 55 + 6;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 120 - 40;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.14,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

export default function HomeScene() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sceneRef.current) return;
    sceneRef.current = true;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060b14, 0.012);
    const camera = new THREE.PerspectiveCamera(
      58,
      innerWidth / innerHeight,
      0.1,
      600,
    );
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x060b14);

    const clock = new THREE.Clock();

    const CAM_START = { x: 0, y: 5, z: 18, lx: 0, ly: 0, lz: 0 };
    const CAM_END = { x: 0, y: 45, z: 0.1, lx: 0, ly: 0, lz: 0 };

    camera.position.set(CAM_START.x, CAM_START.y, CAM_START.z);
    camera.lookAt(CAM_START.lx, CAM_START.ly, CAM_START.lz);

    const sky = createSkyGradientPlane(220, SKY_PLANE_H, 1, 48);
    paintSkyGradient(sky, COL.skyHorizon, COL.skyZenith);
    sky.position.set(0, 14, -85);
    scene.add(sky);

    const sun = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 48),
      new THREE.MeshBasicMaterial({
        color: COL.sun,
        depthWrite: false,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
      }),
    );
    sun.position.set(38, 26, -55);
    scene.add(sun);

    const moon = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 48),
      new THREE.MeshBasicMaterial({
        color: COL.moon,
        depthWrite: false,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      }),
    );
    moon.position.set(36, 24, -52);
    scene.add(moon);

    const stars = createStarField(420);
    scene.add(stars);

    const grassLeftGeo = new THREE.PlaneGeometry(GRASS_HALF_W * 2, ROAD_LEN_Z, 1, 1);
    grassLeftGeo.rotateX(-Math.PI / 2);
    const grassLeftMat = new THREE.MeshBasicMaterial({ color: COL.grassDark });
    const grassLeft = new THREE.Mesh(grassLeftGeo, grassLeftMat);
    grassLeft.position.set(-(ROAD_HALF_W + GRASS_HALF_W), -2.88, 0);
    scene.add(grassLeft);

    const grassRightGeo = new THREE.PlaneGeometry(GRASS_HALF_W * 2, ROAD_LEN_Z, 1, 1);
    grassRightGeo.rotateX(-Math.PI / 2);
    const grassRightMat = new THREE.MeshBasicMaterial({ color: COL.grassLight });
    const grassRight = new THREE.Mesh(grassRightGeo, grassRightMat);
    grassRight.position.set(ROAD_HALF_W + GRASS_HALF_W, -2.9, 0);
    scene.add(grassRight);

    const roadGeo = new THREE.PlaneGeometry(ROAD_HALF_W * 2, ROAD_LEN_Z, 1, 1);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMatSolid = new THREE.MeshBasicMaterial({
      color: COL.road,
      transparent: true,
      opacity: 1,
    });
    const roadMatWire = new THREE.MeshBasicMaterial({
      color: COL.roadWire,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const road = new THREE.Mesh(roadGeo, roadMatSolid);
    road.position.y = -2.95;
    scene.add(road);

    const edgeGeoL = new THREE.PlaneGeometry(0.12, ROAD_LEN_Z, 1, 1);
    edgeGeoL.rotateX(-Math.PI / 2);
    const edgeMatSolid = new THREE.MeshBasicMaterial({
      color: COL.roadMark,
      transparent: true,
      opacity: 1,
    });
    const edgeMatWire = new THREE.MeshBasicMaterial({
      color: COL.roadWire,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const roadEdgeL = new THREE.Mesh(edgeGeoL, edgeMatSolid);
    roadEdgeL.position.set(-ROAD_HALF_W, -2.94, 0);
    scene.add(roadEdgeL);
    const roadEdgeR = new THREE.Mesh(edgeGeoL.clone(), edgeMatSolid);
    roadEdgeR.position.set(ROAD_HALF_W, -2.94, 0);
    scene.add(roadEdgeR);

    const dashGeo = new THREE.PlaneGeometry(0.12, 1.6, 1, 1);
    dashGeo.rotateX(-Math.PI / 2);
    const dashMatSolid = new THREE.MeshBasicMaterial({
      color: COL.roadMark,
      transparent: true,
      opacity: 1,
    });
    const dashMatWire = new THREE.MeshBasicMaterial({
      color: COL.roadWire,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const dashes = [];
    const dashGroup = new THREE.Group();
    const zSpan = DASH_COUNT * DASH_SPACING;
    for (let i = 0; i < DASH_COUNT; i++) {
      const dash = new THREE.Mesh(dashGeo, dashMatSolid);
      let z = i * DASH_SPACING - zSpan * 0.5;
      dash.position.set(0, -2.93, z);
      dashGroup.add(dash);
      dashes.push(dash);
    }
    scene.add(dashGroup);

    const finishLineGroup = createFinishLine();
    scene.add(finishLineGroup);

    const cloudCount = 6 + Math.floor(Math.random() * 5);
    const clouds = [];
    const skyYMin = 10;
    const skyYMax = 28;
    const worldXMin = -75;
    const worldXMax = 75;
    for (let i = 0; i < cloudCount; i++) {
      const c = createCloud();
      c.position.set(
        worldXMin + Math.random() * (worldXMax - worldXMin),
        skyYMin + Math.random() * (skyYMax - skyYMin),
        -48 - Math.random() * 25,
      );
      scene.add(c);
      clouds.push(c);
    }

    const treeCount = 10;
    const trees = [];
    const leftXMin = -58;
    const leftXMax = -ROAD_HALF_W - 1.2;
    const rightXMin = ROAD_HALF_W + 1.2;
    const rightXMax = 58;
    for (let i = 0; i < treeCount; i++) {
      const t = createTree();
      const sc = 0.8 + Math.random() * 0.5;
      t.scale.setScalar(sc);
      const onLeft = i < treeCount / 2;
      const xMin = onLeft ? leftXMin : rightXMin;
      const xMax = onLeft ? leftXMax : rightXMax;
      t.position.set(
        xMin + Math.random() * (xMax - xMin),
        -2.75,
        -ROAD_LEN_Z * 0.2 + Math.random() * (ROAD_LEN_Z * 0.45),
      );
      scene.add(t);
      trees.push({ mesh: t, scale: sc });
    }

    let t = 0;
    let contactProgress = 0;
    let lastTheme = "",
      lastViewMode = "",
      lastSkyIsLight = null;

    const projFogDefaultDark = new THREE.Color(0x060b14);
    const projFogStarsDark = new THREE.Color(0x0a121c);
    const projFogTmp = new THREE.Color();

    function lerp(a, b, tt) {
      return a + (b - a) * tt;
    }
    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }
    function easeInOut(tt) {
      return tt < 0.5 ? 2 * tt * tt : -1 + (4 - 2 * tt) * tt;
    }
    function smoothstep01(tt) {
      const x = clamp(tt, 0, 1);
      return x * x * (3 - 2 * x);
    }

    const onResize = () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    };
    window.addEventListener("resize", onResize);

    const lookTarget = new THREE.Vector3();
    let animationId;

    function resetCloud(cloud) {
      cloud.position.x = worldXMax + 8 + Math.random() * 20;
      cloud.position.y = skyYMin + Math.random() * (skyYMax - skyYMin);
      cloud.position.z = -48 - Math.random() * 25;
    }

    let lastRoadSolid = null;
    let lastRoadLight = null;

    function applyRoadViewMode(isSolid, isLight) {
      if (
        lastRoadSolid !== null &&
        lastRoadSolid === isSolid &&
        lastRoadLight === isLight
      ) {
        return;
      }
      lastRoadSolid = isSolid;
      lastRoadLight = isLight;

      const roadHex = isLight ? 0x4a4a4a : COL.road;
      const markHex = isLight ? 0x333333 : COL.roadMark;
      const wireHex = isLight ? 0x0d6b4c : COL.roadWire;

      if (isSolid) {
        road.material = roadMatSolid;
        roadMatSolid.color.setHex(roadHex);
        roadMatSolid.wireframe = false;
        roadEdgeL.material = edgeMatSolid;
        roadEdgeR.material = edgeMatSolid;
        edgeMatSolid.color.setHex(markHex);
        dashes.forEach((d) => {
          d.material = dashMatSolid;
          d.material.color.setHex(markHex);
        });
      } else {
        road.material = roadMatWire;
        roadMatWire.color.setHex(wireHex);
        roadEdgeL.material = edgeMatWire;
        roadEdgeR.material = edgeMatWire;
        edgeMatWire.color.setHex(wireHex);
        dashes.forEach((d) => {
          d.material = dashMatWire;
          d.material.color.setHex(wireHex);
        });
      }
    }

    function animate() {
      animationId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      t += 0.01;

      const wh = innerHeight;
      const contactSpacer = document.getElementById("contact-spacer");
      if (contactSpacer) {
        const sRect = contactSpacer.getBoundingClientRect();
        const h = Math.max(sRect.height, 1);
        const scrolledPast = wh - sRect.top;
        const scrollRange = h + wh;
        const cRaw = clamp(scrolledPast / scrollRange, 0, 1);
        contactProgress = easeInOut(smoothstep01(cRaw));
      }

      const inContactSection = contactProgress > 0.2;
      const docEl = document.documentElement;
      const atPageBottom =
        window.scrollY + wh >= docEl.scrollHeight - 48;

      const educationEl = document.getElementById("education");
      let landness = 0;
      if (educationEl) {
        const rect = educationEl.getBoundingClientRect();
        const vh = wh;
        const startFade = vh * 1.05;
        const endFade = -vh * 0.06;
        const rawLand = clamp(
          (startFade - rect.top) / (startFade - endFade + 0.001),
          0,
          1,
        );
        landness =
          smoothstep01(easeInOut(rawLand)) * (1 - contactProgress);
      }
      const inv = 1 - landness;

      const cx = lerp(CAM_START.x, CAM_END.x, landness);
      const cy = lerp(CAM_START.y, CAM_END.y, landness);
      const cz = lerp(CAM_START.z, CAM_END.z, landness);
      const camLerp = 0.055;
      camera.position.x += (cx - camera.position.x) * camLerp;
      camera.position.y += (cy - camera.position.y) * camLerp;
      camera.position.z += (cz - camera.position.z) * camLerp;

      lookTarget.set(
        lerp(CAM_START.lx, CAM_END.lx, landness),
        lerp(CAM_START.ly, CAM_END.ly, landness),
        lerp(CAM_START.lz, CAM_END.lz, landness),
      );
      camera.lookAt(lookTarget);
      sun.lookAt(camera.position);
      moon.lookAt(camera.position);

      const baseScroll = 18 * dt;
      clouds.forEach((cloud) => {
        cloud.position.x -= baseScroll * 0.15;
        if (cloud.position.x < worldXMin - 15) resetCloud(cloud);
      });

      const isLight =
        (document.documentElement.getAttribute("data-theme") || "dark") ===
        "light";
      const viewMode =
        document.documentElement.getAttribute("data-viewmode") || "wireframe";
      const isNoneMode = viewMode === "none";
      const isSolidMode = viewMode === "solid";

      if (lastSkyIsLight !== isLight) {
        lastSkyIsLight = isLight;
        if (isLight) {
          paintSkyGradient(sky, COL.skyHorizon, COL.skyZenith);
        } else {
          paintSkyGradient(sky, COL.skyNightHorizon, COL.skyNightZenith);
        }
      }

      const skyPhase = t * 0.35;
      const skyBreath = 0.985 + Math.sin(skyPhase) * 0.015;
      sky.scale.set(1, skyBreath, 1);

      if (isNoneMode) {
        scene.children.forEach((c) => {
          c.visible = false;
        });
        lastTheme = document.documentElement.getAttribute("data-theme") || "dark";
        lastViewMode = "none";
        const clearHex = isLight ? 0xeaf0f6 : 0x060b14;
        renderer.setClearColor(clearHex);
        renderer.render(scene, camera);
        return;
      }

      scene.children.forEach((c) => {
        c.visible = true;
      });

      applyRoadViewMode(isSolidMode, isLight);

      const hideInContact = 1 - contactProgress;

      const roadBaseOp = isLight ? 0.98 : 1;
      road.visible = !isNoneMode;
      roadEdgeL.visible = !isNoneMode;
      roadEdgeR.visible = !isNoneMode;
      dashGroup.visible = !isNoneMode;
      if (!isNoneMode) {
        if (isSolidMode) {
          roadMatSolid.opacity = roadBaseOp;
          edgeMatSolid.opacity = roadBaseOp;
          dashes.forEach((d) => {
            d.material.opacity = roadBaseOp;
          });
        } else {
          roadMatWire.opacity = roadBaseOp * (isLight ? 0.45 : 0.35);
          edgeMatWire.opacity = roadBaseOp * (isLight ? 0.5 : 0.5);
          dashes.forEach((d) => {
            d.material.opacity = roadBaseOp * (isLight ? 0.5 : 0.45);
          });
        }
      }

      finishLineGroup.visible =
        atPageBottom && inContactSection && !isNoneMode;
      finishLineGroup.traverse((o) => {
        if (o.material) {
          o.material.opacity = roadBaseOp;
          o.material.transparent = isLight;
        }
      });

      sky.visible = !isNoneMode;
      sun.visible = isLight && !isNoneMode;
      moon.visible = !isLight && !isNoneMode;
      stars.visible = !isLight && !isNoneMode;
      const showGrassBesideRoad =
        !isNoneMode && (!inContactSection || atPageBottom);
      grassLeft.visible = showGrassBesideRoad;
      grassRight.visible = showGrassBesideRoad;
      clouds.forEach((c) => {
        c.visible = isLight && !isNoneMode;
      });
      trees.forEach((tr) => {
        tr.mesh.visible = !inContactSection;
      });

      const skyOpHero = inv * hideInContact * (isLight ? 0.92 : 1);
      const skyOpContact = (isLight ? 0.9 : 0.96);
      const skyOp = inContactSection ? skyOpContact : skyOpHero;
      sky.material.opacity = skyOp;
      sky.material.transparent = true;
      sun.material.opacity = skyOp;
      moon.material.opacity = skyOp * 0.92;

      const starBase = 0.65 + Math.sin(t * 1.8) * 0.12;
      stars.material.opacity = inContactSection
        ? starBase * 0.9
        : starBase * inv * hideInContact;

      const grassOp =
        atPageBottom && inContactSection
          ? roadBaseOp * (isLight ? 0.95 : 1)
          : (isLight ? 0.95 : 1) * inv * hideInContact;
      grassLeftMat.opacity = grassOp;
      grassRightMat.opacity = grassOp;
      grassLeftMat.transparent = isLight;
      grassRightMat.transparent = isLight;
      if (isLight) {
        grassLeftMat.color.setHex(0x43a047);
        grassRightMat.color.setHex(0x66bb6a);
      } else {
        grassLeftMat.color.setHex(COL.grassDark);
        grassRightMat.color.setHex(COL.grassLight);
      }

      clouds.forEach((c) => {
        c.visible =
          c.visible && (inContactSection ? true : inv > 0.05);
        const op = inContactSection
          ? 0.88 * (isLight ? 0.85 : 1)
          : 0.92 * inv * hideInContact * (isLight ? 0.85 : 1);
        c.traverse((o) => {
          if (o.material) {
            o.material.opacity = op;
            o.material.transparent = true;
          }
        });
      });
      trees.forEach((tr) => {
        tr.mesh.visible = tr.mesh.visible && inv > 0.05;
      });

      scene.fog.density = isLight
        ? lerp(0.006, 0.002, landness)
        : lerp(0.012, 0.004, landness);

      const curTheme = document.documentElement.getAttribute("data-theme") || "dark";
      const vmKey = isSolidMode ? "solid" : "wire";
      if (curTheme !== lastTheme || vmKey !== lastViewMode) {
        lastTheme = curTheme;
        lastViewMode = vmKey;
        const clearHex = isLight ? 0xeaf0f6 : 0x060b14;
        renderer.setClearColor(clearHex);
        scene.fog.color.setHex(clearHex);
      }
      if (!isLight) {
        projFogTmp.copy(
          inContactSection ? projFogStarsDark : projFogDefaultDark,
        );
        scene.fog.color.copy(projFogTmp);
      }

      renderer.render(scene, camera);
    }
    animate();

    window.applySceneViewMode = function (mode) {
      if (mode === "none") {
        scene.children.forEach((c) => {
          c.visible = false;
        });
        return;
      }
      scene.children.forEach((c) => {
        c.visible = true;
      });
    };
    try {
      const stored = localStorage.getItem("ko-settings-viewmode");
      if (stored) window.applySceneViewMode(stored);
    } catch {}

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.15 },
    );
    window._roadObserver = observer;

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      delete window.applySceneViewMode;
      delete window._roadObserver;
      sceneRef.current = false;
    };
  }, []);

  return <canvas ref={canvasRef} id="bg" />;
}
