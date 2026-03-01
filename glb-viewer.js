/* ============================================
   GLB Viewer — clay / solid / wireframe modes
   Supports encrypted .glb.enc files for secure delivery.
   ============================================ */
(function () {
  if (typeof THREE === "undefined") return;

  const MODES = { clay: "clay", solid: "solid", wireframe: "wireframe" };
  const STORAGE_KEY = "ko-glb-viewer-mode";

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

  function createSettingsButton(container, onModeChange) {
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
    container.appendChild(menu);

    let currentMode = (localStorage && localStorage.getItem(STORAGE_KEY)) || "solid";
    menu.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === currentMode);
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        currentMode = b.dataset.mode;
        menu.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x.dataset.mode === currentMode));
        if (localStorage) localStorage.setItem(STORAGE_KEY, currentMode);
        onModeChange(currentMode);
        menu.classList.remove("open");
      });
    });

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("open");
    });
    document.addEventListener("click", () => menu.classList.remove("open"));

    return () => currentMode;
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

    const getMode = createSettingsButton(container, setMode);
    resize();
    setMode(getMode());

    const info = getModelInfo(src);
    const downloadable = info && info.downloadable !== false && !info.encrypted;
    if (downloadable) {
      const downloadBtn = document.createElement("a");
      downloadBtn.className = "glb-viewer__download-btn";
      downloadBtn.href = src.replace(/\.enc$/, "").replace(/\.glb\.enc$/, ".glb");
      downloadBtn.setAttribute("download", "");
      downloadBtn.setAttribute("aria-label", "Download");
      downloadBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
      downloadBtn.style.display = window.innerWidth > 1023 ? "" : "none";
      container.insertBefore(downloadBtn, container.querySelector(".glb-viewer__settings-btn"));
      window.addEventListener("resize", () => {
        downloadBtn.style.display = window.innerWidth > 1023 ? "" : "none";
      });
    }

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

    const animate = () => {
      requestAnimationFrame(animate);
      if (controls) controls.update();
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
