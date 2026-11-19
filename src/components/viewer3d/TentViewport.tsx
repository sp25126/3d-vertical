import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { TENT_MODELS, ZONES_METADATA, FRAME_TYPES } from '../../constants/tentData'
import { textureSyncService } from '../../services/textureSyncService'
import { ZoneId } from '../../types/configurator'
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Compass,
  Loader2,
  Eye,
  Camera
} from 'lucide-react'

type TentSide = 'front' | 'right' | 'back' | 'left'

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
  const [activeSide, setActiveSide] = useState<TentSide>('front')

  const {
    config,
    activeZoneId,
    setActiveZoneId,
    isAutoRotating,
    toggleAutoRotate
  } = useConfiguratorStore()

  // Spherical camera choreography refs
  const currentThetaRef = useRef<number>(0)
  const targetThetaRef = useRef<number>(0)
  const currentPhiRef = useRef<number>(Math.PI / 2.3)
  const targetPhiRef = useRef<number>(Math.PI / 2.3)
  const currentRadiusRef = useRef<number>(3.6)
  const targetRadiusRef = useRef<number>(3.6)
  const isTransitioningRef = useRef<boolean>(false)

  // 1. Initialize Three.js scene (Clean Shopify Studio)
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene with clean, light studio aesthetic (Shopify Dawn standard)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#F8FAFC') // Clean Slate 50
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50)
    camera.position.set(0, 1.8, 3.6)
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
    renderer.toneMappingExposure = 1.05
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
    controls.maxPolarAngle = Math.PI / 2 + 0.03
    controls.target.set(0, 1.25, 0)
    controlsRef.current = controls

    // On user drag, update current spherical angles so animations don't snap
    controls.addEventListener('start', () => {
      isTransitioningRef.current = false
    })

    // Lighting (Luminous E-Commerce Studio)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1)
    scene.add(ambientLight)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.8)
    hemiLight.position.set(0, 10, 0)
    scene.add(hemiLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4)
    keyLight.position.set(4, 9, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 25
    keyLight.shadow.bias = -0.0001
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.7)
    fillLight.position.set(-5, 4, -4)
    scene.add(fillLight)

    const backRimLight = new THREE.DirectionalLight(0xffedd5, 0.5)
    backRimLight.position.set(0, 6, -5)
    scene.add(backRimLight)

    // Soft Studio Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(12, 12)
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.18 })
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
    shadowMesh.rotation.x = -Math.PI / 2
    shadowMesh.position.y = -0.005
    shadowMesh.receiveShadow = true
    scene.add(shadowMesh)

    // Clean Studio Floor Rings
    const ringGeo = new THREE.RingGeometry(1.6, 1.615, 64)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.rotation.x = -Math.PI / 2
    ringMesh.position.y = 0.001
    scene.add(ringMesh)

    // Model Group
    const modelGroup = new THREE.Group()
    scene.add(modelGroup)
    modelGroupRef.current = modelGroup

    // Animation Loop
    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Smooth shortest-path spherical camera interpolation
      if (isTransitioningRef.current && cameraRef.current && controlsRef.current) {
        // Calculate shortest angular path for theta
        let diff = targetThetaRef.current - currentThetaRef.current
        while (diff < -Math.PI) diff += Math.PI * 2
        while (diff > Math.PI) diff -= Math.PI * 2

        currentThetaRef.current += diff * 0.08
        currentPhiRef.current += (targetPhiRef.current - currentPhiRef.current) * 0.08
        currentRadiusRef.current += (targetRadiusRef.current - currentRadiusRef.current) * 0.08

        const radius = currentRadiusRef.current
        const phi = currentPhiRef.current
        const theta = currentThetaRef.current

        const target = controlsRef.current.target
        cameraRef.current.position.set(
          target.x + radius * Math.sin(phi) * Math.sin(theta),
          target.y + radius * Math.cos(phi),
          target.z + radius * Math.sin(phi) * Math.cos(theta)
        )
        cameraRef.current.lookAt(target)

        if (Math.abs(diff) < 0.005 && Math.abs(targetPhiRef.current - currentPhiRef.current) < 0.005) {
          isTransitioningRef.current = false
        }
      } else if (controlsRef.current && cameraRef.current) {
        controlsRef.current.update()
        // Sync internal spherical coordinates with current manual orbit position
        const target = controlsRef.current.target
        const offset = new THREE.Vector3().subVectors(cameraRef.current.position, target)
        currentRadiusRef.current = offset.length()
        currentPhiRef.current = Math.acos(Math.max(-1, Math.min(1, offset.y / currentRadiusRef.current)))
        currentThetaRef.current = Math.atan2(offset.x, offset.z)
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    animate()

    // Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // Snapshot Ref
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
                  roughness: 0.65,
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
                  color: isAluminum ? 0xd1d5db : 0xffffff,
                  metalness: isAluminum ? 0.9 : 0.3,
                  roughness: isAluminum ? 0.25 : 0.4
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

  // 3. Update Hardware Material
  useEffect(() => {
    if (metalMaterialRef.current) {
      const isAluminum = config.frameType === 'heavy_duty_aluminum'
      metalMaterialRef.current.color.set(isAluminum ? 0xd1d5db : 0xffffff)
      metalMaterialRef.current.metalness = isAluminum ? 0.9 : 0.3
      metalMaterialRef.current.roughness = isAluminum ? 0.25 : 0.4
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

  // 5. Rotate Smoothly to Side Function (Directional camera animation)
  const rotateToSide = useCallback((side: TentSide) => {
    setActiveSide(side)

    // Stop auto-rotate so model doesn't keep spinning to the right
    if (isAutoRotating) {
      toggleAutoRotate()
    }

    let targetAzimuth = 0
    switch (side) {
      case 'front':
        targetAzimuth = 0
        break
      case 'right':
        targetAzimuth = Math.PI / 2
        break
      case 'back':
        targetAzimuth = Math.PI
        break
      case 'left':
        targetAzimuth = -Math.PI / 2
        break
    }

    targetThetaRef.current = targetAzimuth
    targetPhiRef.current = Math.PI / 2.3
    targetRadiusRef.current = 3.6
    isTransitioningRef.current = true

    // Also synchronize active peak in the store
    const correspondingZoneId = `peak_${side}` as ZoneId
    if (activeZoneId !== correspondingZoneId && !activeZoneId.startsWith('valance_')) {
      setActiveZoneId(correspondingZoneId)
    }
  }, [isAutoRotating, toggleAutoRotate, activeZoneId, setActiveZoneId])

  // When activeZoneId changes from the UI controls, rotate to its side
  useEffect(() => {
    const meta = ZONES_METADATA[activeZoneId]
    if (meta && meta.side) {
      if (meta.side !== activeSide) {
        rotateToSide(meta.side)
      }
    }
  }, [activeZoneId])

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
      className="relative w-full h-full min-h-[460px] bg-gradient-to-b from-slate-50 to-slate-100 overflow-hidden select-none"
    >
      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-md mb-3">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
            Loading 3D Product Model
          </p>
          <span className="text-[11px] text-slate-500 mt-1">{modelMeta.name}</span>
        </div>
      )}

      {/* Top Floating Badge: Active Model & Footprint */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">
            {modelMeta.dimensions}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">| 360° Studio</span>
        </div>
      </div>

      {/* Floating Side Selector Pills (Direct model rotation controls) */}
      <div className="absolute top-4 right-4 z-10 flex items-center bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-sm">
        {(['front', 'right', 'back', 'left'] as TentSide[]).map((side) => {
          const isSelected = activeSide === side
          return (
            <button
              key={side}
              onClick={() => rotateToSide(side)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {side}
            </button>
          )
        })}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center space-x-2">
        <button
          onClick={toggleAutoRotate}
          title={isAutoRotating ? 'Stop Rotation' : 'Spin 360°'}
          className={`flex items-center space-x-1 px-3 py-2 rounded-xl border backdrop-blur-md transition-all shadow-sm text-xs font-bold ${
            isAutoRotating
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
              : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white'
          }`}
        >
          <Compass className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isAutoRotating ? 'Spinning' : '360° Spin'}</span>
        </button>

        <button
          onClick={() => rotateToSide('front')}
          title="Reset to Front View"
          className="p-2.5 rounded-xl bg-white/90 text-slate-700 border border-slate-200 backdrop-blur-md hover:bg-white hover:text-slate-900 transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="p-2.5 rounded-xl bg-white/90 text-slate-700 border border-slate-200 backdrop-blur-md hover:bg-white hover:text-slate-900 transition-all shadow-sm"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bottom Left: Orbit Interaction Legend */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden sm:block">
        <span className="text-[11px] text-slate-500 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200/80 backdrop-blur-sm">
          Drag to Orbit • Scroll to Zoom
        </span>
      </div>
    </div>
  )
}
