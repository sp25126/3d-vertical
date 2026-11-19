import { ProductModelId, ZoneId, AccessoryItem, FrameType } from '../types/configurator'

export interface ModelMetadata {
  id: ProductModelId
  name: string
  dimensions: string
  basePrice: number
  glbPath: string
  scale: [number, number, number]
  features: string[]
}

export const TENT_MODELS: Record<ProductModelId, ModelMetadata> = {
  '5x5': {
    id: '5x5',
    name: "5' x 5' Compact Pop-Up Canopy",
    dimensions: "5ft x 5ft (1.5m x 1.5m)",
    basePrice: 599,
    glbPath: '/models/tent_5x5.glb',
    scale: [1, 1, 1],
    features: ['Instant 60s setup', '600D UV-coated polyester', 'Commercial steel or aluminum']
  },
  '6.5x6.5': {
    id: '6.5x6.5',
    name: "6.5' x 6.5' Medium Event Canopy",
    dimensions: "6.5ft x 6.5ft (2.0m x 2.0m)",
    basePrice: 749,
    glbPath: '/models/tent_6.5x6.5.glb',
    scale: [1, 1, 1],
    features: ['Mid-tier footprint', 'Reinforced truss bars', 'Water-resistant & fire-rated']
  },
  '8x8': {
    id: '8x8',
    name: "8' x 8' Heavy-Duty Commercial Canopy",
    dimensions: "8ft x 8ft (2.4m x 2.4m)",
    basePrice: 899,
    glbPath: '/models/tent_8x8.glb',
    scale: [1, 1, 1],
    features: ['High-traffic trade show spec', 'Hexagonal leg profiles', 'Lifetime frame warranty']
  },
  '10x10': {
    id: '10x10',
    name: "10' x 10' Flagship Pro Canopy (MVP Spec)",
    dimensions: "10ft x 10ft (3.0m x 3.0m)",
    basePrice: 1049,
    glbPath: '/models/tent_8x8.glb', // Scaled 1.25x
    scale: [1.25, 1.25, 1.25],
    features: ['Industry gold-standard 10x10', 'Dye-sublimation 4K edge-to-edge', 'Lifetime warranty']
  }
}

export const FRAME_TYPES: Record<FrameType, { name: string; priceDelta: number; desc: string }> = {
  commercial_steel: {
    name: 'Commercial White Steel Frame',
    priceDelta: 0,
    desc: 'Heavy-duty steel with rust-resistant powder coat finish'
  },
  heavy_duty_aluminum: {
    name: 'Heavy-Duty 50mm Hex Aluminum Frame',
    priceDelta: 120,
    desc: '40% lighter, corrosion-proof, extra-thick aircraft grade hexagonal legs'
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
  {
    id: 'sandbags',
    name: 'Heavy-Duty Sandbag Weight Bags (Set of 4)',
    description: 'Each bag holds up to 30 lbs of sand to anchor your canopy safely in winds up to 28 mph.',
    price: 49
  },
  {
    id: 'wheelbag',
    name: 'All-Terrain Wheeled Transit Roller Bag',
    description: 'Reinforced 1680D nylon with rugged sealed-bearing urethane wheels and side handles.',
    price: 69
  },
  {
    id: 'stakes',
    name: 'Pro Ground Anchor Steel Stakes & Guy Ropes',
    description: 'Four 12-inch spiral steel stakes and reflective high-tensile tie-downs.',
    price: 29
  },
  {
    id: 'half_wall_front',
    name: 'Front Half-Wall with Telescoping Support Bar',
    description: '36-inch high matching branded barrier wall perfect for ticketing or serving.',
    price: 89
  }
]

export interface ZoneMeta {
  id: ZoneId
  label: string
  shortLabel: string
  group: 'peak' | 'valance'
  cameraAngle: {
    azimuth: number // horizontal orbit angle in radians
    polar: number   // vertical orbit angle in radians
    distance: number
  }
  printCost: number
}

export const ZONES_METADATA: Record<ZoneId, ZoneMeta> = {
  peak_front: {
    id: 'peak_front',
    label: 'Front Peak (Peak 1)',
    shortLabel: 'Front Peak',
    group: 'peak',
    cameraAngle: { azimuth: 0, polar: Math.PI / 2.3, distance: 3.5 },
    printCost: 45
  },
  peak_right: {
    id: 'peak_right',
    label: 'Right Peak (Peak 2)',
    shortLabel: 'Right Peak',
    group: 'peak',
    cameraAngle: { azimuth: Math.PI / 2, polar: Math.PI / 2.3, distance: 3.5 },
    printCost: 45
  },
  peak_back: {
    id: 'peak_back',
    label: 'Back Peak (Peak 3)',
    shortLabel: 'Back Peak',
    group: 'peak',
    cameraAngle: { azimuth: Math.PI, polar: Math.PI / 2.3, distance: 3.5 },
    printCost: 45
  },
  peak_left: {
    id: 'peak_left',
    label: 'Left Peak (Peak 4)',
    shortLabel: 'Left Peak',
    group: 'peak',
    cameraAngle: { azimuth: -Math.PI / 2, polar: Math.PI / 2.3, distance: 3.5 },
    printCost: 45
  },
  valance_front: {
    id: 'valance_front',
    label: 'Front Valance (Drop 1)',
    shortLabel: 'Front Valance',
    group: 'valance',
    cameraAngle: { azimuth: 0, polar: Math.PI / 2.1, distance: 3.2 },
    printCost: 25
  },
  valance_right: {
    id: 'valance_right',
    label: 'Right Valance (Drop 2)',
    shortLabel: 'Right Valance',
    group: 'valance',
    cameraAngle: { azimuth: Math.PI / 2, polar: Math.PI / 2.1, distance: 3.2 },
    printCost: 25
  },
  valance_back: {
    id: 'valance_back',
    label: 'Back Valance (Drop 3)',
    shortLabel: 'Back Valance',
    group: 'valance',
    cameraAngle: { azimuth: Math.PI, polar: Math.PI / 2.1, distance: 3.2 },
    printCost: 25
  },
  valance_left: {
    id: 'valance_left',
    label: 'Left Valance (Drop 4)',
    shortLabel: 'Left Valance',
    group: 'valance',
    cameraAngle: { azimuth: -Math.PI / 2, polar: Math.PI / 2.1, distance: 3.2 },
    printCost: 25
  }
}

export const FONT_OPTIONS = [
  { name: 'Modern Sans (Inter)', family: 'Inter, sans-serif' },
  { name: 'Bold Headline (Montserrat)', family: 'Montserrat, sans-serif' },
  { name: 'Impact Condensed (Bebas Neue)', family: '"Bebas Neue", cursive' },
  { name: 'Athletic Block (Oswald)', family: 'Oswald, sans-serif' },
  { name: 'Script Casual (Pacifico)', family: 'Pacifico, cursive' }
]
