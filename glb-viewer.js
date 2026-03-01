/* ============================================
   GLB Viewer — clay / solid / wireframe modes
   Supports encrypted .glb.enc files for secure delivery.
   ============================================ */
(function () {
  if (typeof THREE === "undefined") return;

  const MODES = { clay: "clay", solid: "solid", wireframe: "wireframe" };
  const STORAGE_KEY = "ko-glb-viewer-mode";
  const ENV_STORAGE_KEY = "ko-glb-viewer-environment";

  let modelsConfig = { models: {}, encryptionKey: "" };
  let modelsConfigPromise = null;

  function loadModelsConfig() {
    if (modelsConfigPromise) return modelsConfigPromise;
    const path = (window.KO_WP_CONFIG && window.KO_WP_CONFIG.modelsConfig) || "models-config.json";
    const url = path.startsWith("http") ? path : new URL(path, window.location.href).href;
    modelsConfigPromise = fetch(url)
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
      encrypted: !!encrypted
    };
  }

  function openAROverlay(src, fetchUrl, encrypted) {
    if (typeof customElements !== "undefined" && customElements.get("model-viewer") === undefined) {
      customElements.whenDefined("model-viewer").then(() => openAROverlay(src, fetchUrl, encrypted));
      return;
    }
    const overlay = document.createElement("div");
    overlay.className = "glb-viewer-ar-overlay";
    overlay.innerHTML = `
      <button class="glb-viewer-ar-overlay__close" aria-label="Close">×</button>
      <model-viewer ar ar-modes="webxr scene-viewer quick-look" camera-controls touch-action="pan-y" style="width:100%;max-width:500px;height:60vh;background:#0c121c;border-radius:14px;"></model-viewer>
      <p class="glb-viewer-ar-overlay__hint">Tap "View in your space" to place the model in the real world</p>
    `;
    const mv = overlay.querySelector("model-viewer");
    const closeBtn = overlay.querySelector(".glb-viewer-ar-overlay__close");

    function close() {
      overlay.remove();
      document.body.style.overflow = "";
      if (mv.src && mv.src.startsWith("blob:")) URL.revokeObjectURL(mv.src);
    }

    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

    function setModelUrl(url) {
      mv.src = url;
    }

    if (encrypted) {
      const key = modelsConfig.encryptionKey || "default-key-change-me";
      fetch(fetchUrl)
        .then((r) => { if (!r.ok) throw new Error("Fetch failed"); return r.arrayBuffer(); })
        .then((buf) => xorDecrypt(buf, key))
        .then((decrypted) => {
          const blob = new Blob([decrypted], { type: "model/gltf-binary" });
          setModelUrl(URL.createObjectURL(blob));
        })
        .catch((err) => {
          console.error("AR load error:", err);
          close();
        });
    } else {
      setModelUrl(new URL(fetchUrl, window.location.href).href);
    }

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
  }

  function createSettingsButton(container, onModeChange, modelInfo, onEnvironmentChange) {
    const btn = document.createElement("button");
    btn.className = "glb-viewer__settings-btn";
    btn.setAttribute("aria-label", "View mode");
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
    container.appendChild(btn);

    const menu = document.createElement("div");
    menu.className = "glb-viewer__mode-menu";
    menu.innerHTML = `
      <button data-mode="clay">Clay</button>
      <button data-mode="solid">Solid</button>
      <button data-mode="wireframe">Wireframe</button>
    `;

    const hasEnvironment = modelInfo && modelInfo.environment;
    if (hasEnvironment) {
      const envBtn = document.createElement("button");
      envBtn.className = "glb-viewer__env-option";
      envBtn.dataset.type = "environment";
      envBtn.dataset.env = modelInfo.environment;
      envBtn.textContent = "Environment";
      menu.appendChild(envBtn);
    }
    container.appendChild(menu);

    let currentMode = (localStorage && localStorage.getItem(STORAGE_KEY)) || "solid";
    const envStorageKey = ENV_STORAGE_KEY + "-" + (modelInfo?.environment || "");
    let envEnabled = hasEnvironment && (!localStorage || localStorage.getItem(envStorageKey) !== "0");

    menu.querySelectorAll("button[data-mode]").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === currentMode);
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        currentMode = b.dataset.mode;
        menu.querySelectorAll("button[data-mode]").forEach((x) => x.classList.toggle("active", x.dataset.mode === currentMode));
        if (localStorage) localStorage.setItem(STORAGE_KEY, currentMode);
        onModeChange(currentMode);
        menu.classList.remove("open");
      });
    });

    if (hasEnvironment) {
      const envBtn = menu.querySelector(".glb-viewer__env-option");
      envBtn.classList.toggle("active", envEnabled);
      envBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        envEnabled = !envEnabled;
        envBtn.classList.toggle("active", envEnabled);
        if (localStorage) localStorage.setItem(envStorageKey, envEnabled ? "1" : "0");
        onEnvironmentChange(envEnabled);
        menu.classList.remove("open");
      });
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("open");
    });
    document.addEventListener("click", () => menu.classList.remove("open"));

    return { getMode: () => currentMode, getEnvEnabled: () => envEnabled };
  }

  function applyMode(model, mode) {
    model.traverse((obj) => {
      if (!obj.isMesh) return;
      const geo = obj.geometry;
      if (!geo) return;

      if (mode === MODES.wireframe) {
        const mat = new THREE.MeshBasicMaterial({
          color: 0x64ffda,
          wireframe: true,
          transparent: true,
          opacity: 0.9
        });
        obj.material = mat;
      } else if (mode === MODES.clay) {
        const orig = obj.userData.originalMaterial;
        const baseColor = (orig && orig.color) ? orig.color.getHex() : (obj.userData.originalColor !== undefined)
          ? obj.userData.originalColor
          : (obj.material && obj.material.color ? obj.material.color.getHex() : 0x8899aa);
        obj.userData.originalColor = baseColor;
        obj.material = new THREE.MeshLambertMaterial({
          color: baseColor,
          flatShading: true,
          transparent: false
        });
      } else {
        if (obj.userData.originalMaterial) {
          obj.material = obj.userData.originalMaterial;
        }
      }
    });
  }

  function storeOriginalMaterials(model) {
    model.traverse((obj) => {
      if (obj.isMesh && obj.material && !obj.userData.originalMaterial) {
        obj.userData.originalMaterial = obj.material;
      }
    });
  }

  const OCEAN_WATER_LEVEL = 20;  // Raise this (e.g. -1 or 0) to make the ocean higher

  function createOceanEnvironment(scene) {
    const oceanGroup = new THREE.Group();
    const planeW = 50;
    const segW = 60;
    const oceanColor = new THREE.Color(0x48b1ff);
    const oceanColor2 = new THREE.Color(0x64ffda);

    const waveGeo1 = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
    waveGeo1.rotateX(-Math.PI / 2);
    const waveMat1 = new THREE.MeshBasicMaterial({
      color: oceanColor,
      wireframe: false,
      transparent: true,
      opacity: 0.65
    });
    const wavePlane1 = new THREE.Mesh(waveGeo1, waveMat1);
    wavePlane1.position.y = OCEAN_WATER_LEVEL;
    wavePlane1.userData.geo = waveGeo1;
    oceanGroup.add(wavePlane1);

    const waveGeo2 = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
    waveGeo2.rotateX(-Math.PI / 2);
    const waveMat2 = new THREE.MeshBasicMaterial({
      color: oceanColor2,
      wireframe: false,
      transparent: true,
      opacity: 0.45
    });
    const wavePlane2 = new THREE.Mesh(waveGeo2, waveMat2);
    wavePlane2.position.y = OCEAN_WATER_LEVEL - 0.2;
    wavePlane2.userData.geo = waveGeo2;
    oceanGroup.add(wavePlane2);

    const foamGeo = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
    foamGeo.rotateX(-Math.PI / 2);
    const foamMat = new THREE.MeshBasicMaterial({
      color: 0xc8e6f5,
      wireframe: false,
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    });
    const foamPlane = new THREE.Mesh(foamGeo, foamMat);
    foamPlane.position.y = OCEAN_WATER_LEVEL + 0.05;
    foamPlane.userData.geo = foamGeo;
    oceanGroup.add(foamPlane);

    oceanGroup.userData.wavePlanes = [wavePlane1, wavePlane2, foamPlane];
    oceanGroup.visible = false;
    return oceanGroup;
  }

  function updateOceanWaves(oceanGroup, t) {
    if (!oceanGroup || !oceanGroup.userData.wavePlanes) return;
    oceanGroup.userData.wavePlanes.forEach((plane) => {
      const pos = plane.geometry.attributes.position;
      if (!pos) return;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const wave1 = (Math.sin(x * 0.15 + t) * Math.cos(z * 0.15 + t) * 0.5 +
          Math.sin(x * 0.08 - t * 0.5) * 0.25);
        const wave2 = (Math.sin(x * 0.12 + t * 1.1) * Math.cos(z * 0.12 + t * 0.8) * 0.35);
        const wave = wave1 + wave2;
        pos.setY(i, wave);
      }
      pos.needsUpdate = true;
    });
  }

  function getWaveHeightAt(x, z, t) {
    const wave1 = (Math.sin(x * 0.15 + t) * Math.cos(z * 0.15 + t) * 0.5 +
      Math.sin(x * 0.08 - t * 0.5) * 0.25);
    const wave2 = (Math.sin(x * 0.12 + t * 1.1) * Math.cos(z * 0.12 + t * 0.8) * 0.35);
    return wave1 + wave2;
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
    else if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 8, 5);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0x64ffda, 0.2);
    fill.position.set(-3, 2, -2);
    scene.add(fill);

    let model = null;
    let controls = null;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w <= 0 || h <= 0) return;
      canvas.width = w;
      canvas.height = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const setMode = (mode) => {
      if (model) applyMode(model, mode);
    };

    const info = getModelInfo(src);
    let envEnabled = false;
    let oceanGroup = null;
    const defaultBg = new THREE.Color(0x0c121c);
    const oceanSkyBg = new THREE.Color(0x0a1628);

    const setEnvironment = (enabled) => {
      envEnabled = enabled;
      if (oceanGroup) {
        oceanGroup.visible = enabled;
        scene.background = enabled ? oceanSkyBg : defaultBg;
      }
      if (model && info?.environment === "ocean") {
        if (enabled) {
          const box = new THREE.Box3().setFromObject(model);
          const minY = box.min.y;
          model.userData.baseY = OCEAN_WATER_LEVEL - minY;
          model.position.y = model.userData.baseY;
        } else {
          model.userData.baseY = 0;
          model.position.y = 0;
        }
      }
    };

    oceanGroup = createOceanEnvironment(scene);
    scene.add(oceanGroup);

    const settingsRet = createSettingsButton(container, setMode, info, setEnvironment);
    const getMode = settingsRet.getMode;
    envEnabled = settingsRet.getEnvEnabled();
    setEnvironment(envEnabled);

    resize();
    setMode(getMode());
    const downloadable = info && info.downloadable !== false && !info.encrypted;
    const settingsBtn = container.querySelector(".glb-viewer__settings-btn");
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
      window.addEventListener("resize", () => {
        downloadBtn.style.display = window.innerWidth > 1023 ? "" : "none";
      });
    }

    const arBtn = document.createElement("button");
    arBtn.className = "glb-viewer__ar-btn";
    arBtn.setAttribute("aria-label", "View in AR");
    arBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 8V6a2 2 0 0 1 2-2h2"/><path d="M20 8V6a2 2 0 0 0-2-2h-2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M20 16v2a2 2 0 0 1-2 2h-2"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>`;
    container.insertBefore(arBtn, insertBeforeEl);
    arBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openAROverlay(src, fetchUrl, encrypted);
    });

    if (typeof THREE.OrbitControls !== "undefined") {
      controls = new THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 2;
      controls.maxDistance = 20;
    }

    const loader = typeof THREE.GLTFLoader !== "undefined"
      ? new THREE.GLTFLoader()
      : null;
    if (!loader) {
      console.warn("GLTFLoader not loaded");
      return;
    }

    function onModelLoaded(gltf) {
      model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      model.position.sub(center);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3 / maxDim;
      model.scale.setScalar(scale);
      const box2 = new THREE.Box3().setFromObject(model);
      const minY = box2.min.y;
      model.userData.baseY = model.position.y;
      model.userData.minY = minY;
      model.userData.floatOffset = 0;
      if (envEnabled && info?.environment === "ocean") {
        model.position.y = OCEAN_WATER_LEVEL - minY;
        model.userData.baseY = model.position.y;
      }
      scene.add(model);
      storeOriginalMaterials(model);
      setMode(getMode());
    }

    function onLoadError(e) {
      console.error("GLB load error:", e);
    }

    if (encrypted) {
      const key = modelsConfig.encryptionKey || "default-key-change-me";
      fetch(fetchUrl)
        .then((r) => { if (!r.ok) throw new Error("Fetch failed"); return r.arrayBuffer(); })
        .then((buf) => xorDecrypt(buf, key))
        .then((decrypted) => loader.parse(decrypted, "", onModelLoaded, onLoadError))
        .catch(onLoadError);
    } else {
      loader.load(fetchUrl, onModelLoaded, undefined, onLoadError);
    }

    let envTime = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      if (controls) controls.update();
      if (envEnabled && oceanGroup) {
        envTime += 0.016;
        updateOceanWaves(oceanGroup, envTime);
        if (model && info?.environment === "ocean") {
          const waveH = getWaveHeightAt(0, 0, envTime);
          model.position.y = model.userData.baseY + waveH * 0.5;
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(resize)
      : null;
    if (ro) ro.observe(container);
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
  window.koModelsConfig = () => modelsConfig;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initAll());
  } else {
    initAll();
  }
})();
