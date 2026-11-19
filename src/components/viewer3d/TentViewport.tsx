import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { textureSyncService } from '../../services/textureSyncService'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { TENT_MODELS } from '../../constants/tentData'
import { ProductModelId } from '../../types/configurator'
import { EnvironmentBuilder, EnvironmentType } from '../../utils/environmentBuilder'
import {
  Maximize2,
  Minimize2,
  RotateCw,
  Loader2,
  Building2,
  TreePine,
  User,
  Layers,
  Sun,
  X,
  Sliders,
  Ruler,
  ChevronDown,
  ChevronLeft
} from 'lucide-react'

interface TentViewportProps {
  onCaptureSnapshotRef?: (fn: () => string) => void
  isSidebarOpen?: boolean
  onToggleSidebar?: () => void
}

type TentSide = 'front' | 'right' | 'back' | 'left'

interface PartInspectionData {
  name: string
  category: string
  specs: { label: string; value: string }[]
  description: string
}

interface ModelCalibration {
  legX: number
  legZ: number
  bracketY: number
  liftOffset: number
  valanceClearance: string
  peakApex: string
}

/**
 * Exact geometric calibration for each commercial canopy size
 * Sourced from physical 3D mesh dimensions (5x5, 6.5x6.5, 8x8, 10x10)
 */
const MODEL_CALIBRATION: Record<ProductModelId, ModelCalibration> = {
  '5x5': {
    legX: 0.751,
    legZ: 0.751,
    bracketY: 0.945,
    liftOffset: 0.55,
    valanceClearance: '1.85 m (6 ft 1 in)',
    peakApex: '2.13 m (7 ft 0 in)'
  },
  '6.5x6.5': {
    legX: 0.984,
    legZ: 0.984,
    bracketY: 1.006,
    liftOffset: 0.65,
    valanceClearance: '1.95 m (6 ft 5 in)',
    peakApex: '2.44 m (8 ft 0 in)'
  },
  '8x8': {
    legX: 1.206,
    legZ: 1.206,
    bracketY: 1.200,
    liftOffset: 0.75,
    valanceClearance: '2.05 m (6 ft 9 in)',
    peakApex: '2.62 m (8 ft 7 in)'
  },
  '10x10': {
    legX: 1.508,
    legZ: 1.508,
    bracketY: 1.500,
    liftOffset: 0.85,
    valanceClearance: '2.10 m (6 ft 11 in)',
    peakApex: '3.40 m (11 ft 2 in)'
  }
}

/**
 * Builds authentic Heavy-Duty Spiral Ground Stakes & Taut Guy Ropes
 * Dynamically tailored to the active tent size so it anchors 100% on the ground (Y = 0)
 * and attaches tautly to the 4 canopy corner brackets.
 */
function createSpiralStakesGroup(
  legX: number,
  legZ: number,
  bracketY: number,
  canopyYOffset: number = 0
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'SpiralStakesAndRopes'

  // Corner bracket locations on canopy valance
  const cornerX = legX
  const cornerZ = legZ
  const by = bracketY + canopyYOffset

  // Stake ground distance (outward diagonal from leg)
  const stakeOutset = 0.55
  const stakeX = cornerX + stakeOutset
  const stakeZ = cornerZ + stakeOutset

  const stakeCoords = [
    { cx: cornerX, cz: cornerZ, sx: stakeX, sz: stakeZ },
    { cx: -cornerX, cz: cornerZ, sx: -stakeX, sz: stakeZ },
    { cx: cornerX, cz: -cornerZ, sx: stakeX, sz: -stakeZ },
    { cx: -cornerX, cz: -cornerZ, sx: -stakeX, sz: -stakeZ }
  ]

  const stakeMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Zinc-plated galvanized steel
    metalness: 0.9,
    roughness: 0.25
  })

  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0xf97316, // High-vis fluorescent orange guyline
    roughness: 0.6,
    metalness: 0.05
  })

  const sliderMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Aluminum tensioner runner tab
    metalness: 0.85,
    roughness: 0.3
  })

  stakeCoords.forEach(({ cx, cz, sx: stX, sz: stZ }) => {
    // 1. Heavy-Duty Spiral Ground Stake Assembly
    const stakeContainer = new THREE.Group()
    stakeContainer.position.set(stX, 0, stZ)

    const outwardAngle = Math.atan2(stZ, stX)
    stakeContainer.rotation.y = -outwardAngle

    // Ground Auger Spiral Blade at turf level
    const spiralGeo = new THREE.TorusGeometry(0.045, 0.007, 8, 16)
    const spiralMesh = new THREE.Mesh(spiralGeo, stakeMat)
    spiralMesh.rotation.x = Math.PI / 2
    spiralMesh.position.set(0, 0.015, 0)
    stakeContainer.add(spiralMesh)

    // Steel Shaft driven into ground (tilted backward 25 deg against rope pull)
    const shaftGeo = new THREE.CylinderGeometry(0.012, 0.007, 0.28, 10)
    const shaftMesh = new THREE.Mesh(shaftGeo, stakeMat)
    shaftMesh.rotation.x = 0.38
    shaftMesh.position.set(0, 0.06, 0.025)
    stakeContainer.add(shaftMesh)

    // Top Eyelet Ring
    const eyeletGeo = new THREE.TorusGeometry(0.024, 0.007, 8, 16)
    const eyeletMesh = new THREE.Mesh(eyeletGeo, stakeMat)
    eyeletMesh.position.set(0, 0.16, 0.065)
    stakeContainer.add(eyeletMesh)

    group.add(stakeContainer)

    // 2. Taut Guy Rope from Canopy Corner Bracket to Stake Eyelet
    const startPt = new THREE.Vector3(cx, by, cz)
    const endPt = new THREE.Vector3(stX, 0.16, stZ)
    const diff = new THREE.Vector3().subVectors(endPt, startPt)
    const ropeLen = diff.length()
    const midPt = new THREE.Vector3().addVectors(startPt, endPt).multiplyScalar(0.5)

    const ropeGeo = new THREE.CylinderGeometry(0.004, 0.004, ropeLen, 8)
    const ropeMesh = new THREE.Mesh(ropeGeo, ropeMat)
    ropeMesh.position.copy(midPt)

    // Orient cylinder along rope vector
    const up = new THREE.Vector3(0, 1, 0)
    const dir = diff.clone().normalize()
    const axis = new THREE.Vector3().crossVectors(up, dir).normalize()
    const angle = Math.acos(Math.max(-1, Math.min(1, up.dot(dir))))
    ropeMesh.quaternion.setFromAxisAngle(axis, angle)
    group.add(ropeMesh)

    // 3. Tensioner Slider Runner Tab
    const sliderGeo = new THREE.BoxGeometry(0.015, 0.045, 0.012)
    const sliderMesh = new THREE.Mesh(sliderGeo, sliderMat)
    sliderMesh.position.lerpVectors(endPt, startPt, 0.35)
    sliderMesh.quaternion.copy(ropeMesh.quaternion)
    group.add(sliderMesh)
  })

  return group
}

/**
 * Builds a 3D measurement dimension ruler next to the person with metric & imperial labels
 */
function createPersonDimensionRuler(): THREE.Group {
  const rulerGroup = new THREE.Group()
  rulerGroup.name = 'DimensionRuler'

  const rulerMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }) // Amber 500
  const tickMat = new THREE.MeshBasicMaterial({ color: 0x1e293b })

  // Vertical height line from ground (Y=0) to person height (Y=1.80m)
  const poleGeo = new THREE.CylinderGeometry(0.003, 0.003, 1.80, 8)
  const poleMesh = new THREE.Mesh(poleGeo, rulerMat)
  poleMesh.position.set(0, 0.90, 0)
  rulerGroup.add(poleMesh)

  // Bottom Ground Tick (0.00m / 0')
  const bottomTick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.006, 0.006), tickMat)
  bottomTick.position.set(0, 0.003, 0)
  rulerGroup.add(bottomTick)

  // Person Height Tick (1.80m / 5' 11")
  const personTick = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.008, 0.006), rulerMat)
  personTick.position.set(0, 1.80, 0)
  rulerGroup.add(personTick)

  // Valance Clearance Tick (2.10m / 6' 11")
  const valanceTick = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.008, 0.006), tickMat)
  valanceTick.position.set(0, 2.10, 0)
  rulerGroup.add(valanceTick)

  return rulerGroup
}

export const TentViewport: React.FC<TentViewportProps> = ({
  onCaptureSnapshotRef,
  isSidebarOpen = true,
  onToggleSidebar
}) => {
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
  const stakesGroupRef = useRef<THREE.Group | null>(null)
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
  const [isEnvMenuOpen, setIsEnvMenuOpen] = useState<boolean>(false)
  const [showHumanScale, setShowHumanScale] = useState<boolean>(false)
  const [isExploded, setIsExploded] = useState<boolean>(false)
  const [explodedProgress, setExplodedProgress] = useState<number>(0)
  const [inspectedPart, setInspectedPart] = useState<PartInspectionData | null>(null)

  const isExplodedRef = useRef<boolean>(false)
  const showHumanScaleRef = useRef<boolean>(false)

  useEffect(() => {
    isExplodedRef.current = isExploded
  }, [isExploded])

  useEffect(() => {
    showHumanScaleRef.current = showHumanScale
  }, [showHumanScale])

  const {
    config,
    activeZoneId,
    setActiveZoneId,
    isAutoRotating,
    toggleAutoRotate
  } = useConfiguratorStore()

  const modelMeta = TENT_MODELS[config.modelId]
  const cal = MODEL_CALIBRATION[config.modelId] || MODEL_CALIBRATION['10x10']

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
    renderer.toneMappingExposure = 1.0
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

    // Balanced Commercial Studio 3-Point Lighting & Contrast Grading
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
    scene.add(ambientLight)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 0.35)
    hemiLight.position.set(0, 10, 0)
    scene.add(hemiLight)

    // Key Light: Warm soft sunlight creating clean canopy facet modeling
    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.35)
    keyLight.position.set(4.5, 8.0, 4.5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.bias = -0.0001
    scene.add(keyLight)

    // Fill Light: Soft neutral sky bounce fill
    const fillLight = new THREE.DirectionalLight(0xf1f5f9, 0.60)
    fillLight.position.set(-4.5, 3.5, 3.0)
    scene.add(fillLight)

    // Rim Light: Edge separation on apex ridge and valance trims
    const backRimLight = new THREE.DirectionalLight(0xe0f2fe, 0.80)
    backRimLight.position.set(0, 6.0, -5.0)
    scene.add(backRimLight)

    // Front Eyeball Light: Subtle frontal fill to reveal custom printed logo details
    const frontEyeballLight = new THREE.DirectionalLight(0xffffff, 0.40)
    frontEyeballLight.position.set(0, 2.0, 4.5)
    scene.add(frontEyeballLight)

    // Dynamic Contextual Environment Builder
    const envBuilder = new EnvironmentBuilder()
    envBuilderRef.current = envBuilder
    envBuilder.setEnvironment('studio')
    scene.add(envBuilder.getGroup())

    // Root Groups
    const modelGroup = new THREE.Group()
    modelGroup.name = 'TentModelRoot'
    scene.add(modelGroup)
    modelGroupRef.current = modelGroup

    const accessoriesGroup = new THREE.Group()
    accessoriesGroup.name = 'AccessoriesRoot'
    scene.add(accessoriesGroup)
    accessoriesGroupRef.current = accessoriesGroup

    const mannequinGroup = new THREE.Group()
    mannequinGroup.name = 'MannequinRoot'
    scene.add(mannequinGroup)
    mannequinGroupRef.current = mannequinGroup

    // Animation Loop
    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      if (isTransitioningRef.current && cameraRef.current && controlsRef.current) {
        let diff = targetThetaRef.current - currentThetaRef.current
        while (diff < -Math.PI) diff += Math.PI * 2
        while (diff > Math.PI) diff -= Math.PI * 2

        currentThetaRef.current += diff * 0.08
        currentPhiRef.current += (targetPhiRef.current - currentPhiRef.current) * 0.08
        currentRadiusRef.current += (targetRadiusRef.current - currentRadiusRef.current) * 0.08

        const theta = currentThetaRef.current
        const phi = currentPhiRef.current
        const radius = currentRadiusRef.current
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
        } else if (hitName.includes('stake') || hitName.includes('rope')) {
          setInspectedPart({
            name: 'Heavy-Duty Spiral Earth Stakes & Ropes',
            category: 'Ground Anchoring',
            specs: [
              { label: 'Anchor Type', value: '12-inch Zinc-Plated Spiral Auger' },
              { label: 'Guy Line Cord', value: '4mm High-Vis Braided Poly Core' },
              { label: 'Tensioner', value: 'Anodized 3-Hole Aluminum Runner' },
              { label: 'Hold Force', value: 'Tested to 180 lbs vertical pull' }
            ],
            description: 'Spiral corkscrew earth stakes driven firmly into the ground with high-strength tensioned guy lines connecting directly to the four canopy corner truss brackets.'
          })
        }
      }
    }

    const domElement = renderer.domElement
    domElement.addEventListener('click', handleClick)

    if (onCaptureSnapshotRef) {
      onCaptureSnapshotRef(() => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return ''

        const camera = cameraRef.current
        const renderer = rendererRef.current
        const scene = sceneRef.current

        // 1. Save live camera transform & target
        const savedPos = camera.position.clone()
        const savedTarget = controlsRef.current ? controlsRef.current.target.clone() : new THREE.Vector3(0, 1.05, 0)
        const savedFov = camera.fov

        // 2. Read live configuration to frame active model size exactly
        const currentModelId = useConfiguratorStore.getState().config.modelId || '10x10'
        const currentCalib = MODEL_CALIBRATION[currentModelId] || MODEL_CALIBRATION['10x10']

        // Exact physical peak apex height:
        // 5x5: 2.13m, 6.5x6.5: 2.44m, 8x8: 2.62m, 10x10: 3.40m
        const apexHeight = currentModelId === '10x10' ? 3.40 : currentModelId === '8x8' ? 2.62 : currentModelId === '6.5x6.5' ? 2.44 : 2.13
        const halfWidth = currentCalib.legX

        // Target center Y at 46% of peak apex height
        const targetCenterY = apexHeight * 0.46

        // Mathematically calibrated distance ensuring full canopy apex, legs and ground shadows fit with 25% margin
        const distFromHeight = (apexHeight * 1.38) / (2 * Math.tan(THREE.MathUtils.degToRad(17)))
        const distFromWidth = (halfWidth * 2 * Math.SQRT2 * 1.25) / (2 * Math.tan(THREE.MathUtils.degToRad(25)))
        const heroDist = Math.max(5.8, distFromHeight, distFromWidth)

        // 3/4 elevated isometric studio beauty angle
        camera.fov = 34
        camera.position.set(heroDist * 0.72, apexHeight * 0.65, heroDist * 0.72)
        camera.lookAt(0, targetCenterY, 0)
        camera.updateProjectionMatrix()

        // Temporarily reset exploded offset if active so the tent is shown assembled in its hero state
        const wasExploded = isExplodedRef.current
        if (wasExploded && fabricGroupRef.current) {
          fabricGroupRef.current.position.y = 0
          if (mechanismGroupRef.current) {
            mechanismGroupRef.current.position.y = 0
          }
        }

        // Hide mannequin scale figure in formal product shot
        let mannequinWasVisible = false
        if (mannequinGroupRef.current && mannequinGroupRef.current.visible) {
          mannequinWasVisible = true
          mannequinGroupRef.current.visible = false
        }

        // 3. Render high-res beauty snapshot
        renderer.render(scene, camera)
        const snapshotUrl = renderer.domElement.toDataURL('image/png', 1.0)

        // 4. Restore live state
        if (wasExploded && fabricGroupRef.current) {
          fabricGroupRef.current.position.y = currentCalib.liftOffset
          if (mechanismGroupRef.current) {
            mechanismGroupRef.current.position.y = currentCalib.liftOffset * 0.45
          }
        }
        if (mannequinWasVisible && mannequinGroupRef.current) {
          mannequinGroupRef.current.visible = true
        }

        camera.fov = savedFov
        camera.position.copy(savedPos)
        if (controlsRef.current) {
          controlsRef.current.target.copy(savedTarget)
          controlsRef.current.update()
        }
        camera.lookAt(savedTarget)
        camera.updateProjectionMatrix()
        renderer.render(scene, camera)

        return snapshotUrl
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

    const loader = new GLTFLoader()

    loader.load(
      modelMeta.glbPath,
      (gltf: GLTF) => {
        const root = gltf.scene
        root.scale.set(modelMeta.scale[0], modelMeta.scale[1], modelMeta.scale[2])

        // Locate top-level structural nodes for Exploded View
        let fabNode: THREE.Object3D | null = null
        let legNode: THREE.Object3D | null = null
        let mechNode: THREE.Object3D | null = null

        // Exact name match
        fabNode = root.getObjectByName('fabric') || null
        legNode = root.getObjectByName('leg') || root.getObjectByName('leg5') || null
        mechNode = root.getObjectByName('mechanism') || root.getObjectByName('mechanism3') || null

        // Child traversal fallback
        if (!fabNode || !legNode || !mechNode) {
          root.children.forEach((child: THREE.Object3D) => {
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
        root.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true

            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

            materials.forEach((mat, idx) => {
              if (mat.name === 'fabric_Mat') {
                // Outer custom printed canopy surface
                const canvasTex = textureSyncService.getTexture()
                if (canvasTex) {
                  canvasTex.flipY = false
                }
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

        // Rebuild dynamic stakes if active
        if (config.accessories.includes('stakes')) {
          rebuildStakes(cal, isExploded ? cal.liftOffset : 0)
        }
      },
      undefined,
      (error: unknown) => {
        console.error('Failed to load tent glb model', error)
        setIsLoadingModel(false)
      }
    )
  }, [config.modelId])

  // 3. Update Fabric Texture & Inner Color
  useEffect(() => {
    if (fabricMaterialRef.current) {
      const canvasTex = textureSyncService.getTexture()
      if (canvasTex) {
        canvasTex.flipY = false
      }
      fabricMaterialRef.current.map = canvasTex
      if (fabricMaterialRef.current.map) {
        fabricMaterialRef.current.map.needsUpdate = true
      }
      fabricMaterialRef.current.needsUpdate = true
    }
    if (innerFabricMaterialRef.current) {
      innerFabricMaterialRef.current.color.set(config.fabricBaseColor).multiplyScalar(0.75)
      innerFabricMaterialRef.current.needsUpdate = true
    }
  }, [config.zones, config.fabricBaseColor])

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

  // Helper to rebuild stakes and guy lines anchored firmly to ground and canopy corners
  const rebuildStakes = (calib: ModelCalibration, canopyYOffset: number = 0) => {
    if (!accessoriesGroupRef.current) return
    const accGroup = accessoriesGroupRef.current

    if (stakesGroupRef.current) {
      accGroup.remove(stakesGroupRef.current)
      stakesGroupRef.current = null
    }

    const stakesGroup = createSpiralStakesGroup(calib.legX, calib.legZ, calib.bracketY, canopyYOffset)
    accGroup.add(stakesGroup)
    stakesGroupRef.current = stakesGroup
  }

  // 5. Load & Dynamically Attach Accessories to Active Model
  useEffect(() => {
    if (!accessoriesGroupRef.current) return
    const accGroup = accessoriesGroupRef.current
    const loader = new GLTFLoader()

    const hasSandbags = config.accessories.includes('sandbags')
    const hasWheelbag = config.accessories.includes('wheelbag')
    const hasStakes = config.accessories.includes('stakes')

    // 1. Sandbags: Modular 4-corner placement wrapping around active legs
    if (hasSandbags) {
      if (sandbagsMeshRef.current) {
        accGroup.remove(sandbagsMeshRef.current)
        sandbagsMeshRef.current = null
      }

      loader.load('/models/accessory_sandbag_single.glb', (gltf: GLTF) => {
        const template = gltf.scene
        const parentGroup = new THREE.Group()
        parentGroup.name = 'SandbagsGroup'

        const legPositions = [
          { x: cal.legX, z: cal.legZ, rot: 0 },
          { x: -cal.legX, z: cal.legZ, rot: Math.PI / 2 },
          { x: -cal.legX, z: -cal.legZ, rot: Math.PI },
          { x: cal.legX, z: -cal.legZ, rot: -Math.PI / 2 }
        ]

        legPositions.forEach(({ x, z, rot }) => {
          const singleBag = template.clone(true)
          singleBag.position.set(x, 0, z)
          singleBag.rotation.y = rot
          parentGroup.add(singleBag)
        })

        // Smooth drop animation from Y = 0.8m down to 0m with gentle bounce
        parentGroup.position.y = 0.8
        const startTime = performance.now()
        const animateDrop = () => {
          const elapsed = (performance.now() - startTime) / 1000
          const t = Math.min(1, elapsed / 0.45)
          parentGroup.position.y = 0.8 * (1 - t) * Math.cos(t * Math.PI * 2.5)
          if (t < 1) {
            requestAnimationFrame(animateDrop)
          } else {
            parentGroup.position.y = 0
          }
        }
        animateDrop()

        accGroup.add(parentGroup)
        sandbagsMeshRef.current = parentGroup
      })
    } else if (!hasSandbags && sandbagsMeshRef.current) {
      accGroup.remove(sandbagsMeshRef.current)
      sandbagsMeshRef.current = null
    }

    // 2. Wheelbag: Parked neatly beside the active front-right leg
    if (hasWheelbag) {
      if (rollerBagMeshRef.current) {
        accGroup.remove(rollerBagMeshRef.current)
        rollerBagMeshRef.current = null
      }

      loader.load('/models/accessory_wheelbag.glb', (gltf: GLTF) => {
        const obj = gltf.scene
        const targetX = cal.legX + 0.38
        const targetZ = cal.legZ - 0.20
        obj.position.set(targetX + 0.8, 0, targetZ)

        const startTime = performance.now()
        const animateSlide = () => {
          const elapsed = (performance.now() - startTime) / 1000
          const t = Math.min(1, elapsed / 0.4)
          obj.position.x = targetX + 0.8 * (1 - t)
          if (t < 1) {
            requestAnimationFrame(animateSlide)
          } else {
            obj.position.x = targetX
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

    // 3. Heavy-Duty Spiral Stakes & Guy Lines (100% Ground Anchored & Taut)
    if (hasStakes) {
      rebuildStakes(cal, isExploded ? cal.liftOffset : 0)
    } else if (!hasStakes && stakesGroupRef.current) {
      accGroup.remove(stakesGroupRef.current)
      stakesGroupRef.current = null
    }
  }, [config.accessories, config.modelId])

  // 6. Toggle Realistic Person Model (Standing OUTSIDE tent with 3D Ruler)
  useEffect(() => {
    if (!mannequinGroupRef.current) return
    const mGroup = mannequinGroupRef.current

    if (showHumanScale) {
      while (mGroup.children.length > 0) {
        mGroup.remove(mGroup.children[0])
      }

      const loader = new GLTFLoader()
      loader.load('/models/scale_person.glb', (gltf: GLTF) => {
        const obj = gltf.scene

        // Position standing OUTSIDE the tent, comfortably to the right of the front leg
        const personX = cal.legX + 0.65
        const personZ = cal.legZ * 0.35
        obj.position.set(personX, 0, personZ)
        obj.rotation.y = -Math.PI / 8 // angled slightly towards camera

        mGroup.add(obj)
        mannequinMeshRef.current = obj

        // Add 3D measurement dimension ruler standing beside the person
        const ruler = createPersonDimensionRuler()
        ruler.position.set(personX + 0.28, 0, personZ)
        mGroup.add(ruler)
      })
    } else if (!showHumanScale && mannequinMeshRef.current) {
      while (mGroup.children.length > 0) {
        mGroup.remove(mGroup.children[0])
      }
      mannequinMeshRef.current = null
    }
  }, [showHumanScale, config.modelId])

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
        const nextVal = prev + diff * 0.12
        applyExplodedOffsets(nextVal)
        animId = requestAnimationFrame(step)
        return nextVal
      })
    }

    animId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animId)
  }, [isExploded, config.modelId])

  /**
   * Exploded View offsets:
   * 1. Fabric Group lifts as a unified canopy cover
   * 2. Scissor Truss Mechanism expands into the middle tier
   * 3. Upright legs & footpads remain firmly grounded (0.00m)
   */
  const applyExplodedOffsets = (progress: number) => {
    const liftY = cal.liftOffset * progress

    if (fabricGroupRef.current) {
      fabricGroupRef.current.position.y = liftY
    }
    if (mechanismGroupRef.current) {
      mechanismGroupRef.current.position.y = liftY * 0.40
    }
    if (legGroupRef.current) {
      legGroupRef.current.position.y = 0.0
    }

    // Update guy lines if stakes are active to remain taut
    if (config.accessories.includes('stakes') && stakesGroupRef.current) {
      rebuildStakes(cal, liftY)
    }
  }

  // 8. Update Auto-Rotation
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating
      controlsRef.current.autoRotateSpeed = 1.2
    }
  }, [isAutoRotating])

  // 9. Environment Switching Handler
  const handleSwitchEnvironment = (env: EnvironmentType) => {
    setActiveEnv(env)
    setIsEnvMenuOpen(false)
    if (envBuilderRef.current) {
      envBuilderRef.current.setEnvironment(env)
    }
  }

  // 10. Automatically rotate 3D camera to face the activeZoneId side & pitch to surface
  useEffect(() => {
    if (!activeZoneId) return
    const parts = activeZoneId.split('_')
    const surface = parts[0] // 'peak' | 'valance'
    const side = parts[1] as TentSide // 'front' | 'right' | 'back' | 'left'

    if (side) {
      setActiveSide(side)
      if (controlsRef.current) {
        controlsRef.current.autoRotate = false
      }

      let targetAngle = 0
      switch (side) {
        case 'front':
          targetAngle = 0
          break
        case 'right':
          targetAngle = Math.PI / 2
          break
        case 'back':
          targetAngle = Math.PI
          break
        case 'left':
          targetAngle = (3 * Math.PI) / 2
          break
      }

      targetThetaRef.current = targetAngle
      targetPhiRef.current = surface === 'valance' ? Math.PI / 2.15 : Math.PI / 2.45
      targetRadiusRef.current = 3.6
      isTransitioningRef.current = true
    }
  }, [activeZoneId])

  // Camera side rotation helper
  const rotateToSide = (side: TentSide) => {
    setActiveSide(side)
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false
    }

    let targetAngle = 0
    switch (side) {
      case 'front':
        targetAngle = 0
        break
      case 'right':
        targetAngle = Math.PI / 2
        break
      case 'back':
        targetAngle = Math.PI
        break
      case 'left':
        targetAngle = (3 * Math.PI) / 2
        break
    }

    targetThetaRef.current = targetAngle
    targetPhiRef.current = Math.PI / 2.3
    targetRadiusRef.current = 3.6
    isTransitioningRef.current = true

    if (activeZoneId) {
      const parts = activeZoneId.split('_')
      const currentSurface = parts[0]
      switch (side) {
        case 'front':
          setActiveZoneId(`${currentSurface}_front` as any)
          break
        case 'right':
          setActiveZoneId(`${currentSurface}_right` as any)
          break
        case 'back':
          setActiveZoneId(`${currentSurface}_back` as any)
          break
        case 'left':
          setActiveZoneId(`${currentSurface}_left` as any)
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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] overflow-hidden select-none bg-slate-50"
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

      {/* Top Left: Clean Active Footprint Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <div className="px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-slate-900 font-sans">
            {modelMeta.dimensions}
          </span>
          <span className="text-[10px] text-slate-500 font-mono px-1.5 py-0.5 rounded bg-slate-100">
            {config.frameType === 'heavy_duty_aluminum' ? '50mm Hex Alloy' : 'Steel Frame'}
          </span>
        </div>
      </div>

      {/* Top Right: Side View Selector & Collapsed Sidebar Trigger */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <div className="flex items-center bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-sm">
          {(['front', 'right', 'back', 'left'] as TentSide[]).map((side) => {
            const isSelected = activeSide === side
            return (
              <button
                key={side}
                onClick={() => rotateToSide(side)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {side}
              </button>
            )
          })}
        </div>

        {/* Sidebar Expand Button (when collapsed) */}
        {!isSidebarOpen && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-black transition-all"
            title="Open Product Options Panel"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Options</span>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Left Toolbar: Staging Environment, 1.8m Person, Exploded View */}
      <div className="absolute top-16 left-4 z-10 flex flex-col space-y-2">
        {/* Environment Popover Menu */}
        <div className="relative">
          <button
            onClick={() => setIsEnvMenuOpen(!isEnvMenuOpen)}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm text-xs font-bold text-slate-700 hover:bg-white hover:border-slate-300 transition-all"
          >
            {activeEnv === 'park' ? (
              <TreePine className="w-3.5 h-3.5 text-emerald-600" />
            ) : activeEnv === 'tradeshow' ? (
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="capitalize">
              {activeEnv === 'tradeshow' ? 'Trade Show' : activeEnv === 'street' ? 'Street Expo' : activeEnv === 'park' ? 'Park Lawn' : 'Studio'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isEnvMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isEnvMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-44 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl p-1.5 flex flex-col space-y-1 z-30 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Staging Environment
              </span>
              <button
                onClick={() => handleSwitchEnvironment('studio')}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeEnv === 'studio' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Studio Clean</span>
              </button>
              <button
                onClick={() => handleSwitchEnvironment('tradeshow')}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeEnv === 'tradeshow' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Trade Show Booth</span>
              </button>
              <button
                onClick={() => handleSwitchEnvironment('street')}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeEnv === 'street' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Street Market</span>
              </button>
              <button
                onClick={() => handleSwitchEnvironment('park')}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeEnv === 'park' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <TreePine className="w-3.5 h-3.5" />
                <span>Park Turf Lawn</span>
              </button>
            </div>
          )}
        </div>

        {/* Real Person Scale Comparison Toggle */}
        <button
          onClick={() => setShowHumanScale(!showHumanScale)}
          title="Compare with 1.80m (5'11'') Real Person outside the tent"
          className={`flex items-center space-x-2 px-3 py-2 rounded-xl border backdrop-blur-md transition-all shadow-sm text-xs font-bold ${
            showHumanScale
              ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/50'
              : 'bg-white/95 text-slate-700 border-slate-200/90 hover:bg-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>1.8m Person (5'11")</span>
        </button>

        {/* Exploded Engineering View Toggle */}
        <button
          onClick={() => setIsExploded(!isExploded)}
          title={isExploded ? 'Reassemble Tent Assembly' : 'Explode View into 3 Tiers (Canopy, Truss, Legs)'}
          className={`flex items-center space-x-2 px-3 py-2 rounded-xl border backdrop-blur-md transition-all shadow-sm text-xs font-bold ${
            isExploded
              ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-400/50'
              : 'bg-white/95 text-slate-700 border-slate-200/90 hover:bg-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isExploded ? 'Reassemble' : 'Exploded View'}</span>
        </button>
      </div>

      {/* Bottom Left: Non-Colliding HUD Cards (Real-Life Scale & Exploded Legends) */}
      <div className="absolute bottom-16 left-4 z-10 flex flex-col space-y-2 max-w-xs pointer-events-none">
        {/* Real-Life Scale Comparison Card (Tailored dynamically to active footprint) */}
        {showHumanScale && (
          <div className="pointer-events-auto px-3.5 py-2.5 rounded-2xl bg-slate-900/95 text-white backdrop-blur-md border border-blue-500/40 shadow-2xl text-[11px] space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between text-blue-400 font-bold">
              <div className="flex items-center space-x-1.5">
                <Ruler className="w-3.5 h-3.5" />
                <span>Scale Comparison</span>
              </div>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                Metric + Imperial
              </span>
            </div>
            <div className="text-[10px] text-slate-200 font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Person Height:</span>
                <span className="font-bold text-amber-400">1.80 m (5 ft 11 in)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valance Clearance:</span>
                <span className="font-bold text-emerald-400">{cal.valanceClearance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Peak Apex Height:</span>
                <span className="font-bold text-sky-400">{cal.peakApex}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Booth Footprint:</span>
                <span className="font-semibold text-slate-300">{modelMeta.dimensions}</span>
              </div>
            </div>
          </div>
        )}

        {/* Exploded View 3-Tier Layer Annotation Legend */}
        {isExploded && (
          <div className="pointer-events-auto px-3 py-2.5 rounded-2xl bg-slate-900/95 text-white backdrop-blur-md border border-amber-500/40 shadow-2xl text-[11px] space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between text-amber-400 font-black text-[10px] uppercase tracking-wider">
              <span>Exploded Mechanical Assembly</span>
              <span className="text-white/60">3 Tiers</span>
            </div>
            <div className="text-[10px] font-mono space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Tier 3: 600D Weather-Seal Canopy Top (+{cal.liftOffset.toFixed(2)}m)</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Tier 2: Accordion Scissor Lattice Mechanism (+{(cal.liftOffset * 0.4).toFixed(2)}m)</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span>Tier 1: Telescoping Upright Legs & Footpads (0.00m)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Orbit Navigation Guidance & Spin Controls */}
      <div className="absolute bottom-4 inset-x-0 z-10 flex items-center justify-between px-6 pointer-events-none">
        <div className="pointer-events-auto px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm text-[11px] text-slate-500 font-medium">
          Drag to Orbit • Scroll to Zoom • Click 3D Parts to Inspect
        </div>

        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            onClick={toggleAutoRotate}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all shadow-sm text-xs font-bold ${
              isAutoRotating
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
            <span>360° Spin</span>
          </button>

          <button
            onClick={() => rotateToSide('front')}
            title="Reset Perspective"
            className="p-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:bg-white shadow-sm transition-all"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
            className="p-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:bg-white shadow-sm transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Interactive 3D Part Inspection Modal */}
      {inspectedPart && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {inspectedPart.category}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  {inspectedPart.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectedPart(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {inspectedPart.description}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              {inspectedPart.specs.map((s, idx) => (
                <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">
                    {s.label}
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setInspectedPart(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-all"
            >
              Close Technical Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
