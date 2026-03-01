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

  const SHIP_MODEL_ID = "Unit3ShipDone";

  function isShipModel(src) {
    return src && (src.includes(SHIP_MODEL_ID) || src.includes("Unit3ShipDone"));
  }

  function createOceanEnvironment(container, modelUrl, onReady) {
    const canvas = document.createElement("canvas");
    canvas.className = "glb-viewer-ar-ocean-canvas";
    canvas.style.cssText = "width:100%;max-width:500px;height:60vh;background:#0a1628;border-radius:14px;display:block";
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1628);
    scene.fog = new THREE.FogExp2(0x48b1ff, 0.04);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(4, 2.5, 6);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;

    const ambient = new THREE.AmbientLight(0x64a8d4, 0.5);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 10, 5);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0x48b1ff, 0.4);
    fill.position.set(-3, 2, -2);
    scene.add(fill);

    const oceanGeo = new THREE.PlaneGeometry(40, 40, 80, 80);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshPhongMaterial({
      color: 0x1a5a8a,
      transparent: true,
      opacity: 0.92,
      shininess: 80,
      specular: 0x4488cc,
      flatShading: false
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.y = -1.5;
    scene.add(ocean);

    let shipModel = null;
    let controls = null;
    let animId = 0;
    const loader = typeof THREE.GLTFLoader !== "undefined" ? new THREE.GLTFLoader() : null;

    function loadShip() {
      if (!loader) return;
      loader.load(modelUrl, (gltf) => {
        shipModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(shipModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        shipModel.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        shipModel.scale.setScalar(scale);
        shipModel.position.y = -1.5 + (size.y * scale) * 0.5;
        scene.add(shipModel);
        onReady && onReady();
      }, undefined, (e) => console.error("Ocean env load error:", e));
    }

    loadShip();

    if (typeof THREE.OrbitControls !== "undefined") {
      controls = new THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 2;
      controls.maxDistance = 15;
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height);
    };
    resize();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(container);

    const posAttr = oceanGeo.attributes.position;
    let t = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      t += 0.012;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i), z = posAttr.getZ(i);
        const wave = Math.sin(x * 0.15 + t) * Math.cos(z * 0.15 + t * 0.8) * 0.15
          + Math.sin(x * 0.08 - t * 0.5) * 0.08;
        posAttr.setY(i, wave);
      }
      posAttr.needsUpdate = true;
      oceanGeo.computeVertexNormals();
      if (controls) controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return {
      dispose: () => {
        cancelAnimationFrame(animId);
        if (ro) ro.disconnect();
        renderer.dispose();
        oceanGeo.dispose();
        oceanMat.dispose();
        canvas.remove();
      }
    };
  }

  function openAROverlay(src, fetchUrl, encrypted) {
    if (typeof customElements !== "undefined" && customElements.get("model-viewer") === undefined) {
      customElements.whenDefined("model-viewer").then(() => openAROverlay(src, fetchUrl, encrypted));
      return;
    }
    const hasShipEnv = isShipModel(src);
    const overlay = document.createElement("div");
    overlay.className = "glb-viewer-ar-overlay";
    overlay.innerHTML = `
      <button class="glb-viewer-ar-overlay__close" aria-label="Close">×</button>
      ${hasShipEnv ? `
        <div class="glb-viewer-ar-env-selector">
          <label>Environment</label>
          <select class="glb-viewer-ar-env-select" disabled>
            <option value="default">Default</option>
            <option value="ocean">Ocean</option>
          </select>
        </div>
      ` : ""}
      <div class="glb-viewer-ar-content">
        <model-viewer ar ar-modes="webxr scene-viewer quick-look" camera-controls touch-action="pan-y" style="width:100%;max-width:500px;height:60vh;background:#0c121c;border-radius:14px;"></model-viewer>
      </div>
      <p class="glb-viewer-ar-overlay__hint">Tap "View in your space" to place the model in the real world</p>
    `;
    const mv = overlay.querySelector("model-viewer");
    const contentWrap = overlay.querySelector(".glb-viewer-ar-content");
    const closeBtn = overlay.querySelector(".glb-viewer-ar-overlay__close");
    const envSelect = overlay.querySelector(".glb-viewer-ar-env-select");
    let oceanEnv = null;
    let modelBlobUrl = null;

    function close() {
      if (oceanEnv) oceanEnv.dispose();
      overlay.remove();
      document.body.style.overflow = "";
      if (modelBlobUrl) URL.revokeObjectURL(modelBlobUrl);
      if (mv.src && mv.src.startsWith("blob:")) URL.revokeObjectURL(mv.src);
    }

    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

    function setModelUrl(url) {
      mv.src = url;
    }

    function showModelViewer() {
      if (oceanEnv) {
        oceanEnv.dispose();
        oceanEnv = null;
      }
      contentWrap.innerHTML = "";
      const m = document.createElement("model-viewer");
      m.setAttribute("ar", "");
      m.setAttribute("ar-modes", "webxr scene-viewer quick-look");
      m.setAttribute("camera-controls", "");
      m.setAttribute("touch-action", "pan-y");
      m.style.cssText = "width:100%;max-width:500px;height:60vh;background:#0c121c;border-radius:14px";
      m.src = modelBlobUrl || (mv && mv.src) || "";
      contentWrap.appendChild(m);
    }

    function showOceanEnv() {
      contentWrap.innerHTML = "";
      const url = modelBlobUrl || new URL(fetchUrl, window.location.href).href;
      oceanEnv = createOceanEnvironment(contentWrap, url, () => {});
      const arBtn = document.createElement("button");
      arBtn.className = "glb-viewer-ar-ocean-ar-btn";
      arBtn.textContent = "View in your space";
      arBtn.addEventListener("click", () => {
        const m = document.createElement("model-viewer");
        m.setAttribute("ar", "");
        m.setAttribute("ar-modes", "webxr scene-viewer quick-look");
        m.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none";
        m.src = modelBlobUrl || url;
        document.body.appendChild(m);
        m.addEventListener("load", () => { try { m.activateAR(); } catch (_) {} }, { once: true });
        setTimeout(() => m.remove(), 5000);
      });
      contentWrap.appendChild(arBtn);
    }

    function applyEnv() {
      const env = envSelect ? envSelect.value : "default";
      if (env === "ocean" && hasShipEnv) {
        showOceanEnv();
      } else {
        if (oceanEnv) {
          oceanEnv.dispose();
          oceanEnv = null;
        }
        showModelViewer();
      }
    }

    if (envSelect) {
      envSelect.addEventListener("change", applyEnv);
    }

    function onModelReady(url) {
      modelBlobUrl = url;
      setModelUrl(url);
      if (envSelect) envSelect.disabled = false;
      if (envSelect && envSelect.value === "ocean") {
        showOceanEnv();
      } else {
        applyEnv();
      }
    }

    if (encrypted) {
      const key = modelsConfig.encryptionKey || "default-key-change-me";
      fetch(fetchUrl)
        .then((r) => { if (!r.ok) throw new Error("Fetch failed"); return r.arrayBuffer(); })
        .then((buf) => xorDecrypt(buf, key))
        .then((decrypted) => {
          const blob = new Blob([decrypted], { type: "model/gltf-binary" });
          const url = URL.createObjectURL(blob);
          onModelReady(url);
        })
        .catch((err) => {
          console.error("AR load error:", err);
          close();
        });
    } else {
      const url = new URL(fetchUrl, window.location.href).href;
      onModelReady(url);
    }

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
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
