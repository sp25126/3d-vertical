import React, { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { TENT_MODELS, ZONES_METADATA, FRAME_TYPES } from '../../constants/tentData'
import { textureSyncService } from '../../services/textureSyncService'
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Compass,
  Loader2,
  Ruler,
  Layers,
  Sparkles,
  Camera
} from 'lucide-react'

type CameraPreset = 'orbit' | 'front' | 'iso' | 'top' | 'eye'

interface TentViewportProps {
  onCaptureSnapshotRef?: (captureFn: () => string) => void
}

export const TentViewport: React.FC<TentViewportProps> = ({ onCaptureSnapshotRef }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const modelGroupRef = useRef<THREE.Group | null>(null)
  const dimensionsGroupRef = useRef<THREE.Group | null>(null)
  const fabricMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const metalMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null)

  const [isLoadingModel, setIsLoadingModel] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showDimensions, setShowDimensions] = useState(false)
  const [activePreset, setActivePreset] = useState<CameraPreset>('orbit')

  const {
    config,
    activeZoneId,
    isAutoRotating,
    toggleAutoRotate
  } = useConfiguratorStore()

  // Target camera position for smooth transition
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.8, 3.8))
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.3, 0))

  // 1. Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#07090E') // Studio 950 deep charcoal
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50)
    camera.position.set(0, 1.8, 3.8)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 1.6
    controls.maxDistance = 8.5
    controls.maxPolarAngle = Math.PI / 2 + 0.04
    controls.target.set(0, 1.3, 0)
    controlsRef.current = controls

    // Multi-tier Studio Lighting (Scrollcraft / Impeccable standard)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
    scene.add(ambientLight)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x181f30, 0.6)
    hemiLight.position.set(0, 12, 0)
    scene.add(hemiLight)

    // Key Light with soft shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6)
    keyLight.position.set(4.5, 9, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 25
    keyLight.shadow.camera.left = -4
    keyLight.shadow.camera.right = 4
    keyLight.shadow.camera.top = 4
    keyLight.shadow.camera.bottom = -4
    keyLight.shadow.bias = -0.0001
    scene.add(keyLight)

    // Soft Cyan Fill Light
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.75)
    fillLight.position.set(-5, 4.5, -4)
    scene.add(fillLight)

    // Warm Amber Rim Light for edge separation
    const rimLight = new THREE.DirectionalLight(0xfef3c7, 0.85)
    rimLight.position.set(0, 7, -6)
    scene.add(rimLight)

    // Ground Studio Shadow Floor
    const shadowGeo = new THREE.PlaneGeometry(14, 14)
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.45 })
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
    shadowMesh.rotation.x = -Math.PI / 2
    shadowMesh.position.y = -0.01
    shadowMesh.receiveShadow = true
    scene.add(shadowMesh)

    // Concentric Studio Floor Rings
    const ringGeo = new THREE.RingGeometry(1.6, 1.62, 64)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x25304b, side: THREE.DoubleSide })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.rotation.x = -Math.PI / 2
    ringMesh.position.y = 0.001
    scene.add(ringMesh)

    const ringOuterGeo = new THREE.RingGeometry(2.8, 2.815, 64)
    const ringOuterMesh = new THREE.Mesh(ringOuterGeo, ringMat)
    ringOuterMesh.rotation.x = -Math.PI / 2
    ringOuterMesh.position.y = 0.001
    scene.add(ringOuterMesh)

    // Subtle Grid Helper
    const grid = new THREE.GridHelper(12, 24, 0x25304b, 0x121724)
    grid.position.y = 0
    scene.add(grid)

    // Groups
    const modelGroup = new THREE.Group()
    scene.add(modelGroup)
    modelGroupRef.current = modelGroup

    const dimensionsGroup = new THREE.Group()
    scene.add(dimensionsGroup)
    dimensionsGroupRef.current = dimensionsGroup

    // Animation Loop
    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Smooth camera interpolation
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCameraPosRef.current, 0.06)
        controlsRef.current.target.lerp(targetLookAtRef.current, 0.06)
        controlsRef.current.update()
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    animate()

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // Expose snapshot capture
    if (onCaptureSnapshotRef) {
      onCaptureSnapshotRef(() => {
        if (!rendererRef.current) return ''
        return rendererRef.current.domElement.toDataURL('image/png', 0.95)
      })
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  // 2. Load 3D Model
  useEffect(() => {
    if (!sceneRef.current || !modelGroupRef.current) return

    const modelGroup = modelGroupRef.current
    setIsLoadingModel(true)

    while (modelGroup.children.length > 0) {
      modelGroup.remove(modelGroup.children[0])
    }

    const modelMeta = TENT_MODELS[config.modelId]
    const loader = new GLTFLoader()

    loader.load(
      modelMeta.glbPath,
      (gltf) => {
        const root = gltf.scene
        root.scale.set(modelMeta.scale[0], modelMeta.scale[1], modelMeta.scale[2])

        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true

            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

            materials.forEach((mat, idx) => {
              if (mat.name === 'fabric_Mat' || mesh.name === 'Mesh.003' || mesh.name === 'Mesh') {
                const canvasTex = textureSyncService.getTexture()

                const newFabricMat = new THREE.MeshStandardMaterial({
                  map: canvasTex,
                  roughness: 0.68,
                  metalness: 0.04,
                  bumpScale: 0.02,
                  side: THREE.DoubleSide
                })

                if (Array.isArray(mesh.material)) {
                  mesh.material[idx] = newFabricMat
                } else {
                  mesh.material = newFabricMat
                }
                fabricMaterialRef.current = newFabricMat
              } else if (mat.name === 'Metal_mat') {
                const isAluminum = config.frameType === 'heavy_duty_aluminum'
                const metalMat = new THREE.MeshStandardMaterial({
                  color: isAluminum ? 0xd1d5db : 0xf8fafc,
                  metalness: isAluminum ? 0.92 : 0.45,
                  roughness: isAluminum ? 0.22 : 0.32
                })

                if (Array.isArray(mesh.material)) {
                  mesh.material[idx] = metalMat
                } else {
                  mesh.material = metalMat
                }
                metalMaterialRef.current = metalMat
              }
            })
          }
        })

        modelGroup.add(root)
        setIsLoadingModel(false)
      },
      undefined,
      (error) => {
        console.error('Failed to load tent glb model', error)
        setIsLoadingModel(false)
      }
    )
  }, [config.modelId])

  // 3. Update Hardware Frame Material
  useEffect(() => {
    if (metalMaterialRef.current) {
      const isAluminum = config.frameType === 'heavy_duty_aluminum'
      metalMaterialRef.current.color.set(isAluminum ? 0xd1d5db : 0xf8fafc)
      metalMaterialRef.current.metalness = isAluminum ? 0.92 : 0.45
      metalMaterialRef.current.roughness = isAluminum ? 0.22 : 0.32
      metalMaterialRef.current.needsUpdate = true
    }
  }, [config.frameType])

  // 4. Update Auto-Rotation
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating
      controlsRef.current.autoRotateSpeed = 2.0
    }
  }, [isAutoRotating])

  // 5. Zone Focus Animation
  useEffect(() => {
    const meta = ZONES_METADATA[activeZoneId]
    if (!meta) return

    const { azimuth, polar, distance } = meta.cameraAngle
    const targetY = 1.3
    const x = distance * Math.sin(azimuth) * Math.sin(polar)
    const y = targetY + distance * Math.cos(polar)
    const z = distance * Math.cos(azimuth) * Math.sin(polar)

    targetCameraPosRef.current.set(x, y, z)
    targetLookAtRef.current.set(0, targetY, 0)
    setActivePreset('orbit')
  }, [activeZoneId])

  // Camera Presets handler
  const setCameraPreset = (preset: CameraPreset) => {
    setActivePreset(preset)
    const targetY = 1.3

    switch (preset) {
      case 'front':
        targetCameraPosRef.current.set(0, targetY + 0.1, 3.4)
        targetLookAtRef.current.set(0, targetY, 0)
        break
      case 'iso':
        targetCameraPosRef.current.set(2.8, 2.2, 2.8)
        targetLookAtRef.current.set(0, targetY, 0)
        break
      case 'top':
        targetCameraPosRef.current.set(0.01, 4.5, 0)
        targetLookAtRef.current.set(0, 0, 0)
        break
      case 'eye':
        // Eye level looking up at canopy
        targetCameraPosRef.current.set(0, 0.7, 2.2)
        targetLookAtRef.current.set(0, 1.8, 0)
        break
      case 'orbit':
      default:
        targetCameraPosRef.current.set(0, 1.8, 3.8)
        targetLookAtRef.current.set(0, targetY, 0)
        break
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err))
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch((err) => console.error(err))
      setIsFullscreen(false)
    }
  }

  const modelMeta = TENT_MODELS[config.modelId]

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[440px] bg-gradient-to-b from-studio-950 via-studio-900 to-studio-950 overflow-hidden select-none"
    >
      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-studio-950/85 backdrop-blur-md">
          <div className="w-12 h-12 rounded-2xl bg-studio-850 border border-studio-700/80 flex items-center justify-center shadow-glow-gold mb-3">
            <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
          </div>
          <p className="text-xs uppercase tracking-widest font-bold text-white">Loading 3D Studio Model</p>
          <span className="text-[11px] text-studio-500 mt-1">{modelMeta.name}</span>
        </div>
      )}

      {/* Top Left: Active Zone & Live Telemetry Pill */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-1.5">
        <div className="px-3 py-1.5 rounded-xl bg-studio-900/90 backdrop-blur-md border border-white/10 shadow-studio-card flex items-center space-x-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-100 font-display">
            {ZONES_METADATA[activeZoneId]?.label || '3D Viewport'}
          </span>
        </div>

        {/* Footprint badge */}
        <div className="px-2.5 py-1 rounded-lg bg-studio-850/80 backdrop-blur border border-white/5 w-fit">
          <span className="text-[10px] font-mono text-studio-500">
            {modelMeta.dimensions} • 600D Poly
          </span>
        </div>
      </div>

      {/* Top Right: Camera Presets Selector (Scrollcraft / Architectural Studio) */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center bg-studio-900/90 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-studio-card">
        <button
          onClick={() => setCameraPreset('orbit')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            activePreset === 'orbit' ? 'bg-gold-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Orbit
        </button>
        <button
          onClick={() => setCameraPreset('front')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            activePreset === 'front' ? 'bg-gold-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Elevation
        </button>
        <button
          onClick={() => setCameraPreset('iso')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            activePreset === 'iso' ? 'bg-gold-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Isometric
        </button>
        <button
          onClick={() => setCameraPreset('eye')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            activePreset === 'eye' ? 'bg-gold-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Eye-Level
        </button>
        <button
          onClick={() => setCameraPreset('top')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            activePreset === 'top' ? 'bg-gold-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Top Plan
        </button>
      </div>

      {/* Floating Viewport Actions Bottom Right */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center space-x-2">
        <button
          onClick={toggleAutoRotate}
          title="Toggle 360° Studio Turntable"
          className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-studio-card ${
            isAutoRotating
              ? 'bg-gold-500 text-slate-950 border-gold-400 shadow-glow-gold font-bold'
              : 'bg-studio-850/80 text-slate-300 border-white/10 hover:bg-studio-800 hover:text-white'
          }`}
        >
          <Compass className={`w-4 h-4 ${isAutoRotating ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={() => setCameraPreset('orbit')}
          title="Reset Camera View"
          className="p-2.5 rounded-xl bg-studio-850/80 text-slate-300 border border-white/10 backdrop-blur-md hover:bg-studio-800 hover:text-white transition-all shadow-studio-card"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="p-2.5 rounded-xl bg-studio-850/80 text-slate-300 border border-white/10 backdrop-blur-md hover:bg-studio-800 hover:text-white transition-all shadow-studio-card"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Subtle Studio Lighting Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-studio-950/60" />

      {/* Bottom Left Interaction Legend */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden sm:block">
        <span className="text-[10px] tracking-wide font-mono text-studio-500 bg-studio-900/80 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
          L-Click: Orbit • Scroll: Zoom • R-Click: Pan
        </span>
      </div>
    </div>
  )
}
