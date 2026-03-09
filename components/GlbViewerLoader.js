"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function GlbViewerLoader() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const MODES = { clay: "clay", solid: "solid", wireframe: "wireframe" };
    const STORAGE_KEY = "ko-glb-viewer-mode";
    const ENV_STORAGE_KEY = "ko-glb-viewer-environment";

    let modelsConfig = { models: {}, encryptionKey: "" };
    let modelsConfigPromise = null;

    function loadModelsConfig() {
      if (modelsConfigPromise) return modelsConfigPromise;
      modelsConfigPromise = fetch("/models-config.json")
        .then((r) => (r.ok ? r.json() : {}))
        .then((c) => { modelsConfig = c; return c; })
        .catch(() => ({}));
      return modelsConfigPromise;
    }

    function xorDecrypt(buffer, key) {
      const keyBytes = new TextEncoder().encode(key);
      const out = new Uint8Array(buffer.byteLength);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < view.length; i++) {
        out[i] = view[i] ^ keyBytes[i % keyBytes.length];
      }
      return out.buffer;
    }

    function getModelInfo(src) {
      const filename = src.split("/").pop() || src;
      const baseName = filename.replace(/\.enc$/, "").replace(/\.glb$/, "");
      for (const [key, opts] of Object.entries(modelsConfig.models || {})) {
        const k = key.replace(/\.enc$/, "").replace(/\.glb$/, "");
        if (key === filename || key === baseName + ".glb" || k === baseName) return opts;
      }
      return null;
    }

    function resolveModelSrc(src) {
      const info = getModelInfo(src);
      const encrypted = info && info.encrypted;
      const base = src.replace(/\.enc$/, "").replace(/\.glb$/, "");
      return {
        fetchUrl: encrypted ? base + ".glb.enc" : (src.endsWith(".glb") ? src : base + ".glb"),
        encrypted: !!encrypted,
      };
    }

    const EDGES_THRESHOLD = 1;
    const WELD_EPSILON_RATIO = 1e-5;
    const QUAD_FOLD_LIMIT = 75;

    function edgeKey(a, b) { return a < b ? a + ":" + b : b + ":" + a; }

    function buildQuadWireframeGeometry(geo) {
      const posAttr = geo?.attributes?.position;
      if (!posAttr || posAttr.count < 3) return null;

      const bounds = new THREE.Box3().setFromBufferAttribute(posAttr);
      const size = bounds.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 1);
      const epsilon = Math.max(maxDim * WELD_EPSILON_RATIO, 1e-6);

      const points = [];
      const pointMap = new Map();
      const remap = new Array(posAttr.count);

      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
        const key = [Math.round(x / epsilon), Math.round(y / epsilon), Math.round(z / epsilon)].join(",");
        if (!pointMap.has(key)) { pointMap.set(key, points.length); points.push(new THREE.Vector3(x, y, z)); }
        remap[i] = pointMap.get(key);
      }

      const triangles = [];
      const edges = new Map();
      const ab = new THREE.Vector3(), ac = new THREE.Vector3(), normal = new THREE.Vector3();

      function addEdge(a, b, triIndex) {
        const key = edgeKey(a, b);
        let edge = edges.get(key);
        if (!edge) { edge = { a: Math.min(a, b), b: Math.max(a, b), tris: [], length: points[a].distanceTo(points[b]) }; edges.set(key, edge); }
        edge.tris.push(triIndex);
      }

      function addTriangle(a, b, c) {
        const wa = remap[a], wb = remap[b], wc = remap[c];
        if (wa === wb || wb === wc || wc === wa) return;
        ab.subVectors(points[wb], points[wa]);
        ac.subVectors(points[wc], points[wa]);
        normal.crossVectors(ab, ac);
        if (normal.lengthSq() <= 1e-12) return;
        const triIndex = triangles.length;
        triangles.push({ verts: [wa, wb, wc], normal: normal.clone().normalize() });
        addEdge(wa, wb, triIndex); addEdge(wb, wc, triIndex); addEdge(wc, wa, triIndex);
      }

      if (geo.index?.count >= 3) {
        const idx = geo.index.array;
        for (let i = 0; i < idx.length; i += 3) addTriangle(idx[i], idx[i + 1], idx[i + 2]);
      } else {
        for (let i = 0; i < posAttr.count; i += 3) addTriangle(i, i + 1, i + 2);
      }

      if (!edges.size) return null;
      const linePositions = [];
      edges.forEach((edge) => {
        const triRefs = edge.tris;
        let shouldDraw = triRefs.length !== 2;
        if (!shouldDraw) {
          const triA = triangles[triRefs[0]], triB = triangles[triRefs[1]];
          const angle = THREE.MathUtils.radToDeg(triA.normal.angleTo(triB.normal));
          shouldDraw = angle >= EDGES_THRESHOLD;
        }
        if (!shouldDraw) return;
        const start = points[edge.a], end = points[edge.b];
        linePositions.push(start.x, start.y, start.z, end.x, end.y, end.z);
      });

      if (!linePositions.length) return null;
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
      return lineGeo;
    }

    function applyMode(model, mode) {
      model.traverse((obj) => {
        if (!obj.isMesh) return;
        const geo = obj.geometry;
        if (!geo) return;
        if (obj.userData.wireframeLines) { obj.remove(obj.userData.wireframeLines); obj.userData.wireframeLines = null; }
        if (mode === MODES.wireframe) {
          const edgesGeo = geo.userData.quadWireframeGeometry || buildQuadWireframeGeometry(geo) || new THREE.EdgesGeometry(geo, EDGES_THRESHOLD);
          geo.userData.quadWireframeGeometry = edgesGeo;
          const lineMat = new THREE.LineBasicMaterial({ color: 0x64ffda, transparent: true, opacity: 0.9 });
          const lines = new THREE.LineSegments(edgesGeo, lineMat);
          obj.userData.wireframeLines = lines;
          obj.add(lines);
          obj.material = new THREE.MeshBasicMaterial({ color: 0x64ffda, transparent: true, opacity: 0, depthWrite: false });
        } else if (mode === MODES.clay) {
          const orig = obj.userData.originalMaterial;
          const baseColor = (orig?.color) ? orig.color.getHex() : (obj.userData.originalColor !== undefined) ? obj.userData.originalColor : (obj.material?.color ? obj.material.color.getHex() : 0x8899aa);
          obj.userData.originalColor = baseColor;
          obj.material = new THREE.MeshLambertMaterial({ color: baseColor, flatShading: true, transparent: false });
        } else {
          if (obj.userData.originalMaterial) obj.material = obj.userData.originalMaterial;
        }
      });
    }

    function storeOriginalMaterials(model) {
      model.traverse((obj) => {
        if (obj.isMesh && obj.material && !obj.userData.originalMaterial) obj.userData.originalMaterial = obj.material;
      });
    }

    const OCEAN_WATER_LEVEL = -0.5;
    const SHIP_WATER_LEVEL = -1.8;
    const WAVE_AMPLITUDE = 0.25;

    function createOceanEnvironment() {
      const oceanGroup = new THREE.Group();
      const planeW = 50, segW = 60;
      const waveGeo1 = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
      waveGeo1.rotateX(-Math.PI / 2);
      const waveMat1 = new THREE.MeshBasicMaterial({ color: 0x48b1ff, wireframe: false, transparent: true, opacity: 0.65 });
      const wavePlane1 = new THREE.Mesh(waveGeo1, waveMat1);
      wavePlane1.position.y = OCEAN_WATER_LEVEL;
      oceanGroup.add(wavePlane1);

      const waveGeo2 = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
      waveGeo2.rotateX(-Math.PI / 2);
      const waveMat2 = new THREE.MeshBasicMaterial({ color: 0x64ffda, wireframe: false, transparent: true, opacity: 0.45 });
      const wavePlane2 = new THREE.Mesh(waveGeo2, waveMat2);
      wavePlane2.position.y = OCEAN_WATER_LEVEL - 0.2;
      oceanGroup.add(wavePlane2);

      const foamGeo = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
      foamGeo.rotateX(-Math.PI / 2);
      const foamMat = new THREE.MeshBasicMaterial({ color: 0xc8e6f5, wireframe: false, transparent: true, opacity: 0.2, depthWrite: false });
      const foamPlane = new THREE.Mesh(foamGeo, foamMat);
      foamPlane.position.y = OCEAN_WATER_LEVEL + 0.05;
      oceanGroup.add(foamPlane);

      oceanGroup.userData.wavePlanes = [wavePlane1, wavePlane2, foamPlane];
      oceanGroup.visible = false;
      return oceanGroup;
    }

    function updateOceanWaves(oceanGroup, t) {
      if (!oceanGroup?.userData.wavePlanes) return;
      oceanGroup.userData.wavePlanes.forEach((plane) => {
        const pos = plane.geometry.attributes.position;
        if (!pos) return;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), z = pos.getZ(i);
          const wave = (Math.sin(x * 0.15 + t) * Math.cos(z * 0.15 + t) * 0.5 + Math.sin(x * 0.08 - t * 0.5) * 0.25 + Math.sin(x * 0.12 + t * 1.1) * Math.cos(z * 0.12 + t * 0.8) * 0.35) * WAVE_AMPLITUDE;
          pos.setY(i, wave);
        }
        pos.needsUpdate = true;
      });
    }

    function getWaveHeightAt(x, z, t) {
      return (Math.sin(x * 0.15 + t) * Math.cos(z * 0.15 + t) * 0.5 + Math.sin(x * 0.08 - t * 0.5) * 0.25 + Math.sin(x * 0.12 + t * 1.1) * Math.cos(z * 0.12 + t * 0.8) * 0.35) * WAVE_AMPLITUDE;
    }

    function createSettingsButton(container, onModeChange, modelInfo, onEnvironmentChange) {
      const btn = document.createElement("button");
      btn.className = "glb-viewer__settings-btn";
      btn.setAttribute("aria-label", "View mode");
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
      container.appendChild(btn);
      const menu = document.createElement("div");
      menu.className = "glb-viewer__mode-menu";
      menu.innerHTML = `<button data-mode="clay">Clay</button><button data-mode="solid">Solid</button><button data-mode="wireframe">Wireframe</button>`;

      const hasEnvironment = modelInfo?.environment;
      if (hasEnvironment) {
        const envBtn = document.createElement("button");
        envBtn.className = "glb-viewer__env-option";
        envBtn.dataset.type = "environment";
        envBtn.dataset.env = modelInfo.environment;
        envBtn.textContent = "Environment";
        menu.appendChild(envBtn);
      }
      container.appendChild(menu);

      let currentMode = localStorage?.getItem(STORAGE_KEY) || "solid";
      const envStorageKey = ENV_STORAGE_KEY + "-" + (modelInfo?.environment || "");
      let envEnabled = hasEnvironment && localStorage?.getItem(envStorageKey) === "1";

      menu.querySelectorAll("button[data-mode]").forEach((b) => {
        b.classList.toggle("active", b.dataset.mode === currentMode);
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          currentMode = b.dataset.mode;
          menu.querySelectorAll("button[data-mode]").forEach((x) => x.classList.toggle("active", x.dataset.mode === currentMode));
          localStorage?.setItem(STORAGE_KEY, currentMode);
          onModeChange(currentMode);
          menu.classList.remove("open");
        });
      });

      if (hasEnvironment) {
        const envBtn = menu.querySelector(".glb-viewer__env-option");
        envBtn.classList.toggle("active", envEnabled);
        envBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (currentMode !== "solid") {
            currentMode = "solid";
            menu.querySelectorAll("button[data-mode]").forEach((x) => x.classList.toggle("active", x.dataset.mode === "solid"));
            localStorage?.setItem(STORAGE_KEY, "solid");
            onModeChange("solid");
          }
          envEnabled = !envEnabled;
          envBtn.classList.toggle("active", envEnabled);
          localStorage?.setItem(envStorageKey, envEnabled ? "1" : "0");
          onEnvironmentChange(envEnabled);
          menu.classList.remove("open");
        });
      }

      btn.addEventListener("click", (e) => { e.stopPropagation(); menu.classList.toggle("open"); });
      document.addEventListener("click", () => menu.classList.remove("open"));
      return { getMode: () => currentMode, getEnvEnabled: () => envEnabled };
    }

    function initViewer(container, src) {
      const canvas = container.querySelector(".glb-viewer__canvas");
      if (!canvas || !src) return;

      const { fetchUrl, encrypted } = resolveModelSrc(src);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0c121c);
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      camera.position.set(4, 3, 6);
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const dir = new THREE.DirectionalLight(0xffffff, 0.8);
      dir.position.set(5, 8, 5);
      scene.add(dir);
      const fill = new THREE.DirectionalLight(0x64ffda, 0.2);
      fill.position.set(-3, 2, -2);
      scene.add(fill);

      let model = null;
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 2;
      controls.maxDistance = 20;

      const resize = () => {
        const rect = container.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        canvas.width = rect.width;
        canvas.height = rect.height;
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
        renderer.setSize(rect.width, rect.height);
      };

      const info = getModelInfo(src);
      let envEnabled = false;
      const oceanGroup = createOceanEnvironment();
      scene.add(oceanGroup);
      const defaultBg = new THREE.Color(0x0c121c);
      const oceanSkyBg = new THREE.Color(0x0a1628);

      const setEnvironment = (enabled) => {
        envEnabled = enabled;
        oceanGroup.visible = enabled;
        scene.background = enabled ? oceanSkyBg : defaultBg;
        if (model && info?.environment === "ocean") {
          if (enabled) {
            const box = new THREE.Box3().setFromObject(model);
            model.userData.baseY = SHIP_WATER_LEVEL - box.min.y;
            model.position.y = model.userData.baseY;
          } else {
            model.userData.baseY = 0;
            model.position.y = 0;
          }
        }
      };

      const setMode = (mode) => {
        if (model) applyMode(model, mode);
        if (mode !== MODES.solid) setEnvironment(false);
      };

      const settingsRet = createSettingsButton(container, setMode, info, setEnvironment);
      envEnabled = settingsRet.getEnvEnabled();
      setEnvironment(envEnabled);
      resize();
      setMode(settingsRet.getMode());

      const settingsBtn = container.querySelector(".glb-viewer__settings-btn");
      const downloadable = info && info.downloadable !== false && !info.encrypted;
      let insertBeforeEl = settingsBtn;

      if (downloadable) {
        const downloadBtn = document.createElement("a");
        downloadBtn.className = "glb-viewer__download-btn";
        downloadBtn.href = src.replace(/\.enc$/, "").replace(/\.glb\.enc$/, ".glb");
        downloadBtn.setAttribute("download", "");
        downloadBtn.setAttribute("aria-label", "Download");
        downloadBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
        downloadBtn.style.display = window.innerWidth > 1023 ? "" : "none";
        container.insertBefore(downloadBtn, settingsBtn);
        insertBeforeEl = downloadBtn;
      }

      const arBtn = document.createElement("button");
      arBtn.className = "glb-viewer__ar-btn";
      arBtn.setAttribute("aria-label", "View in AR");
      arBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 8V6a2 2 0 0 1 2-2h2"/><path d="M20 8V6a2 2 0 0 0-2-2h-2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M20 16v2a2 2 0 0 1-2 2h-2"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>`;
      container.insertBefore(arBtn, insertBeforeEl);

      const loader = new GLTFLoader();
      function onModelLoaded(gltf) {
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        model.scale.setScalar(3 / maxDim);
        const box2 = new THREE.Box3().setFromObject(model);
        model.userData.baseY = model.position.y;
        model.userData.minY = box2.min.y;
        if (envEnabled && info?.environment === "ocean") {
          model.position.y = SHIP_WATER_LEVEL - box2.min.y;
          model.userData.baseY = model.position.y;
        }
        scene.add(model);
        storeOriginalMaterials(model);
        setMode(settingsRet.getMode());
      }

      if (encrypted) {
        const key = modelsConfig.encryptionKey || "default-key-change-me";
        fetch(fetchUrl)
          .then((r) => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
          .then((buf) => xorDecrypt(buf, key))
          .then((dec) => loader.parse(dec, "", onModelLoaded, console.error))
          .catch(console.error);
      } else {
        loader.load(fetchUrl, onModelLoaded, undefined, console.error);
      }

      let envTime = 0;
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        if (envEnabled && oceanGroup) {
          envTime += 0.016;
          updateOceanWaves(oceanGroup, envTime);
          if (model && info?.environment === "ocean") {
            model.position.y = model.userData.baseY + getWaveHeightAt(0, 0, envTime) * 0.5;
          }
        }
        renderer.render(scene, camera);
      };
      animate();

      if (typeof ResizeObserver !== "undefined") new ResizeObserver(resize).observe(container);
      window.addEventListener("resize", resize);
    }

    function initAll(scope) {
      scope = scope || document;
      const els = scope.querySelectorAll("[data-glb-viewer]");
      if (!els.length) return;
      loadModelsConfig().then(() => {
        els.forEach((el) => {
          if (el.dataset.glbViewerInit) return;
          el.dataset.glbViewerInit = "1";
          const src = el.dataset.src || el.querySelector("[data-src]")?.dataset?.src;
          if (src) initViewer(el, src);
        });
      });
    }

    window.initGlbViewers = initAll;
    initAll();

    return () => {
      delete window.initGlbViewers;
    };
  }, []);

  return null;
}
