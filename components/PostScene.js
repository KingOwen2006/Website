"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const COL = {
  grassDark: 0x4caf50,
  grassLight: 0x5dbb3f,
  fieldDark: 0x1a6b3a,
  fieldLight: 0x2d8a4e,
  skyHorizon: 0x87ceeb,
  skyZenith: 0x4a90d9,
  skyNightHorizon: 0x1a2744,
  skyNightZenith: 0x050814,
};

const ROAD_HALF_W = 3;
const SKY_PLANE_H = 95;
const GRASS_HALF_W = 50;
const GROUND_LEN_Z = 120;

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
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
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

    const planeW = 120, planeH = 120;
    const geo = new THREE.PlaneGeometry(planeW, planeH, 1, 1);
    geo.rotateX(-Math.PI / 2);
    const matWire = new THREE.MeshBasicMaterial({ color: COL.fieldDark, wireframe: true, transparent: true, opacity: 0.06 });
    const matSolid = new THREE.MeshBasicMaterial({ color: COL.fieldLight, wireframe: false, transparent: true, opacity: 0.55 });
    const plane = new THREE.Mesh(geo, matWire);
    plane.position.y = -3;
    scene.add(plane);

    const sky = createSkyGradientPlane(220, SKY_PLANE_H, 1, 48);
    paintSkyGradient(sky, COL.skyHorizon, COL.skyZenith);
    sky.position.set(0, 14, -85);
    scene.add(sky);

    const grassLeftGeo = new THREE.PlaneGeometry(GRASS_HALF_W * 2, GROUND_LEN_Z, 1, 1);
    grassLeftGeo.rotateX(-Math.PI / 2);
    const grassLeftMat = new THREE.MeshBasicMaterial({ color: COL.grassDark });
    const grassLeft = new THREE.Mesh(grassLeftGeo, grassLeftMat);
    grassLeft.position.set(-(ROAD_HALF_W + GRASS_HALF_W), -2.98, 0);
    scene.add(grassLeft);

    const grassRightGeo = new THREE.PlaneGeometry(GRASS_HALF_W * 2, GROUND_LEN_Z, 1, 1);
    grassRightGeo.rotateX(-Math.PI / 2);
    const grassRightMat = new THREE.MeshBasicMaterial({ color: COL.grassLight });
    const grassRight = new THREE.Mesh(grassRightGeo, grassRightMat);
    grassRight.position.set(ROAD_HALF_W + GRASS_HALF_W, -2.99, 0);
    scene.add(grassRight);

    const pGeo = new THREE.BufferGeometry();
    const pCount = 300;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 60;
      pPos[i * 3 + 1] = Math.random() * 15 - 3;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x64ffda, size: 0.06, transparent: true, opacity: 0.15, depthWrite: false });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    let lastT = "", lastV = "";
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
        grassLeft.visible = false;
        grassRight.visible = false;
        sky.visible = false;
        return;
      }
      plane.visible = true;
      particles.visible = true;
      grassLeft.visible = true;
      grassRight.visible = true;
      sky.visible = true;
      plane.material = mode === "solid" ? matSolid : matWire;
    };
    try {
      const sv = localStorage.getItem("ko-settings-viewmode");
      if (sv) window.applySceneViewMode(sv);
    } catch {}

    let animId;
    function animate() {
      animId = requestAnimationFrame(animate);
      const isLight = (document.documentElement.getAttribute("data-theme") || "dark") === "light";
      const isNone = (document.documentElement.getAttribute("data-viewmode") || "wireframe") === "none";
      const isSolid = (document.documentElement.getAttribute("data-viewmode") || "wireframe") === "solid";

      if (isNone) {
        plane.visible = false;
        particles.visible = false;
        grassLeft.visible = false;
        grassRight.visible = false;
        sky.visible = false;
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
        paintSkyGradient(sky, isLight ? COL.skyHorizon : COL.skyNightHorizon, isLight ? COL.skyZenith : COL.skyNightZenith);
        const hex = isLight ? 0xeaf0f6 : 0x060b14;
        renderer.setClearColor(hex);
        scene.fog.color.setHex(hex);
        plane.material = isSolid ? matSolid : matWire;
      }

      plane.visible = true;
      sky.visible = true;
      grassLeft.visible = true;
      grassRight.visible = true;
      matWire.opacity = isLight ? 0.12 : 0.06;
      matSolid.opacity = isLight ? 0.6 : 0.55;
      matWire.color.setHex(isLight ? 0x2d8a4e : COL.fieldDark);
      matSolid.color.setHex(isLight ? 0x3a9a5e : COL.fieldLight);
      scene.fog.density = isLight ? 0.006 : 0.015;
      pMat.opacity = isSolid ? 0 : (isLight ? 0.3 : 0.15);
      particles.visible = !isSolid;

      const skyOp = isLight ? 0.92 : 0.96;
      sky.material.opacity = skyOp;
      sky.material.transparent = true;

      const grassOp = isLight ? 0.95 : 1;
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
