/* ============================================
   WebXR AR Ocean Environment — Unit3ShipDone exclusive
   Ship floats on ocean with water atmosphere, camera mode
   ============================================ */
(function () {
  if (typeof THREE === "undefined") return;

  const SHIP_MODEL_ID = "Unit3ShipDone.glb";

  function isShipModel(src) {
    return (src || "").toLowerCase().includes("unit3shipdone");
  }

  function createARButton(renderer, onSessionStart) {
    const btn = document.createElement("button");
    btn.textContent = "View in AR";
    btn.style.cssText = "position:absolute;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;font-size:1rem;font-weight:600;background:var(--accent,#3BCABF);color:#0c121c;border:none;border-radius:10px;cursor:pointer;z-index:10;box-shadow:0 4px 12px rgba(0,0,0,.3)";
    btn.addEventListener("click", async () => {
      if (!navigator.xr) {
        alert("AR is not supported in this browser. Try Chrome on Android or Safari on iOS.");
        return;
      }
      const supported = await navigator.xr.isSessionSupported("immersive-ar");
      if (!supported) {
        alert("AR is not supported on this device.");
        return;
      }
      try {
        const session = await navigator.xr.requestSession("immersive-ar", {
          optionalFeatures: ["hit-test"]
        });
        onSessionStart(session);
      } catch (err) {
        console.error("AR session failed:", err);
        alert("Could not start AR. Camera permission may be required.");
      }
    });
    return btn;
  }

  function createOceanPlane(size, animated) {
    const geo = new THREE.PlaneGeometry(size, size, 48, 48);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x1a5a8a,
      transparent: true,
      opacity: 0.9,
      shininess: 100,
      specular: 0x66aadd,
      flatShading: false
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.position.y = 0;
    plane.receiveShadow = true;
    plane.userData.animated = !!animated;
    plane.userData.positions = geo.attributes.position.array;
    plane.userData.originalY = new Float32Array(geo.attributes.position.count);
    for (let i = 0; i < geo.attributes.position.count; i++) {
      plane.userData.originalY[i] = geo.attributes.position.getY(i);
    }
    return plane;
  }

  function animateOcean(plane, t) {
    if (!plane.userData.animated || !plane.userData.positions) return;
    const pos = plane.geometry.attributes.position;
    const origY = plane.userData.originalY;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const wave = Math.sin(x * 0.5 + t) * Math.cos(z * 0.5 + t * 0.8) * 0.08;
      pos.setY(i, origY[i] + wave);
    }
    pos.needsUpdate = true;
  }

  function createOceanGroup(shipModel, oceanSize) {
    const group = new THREE.Group();
    const ocean = createOceanPlane(oceanSize, true);
    group.add(ocean);
    group.userData.ocean = ocean;
    const ship = shipModel.clone();
    ship.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        obj.material = obj.material.clone();
      }
    });
    const box = new THREE.Box3().setFromObject(ship);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    ship.position.sub(center);
    ship.position.y = size.y * 0.5 + 0.02;
    const maxDim = Math.max(size.x, size.y, size.z);
    ship.scale.setScalar(Math.min(2 / maxDim, oceanSize * 0.15 / maxDim));
    group.add(ship);
    return group;
  }

  window.openAROceanOverlay = function (modelUrl, modelArrayBuffer, encrypted) {
    const overlay = document.createElement("div");
    overlay.className = "glb-viewer-ar-overlay glb-viewer-ar-ocean";
    overlay.style.flexDirection = "column";
    overlay.innerHTML = `
      <button class="glb-viewer-ar-overlay__close" aria-label="Close">×</button>
      <div class="glb-viewer-ar-ocean__preview" style="width:100%;max-width:400px;height:45vh;background:#0c121c;border-radius:14px;position:relative;overflow:hidden">
        <canvas id="ar-ocean-preview-canvas" style="width:100%;height:100%;display:block"></canvas>
      </div>
      <p class="glb-viewer-ar-overlay__hint" style="margin:1rem 0 0.5rem">Environment: Ocean — Ship on water</p>
      <p class="glb-viewer-ar-overlay__hint" style="font-size:0.8rem;opacity:0.8">Tap below to enter AR, then tap a surface to place the ship</p>
    `;

    const closeBtn = overlay.querySelector(".glb-viewer-ar-overlay__close");
    const previewCanvas = overlay.querySelector("#ar-ocean-preview-canvas");

    let blobUrl = null;
    let previewScene = null;
    let previewRenderer = null;
    let previewCamera = null;
    let previewShip = null;

    function close() {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (previewRenderer) previewRenderer.dispose();
      overlay.remove();
      document.body.style.overflow = "";
    }

    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

    const loader = typeof THREE.GLTFLoader !== "undefined" ? new THREE.GLTFLoader() : null;
    if (!loader) {
      close();
      return;
    }

    function loadModel(cb) {
      const onLoad = (gltf) => cb(gltf.scene);
      const onError = (e) => { console.error(e); close(); };
      if (modelArrayBuffer) {
        loader.parse(modelArrayBuffer, "", onLoad, onError);
      } else if (modelUrl) {
        loader.load(modelUrl, (gltf) => onLoad(gltf), undefined, onError);
      }
    }

    loadModel((shipModel) => {
      previewShip = shipModel.clone();
      const box = new THREE.Box3().setFromObject(previewShip);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      previewShip.position.sub(center);
      previewShip.position.y = size.y * 0.5 + 0.05;
      const maxDim = Math.max(size.x, size.y, size.z);
      previewShip.scale.setScalar(1.5 / maxDim);

      previewScene = new THREE.Scene();
      previewScene.background = new THREE.Color(0x0a1628);
      previewScene.fog = new THREE.FogExp2(0x1a5a8a, 0.08);
      previewCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      previewCamera.position.set(2, 1.5, 2);
      previewCamera.lookAt(0, 0, 0);

      const ocean = createOceanPlane(4, true);
      previewScene.add(ocean);
      previewScene.add(previewShip);

      const ambient = new THREE.AmbientLight(0xffffff, 0.5);
      const dir = new THREE.DirectionalLight(0xffffff, 0.8);
      dir.position.set(3, 5, 2);
      previewScene.add(ambient);
      previewScene.add(dir);

      previewRenderer = new THREE.WebGLRenderer({ canvas: previewCanvas, alpha: true, antialias: true });
      previewRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      previewRenderer.setSize(previewCanvas.clientWidth, previewCanvas.clientHeight);

      function resizePreview() {
        const w = previewCanvas.clientWidth;
        const h = previewCanvas.clientHeight;
        if (w && h) {
          previewCanvas.width = w;
          previewCanvas.height = h;
          previewCamera.aspect = w / h;
          previewCamera.updateProjectionMatrix();
          previewRenderer.setSize(w, h);
        }
      }
      resizePreview();
      window.addEventListener("resize", resizePreview);

      let t = 0;
      function animatePreview() {
        if (!overlay.isConnected) return;
        t += 0.016;
        if (previewShip) previewShip.rotation.y = t * 0.3;
        animateOcean(ocean, t);
        previewRenderer.render(previewScene, previewCamera);
        requestAnimationFrame(animatePreview);
      }
      animatePreview();

      const arBtn = createARButton(previewRenderer, (session) => {
        overlay.querySelector(".glb-viewer-ar-ocean__preview").style.display = "none";
        arBtn.style.display = "none";
        overlay.querySelectorAll(".glb-viewer-ar-overlay__hint").forEach((p) => p.style.display = "none");
        startARSession(session, shipModel, overlay, close);
      });
      overlay.appendChild(arBtn);
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
  };

  function startARSession(session, shipModel, overlay, close) {
    overlay.style.display = "none";
    overlay.style.pointerEvents = "none";
    document.body.style.overflow = "";

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;display:block;z-index:10000";
    document.body.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a5a8a, 0.06);
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.xr.enabled = true;

    const gl = renderer.getContext();
    if (gl.makeXRCompatible) {
      gl.makeXRCompatible().then(() => {
        renderer.xr.setSession(session);
      }).catch((err) => {
        console.error("XR compatible failed:", err);
        renderer.xr.setSession(session);
      });
    } else {
      renderer.xr.setSession(session);
    }

    const light = new THREE.HemisphereLight(0xffffff, 0x4488cc, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    let hitTestSource = null;
    let hitTestSourceRequested = false;
    let placed = false;

    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", () => {
      if (reticle.visible && !placed) {
        placed = true;
        const group = createOceanGroup(shipModel, 3);
        group.position.setFromMatrixPosition(reticle.matrix);
        group.rotation.y = Math.atan2(
          -camera.position.x - group.position.x,
          -camera.position.z - group.position.z
        );
        scene.add(group);
        reticle.visible = false;
      }
    });
    scene.add(controller);

    session.addEventListener("end", () => {
      canvas.remove();
      window.removeEventListener("resize", onWindowResize);
      close();
    });

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onWindowResize);

    let xrRefSpace = null;

    renderer.setAnimationLoop((timestamp, frame) => {
      if (!frame) return;
      const referenceSpace = renderer.xr.getReferenceSpace();

      if (!hitTestSourceRequested) {
        session.requestReferenceSpace("viewer").then((refSpace) => {
          xrRefSpace = refSpace;
          return session.requestHitTestSource({ space: refSpace });
        }).then((source) => {
          hitTestSource = source;
        }).catch(() => {});
        hitTestSourceRequested = true;
      }

      if (hitTestSource && xrRefSpace && !placed) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(xrRefSpace);
          if (pose) {
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
          } else {
            reticle.visible = false;
          }
        } else {
          reticle.visible = false;
        }
      }

      scene.children.forEach((child) => {
        if (child.userData && child.userData.ocean) animateOcean(child.userData.ocean, timestamp / 1000);
      });

      renderer.render(scene, camera);
    });
  }

  window.isShipModelForAR = isShipModel;
  window.SHIP_MODEL_ID = SHIP_MODEL_ID;
})();
