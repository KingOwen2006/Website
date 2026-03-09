"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HomeScene() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sceneRef.current) return;
    sceneRef.current = true;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060b14, 0.012);
    const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 600);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x060b14);

    const CAM_START = { x: 0, y: 5, z: 18, lx: 0, ly: 0, lz: 0 };
    const CAM_END = { x: 0, y: 45, z: 0.1, lx: 0, ly: 0, lz: 0 };

    camera.position.set(CAM_START.x, CAM_START.y, CAM_START.z);
    camera.lookAt(CAM_START.lx, CAM_START.ly, CAM_START.lz);

    const oceanColor = new THREE.Color(0x48b1ff);
    const fieldColor = new THREE.Color(0x1a6b3a);
    const oceanColor2 = new THREE.Color(0x64ffda);
    const fieldColor2 = new THREE.Color(0x2d8a4e);

    const planeW = 120, segW = 90;
    const waveGeo1 = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
    waveGeo1.rotateX(-Math.PI / 2);
    const waveMat1 = new THREE.MeshBasicMaterial({ color: oceanColor, wireframe: true, transparent: true, opacity: 0.06 });
    const waveMat1Solid = new THREE.MeshBasicMaterial({ color: oceanColor, wireframe: false, transparent: true, opacity: 0.5 });
    const wavePlane1 = new THREE.Mesh(waveGeo1, waveMat1);
    wavePlane1.position.y = -3;
    scene.add(wavePlane1);

    const waveGeo2 = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
    waveGeo2.rotateX(-Math.PI / 2);
    const waveMat2 = new THREE.MeshBasicMaterial({ color: oceanColor2, wireframe: true, transparent: true, opacity: 0.03 });
    const waveMat2Solid = new THREE.MeshBasicMaterial({ color: oceanColor2, wireframe: false, transparent: true, opacity: 0.4 });
    const wavePlane2 = new THREE.Mesh(waveGeo2, waveMat2);
    wavePlane2.position.y = -3.8;
    scene.add(wavePlane2);

    const sandGeo = new THREE.PlaneGeometry(55, 28, 1, 1);
    sandGeo.rotateX(-Math.PI / 2);
    const sandMat = new THREE.MeshBasicMaterial({ color: 0xd4b896, transparent: true, opacity: 0 });
    const sandPlane = new THREE.Mesh(sandGeo, sandMat);
    sandPlane.position.set(0, -2.92, 16);
    scene.add(sandPlane);

    const roadGeo = new THREE.PlaneGeometry(6, 300, 1, 1);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshBasicMaterial({ color: 0x15152a, transparent: true, opacity: 0 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.y = -2.95;
    scene.add(road);

    const edgeGeoL = new THREE.PlaneGeometry(0.15, 300, 1, 1);
    edgeGeoL.rotateX(-Math.PI / 2);
    const edgeMatL = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const roadEdgeL = new THREE.Mesh(edgeGeoL, edgeMatL);
    roadEdgeL.position.set(-3, -2.94, 0);
    scene.add(roadEdgeL);
    const roadEdgeR = new THREE.Mesh(edgeGeoL.clone(), edgeMatL.clone());
    roadEdgeR.position.set(3, -2.94, 0);
    scene.add(roadEdgeR);

    const dashGeo = new THREE.PlaneGeometry(0.15, 1.8, 1, 1);
    dashGeo.rotateX(-Math.PI / 2);
    const dashes = [];
    for (let i = 0; i < 60; i++) {
      const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.position.set(0, -2.93, -i * 4 + 30);
      scene.add(dash);
      dashes.push(dash);
    }

    const geos = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.OctahedronGeometry(1, 0),
      new THREE.TetrahedronGeometry(1, 0),
      new THREE.DodecahedronGeometry(1, 0),
    ];
    const palette = [0x64ffda, 0x48b1ff, 0xa78bfa, 0x3fb950, 0xd2a8ff];
    const shapes = [];

    for (let i = 0; i < 20; i++) {
      const geo = geos[Math.floor(Math.random() * geos.length)];
      const color = palette[Math.floor(Math.random() * palette.length)];
      const baseOpacity = 0.1 + Math.random() * 0.12;
      const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: baseOpacity });
      const matSolid = new THREE.MeshBasicMaterial({ color, wireframe: false, transparent: true, opacity: 0.55 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((Math.random() - 0.5) * 35, (Math.random() - 0.5) * 15 + 2, (Math.random() - 0.5) * 20 - 5);
      mesh.scale.setScalar(0.4 + Math.random() * 1.8);
      mesh.userData = {
        rotSpeed: { x: (Math.random() - 0.5) * 0.008, y: (Math.random() - 0.5) * 0.008, z: (Math.random() - 0.5) * 0.004 },
        floatSpeed: 0.2 + Math.random() * 0.4,
        floatAmp: 0.2 + Math.random() * 0.6,
        baseY: mesh.position.y,
        baseOpacity,
        matWire: mat,
        matSolid,
      };
      scene.add(mesh);
      shapes.push(mesh);
    }

    const starGeo = new THREE.BufferGeometry();
    const starCount = 180;
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 80;
      starPos[i * 3 + 1] = Math.random() * 35 + 8;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      const b = 0.85 + Math.random() * 0.15;
      starCol[i * 3] = b; starCol[i * 3 + 1] = b; starCol[i * 3 + 2] = b + Math.random() * 0.1;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
    const stars = new THREE.Points(starGeo, starMat);
    stars.visible = false;
    scene.add(stars);

    const foamGeo = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
    foamGeo.rotateX(-Math.PI / 2);
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xb8b8b8, transparent: true, opacity: 0, wireframe: false, depthWrite: false });
    const foamPlane = new THREE.Mesh(foamGeo, foamMat);
    foamPlane.position.y = -2.85;
    scene.add(foamPlane);

    const shoreWaveGeo = new THREE.PlaneGeometry(50, 5, 40, 4);
    shoreWaveGeo.rotateX(-Math.PI / 2);
    const shoreWaveMat = new THREE.MeshBasicMaterial({ color: 0x48b1ff, transparent: true, opacity: 0, depthWrite: false });
    const shoreWave = new THREE.Mesh(shoreWaveGeo, shoreWaveMat);
    shoreWave.position.set(0, -2.93, 10);
    scene.add(shoreWave);

    const edgeShapes = [];
    for (let i = 0; i < 6; i++) {
      const geo = geos[Math.floor(Math.random() * geos.length)];
      const edges = new THREE.EdgesGeometry(geo);
      const color = palette[Math.floor(Math.random() * palette.length)];
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.05 });
      const line = new THREE.LineSegments(edges, mat);
      line.position.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 15 - 8);
      line.scale.setScalar(2.5 + Math.random() * 4);
      line.userData = { rotSpeed: { x: (Math.random() - 0.5) * 0.002, y: (Math.random() - 0.5) * 0.002 }, baseOpacity: 0.05 };
      scene.add(line);
      edgeShapes.push(line);
    }

    const pGeo = new THREE.BufferGeometry();
    const pCount = 600;
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 70;
      pPos[i * 3 + 1] = Math.random() * 20 - 3;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 70;
      const c = new THREE.Color().setHSL(0.45 + Math.random() * 0.2, 0.5, 0.5 + Math.random() * 0.2);
      pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.35, depthWrite: false });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    let mouseX = 0, mouseY = 0, t = 0;
    let contactProgress = 0;
    let lastTheme = "", lastViewMode = "";

    const projFogDefaultDark = new THREE.Color(0x060b14);
    const projFogStarsDark = new THREE.Color(0x0a121c);
    const projFogTmp = new THREE.Color();

    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
    function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

    const onMouseMove = (e) => {
      mouseX = (e.clientX / innerWidth - 0.5) * 2;
      mouseY = (e.clientY / innerHeight - 0.5) * 2;
    };
    const onResize = () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    };
    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    const lookTarget = new THREE.Vector3();
    let animationId;

    function animate() {
      animationId = requestAnimationFrame(animate);
      t += 0.01;

      const wh = innerHeight;
      const contactSpacer = document.getElementById("contact-spacer");
      if (contactSpacer) {
        const sRect = contactSpacer.getBoundingClientRect();
        const cRaw = clamp((wh - sRect.top) / sRect.height, 0, 1);
        contactProgress = easeInOut(cRaw);
      }

      const inContactSection = contactProgress > 0.2;

      const eduTitle = document.querySelector("#education .road-section-title");
      const postsEl = document.getElementById("posts");
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

      const cx = lerp(CAM_START.x, CAM_END.x, landness) + mouseX * 1.5 * inv;
      const cy = lerp(CAM_START.y, CAM_END.y, landness) - mouseY * 0.5 * inv;
      const cz = lerp(CAM_START.z, CAM_END.z, landness);
      camera.position.x += (cx - camera.position.x) * 0.06;
      camera.position.y += (cy - camera.position.y) * 0.06;
      camera.position.z += (cz - camera.position.z) * 0.06;

      lookTarget.set(
        lerp(CAM_START.lx, CAM_END.lx, landness),
        lerp(CAM_START.ly, CAM_END.ly, landness),
        lerp(CAM_START.lz, CAM_END.lz, landness)
      );
      camera.lookAt(lookTarget);

      const waveAmp = inv;
      const BEACH_EDGE_Z = 0;
      const BEACH_FADE_Z = 5;
      const p1 = wavePlane1.geometry.attributes.position;
      for (let i = 0; i < p1.count; i++) {
        const x = p1.getX(i), z = p1.getZ(i);
        const beachFade = z > BEACH_EDGE_Z ? Math.max(0, 1 - (z - BEACH_EDGE_Z) / (BEACH_FADE_Z - BEACH_EDGE_Z)) : 1;
        const wave = (Math.sin(x * 0.12 + t) * Math.cos(z * 0.12 + t) * 0.7 + Math.sin(x * 0.06 - t * 0.4) * 0.4) * waveAmp * beachFade;
        p1.setY(i, wave);
      }
      p1.needsUpdate = true;

      const p2 = wavePlane2.geometry.attributes.position;
      for (let i = 0; i < p2.count; i++) {
        const x = p2.getX(i), z = p2.getZ(i);
        const beachFade = z > BEACH_EDGE_Z ? Math.max(0, 1 - (z - BEACH_EDGE_Z) / (BEACH_FADE_Z - BEACH_EDGE_Z)) : 1;
        const wave = (Math.sin(x * 0.1 + t * 1.1) * Math.cos(z * 0.1 + t * 0.7) * 0.5) * waveAmp * beachFade;
        p2.setY(i, wave);
      }
      p2.needsUpdate = true;

      const isLight = (document.documentElement.getAttribute("data-theme") || "dark") === "light";
      const isNoneMode = document.documentElement.getAttribute("data-viewmode") === "none";

      if (isNoneMode) {
        scene.children.forEach((c) => { c.visible = false; });
        lastTheme = document.documentElement.getAttribute("data-theme") || "dark";
        lastViewMode = "none";
        const clearHex = isLight ? 0xeaf0f6 : 0x060b14;
        renderer.setClearColor(clearHex);
        renderer.render(scene, camera);
        return;
      }

      const c1 = oceanColor.clone().lerp(fieldColor, educationMix);
      const c2 = oceanColor2.clone().lerp(fieldColor2, educationMix);
      waveMat1.color.copy(c1);
      waveMat2.color.copy(c2);
      waveMat1Solid.color.copy(c1);
      waveMat2Solid.color.copy(c2);
      waveMat1.opacity = isLight ? lerp(0.18, 0.25, landness) : lerp(0.06, 0.09, landness);
      waveMat2.opacity = isLight ? lerp(0.12, 0.18, landness) : lerp(0.03, 0.06, landness);
      waveMat1Solid.opacity = isLight ? lerp(0.6, 0.7, landness) : lerp(0.5, 0.6, landness);
      waveMat2Solid.opacity = isLight ? lerp(0.5, 0.6, landness) : lerp(0.4, 0.5, landness);

      sandPlane.visible = inv > 0.1 && contactProgress > 0.2;
      if (sandPlane.visible) {
        sandMat.color.setHex(isLight ? 0xe8d5b8 : 0xd4b896);
        sandMat.opacity = inv * (isLight ? 0.9 : 0.75);
      }

      const showShoreWaves = inv > 0.1 && contactProgress > 0.2;
      shoreWave.visible = showShoreWaves;
      if (showShoreWaves) {
        const washCycle = Math.sin(t * 0.4) * 0.5 + 0.5;
        const swPos = shoreWave.geometry.attributes.position;
        for (let i = 0; i < swPos.count; i++) {
          const x = swPos.getX(i), z = swPos.getZ(i);
          const wave = Math.sin(x * 0.5 + t * 1.2) * Math.cos(z * 0.8 + t * 0.9) * 0.25 * washCycle;
          swPos.setY(i, wave);
        }
        swPos.needsUpdate = true;
        shoreWaveMat.color.copy(c1);
        shoreWaveMat.opacity = inv * (0.35 + washCycle * 0.25) * (isLight ? 0.6 : 0.5);
      }

      const isSolidMode = document.documentElement.getAttribute("data-viewmode") === "solid";
      const roadAlpha = clamp((landness - 0.25) / 0.55, 0, 1);
      const roadVisible = roadAlpha > 0.001;
      road.visible = roadVisible;
      roadEdgeL.visible = roadVisible;
      roadEdgeR.visible = roadVisible;
      dashes.forEach((d) => { d.visible = roadVisible; });
      if (roadVisible) {
        roadMat.opacity = roadAlpha * 0.4;
        edgeMatL.opacity = roadAlpha * 0.15;
        roadEdgeR.material.opacity = roadAlpha * 0.15;
        dashes.forEach((d) => { d.material.opacity = roadAlpha * 0.25; });
      }

      const hideInContact = 1 - contactProgress;
      shapes.forEach((s) => {
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
      edgeShapes.forEach((s) => {
        s.visible = !isSolidMode && !inContactSection;
        if (s.visible) {
          s.rotation.x += s.userData.rotSpeed.x;
          s.rotation.y += s.userData.rotSpeed.y;
          s.material.opacity = (isLight ? s.userData.baseOpacity * 2.5 : s.userData.baseOpacity) * inv * hideInContact;
        }
      });

      scene.fog.density = isLight ? lerp(0.006, 0.002, landness) : lerp(0.012, 0.004, landness);

      const showStars = !isLight && inContactSection && inv > 0.1;
      stars.visible = showStars;
      if (showStars) starMat.opacity = 0.85 * contactProgress;

      const showFoam = !isLight && isSolidMode && inContactSection && inv > 0.1;
      foamPlane.visible = showFoam;
      if (showFoam) {
        const fp = foamPlane.geometry.attributes.position;
        for (let i = 0; i < fp.count; i++) {
          const x = fp.getX(i), z = fp.getZ(i);
          const beachFade = z > BEACH_EDGE_Z ? Math.max(0, 1 - (z - BEACH_EDGE_Z) / (BEACH_FADE_Z - BEACH_EDGE_Z)) : 1;
          const wave = (Math.sin(x * 0.12 + t) * Math.cos(z * 0.12 + t) * 0.7 + Math.sin(x * 0.06 - t * 0.4) * 0.4) * waveAmp * beachFade;
          fp.setY(i, wave);
        }
        fp.needsUpdate = true;
        foamMat.opacity = 0.25 * inv;
      }

      pMat.opacity = isSolidMode ? 0 : (isLight ? 0.55 : 0.35);
      particles.visible = !isSolidMode && !inContactSection;

      const curTheme = document.documentElement.getAttribute("data-theme") || "dark";
      if (curTheme !== lastTheme || (isSolidMode ? "solid" : "wire") !== lastViewMode) {
        lastTheme = curTheme;
        lastViewMode = isSolidMode ? "solid" : "wire";
        const clearHex = isLight ? 0xeaf0f6 : 0x060b14;
        renderer.setClearColor(clearHex);
        scene.fog.color.setHex(clearHex);
      }
      if (!isLight) {
        projFogTmp.copy(showStars ? projFogStarsDark : projFogDefaultDark);
        scene.fog.color.copy(projFogTmp);
      }

      particles.rotation.y += 0.00015;
      renderer.render(scene, camera);
    }
    animate();

    window.applySceneViewMode = function (mode) {
      if (mode === "none") {
        scene.children.forEach((c) => { c.visible = false; });
        return;
      }
      scene.children.forEach((c) => { c.visible = true; });
      const isSolid = mode === "solid";
      wavePlane1.material = isSolid ? waveMat1Solid : waveMat1;
      wavePlane2.material = isSolid ? waveMat2Solid : waveMat2;
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
    } catch {}

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.15 }
    );
    window._roadObserver = observer;

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      delete window.applySceneViewMode;
      delete window._roadObserver;
      sceneRef.current = false;
    };
  }, []);

  return <canvas ref={canvasRef} id="bg" />;
}
