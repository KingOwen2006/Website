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
  { id: 'cube-1', type: 'cube', top: 8, left: 10 },
  { id: 'cylinder-1', type: 'cylinder', top: 6, left: 28 },
  { id: 'cone-1', type: 'cone', top: 10, left: 46 },
  { id: 'cube-2', type: 'cube', top: 7, left: 64, slow: true },
  { id: 'cylinder-2', type: 'cylinder', top: 9, left: 82, slow: true },
  { id: 'cone-2', type: 'cone', top: 12, left: 94 },
  { id: 'cube-3', type: 'cube', top: 24, left: 6 },
  { id: 'cylinder-3', type: 'cylinder', top: 28, left: 22 },
  { id: 'cone-3', type: 'cone', top: 22, left: 38 },
  { id: 'cube-4', type: 'cube', top: 26, left: 54, slow: true },
  { id: 'cylinder-4', type: 'cylinder', top: 24, left: 70 },
  { id: 'cone-4', type: 'cone', top: 30, left: 86, slow: true },
  { id: 'cube-5', type: 'cube', top: 42, left: 14 },
  { id: 'cylinder-5', type: 'cylinder', top: 46, left: 32, slow: true },
  { id: 'cone-5', type: 'cone', top: 44, left: 50 },
  { id: 'cube-6', type: 'cube', top: 48, left: 68 },
  { id: 'cylinder-6', type: 'cylinder', top: 42, left: 84 },
  { id: 'cube-7', type: 'cube', top: 58, left: 8, slow: true },
  { id: 'cone-6', type: 'cone', top: 62, left: 26 },
  { id: 'cylinder-7', type: 'cylinder', top: 56, left: 44, slow: true },
  { id: 'cube-8', type: 'cube', top: 60, left: 62 },
  { id: 'cone-7', type: 'cone', top: 64, left: 80, slow: true },
  { id: 'cylinder-8', type: 'cylinder', top: 74, left: 16 },
  { id: 'cube-9', type: 'cube', top: 78, left: 36, slow: true },
  { id: 'cone-8', type: 'cone', top: 72, left: 56 },
  { id: 'cylinder-9', type: 'cylinder', top: 76, left: 76 },
  { id: 'cube-10', type: 'cube', top: 88, left: 24 },
  { id: 'cone-9', type: 'cone', top: 84, left: 48, slow: true },
  { id: 'cylinder-10', type: 'cylinder', top: 90, left: 72, slow: true },
]

type ShapeRuntime = {
  mesh: THREE.LineSegments
  baseX: number
  baseY: number
  baseZ: number
  floatLift: number
  rotX: number
  rotY: number
  rotZ: number
}

function randomWireColor() {
  const hue = Math.floor(Math.random() * 360)
  const saturation = (58 + Math.floor(Math.random() * 32)) / 100
  const lightness = (38 + Math.floor(Math.random() * 22)) / 100
  return new THREE.Color().setHSL(hue / 360, saturation, lightness)
}

function randomSize() {
  return 20 + Math.random() * 56
}

function createWireframeMesh(type: ShapeType, color: THREE.Color, size: number) {
  let geometry: THREE.BufferGeometry

  switch (type) {
    case 'cube':
      geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size))
      break
    case 'cone':
      geometry = new THREE.EdgesGeometry(new THREE.ConeGeometry(size * 0.48, size, 12))
      break
    case 'cylinder':
      geometry = new THREE.EdgesGeometry(new THREE.CylinderGeometry(size * 0.46, size * 0.46, size, 12))
      break
  }

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 1,
  })
  return new THREE.LineSegments(geometry, material)
}

function layoutShapes(
  shapes: ShapeRuntime[],
  width: number,
  height: number,
  configs: ShapeConfig[],
) {
  shapes.forEach((shape, index) => {
    const config = configs[index]
    shape.baseX = (config.left / 100) * width - width / 2
    shape.baseY = height / 2 - (config.top / 100) * height
  })
}

function applyScrollFloatToShapes(
  shapes: ShapeRuntime[],
  height: number,
  scrollProgress: number,
) {
  const floatUp = scrollProgress * height * 1.22

  shapes.forEach(({ mesh, baseX, baseY, baseZ, floatLift }) => {
    mesh.position.set(baseX, baseY + floatUp * floatLift, baseZ)
  })
}

type HeroShapesProps = {
  hidden?: boolean
  eraseProgress?: number
}

export default function HeroShapes({ hidden = false, eraseProgress = 0 }: HeroShapesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const eraseRef = useRef(eraseProgress)
  const hiddenRef = useRef(hidden)

  eraseRef.current = eraseProgress
  hiddenRef.current = hidden

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scene = new THREE.Scene()
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.className = 'hero-shapes-canvas'
    container.appendChild(renderer.domElement)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 4000)
    camera.position.z = 900

    const disposables: Array<{ dispose: () => void }> = []
    const shapeRuntimes: ShapeRuntime[] = SHAPES.map((config, index) => {
      const size = randomSize()
      const mesh = createWireframeMesh(config.type, randomWireColor(), size)
      const speedScale = config.slow ? 0.5 : 1
      const runtime: ShapeRuntime = {
        mesh,
        baseX: 0,
        baseY: 0,
        baseZ: (Math.random() - 0.5) * 40,
        floatLift: 0.72 + (index % 6) * 0.05,
        rotX: (0.001 + Math.random() * 0.0012) * speedScale,
        rotY: (0.0012 + Math.random() * 0.0018) * speedScale,
        rotZ: (0.0007 + Math.random() * 0.0009) * speedScale,
      }

      mesh.rotation.x = (Math.random() - 0.5) * Math.PI
      mesh.rotation.y = (Math.random() - 0.5) * Math.PI
      mesh.rotation.z = (Math.random() - 0.5) * 0.6

      scene.add(mesh)
      disposables.push(mesh.geometry, mesh.material)
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

    const render = () => {
      if (hiddenRef.current) return

      const height = container.clientHeight

      if (!reducedMotion) {
        shapeRuntimes.forEach(({ mesh, rotX, rotY, rotZ }) => {
          mesh.rotation.x += rotX
          mesh.rotation.y += rotY
          mesh.rotation.z += rotZ
        })
      }

      applyScrollFloatToShapes(shapeRuntimes, height, eraseRef.current)
      renderer.render(scene, camera)
    }

    const tick = () => {
      render()
      raf = window.requestAnimationFrame(tick)
    }

    if (reducedMotion) {
      render()
    } else {
      tick()
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

  return (
    <section
      ref={containerRef}
      className={`hero-shapes${hidden ? ' hero-shapes--hidden' : ''}`}
      aria-hidden="true"
    />
  )
}
