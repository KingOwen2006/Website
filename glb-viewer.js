/* ============================================
   GLB Viewer — clay / solid / wireframe modes
   ============================================ */
(function () {
  if (typeof THREE === "undefined") return;

  const MODES = { clay: "clay", solid: "solid", wireframe: "wireframe" };
  const STORAGE_KEY = "ko-glb-viewer-mode";

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
        if (obj.userData.wireframeLines) {
          obj.visible = false;
          obj.userData.wireframeLines.visible = true;
          return;
        }
        obj.visible = false;
        const edgesGeo = new THREE.EdgesGeometry(geo, 1); /* 1° = hide coplanar (quad diagonals) */
        const lineMat = new THREE.LineBasicMaterial({ color: 0x64ffda });
        const lines = new THREE.LineSegments(edgesGeo, lineMat);
        obj.add(lines);
        obj.userData.wireframeLines = lines;
      } else {
        if (obj.userData.wireframeLines) {
          obj.remove(obj.userData.wireframeLines);
          obj.userData.wireframeLines.geometry.dispose();
          obj.userData.wireframeLines.material.dispose();
          obj.userData.wireframeLines = null;
        }
        obj.visible = true;
        if (mode === MODES.clay) {
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c121c);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(4, 3, 6);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;

    const ambient = new THREE.AmbientLight(0xa0b0c0, 0.35);
    scene.add(ambient);
    const hemi = new THREE.HemisphereLight(0xe8f0ff, 0x506080, 0.4);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff5e6, 0.9);
    key.position.set(5, 7, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8dcff, 0.4);
    fill.position.set(-4, 3, -3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.45);
    rim.position.set(0, 4, -8);
    scene.add(rim);

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

    loader.load(
      src,
      (gltf) => {
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
      },
      undefined,
      (e) => console.error("GLB load error:", e)
    );

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
    scope.querySelectorAll("[data-glb-viewer]").forEach((el) => {
      if (el.dataset.glbViewerInit) return;
      el.dataset.glbViewerInit = "1";
      const src = el.dataset.src || el.querySelector("[data-src]")?.dataset?.src;
      if (src) initViewer(el, src);
    });
  }

  window.initGlbViewers = initAll;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initAll());
  } else {
    initAll();
  }
})();
