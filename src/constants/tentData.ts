import { ProductModelId, ZoneId, AccessoryItem, FrameType } from '../types/configurator'

export interface ModelMetadata {
  id: ProductModelId
  name: string
  dimensions: string
  basePrice: number // Active base price
  basePriceINR: number
  basePriceUSD: number
  hsnCode: string
  glbPath: string
  scale: [number, number, number]
  features: string[]
}

export const TENT_MODELS: Record<ProductModelId, ModelMetadata> = {
  '5x5': {
    id: '5x5',
    name: "5' x 5' Compact Pop-Up Canopy",
    dimensions: "5ft x 5ft (1.5m x 1.5m)",
    basePrice: 11999,
    basePriceINR: 11999,
    basePriceUSD: 599,
    hsnCode: '6306 22 00',
    glbPath: '/models/tent_5x5.glb',
    scale: [1, 1, 1],
    features: ['Instant 60s pop-up setup', '600D PU waterproof polyester', 'Heavy-duty truss construction']
  },
  '6.5x6.5': {
    id: '6.5x6.5',
    name: "6.5' x 6.5' Medium Event Canopy",
    dimensions: "6.5ft x 6.5ft (2.0m x 2.0m)",
    basePrice: 14499,
    basePriceINR: 14499,
    basePriceUSD: 749,
    hsnCode: '6306 22 00',
    glbPath: '/models/tent_6.5x6.5.glb',
    scale: [1.31, 1.15, 1.31],
    features: ['Mid-tier footprint', 'Reinforced truss joints', 'UV50+ & fire-retardant fabric']
  },
  '8x8': {
    id: '8x8',
    name: "8' x 8' Heavy-Duty Commercial Canopy",
    dimensions: "8ft x 8ft (2.4m x 2.4m)",
    basePrice: 16999,
    basePriceINR: 16999,
    basePriceUSD: 899,
    hsnCode: '6306 22 00',
    glbPath: '/models/tent_8x8.glb',
    scale: [1, 1, 1],
    features: ['High-traffic trade show spec', 'Hexagonal leg profiles', 'Lifetime frame warranty']
  },
  '10x10': {
    id: '10x10',
    name: "10' x 10' Flagship Pro Canopy",
    dimensions: "10ft x 10ft (3.0m x 3.0m)",
    basePrice: 19999,
    basePriceINR: 19999,
    basePriceUSD: 1049,
    hsnCode: '6306 22 00',
    glbPath: '/models/tent_8x8.glb',
    scale: [1.25, 1.25, 1.25],
    features: ['Industry standard 10x10 footprint', 'Edge-to-edge 4K dye-sublimation print', 'Lifetime frame warranty']
  },
  custom: {
    id: 'custom',
    name: 'Custom Engineered Canopy',
    dimensions: 'Custom Width x Depth',
    basePrice: 19999,
    basePriceINR: 19999,
    basePriceUSD: 1049,
    hsnCode: '6306 22 00',
    glbPath: '/models/tent_8x8.glb',
    scale: [1.25, 1.25, 1.25],
    features: ['Bespoke commercial sizing', 'Continuous dynamic structural scaling', 'Lifetime custom truss warranty']
  }
}

export const FRAME_TYPES: Record<FrameType, {
  name: string
  priceDelta: number
  priceDeltaINR: number
  priceDeltaUSD: number
  hsnCode: string
  desc: string
  badge: string
}> = {
  commercial_steel: {
    name: 'Commercial White Steel Frame',
    priceDelta: 0,
    priceDeltaINR: 0,
    priceDeltaUSD: 0,
    hsnCode: '7326 90 99',
    desc: 'Heavy-duty steel with rust-resistant powder coat finish (52 lbs)',
    badge: 'Standard'
  },
  heavy_duty_aluminum: {
    name: 'Heavy-Duty 50mm Hex Aluminum Frame',
    priceDelta: 3500,
    priceDeltaINR: 3500,
    priceDeltaUSD: 120,
    hsnCode: '7610 90 90',
    desc: '40% lighter, corrosion-proof, 50mm hexagonal aircraft-grade alloy (38 lbs)',
    badge: 'Pro Upgrade'
  }
}

export const PRESET_COLORS = [
  { name: 'MVP Gold / Amber', hex: '#F6AF2D' },
  { name: 'Royal Navy Blue', hex: '#1E3A8A' },
  { name: 'Bright Crimson', hex: '#DC2626' },
  { name: 'Forest Green', hex: '#15803D' },
  { name: 'Midnight Black', hex: '#18181B' },
  { name: 'Arctic White', hex: '#F8FAFC' },
  { name: 'Slate Grey', hex: '#475569' },
  { name: 'Electric Cyan', hex: '#0284C7' },
  { name: 'Deep Purple', hex: '#6D28D9' },
  { name: 'Sunset Orange', hex: '#EA580C' }
]

export const ACCESSORIES: AccessoryItem[] = [
  // --- Modular Fabric Walls & Rail Skirts (MVP Visuals Architecture) ---
  {
    id: 'wall_back_full',
    name: 'Full Back Wall (Backdrop Enclosure)',
    description: 'Seamless 600D weatherproof polyester full-height back wall with heavy-duty velcro leg straps.',
    price: 3499,
    priceINR: 3499,
    priceUSD: 179,
    hsnCode: '6306 90 00',
    category: 'wall'
  },
  {
    id: 'wall_left_full',
    name: 'Full Side Wall (Left Flank)',
    description: 'Full-height weatherproof side enclosure with reinforced corner seams and frame attachment loops.',
    price: 2750,
    priceINR: 2750,
    priceUSD: 139,
    hsnCode: '6306 90 00',
    category: 'wall'
  },
  {
    id: 'wall_right_full',
    name: 'Full Side Wall (Right Flank)',
    description: 'Full-height weatherproof side enclosure with reinforced corner seams and frame attachment loops.',
    price: 2750,
    priceINR: 2750,
    priceUSD: 139,
    hsnCode: '6306 90 00',
    category: 'wall'
  },
  {
    id: 'wall_left_half',
    name: 'Half Side Wall with Mounting Rail (Left)',
    description: '0.95m rail skirt with aircraft-grade aluminum crossbar and leg clamp collar hardware.',
    price: 2150,
    priceINR: 2150,
    priceUSD: 110,
    hsnCode: '6306 90 00',
    category: 'wall'
  },
  {
    id: 'wall_right_half',
    name: 'Half Side Wall with Mounting Rail (Right)',
    description: '0.95m rail skirt with aircraft-grade aluminum crossbar and leg clamp collar hardware.',
    price: 2150,
    priceINR: 2150,
    priceUSD: 110,
    hsnCode: '6306 90 00',
    category: 'wall'
  },
  {
    id: 'wall_front_half',
    name: 'Front Counter Skirt with Mounting Rail',
    description: 'Half-height registration/vending counter skirt with aluminum crossbar and quick-release clamps.',
    price: 2150,
    priceINR: 2150,
    priceUSD: 110,
    hsnCode: '6306 90 00',
    category: 'wall'
  },
  // --- Anchoring & Transportation Hardware ---
  {
    id: 'sandbags',
    name: 'Heavy-Duty Sandbag Weights (Set of 4)',
    description: 'Holds up to 120 lbs total to anchor canopy in winds up to 28 mph.',
    price: 1250,
    priceINR: 1250,
    priceUSD: 49,
    hsnCode: '6306 90 00',
    category: 'hardware'
  },
  {
    id: 'wheelbag',
    name: 'All-Terrain Wheeled Transit Roller Bag',
    description: 'Rugged 1680D ballistic nylon with smooth urethane wheels.',
    price: 1850,
    priceINR: 1850,
    priceUSD: 69,
    hsnCode: '4202 92 00',
    category: 'hardware'
  },
  {
    id: 'stakes',
    name: 'Heavy-Duty Spiral Ground Stakes & Ropes',
    description: 'Four 12-inch zinc-plated steel spiral stakes and tie-down guy ropes.',
    price: 750,
    priceINR: 750,
    priceUSD: 29,
    hsnCode: '7326 90 99',
    category: 'hardware'
  }
]

export interface ZoneMeta {
  id: ZoneId
  label: string
  shortLabel: string
  side: 'front' | 'right' | 'back' | 'left'
  group: 'peak' | 'valance'
  azimuthAngle: number
  polarAngle: number
  distance: number
  printCost: number
  printCostINR: number
  printCostUSD: number
  hsnCode: string
}

export const ZONES_METADATA: Record<ZoneId, ZoneMeta> = {
  peak_front: {
    id: 'peak_front',
    label: 'Front Peak (Roof 1)',
    shortLabel: 'Front Peak',
    side: 'front',
    group: 'peak',
    azimuthAngle: 0,
    polarAngle: Math.PI / 2.3,
    distance: 3.5,
    printCost: 950,
    printCostINR: 950,
    printCostUSD: 45,
    hsnCode: '9989 12'
  },
  peak_right: {
    id: 'peak_right',
    label: 'Right Peak (Roof 2)',
    shortLabel: 'Right Peak',
    side: 'right',
    group: 'peak',
    azimuthAngle: Math.PI / 2,
    polarAngle: Math.PI / 2.3,
    distance: 3.5,
    printCost: 950,
    printCostINR: 950,
    printCostUSD: 45,
    hsnCode: '9989 12'
  },
  peak_back: {
    id: 'peak_back',
    label: 'Back Peak (Roof 3)',
    shortLabel: 'Back Peak',
    side: 'back',
    group: 'peak',
    azimuthAngle: Math.PI,
    polarAngle: Math.PI / 2.3,
    distance: 3.5,
    printCost: 950,
    printCostINR: 950,
    printCostUSD: 45,
    hsnCode: '9989 12'
  },
  peak_left: {
    id: 'peak_left',
    label: 'Left Peak (Roof 4)',
    shortLabel: 'Left Peak',
    side: 'left',
    group: 'peak',
    azimuthAngle: -Math.PI / 2,
    polarAngle: Math.PI / 2.3,
    distance: 3.5,
    printCost: 950,
    printCostINR: 950,
    printCostUSD: 45,
    hsnCode: '9989 12'
  },
  valance_front: {
    id: 'valance_front',
    label: 'Front Valance (Drop 1)',
    shortLabel: 'Front Valance',
    side: 'front',
    group: 'valance',
    azimuthAngle: 0,
    polarAngle: Math.PI / 2.15,
    distance: 3.2,
    printCost: 550,
    printCostINR: 550,
    printCostUSD: 25,
    hsnCode: '9989 12'
  },
  valance_right: {
    id: 'valance_right',
    label: 'Right Valance (Drop 2)',
    shortLabel: 'Right Valance',
    side: 'right',
    group: 'valance',
    azimuthAngle: Math.PI / 2,
    polarAngle: Math.PI / 2.15,
    distance: 3.2,
    printCost: 550,
    printCostINR: 550,
    printCostUSD: 25,
    hsnCode: '9989 12'
  },
  valance_back: {
    id: 'valance_back',
    label: 'Back Valance (Drop 3)',
    shortLabel: 'Back Valance',
    side: 'back',
    group: 'valance',
    azimuthAngle: Math.PI,
    polarAngle: Math.PI / 2.15,
    distance: 3.2,
    printCost: 550,
    printCostINR: 550,
    printCostUSD: 25,
    hsnCode: '9989 12'
  },
  valance_left: {
    id: 'valance_left',
    label: 'Left Valance (Drop 4)',
    shortLabel: 'Left Valance',
    side: 'left',
    group: 'valance',
    azimuthAngle: -Math.PI / 2,
    polarAngle: Math.PI / 2.15,
    distance: 3.2,
    printCost: 550,
    printCostINR: 550,
    printCostUSD: 25,
    hsnCode: '9989 12'
  }
}

export const FONT_OPTIONS = [
  { name: 'Modern Sans (Inter)', family: 'Inter, sans-serif' },
  { name: 'Bold Headline (Montserrat)', family: 'Montserrat, sans-serif' },
  { name: 'Impact Condensed (Bebas Neue)', family: '"Bebas Neue", cursive' },
  { name: 'Athletic Block (Oswald)', family: 'Oswald, sans-serif' },
  { name: 'Script Casual (Pacifico)', family: 'Pacifico, cursive' }
]
