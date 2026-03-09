"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function PostScene() {
  const canvasRef = useRef(null);
  const initRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initRef.current) return;
    initRef.current = true;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060b14, 0.015);
    const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 600);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x060b14);
    camera.position.set(0, 5, 18);
    camera.lookAt(0, 0, 0);

    const planeW = 120, segW = 70;
    const geo = new THREE.PlaneGeometry(planeW, planeW, segW, segW);
    geo.rotateX(-Math.PI / 2);
    const matWire = new THREE.MeshBasicMaterial({ color: 0x48b1ff, wireframe: true, transparent: true, opacity: 0.04 });
    const matSolid = new THREE.MeshBasicMaterial({ color: 0x48b1ff, wireframe: false, transparent: true, opacity: 0.5 });
    const plane = new THREE.Mesh(geo, matWire);
    plane.position.y = -3;
    scene.add(plane);

    const pGeo = new THREE.BufferGeometry();
    const pCount = 300;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 60;
      pPos[i * 3 + 1] = Math.random() * 15 - 3;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x64ffda, size: 0.06, transparent: true, opacity: 0.2, depthWrite: false });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    let t = 0, lastT = "", lastV = "";
    const onResize = () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    };
    window.addEventListener("resize", onResize);

    window.applySceneViewMode = function (mode) {
      if (mode === "none") {
        plane.visible = false;
        particles.visible = false;
        return;
      }
      plane.visible = true;
      particles.visible = true;
      plane.material = mode === "solid" ? matSolid : matWire;
    };
    try {
      const sv = localStorage.getItem("ko-settings-viewmode");
      if (sv) window.applySceneViewMode(sv);
    } catch {}

    let animId;
    function animate() {
      animId = requestAnimationFrame(animate);
      t += 0.008;
      const isLight = (document.documentElement.getAttribute("data-theme") || "dark") === "light";
      const isNone = (document.documentElement.getAttribute("data-viewmode") || "wireframe") === "none";
      const isSolid = (document.documentElement.getAttribute("data-viewmode") || "wireframe") === "solid";

      if (isNone) {
        plane.visible = false;
        particles.visible = false;
        lastT = isLight ? "l" : "d";
        lastV = "n";
        const hex = isLight ? 0xeaf0f6 : 0x060b14;
        renderer.setClearColor(hex);
        scene.fog.color.setHex(hex);
        renderer.render(scene, camera);
        return;
      }

      const curT = isLight ? "l" : "d", curV = isSolid ? "s" : "w";
      if (curT !== lastT || curV !== lastV) {
        lastT = curT; lastV = curV;
        const hex = isLight ? 0xeaf0f6 : 0x060b14;
        renderer.setClearColor(hex);
        scene.fog.color.setHex(hex);
        plane.material = isSolid ? matSolid : matWire;
      }

      plane.visible = true;
      matWire.opacity = isLight ? 0.18 : 0.04;
      matSolid.opacity = isLight ? 0.6 : 0.5;
      scene.fog.density = isLight ? 0.006 : 0.015;
      pMat.opacity = isSolid ? 0 : (isLight ? 0.4 : 0.2);
      particles.visible = !isSolid;

      const p = plane.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i);
        p.setY(i, Math.sin(x * 0.1 + t) * Math.cos(z * 0.1 + t) * 0.4);
      }
      p.needsUpdate = true;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      delete window.applySceneViewMode;
      initRef.current = false;
    };
  }, []);

  return <canvas ref={canvasRef} id="bg" />;
}
