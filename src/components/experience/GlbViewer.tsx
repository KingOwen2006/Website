import { useEffect, useRef } from 'react'
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type GlbViewerProps = {
  src: string
}

export default function GlbViewer({ src }: GlbViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new Scene()
    scene.background = new Color(0x111111)

    const camera = new PerspectiveCamera(45, 1, 0.1, 1000)
    camera.position.set(2, 1.5, 3)

    const renderer = new WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    scene.add(new AmbientLight(0xffffff, 0.65))
    const keyLight = new DirectionalLight(0xffffff, 1.1)
    keyLight.position.set(4, 6, 5)
    scene.add(keyLight)

    let frameId = 0
    const resize = () => {
      const { clientWidth, clientHeight } = container
      if (!clientWidth || !clientHeight) return
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight, false)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const loader = new GLTFLoader()
    loader.load(
      src,
      (gltf) => {
        scene.add(gltf.scene)
        const bounds = new Box3().setFromObject(gltf.scene)
        const center = bounds.getCenter(new Vector3())
        const size = bounds.getSize(new Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const distance = maxDim * 1.8

        gltf.scene.position.sub(center)
        camera.position.set(distance, distance * 0.65, distance)
        controls.target.set(0, 0, 0)
        controls.update()
      },
      undefined,
      () => {
        container.dataset.viewerError = 'true'
      },
    )

    const animate = () => {
      frameId = window.requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      window.cancelAnimationFrame(frameId)
      observer.disconnect()
      controls.dispose()
      renderer.dispose()
      container.replaceChildren()
    }
  }, [src])

  return <div ref={containerRef} className="glb-viewer" aria-label="Interactive 3D model" />
}
