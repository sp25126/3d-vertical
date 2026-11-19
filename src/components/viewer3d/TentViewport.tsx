import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { TENT_MODELS, ZONES_METADATA, FRAME_TYPES } from '../../constants/tentData'
import { textureSyncService } from '../../services/textureSyncService'
import { RotateCcw, Maximize2, Minimize2, Eye, Compass, Loader2 } from 'lucide-react'

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
  const fabricMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const metalMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null)

  const [isLoadingModel, setIsLoadingModel] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const {
    config,
    activeZoneId,
    isAutoRotating,
    toggleAutoRotate,
    setActiveZoneId
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
    scene.background = new THREE.Color('#0f172a') // Slate 900
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50)
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
    renderer.toneMappingExposure = 1.15
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 1.8
    controls.maxDistance = 8.0
    controls.maxPolarAngle = Math.PI / 2 + 0.05 // Don't go below ground
    controls.target.set(0, 1.3, 0)
    controlsRef.current = controls

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambientLight)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.6)
    hemiLight.position.set(0, 10, 0)
    scene.add(hemiLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5)
    keyLight.position.set(4, 8, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.bias = -0.0001
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.8)
    fillLight.position.set(-5, 4, -4)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xffedd5, 0.6)
    rimLight.position.set(0, 6, -6)
    scene.add(rimLight)

    // Circular Studio Ground Shadow
    const shadowGeo = new THREE.PlaneGeometry(12, 12)
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 })
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
    shadowMesh.rotation.x = -Math.PI / 2
    shadowMesh.position.y = -0.01
    shadowMesh.receiveShadow = true
    scene.add(shadowMesh)

    // Subtle grid pattern
    const grid = new THREE.GridHelper(10, 20, 0x334155, 0x1e293b)
    grid.position.y = 0
    scene.add(grid)

    // Model root group
    const modelGroup = new THREE.Group()
    scene.add(modelGroup)
    modelGroupRef.current = modelGroup

    // Animation Loop
    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Smooth camera position interpolation
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCameraPosRef.current, 0.05)
        controlsRef.current.target.lerp(targetLookAtRef.current, 0.05)
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

    // Expose snapshot capture function
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

  // 2. Load 3D Model when modelId changes
  useEffect(() => {
    if (!sceneRef.current || !modelGroupRef.current) return

    const modelGroup = modelGroupRef.current
    setIsLoadingModel(true)

    // Clear previous model children
    while (modelGroup.children.length > 0) {
      modelGroup.remove(modelGroup.children[0])
    }

    const modelMeta = TENT_MODELS[config.modelId]
    const loader = new GLTFLoader()

    loader.load(
      modelMeta.glbPath,
      (gltf) => {
        const root = gltf.scene

        // Apply scaling
        root.scale.set(modelMeta.scale[0], modelMeta.scale[1], modelMeta.scale[2])

        // Traverse meshes to configure materials & shadows
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true

            // If multi-material or single
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

            materials.forEach((mat, idx) => {
              if (mat.name === 'fabric_Mat' || mesh.name === 'Mesh.003' || mesh.name === 'Mesh') {
                // Configure high-res canvas texture
                const canvasTex = textureSyncService.getTexture()

                const newFabricMat = new THREE.MeshStandardMaterial({
                  map: canvasTex,
                  roughness: 0.7,
                  metalness: 0.05,
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
                // Configure hardware frame material
                const isAluminum = config.frameType === 'heavy_duty_aluminum'
                const metalMat = new THREE.MeshStandardMaterial({
                  color: isAluminum ? 0xd1d5db : 0xf1f5f9,
                  metalness: isAluminum ? 0.9 : 0.4,
                  roughness: isAluminum ? 0.25 : 0.35
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

  // 3. Update Hardware Material when frameType changes
  useEffect(() => {
    if (metalMaterialRef.current) {
      const isAluminum = config.frameType === 'heavy_duty_aluminum'
      metalMaterialRef.current.color.set(isAluminum ? 0xd1d5db : 0xf1f5f9)
      metalMaterialRef.current.metalness = isAluminum ? 0.9 : 0.4
      metalMaterialRef.current.roughness = isAluminum ? 0.25 : 0.35
      metalMaterialRef.current.needsUpdate = true
    }
  }, [config.frameType])

  // 4. Update Controls Auto-Rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating
      controlsRef.current.autoRotateSpeed = 2.0
    }
  }, [isAutoRotating])

  // 5. Smoothly animate camera when active zone changes
  useEffect(() => {
    const meta = ZONES_METADATA[activeZoneId]
    if (!meta) return

    const { azimuth, polar, distance } = meta.cameraAngle

    // Calculate spherical camera coordinates
    const targetY = 1.3
    const x = distance * Math.sin(azimuth) * Math.sin(polar)
    const y = targetY + distance * Math.cos(polar)
    const z = distance * Math.cos(azimuth) * Math.sin(polar)

    targetCameraPosRef.current.set(x, y, z)
    targetLookAtRef.current.set(0, targetY, 0)
  }, [activeZoneId])

  const handleResetCamera = () => {
    targetCameraPosRef.current.set(0, 1.8, 3.8)
    targetLookAtRef.current.set(0, 1.3, 0)
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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[420px] bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden"
    >
      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-300">Loading 3D Canopy Tent Model...</p>
          <span className="text-xs text-slate-500 mt-1">{TENT_MODELS[config.modelId].name}</span>
        </div>
      )}

      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <div className="px-3 py-1.5 rounded-full bg-slate-800/90 backdrop-blur border border-slate-700/80 shadow-lg flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">
            {ZONES_METADATA[activeZoneId]?.label || '3D Orbit View'}
          </span>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center space-x-2">
        <button
          onClick={toggleAutoRotate}
          title="Toggle 360° Auto-Rotation"
          className={`p-2.5 rounded-xl border backdrop-blur transition-all shadow-md ${
            isAutoRotating
              ? 'bg-brand-500 text-white border-brand-400'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Compass className={`w-4 h-4 ${isAutoRotating ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={handleResetCamera}
          title="Reset Camera View"
          className="p-2.5 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/80 backdrop-blur hover:bg-slate-700 hover:text-white transition-all shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="p-2.5 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/80 backdrop-blur hover:bg-slate-700 hover:text-white transition-all shadow-md"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Orbit Tip Pill */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <span className="text-[11px] text-slate-400 bg-slate-900/70 px-2.5 py-1 rounded-md border border-slate-800 backdrop-blur">
          Drag to Orbit • Scroll to Zoom • Right-click to Pan
        </span>
      </div>
    </div>
  )
}
