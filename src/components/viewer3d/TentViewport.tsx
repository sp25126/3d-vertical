import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { textureSyncService } from '../../services/textureSyncService'
import { TENT_MODELS, ZONES_METADATA } from '../../constants/tentData'
import { ZoneId } from '../../types/configurator'
import { EnvironmentBuilder, EnvironmentType } from '../../utils/environmentBuilder'
import {
  Loader2,
  Compass,
  RotateCcw,
  Maximize2,
  Minimize2,
  Layers,
  User,
  Building2,
  TreePine,
  Sun,
  X,
  Sliders,
  Check
} from 'lucide-react'

interface TentViewportProps {
  onCaptureSnapshotRef?: (fn: () => string) => void
}

type TentSide = 'front' | 'right' | 'back' | 'left'

interface PartInspectionData {
  name: string
  category: string
  specs: Array<{ label: string; value: string }>
  description: string
}

export const TentViewport: React.FC<TentViewportProps> = ({ onCaptureSnapshotRef }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const modelGroupRef = useRef<THREE.Group | null>(null)
  const accessoriesGroupRef = useRef<THREE.Group | null>(null)
  const mannequinGroupRef = useRef<THREE.Group | null>(null)
  const envBuilderRef = useRef<EnvironmentBuilder | null>(null)

  // Structural nodes for Exploded View
  const fabricGroupRef = useRef<THREE.Object3D | null>(null)
  const legGroupRef = useRef<THREE.Object3D | null>(null)
  const mechanismGroupRef = useRef<THREE.Object3D | null>(null)

  // Accessory meshes
  const sandbagsMeshRef = useRef<THREE.Object3D | null>(null)
  const rollerBagMeshRef = useRef<THREE.Object3D | null>(null)
  const stakesMeshRef = useRef<THREE.Object3D | null>(null)
  const mannequinMeshRef = useRef<THREE.Object3D | null>(null)

  // Materials refs
  const fabricMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const innerFabricMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const metalMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null)

  // Spherical camera navigation
  const currentThetaRef = useRef<number>(0)
  const currentPhiRef = useRef<number>(Math.PI / 2.3)
  const currentRadiusRef = useRef<number>(3.6)
  const targetThetaRef = useRef<number>(0)
  const targetPhiRef = useRef<number>(Math.PI / 2.3)
  const targetRadiusRef = useRef<number>(3.6)
  const isTransitioningRef = useRef<boolean>(false)

  // Component UI State
  const [activeSide, setActiveSide] = useState<TentSide>('front')
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [activeEnv, setActiveEnv] = useState<EnvironmentType>('studio')
  const [showHumanScale, setShowHumanScale] = useState<boolean>(false)
  const [isExploded, setIsExploded] = useState<boolean>(false)
  const [explodedProgress, setExplodedProgress] = useState<number>(0)
  const [inspectedPart, setInspectedPart] = useState<PartInspectionData | null>(null)

  const {
    config,
    activeZoneId,
    setActiveZoneId,
    isAutoRotating,
    toggleAutoRotate
  } = useConfiguratorStore()

  // 1. Initialize Three.js Scene, Camera, Lighting & Controls
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0xf8fafc)

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 1.45, 3.6)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 1.4
    controls.maxDistance = 10.0
    controls.maxPolarAngle = Math.PI / 2 - 0.01 // Prevent dipping beneath ground
    controls.target.set(0, 1.05, 0)
    controlsRef.current = controls

    controls.addEventListener('start', () => {
      isTransitioningRef.current = false
    })

    // Lighting Setup
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
    keyLight.shadow.bias = -0.0001
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.7)
    fillLight.position.set(-5, 4, -4)
    scene.add(fillLight)

    const backRimLight = new THREE.DirectionalLight(0xffedd5, 0.5)
    backRimLight.position.set(0, 6, -5)
    scene.add(backRimLight)

    // Contextual Environment Builder
    const envBuilder = new EnvironmentBuilder()
    envBuilderRef.current = envBuilder
    envBuilder.setEnvironment('studio')
    scene.add(envBuilder.getGroup())

    // Model Groups
    const modelGroup = new THREE.Group()
    scene.add(modelGroup)
    modelGroupRef.current = modelGroup

    const accessoriesGroup = new THREE.Group()
    scene.add(accessoriesGroup)
    accessoriesGroupRef.current = accessoriesGroup

    const mannequinGroup = new THREE.Group()
    scene.add(mannequinGroup)
    mannequinGroupRef.current = mannequinGroup

    // Animation Loop
    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Smooth camera interpolation
      if (isTransitioningRef.current && cameraRef.current && controlsRef.current) {
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

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // Raycasting for interactive 3D click-to-inspect
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const handleClick = (event: MouseEvent) => {
      if (!rendererRef.current || !cameraRef.current || !modelGroupRef.current) return
      const rect = rendererRef.current.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, cameraRef.current)
      const intersects = raycaster.intersectObjects([
        ...modelGroupRef.current.children,
        ...accessoriesGroup.children,
        ...mannequinGroup.children
      ], true)

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh
        const hitName = hit.name.toLowerCase()

        if (hitName.includes('fabric') || hit.parent?.name.toLowerCase().includes('fabric')) {
          setInspectedPart({
            name: '600D Custom Roof Canopy & Valance',
            category: 'Textile Engineering',
            specs: [
              { label: 'Textile Fabric', value: '600D PU Polyester (280 GSM)' },
              { label: 'Printing Tech', value: '4K Edge-to-Edge Dye-Sublimation' },
              { label: 'Fire Rating', value: 'CPAI-84 & NFPA-701 Retardant' },
              { label: 'Water Column', value: '3000mm Hydrostatic Head Sealed' }
            ],
            description: 'Heavy-duty 600 Denier oxford polyester fabric with internal polyurethane weather seal, heat-sealed double seams, and high-frequency corner reinforcement.'
          })
        } else if (hitName.includes('leg') || hit.parent?.name.toLowerCase().includes('leg')) {
          const isAlloy = config.frameType === 'heavy_duty_aluminum'
          setInspectedPart({
            name: isAlloy ? '50mm Hexagonal Aircraft Aluminum Leg' : 'Commercial White Steel Telescoping Leg',
            category: 'Frame Hardware',
            specs: [
              { label: 'Leg Profile', value: isAlloy ? '50mm Hexagonal 6061-T6 Alloy' : '40mm Square Carbon Steel' },
              { label: 'Wall Thickness', value: isAlloy ? '2.0mm Heavy-Duty' : '1.5mm Powder-Coated' },
              { label: 'Height Lock', value: '5-Position Push-Pin Thumb Release' },
              { label: 'Footpad Base', value: 'Cast Zinc-Alloy Ground Anchor Plate' }
            ],
            description: 'Reinforced telescoping upright corner leg engineered to absorb intense wind shear without buckling. Features push-button locking pins for effortless 60-second setup.'
          })
        } else if (hitName.includes('mechanism') || hit.parent?.name.toLowerCase().includes('mechanism')) {
          setInspectedPart({
            name: 'Diamond Lattice Scissor Truss Rods',
            category: 'Kinematic Mechanism',
            specs: [
              { label: 'Structure', value: 'Cross-Scissor Accordion Truss' },
              { label: 'Pivot Joints', value: 'Self-Lubricating Nylon Bushings' },
              { label: 'Center Mast', value: 'Spring-Loaded Apex Peak Push-Up' },
              { label: 'Wind Stability', value: 'Rated up to 28 mph with Ballast' }
            ],
            description: 'Double-reinforced cross truss bars forming an accordion pantograph frame that distributes roof tension uniformly across all 4 peaks and corners.'
          })
        } else if (hitName.includes('sandbag')) {
          setInspectedPart({
            name: 'Heavy-Duty Saddle Sandbag Ballasts',
            category: 'Safety & Ballast',
            specs: [
              { label: 'Capacity', value: 'Holds up to 120 lbs (4 x 30 lbs)' },
              { label: 'Textile', value: '1680D Ballistic Nylon' },
              { label: 'Attachment', value: 'Double Velcro Wrap Around Leg' },
              { label: 'Wind Resistance', value: 'Anchors canopy in 28+ mph winds' }
            ],
            description: 'Dual-cylinder saddle weight bags that wrap securely around each leg base. Prevents sudden gusts from lifting the canopy.'
          })
        } else if (hitName.includes('roller') || hitName.includes('bag')) {
          setInspectedPart({
            name: 'All-Terrain Wheeled Transit Bag',
            category: 'Transport & Storage',
            specs: [
              { label: 'Shell Material', value: '1680D Ballistic Poly-PVC' },
              { label: 'Caster Wheels', value: 'Dual Urethane Sealed Bearings' },
              { label: 'Handles', value: 'Dual Molded Rubber Grip Haul Handles' },
              { label: 'Pouch', value: 'Exterior Zipper Document Compartment' }
            ],
            description: 'Rugged commercial transport case engineered for rough trade show gravel and asphalt transport. Fits frame and folded canopy snugly.'
          })
        }
      }
    }

    const domElement = renderer.domElement
    domElement.addEventListener('click', handleClick)

    if (onCaptureSnapshotRef) {
      onCaptureSnapshotRef(() => {
        if (!rendererRef.current) return ''
        return rendererRef.current.domElement.toDataURL('image/png', 0.95)
      })
    }

    return () => {
      domElement.removeEventListener('click', handleClick)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  // 2. Load 3D Tent Model
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

        // Locate top-level structural nodes for Exploded View
        let fabNode: THREE.Object3D | null = null
        let legNode: THREE.Object3D | null = null
        let mechNode: THREE.Object3D | null = null

        // 1. Exact name match
        fabNode = root.getObjectByName('fabric') || null
        legNode = root.getObjectByName('leg') || root.getObjectByName('leg5') || null
        mechNode = root.getObjectByName('mechanism') || root.getObjectByName('mechanism3') || null

        // 2. Child traversal fallback
        if (!fabNode || !legNode || !mechNode) {
          root.children.forEach((child) => {
            const low = child.name.toLowerCase()
            if (!fabNode && low.includes('fabric')) fabNode = child
            if (!legNode && low.includes('leg')) legNode = child
            if (!mechNode && low.includes('mechanism')) mechNode = child
          })
        }

        fabricGroupRef.current = fabNode
        legGroupRef.current = legNode
        mechanismGroupRef.current = mechNode

        // Traverse all meshes and assign high-precision PBR materials
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true

            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

            materials.forEach((mat, idx) => {
              if (mat.name === 'fabric_Mat') {
                // Outer custom printed canopy surface
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
              } else if (mat.name === 'Inner_fabric') {
                // Inner lining of canopy fabric
                const innerMat = new THREE.MeshStandardMaterial({
                  color: new THREE.Color(config.fabricBaseColor).multiplyScalar(0.75),
                  roughness: 0.85,
                  metalness: 0.02,
                  side: THREE.DoubleSide
                })
                if (Array.isArray(mesh.material)) {
                  mesh.material[idx] = innerMat
                } else {
                  mesh.material = innerMat
                }
                innerFabricMaterialRef.current = innerMat
              } else if (mat.name === 'Metal_mat' || mesh.name.toLowerCase().includes('leg') || mesh.name.toLowerCase().includes('mechanism')) {
                // Alloy / Steel Frame Hardware
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

        // Reapply active exploded state if already exploded
        applyExplodedOffsets(isExploded ? 1.0 : 0.0)
      },
      undefined,
      (error) => {
        console.error('Failed to load tent glb model', error)
        setIsLoadingModel(false)
      }
    )
  }, [config.modelId])

  // 3. Update Fabric Color on Inner Lining
  useEffect(() => {
    if (innerFabricMaterialRef.current) {
      innerFabricMaterialRef.current.color.set(config.fabricBaseColor).multiplyScalar(0.75)
      innerFabricMaterialRef.current.needsUpdate = true
    }
  }, [config.fabricBaseColor])

  // 4. Update Hardware Alloy Material
  useEffect(() => {
    if (metalMaterialRef.current) {
      const isAluminum = config.frameType === 'heavy_duty_aluminum'
      metalMaterialRef.current.color.set(isAluminum ? 0xd1d5db : 0xffffff)
      metalMaterialRef.current.metalness = isAluminum ? 0.9 : 0.3
      metalMaterialRef.current.roughness = isAluminum ? 0.25 : 0.4
      metalMaterialRef.current.needsUpdate = true
    }
  }, [config.frameType])

  // 5. Load & Dynamically Attach Accessories
  useEffect(() => {
    if (!accessoriesGroupRef.current) return
    const accGroup = accessoriesGroupRef.current
    const loader = new GLTFLoader()

    const hasSandbags = config.accessories.includes('sandbags')
    const hasWheelbag = config.accessories.includes('wheelbag')
    const hasStakes = config.accessories.includes('stakes')

    // 1. Sandbags
    if (hasSandbags && !sandbagsMeshRef.current) {
      loader.load('/models/accessory_sandbags.glb', (gltf) => {
        const obj = gltf.scene
        obj.position.y = 0.8
        const startTime = performance.now()
        const animateDrop = () => {
          const elapsed = (performance.now() - startTime) / 1000
          const t = Math.min(1, elapsed / 0.45)
          obj.position.y = 0.8 * (1 - t) * Math.cos(t * Math.PI * 2.5)
          if (t < 1) {
            requestAnimationFrame(animateDrop)
          } else {
            obj.position.y = 0
          }
        }
        animateDrop()
        accGroup.add(obj)
        sandbagsMeshRef.current = obj
      })
    } else if (!hasSandbags && sandbagsMeshRef.current) {
      accGroup.remove(sandbagsMeshRef.current)
      sandbagsMeshRef.current = null
    }

    // 2. Wheelbag
    if (hasWheelbag && !rollerBagMeshRef.current) {
      loader.load('/models/accessory_wheelbag.glb', (gltf) => {
        const obj = gltf.scene
        obj.position.x = 2.4
        const startTime = performance.now()
        const animateSlide = () => {
          const elapsed = (performance.now() - startTime) / 1000
          const t = Math.min(1, elapsed / 0.4)
          obj.position.x = 2.4 - t * 0.78
          if (t < 1) {
            requestAnimationFrame(animateSlide)
          } else {
            obj.position.x = 1.62
          }
        }
        animateSlide()
        accGroup.add(obj)
        rollerBagMeshRef.current = obj
      })
    } else if (!hasWheelbag && rollerBagMeshRef.current) {
      accGroup.remove(rollerBagMeshRef.current)
      rollerBagMeshRef.current = null
    }

    // 3. Stakes & Guy lines
    if (hasStakes && !stakesMeshRef.current) {
      loader.load('/models/accessory_stakes.glb', (gltf) => {
        const obj = gltf.scene
        accGroup.add(obj)
        stakesMeshRef.current = obj
      })
    } else if (!hasStakes && stakesMeshRef.current) {
      accGroup.remove(stakesMeshRef.current)
      stakesMeshRef.current = null
    }
  }, [config.accessories])

  // 6. Toggle Human Scale Mannequin
  useEffect(() => {
    if (!mannequinGroupRef.current) return
    const mGroup = mannequinGroupRef.current

    if (showHumanScale && !mannequinMeshRef.current) {
      const loader = new GLTFLoader()
      loader.load('/models/scale_mannequin.glb', (gltf) => {
        const obj = gltf.scene
        mGroup.add(obj)
        mannequinMeshRef.current = obj
      })
    } else if (!showHumanScale && mannequinMeshRef.current) {
      mGroup.remove(mannequinMeshRef.current)
      mannequinMeshRef.current = null
    }
  }, [showHumanScale])

  // 7. Exploded View Smooth Interpolation & Camera Reframing
  useEffect(() => {
    let animId: number
    const target = isExploded ? 1.0 : 0.0

    // Smoothly reframe camera when exploded
    if (controlsRef.current) {
      if (isExploded) {
        controlsRef.current.target.set(0, 1.45, 0)
        targetRadiusRef.current = 4.3
        targetPhiRef.current = Math.PI / 2.35
      } else {
        controlsRef.current.target.set(0, 1.05, 0)
        targetRadiusRef.current = 3.6
        targetPhiRef.current = Math.PI / 2.3
      }
      isTransitioningRef.current = true
    }

    const step = () => {
      setExplodedProgress((prev) => {
        const diff = target - prev
        if (Math.abs(diff) < 0.015) {
          const finalVal = target
          applyExplodedOffsets(finalVal)
          return finalVal
        }
        const next = prev + diff * 0.14
        applyExplodedOffsets(next)
        animId = requestAnimationFrame(step)
        return next
      })
    }

    animId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animId)
  }, [isExploded])

  /**
   * Applies clean 3-tier mechanical explosion:
   * Tier 3: Unified Canopy Cover (Peak + Valance, Inner + Outer) lifts cleanly (+0.82m)
   * Tier 2: Scissor Lattice Truss Mechanism suspends in the middle (+0.32m)
   * Tier 1: Telescoping Upright Legs remain firmly grounded (0.00m)
   */
  const applyExplodedOffsets = (progress: number) => {
    if (fabricGroupRef.current) {
      fabricGroupRef.current.position.y = progress * 0.82
    }
    if (mechanismGroupRef.current) {
      mechanismGroupRef.current.position.y = progress * 0.32
    }
    if (legGroupRef.current) {
      legGroupRef.current.position.y = 0.0
    }
  }

  // 8. Update Auto-Rotation
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating
      controlsRef.current.autoRotateSpeed = 2.0
    }
  }, [isAutoRotating])

  // 9. Rotate Smoothly to Side Function
  const rotateToSide = useCallback((side: TentSide) => {
    setActiveSide(side)

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
    targetPhiRef.current = isExploded ? Math.PI / 2.35 : Math.PI / 2.3
    targetRadiusRef.current = isExploded ? 4.3 : 3.6
    isTransitioningRef.current = true

    const correspondingZoneId = `peak_${side}` as ZoneId
    if (activeZoneId !== correspondingZoneId && !activeZoneId.startsWith('valance_')) {
      setActiveZoneId(correspondingZoneId)
    }
  }, [isAutoRotating, toggleAutoRotate, activeZoneId, setActiveZoneId, isExploded])

  // Switch Environment Handler
  const handleSwitchEnvironment = (env: EnvironmentType) => {
    setActiveEnv(env)
    if (envBuilderRef.current) {
      envBuilderRef.current.setEnvironment(env)
    }
    if (sceneRef.current) {
      switch (env) {
        case 'studio':
          sceneRef.current.background = new THREE.Color(0xf8fafc)
          break
        case 'tradeshow':
          sceneRef.current.background = new THREE.Color(0x1e293b)
          break
        case 'street':
          sceneRef.current.background = new THREE.Color(0x38bdf8)
          break
        case 'park':
          sceneRef.current.background = new THREE.Color(0x7dd3fc)
          break
      }
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
      className="relative w-full h-full min-h-[500px] overflow-hidden select-none"
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

      {/* Top Left: Active Model & Footprint Pill */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
        <div className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-black text-slate-900 font-sans">
            {modelMeta.dimensions}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {config.frameType === 'heavy_duty_aluminum' ? '50mm Hex Alloy' : 'Steel Frame'}
          </span>
        </div>

        {/* Real-Life Scale Comparison HUD (When Mannequin is Active) */}
        {showHumanScale && (
          <div className="px-3 py-2 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700 shadow-lg text-[11px] space-y-1 animate-in fade-in duration-200">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
              <User className="w-3.5 h-3.5" />
              <span>Real-Life Scale Comparison</span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono space-y-0.5">
              <div>• Person Height: 1.80m (5'11")</div>
              <div>• Valance Clearance: 2.10m (7'0")</div>
              <div>• Peak Apex Height: 3.40m (11'2")</div>
            </div>
          </div>
        )}

        {/* Exploded View 3-Tier Layer Annotation Legend */}
        {isExploded && (
          <div className="px-3 py-2.5 rounded-xl bg-slate-900/95 text-white backdrop-blur-md border border-amber-500/50 shadow-xl text-[11px] space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
            <div className="flex items-center justify-between text-amber-400 font-black text-[10px] uppercase tracking-wider">
              <span>Exploded Mechanical Assembly</span>
              <span className="text-white/60">3 Tiers</span>
            </div>
            <div className="text-[10px] font-mono space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Tier 3: 600D Weather-Seal Canopy Top (+0.82m)</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Tier 2: Accordion Scissor Lattice Mechanism (+0.32m)</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span>Tier 1: Telescoping Upright Legs & Footpads (0.00m)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Right: Side View Selector Pills */}
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

      {/* Left Vertical Action Bar: Environments & Motion Modes */}
      <div className="absolute top-16 left-4 z-10 flex flex-col space-y-2">
        {/* Environment Switcher Dropdown / Pills */}
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-sm flex flex-col space-y-1">
          <span className="text-[9px] font-bold uppercase text-slate-400 px-2 py-0.5 text-center">
            Environment
          </span>
          <button
            onClick={() => handleSwitchEnvironment('studio')}
            title="Studio Lighting"
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              activeEnv === 'studio'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Studio</span>
          </button>
          <button
            onClick={() => handleSwitchEnvironment('tradeshow')}
            title="Convention Center / Trade Show Booth"
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              activeEnv === 'tradeshow'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trade Show</span>
          </button>
          <button
            onClick={() => handleSwitchEnvironment('street')}
            title="Outdoor Street Expo / Farmers Market"
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              activeEnv === 'street'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Street Expo</span>
          </button>
          <button
            onClick={() => handleSwitchEnvironment('park')}
            title="Park / Festival Lawn"
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              activeEnv === 'park'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TreePine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Park Lawn</span>
          </button>
        </div>

        {/* Human Scale Mannequin Toggle */}
        <button
          onClick={() => setShowHumanScale(!showHumanScale)}
          title="Compare with 1.8m Human Scale"
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border backdrop-blur-md transition-all shadow-sm text-xs font-bold ${
            showHumanScale
              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
              : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">1.8m Scale</span>
        </button>

        {/* Exploded Engineering View Toggle */}
        <button
          onClick={() => setIsExploded(!isExploded)}
          title={isExploded ? 'Reassemble Tent Assembly' : 'Explode View into 3 Tiers (Canopy, Truss, Legs)'}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border backdrop-blur-md transition-all shadow-sm text-xs font-bold ${
            isExploded
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold ring-2 ring-amber-400/50'
              : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isExploded ? 'Reassemble Tent' : 'Exploded View'}</span>
        </button>
      </div>

      {/* Part Inspection Drawer / Popup */}
      {inspectedPart && (
        <div className="absolute top-20 right-4 z-30 w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xl text-slate-800 animate-in fade-in slide-in-from-right-3 duration-200">
          <div className="flex items-start justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                {inspectedPart.category}
              </span>
              <h3 className="text-xs font-black text-slate-900 leading-tight">
                {inspectedPart.name}
              </h3>
            </div>
            <button
              onClick={() => setInspectedPart(null)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-2.5 space-y-1.5 text-[11px] font-mono">
            {inspectedPart.specs.map((s, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="text-slate-500 font-sans">{s.label}:</span>
                <span className="font-semibold text-slate-900">{s.value}</span>
              </div>
            ))}
          </div>

          <p className="text-[10.5px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2 font-sans">
            {inspectedPart.description}
          </p>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center space-x-2">
        <button
          onClick={toggleAutoRotate}
          title={isAutoRotating ? 'Stop Rotation' : 'Spin 360°'}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border backdrop-blur-md transition-all shadow-sm text-xs font-bold ${
            isAutoRotating
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
              : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
          }`}
        >
          <Compass className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isAutoRotating ? 'Spinning' : '360° Spin'}</span>
        </button>

        <button
          onClick={() => rotateToSide('front')}
          title="Reset to Front View"
          className="p-2.5 rounded-xl bg-white/95 text-slate-700 border border-slate-200 backdrop-blur-md hover:bg-white hover:text-slate-900 transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="p-2.5 rounded-xl bg-white/95 text-slate-700 border border-slate-200 backdrop-blur-md hover:bg-white hover:text-slate-900 transition-all shadow-sm"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bottom Left: Orbit Interaction Legend */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center space-x-2">
        <span className="text-[11px] text-slate-600 bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200/80 backdrop-blur-sm shadow-xs font-medium">
          Drag to Orbit • Scroll to Zoom • Click 3D Parts to Inspect
        </span>
      </div>
    </div>
  )
}
