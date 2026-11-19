/**
 * ============================================================================
 * INTERACTIVE PRODUCT CONFIGURATOR — ENTERPRISE DATA ARCHITECTURE
 * Clean 3-Tier Layered Schema:
 *   1. Product Definition Schema (Catalog / Blueprint)
 *   2. Customer Session Configuration (Active State / Vector Layers)
 *   3. E-Commerce & Prepress Production Payload (Shopify / Factory RIP)
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// TIER 1: PRODUCT CATALOG DEFINITION SCHEMA (Reusable across all products)
// ----------------------------------------------------------------------------

export type ProductType = 'canopy_tent' | 'table_cover' | 'feather_flag' | 'backdrop_banner' | 'inflatable'

export interface Vector2D {
  x: number
  y: number
}

export interface Vector3D {
  x: number
  y: number
  z: number
}

export interface BoundingBox2D {
  uMin: number
  vMin: number
  uMax: number
  vMax: number
}

/**
 * Geometric socket on 3D mesh where accessories can be mounted
 */
export interface MeshSocketDefinition {
  socketId: string
  name: string
  parentBoneOrNode: string
  relativePosition: Vector3D
  relativeRotation: Vector3D
  compatibleAccessories: string[]
}

/**
 * Customizable surface definition on a 3D product
 */
export interface ProductSurfaceZone {
  zoneId: string
  name: string
  shortLabel: string
  group: 'peak' | 'valance' | 'wall' | 'flag'
  side: 'front' | 'right' | 'back' | 'left'
  // 2D Prepress Canvas dimensions (in mm or standard pixels)
  canvasDimensions: {
    width: number
    height: number
    bleedMargin: number // mm
    safeMargin: number  // mm
  }
  // 3D Texture Atlas UV mapping coordinates
  atlasMapping: {
    uCenter: number
    vCenter: number
    uWidth: number
    vHeight: number
    rotationRad: number
    flipY: boolean
  }
  // Camera focus viewpoint when customizing this surface
  cameraTarget: {
    azimuthRad: number
    polarRad: number
    distance: number
    targetOffset: Vector3D
  }
  basePrintFee: number
}

/**
 * Hardware material variant (e.g. Steel vs Aluminum frame)
 */
export interface HardwareVariantOption {
  variantId: string
  name: string
  sku: string
  weightLbs: number
  priceDelta: number
  pbrMaterial: {
    colorHex: string
    metalness: number
    roughness: number
    clearcoat?: number
  }
  features: string[]
  warrantyYears: number | 'lifetime'
}

/**
 * Complete Product Definition Schema (Driven by JSON/Headless CMS)
 */
export interface ProductDefinition {
  id: string
  productType: ProductType
  title: string
  slug: string
  description: string
  dimensions: {
    nominal: string // e.g. "10' x 10'"
    actualMeters: Vector3D
  }
  basePrice: number
  glbModelPath: string
  modelScale: Vector3D
  surfaces: ProductSurfaceZone[]
  hardwareOptions: HardwareVariantOption[]
  defaultColorHex: string
  paletteOptions: Array<{ name: string; hex: string; pantoneRef?: string }>
  sockets: MeshSocketDefinition[]
}

// ----------------------------------------------------------------------------
// TIER 2: CUSTOMER SESSION STATE (Active Customization & Artwork Layers)
// ----------------------------------------------------------------------------

export type LayerType = 'text' | 'image' | 'vector_shape' | 'badge'

export interface BaseArtworkLayer {
  id: string
  type: LayerType
  name: string
  visible: boolean
  locked: boolean
  opacity: number // 0 to 1
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay'
  // Normalized positioning [0..100%]
  position: Vector2D
  rotationDeg: number // -180 to 180
  scaleFactor: number // 0.2 to 3.0
  zIndex: number
}

export interface TextArtworkLayer extends BaseArtworkLayer {
  type: 'text'
  text: string
  fontFamily: string
  fontSizePx: number
  fontWeight: number | string
  fontStyle?: 'normal' | 'italic'
  colorHex: string
  letterSpacingPx?: number
  strokeColorHex?: string
  strokeWidthPx?: number
  textAlign?: 'left' | 'center' | 'right'
}

export interface ImageArtworkLayer extends BaseArtworkLayer {
  type: 'image'
  sourceUrl: string
  originalFileName: string
  naturalWidth: number
  naturalHeight: number
  aspectRatio: number
  fileSizeBytes: number
  isVector: boolean
}

export type ArtworkLayer = TextArtworkLayer | ImageArtworkLayer

export interface SurfaceCustomizationState {
  zoneId: string
  backgroundColorOverride?: string
  layers: ArtworkLayer[]
  isCustomized: boolean
  lastModifiedTimestamp: number
}

/**
 * Root Configurator Session State (Stored in Zustand / LocalStorage)
 */
export interface ConfiguratorSessionState {
  sessionId: string
  productId: string
  selectedVariantId: string
  selectedHardwareId: string
  baseFabricColorHex: string
  surfaces: Record<string, SurfaceCustomizationState>
  selectedAccessoryIds: string[]
  history: {
    past: Array<Record<string, SurfaceCustomizationState>>
    future: Array<Record<string, SurfaceCustomizationState>>
  }
}

// ----------------------------------------------------------------------------
// TIER 3: E-COMMERCE & PREPRESS PRODUCTION PAYLOAD (Shopify / Factory RIP)
// ----------------------------------------------------------------------------

export interface ProductionPrepressProof {
  zoneId: string
  zoneName: string
  vectorProofSvgDataUrl?: string
  rasterProofPngDataUrl: string
  printDimensionsMm: { width: number; height: number }
  spotColorsPantone: string[]
  elementsSummary: Array<{
    type: LayerType
    contentOrFileName: string
    coordinates: Vector2D
    scale: number
    rotation: number
  }>
}

export interface ShopifyLineItemProperties {
  // Visible line item properties in customer order email & cart
  'Canopy Dimensions': string
  'Frame Hardware': string
  'Fabric Base Color': string
  'Printed Surfaces': string
  'Included Accessories': string

  // Hidden prepress & factory fulfillment metadata
  '_config_id': string
  '_prepress_hash': string
  '_base_price_cents': number
  '_customization_fee_cents': number
  '_pdf_proof_url'?: string
  '_thumbnail_preview_data_url'?: string
  '_created_at_utc': string
}

export interface ShopifyOrderPayload {
  cartId: string
  variantId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  currency: string
  properties: ShopifyLineItemProperties
  prepressProofs: ProductionPrepressProof[]
}
