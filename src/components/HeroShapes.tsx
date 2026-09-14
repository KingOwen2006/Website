import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import '../styles/hero-shapes.css'

type ShapeType = 'cube' | 'cone' | 'cylinder'

type ShapeConfig = {
  id: string
  type: ShapeType
  top: number
  left: number
  slow?: boolean
}

const SHAPES: ShapeConfig[] = [
  { id: 'cube-1', type: 'cube', top: 12, left: 9 },
  { id: 'cylinder-1', type: 'cylinder', top: 8, left: 31, slow: true },
  { id: 'cone-1', type: 'cone', top: 14, left: 76 },
  { id: 'cube-2', type: 'cube', top: 21, left: 93, slow: true },
  { id: 'cylinder-2', type: 'cylinder', top: 40, left: 7 },
  { id: 'cone-2', type: 'cone', top: 43, left: 88, slow: true },
  { id: 'cube-3', type: 'cube', top: 67, left: 14, slow: true },
  { id: 'cylinder-3', type: 'cylinder', top: 70, left: 82 },
  { id: 'cone-3', type: 'cone', top: 87, left: 28 },
  { id: 'cube-4', type: 'cube', top: 84, left: 68, slow: true },
  { id: 'cylinder-4', type: 'cylinder', top: 58, left: 96, slow: true },
  { id: 'cone-4', type: 'cone', top: 91, left: 92 },
]

const GREY_PALETTE = [0xa4a9b2, 0xc8c9cc, 0xd5d7dc, 0xe2e4e8, 0xb8bcc4]

type SketchLayer = {
  geometry: THREE.BufferGeometry
  original: Float32Array
}

type ShapeRuntime = {
  group: THREE.Group
  layers: SketchLayer[]
  baseX: number
  baseY: number
  baseZ: number
  floatAmp: number
  floatSpeed: number
  floatPhase: number
  rotX: number
  rotY: number
  rotZ: number
}

function wireColor(index: number) {
  return new THREE.Color(GREY_PALETTE[index % GREY_PALETTE.length])
}

function shapeSize(index: number) {
  return 28 + ((index * 17) % 46)
}

function createSourceGeometry(type: ShapeType, size: number) {
  switch (type) {
    case 'cube':
      return new THREE.BoxGeometry(size, size, size)
    case 'cone':
      return new THREE.ConeGeometry(size * 0.48, size, 12)
    case 'cylinder':
      return new THREE.CylinderGeometry(size * 0.46, size * 0.46, size, 12)
  }
}

function createSketchShape(type: ShapeType, color: THREE.Color, size: number) {
  const source = createSourceGeometry(type, size)
  const edges = new THREE.EdgesGeometry(source)
  source.dispose()

  const ghost = edges.clone()
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.88,
  })
  const ghostMaterial = new THREE.LineBasicMaterial({
    color: color.clone().offsetHSL(0, 0, 0.08),
    transparent: true,
    opacity: 0.38,
  })

  const line = new THREE.LineSegments(edges, material)
  const ghostLine = new THREE.LineSegments(ghost, ghostMaterial)
  ghostLine.position.set(1.4, 1.1, 0.6)

  const group = new THREE.Group()
  group.add(line, ghostLine)

  const layers: SketchLayer[] = [
    { geometry: edges, original: Float32Array.from(edges.attributes.position.array as Float32Array) },
    { geometry: ghost, original: Float32Array.from(ghost.attributes.position.array as Float32Array) },
  ]

  return { group, layers, materials: [material, ghostMaterial] }
}

function layoutShapes(shapes: ShapeRuntime[], width: number, height: number, configs: ShapeConfig[]) {
  shapes.forEach((shape, index) => {
    const config = configs[index]
    shape.baseX = (config.left / 100) * width - width / 2
    shape.baseY = height / 2 - (config.top / 100) * height
  })
}

function jitterLayer(layer: SketchLayer, time: number, amount: number) {
  const positions = layer.geometry.attributes.position
  const arr = positions.array as Float32Array
  const original = layer.original

  for (let i = 0; i < arr.length; i += 3) {
    arr[i] = original[i] + Math.sin(time * 0.0018 + i * 0.17) * amount
    arr[i + 1] = original[i + 1] + Math.cos(time * 0.0015 + i * 0.21) * amount
    arr[i + 2] = original[i + 2] + Math.sin(time * 0.0011 + i * 0.13) * amount * 0.6
  }

  positions.needsUpdate = true
}

export default function HeroShapes() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scene = new THREE.Scene()
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.className = 'hero-shapes-canvas'
    container.appendChild(renderer.domElement)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 4000)
    camera.position.z = 900

    const disposables: Array<{ dispose: () => void }> = []
    const shapeRuntimes: ShapeRuntime[] = SHAPES.map((config, index) => {
      const size = shapeSize(index)
      const { group, layers, materials } = createSketchShape(config.type, wireColor(index), size)
      const speedScale = config.slow ? 0.55 : 1
      const runtime: ShapeRuntime = {
        group,
        layers,
        baseX: 0,
        baseY: 0,
        baseZ: -40 + (index % 4) * 38,
        floatAmp: 10 + (index % 6) * 3.5,
        floatSpeed: 0.00045 + (index % 7) * 0.00012,
        floatPhase: index * 0.73,
        rotX: (0.001 + (index % 3) * 0.00035) * speedScale,
        rotY: (0.0014 + (index % 4) * 0.0003) * speedScale,
        rotZ: (0.0006 + (index % 2) * 0.0004) * speedScale,
      }

      group.rotation.x = ((index % 5) - 2) * 0.32
      group.rotation.y = ((index % 4) - 1.5) * 0.48
      group.rotation.z = ((index % 3) - 1) * 0.18

      scene.add(group)
      disposables.push(...layers.map((layer) => layer.geometry), ...materials)
      return runtime
    })

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      layoutShapes(shapeRuntimes, width, height, SHAPES)
    }

    resize()
    window.addEventListener('resize', resize)

    let raf = 0

    const render = (time: number) => {
      shapeRuntimes.forEach((shape) => {
        const floatY = reducedMotion
          ? 0
          : Math.sin(time * shape.floatSpeed + shape.floatPhase) * shape.floatAmp

        shape.group.position.set(shape.baseX, shape.baseY + floatY, shape.baseZ)

        if (!reducedMotion) {
          shape.group.rotation.x += shape.rotX
          shape.group.rotation.y += shape.rotY
          shape.group.rotation.z += shape.rotZ
          shape.layers.forEach((layer, layerIndex) => {
            jitterLayer(layer, time + layerIndex * 180, 0.55)
          })
        }
      })

      renderer.render(scene, camera)
    }

    const tick = (time: number) => {
      render(time)
      raf = window.requestAnimationFrame(tick)
    }

    if (reducedMotion) {
      render(0)
    } else {
      raf = window.requestAnimationFrame(tick)
    }

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      disposables.forEach((item) => item.dispose())
      renderer.dispose()
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="hero-shapes" aria-hidden="true" />
}
