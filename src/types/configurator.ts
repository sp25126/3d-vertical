export type ProductModelId = '5x5' | '6.5x6.5' | '8x8' | '10x10'

export type FrameType = 'commercial_steel' | 'heavy_duty_aluminum'

export type CurrencyCode = 'INR' | 'USD'

export type ZoneId = 
  | 'peak_front' 
  | 'peak_back' 
  | 'peak_left' 
  | 'peak_right'
  | 'valance_front'
  | 'valance_back'
  | 'valance_left'
  | 'valance_right'

export type ElementType = 'text' | 'image'

export interface BaseElement {
  id: string
  type: ElementType
  x: number // center x in % (0 - 100)
  y: number // center y in % (0 - 100)
  rotation: number // degrees (-180 to 180)
  scale: number // relative scale factor (0.2 to 3.0)
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number // in px
  color: string
  fontWeight: string | number
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right'
  letterSpacing?: number
  strokeColor?: string
  strokeWidth?: number
}

export interface ImageElement extends BaseElement {
  type: 'image'
  url: string
  naturalWidth: number
  naturalHeight: number
  name: string
}

export type CustomElement = TextElement | ImageElement

export interface ZoneCustomization {
  zoneId: ZoneId
  backgroundColor?: string // optional override for specific zone, otherwise uses tent base color
  elements: CustomElement[]
}

export interface AccessoryItem {
  id: string
  name: string
  description: string
  price: number
  priceINR?: number
  priceUSD?: number
  hsnCode?: string
  imageUrl?: string
  included?: boolean
}

export interface TentConfig {
  modelId: ProductModelId
  frameType: FrameType
  fabricBaseColor: string
  zones: Record<ZoneId, ZoneCustomization>
  accessories: string[] // accessory IDs
}

export interface HsnSummaryItem {
  hsnCode: string
  description: string
  taxableValue: number
  cgstRate: number
  cgstAmount: number
  sgstRate: number
  sgstAmount: number
  totalTax: number
}

export interface PricingBreakdown {
  currency: CurrencyCode
  currencySymbol: string
  basePrice: number
  printCostPerZone: number
  customizedZonesCount: number
  printTotal: number
  frameUpgradeCost: number
  accessoriesTotal: number
  subtotal: number // Taxable Amount
  // Statutory Indian GST 18% (Rule 46 CGST Act)
  cgstRate: number // 9%
  cgstAmount: number
  sgstRate: number // 9%
  sgstAmount: number
  igstRate: number // 18%
  igstAmount: number
  totalGst: number
  estimatedTax: number // Backward compatibility alias for total tax
  finalTotal: number
  hsnSummary: HsnSummaryItem[]
}

export interface ShopifyCartLineItem {
  id: string
  variantId: string
  title: string
  quantity: number
  price: number
  properties: Record<string, string>
}

