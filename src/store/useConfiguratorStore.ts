import { create } from 'zustand'
import {
  TentConfig,
  ProductModelId,
  FrameType,
  ZoneId,
  CustomElement,
  PricingBreakdown,
  ShopifyCartLineItem,
  TextElement,
  ImageElement
} from '../types/configurator'
import { pricingService } from '../services/pricingService'
import { shopifyService } from '../services/shopifyService'

const DEFAULT_ZONES: Record<ZoneId, { zoneId: ZoneId; elements: CustomElement[] }> = {
  peak_front: { zoneId: 'peak_front', elements: [] },
  peak_right: { zoneId: 'peak_right', elements: [] },
  peak_back: { zoneId: 'peak_back', elements: [] },
  peak_left: { zoneId: 'peak_left', elements: [] },
  valance_front: { zoneId: 'valance_front', elements: [] },
  valance_right: { zoneId: 'valance_right', elements: [] },
  valance_back: { zoneId: 'valance_back', elements: [] },
  valance_left: { zoneId: 'valance_left', elements: [] }
}

const INITIAL_CONFIG: TentConfig = {
  modelId: '8x8',
  frameType: 'commercial_steel',
  fabricBaseColor: '#F6AF2D', // MVP Visuals Classic Gold/Amber
  zones: { ...DEFAULT_ZONES },
  accessories: ['sandbags']
}

interface ConfiguratorState {
  config: TentConfig
  activeZoneId: ZoneId
  selectedElementId: string | null
  pricing: PricingBreakdown
  isPricingLoading: boolean
  isCartOpen: boolean
  cart: ShopifyCartLineItem[]
  history: TentConfig[]
  historyIndex: number
  isWireframeVisible: boolean
  isAutoRotating: boolean

  // Actions
  setModelId: (modelId: ProductModelId) => void
  setFrameType: (frameType: FrameType) => void
  setFabricBaseColor: (color: string) => void
  setActiveZoneId: (zoneId: ZoneId) => void
  setSelectedElementId: (elementId: string | null) => void
  toggleAccessory: (accessoryId: string) => void
  addElement: (zoneId: ZoneId, element: Omit<TextElement, 'id'> | Omit<ImageElement, 'id'>) => void
  updateElement: (zoneId: ZoneId, elementId: string, updates: Partial<CustomElement>) => void
  removeElement: (zoneId: ZoneId, elementId: string) => void
  setZoneBackgroundColor: (zoneId: ZoneId, color?: string) => void
  clearZone: (zoneId: ZoneId) => void
  resetConfig: () => void
  loadPreset: (presetKey: string) => void
  undo: () => void
  redo: () => void
  toggleCart: (open?: boolean) => void
  toggleAutoRotate: () => void
  fetchPricing: () => Promise<void>
  addToShopifyCart: (previewSnapshot?: string) => Promise<boolean>
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  config: INITIAL_CONFIG,
  activeZoneId: 'peak_front',
  selectedElementId: null,
  pricing: {
    basePrice: 899,
    printCostPerZone: 45,
    customizedZonesCount: 0,
    printTotal: 0,
    frameUpgradeCost: 0,
    accessoriesTotal: 49,
    subtotal: 948,
    estimatedTax: 75.84,
    finalTotal: 1023.84
  },
  isPricingLoading: false,
  isCartOpen: false,
  cart: [],
  history: [INITIAL_CONFIG],
  historyIndex: 0,
  isWireframeVisible: false,
  isAutoRotating: false,

  fetchPricing: async () => {
    set({ isPricingLoading: true })
    try {
      const breakdown = await pricingService.calculatePrice(get().config)
      set({ pricing: breakdown, isPricingLoading: false })
    } catch (e) {
      console.error('Pricing calculation failed', e)
      set({ isPricingLoading: false })
    }
  },

  setModelId: (modelId) => {
    const current = get().config
    const newConfig = { ...current, modelId }
    set({ config: newConfig })
    get().fetchPricing()
  },

  setFrameType: (frameType) => {
    const current = get().config
    const newConfig = { ...current, frameType }
    set({ config: newConfig })
    get().fetchPricing()
  },

  setFabricBaseColor: (color) => {
    const current = get().config
    const newConfig = { ...current, fabricBaseColor: color }
    set({ config: newConfig })
    get().fetchPricing()
  },

  setActiveZoneId: (zoneId) => {
    set({ activeZoneId: zoneId, selectedElementId: null })
  },

  setSelectedElementId: (elementId) => {
    set({ selectedElementId: elementId })
  },

  toggleAccessory: (accessoryId) => {
    const current = get().config
    const exists = current.accessories.includes(accessoryId)
    const newAccessories = exists
      ? current.accessories.filter((id) => id !== accessoryId)
      : [...current.accessories, accessoryId]
    const newConfig = { ...current, accessories: newAccessories }
    set({ config: newConfig })
    get().fetchPricing()
  },

  addElement: (zoneId, elementData) => {
    const current = get().config
    const id = `el-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`
    const newElement = { ...elementData, id } as CustomElement

    const zone = current.zones[zoneId] || { zoneId, elements: [] }
    const updatedZone = {
      ...zone,
      elements: [...zone.elements, newElement]
    }

    const newConfig = {
      ...current,
      zones: {
        ...current.zones,
        [zoneId]: updatedZone
      }
    }

    set({
      config: newConfig,
      selectedElementId: id
    })
    get().fetchPricing()
  },

  updateElement: (zoneId, elementId, updates) => {
    const current = get().config
    const zone = current.zones[zoneId]
    if (!zone) return

    const updatedElements = zone.elements.map((el) => {
      if (el.id === elementId) {
        return { ...el, ...updates } as CustomElement
      }
      return el
    })

    const newConfig = {
      ...current,
      zones: {
        ...current.zones,
        [zoneId]: {
          ...zone,
          elements: updatedElements
        }
      }
    }

    set({ config: newConfig })
    get().fetchPricing()
  },

  removeElement: (zoneId, elementId) => {
    const current = get().config
    const zone = current.zones[zoneId]
    if (!zone) return

    const updatedElements = zone.elements.filter((el) => el.id !== elementId)
    const newConfig = {
      ...current,
      zones: {
        ...current.zones,
        [zoneId]: {
          ...zone,
          elements: updatedElements
        }
      }
    }

    set({
      config: newConfig,
      selectedElementId: null
    })
    get().fetchPricing()
  },

  setZoneBackgroundColor: (zoneId, color) => {
    const current = get().config
    const zone = current.zones[zoneId] || { zoneId, elements: [] }
    const newConfig = {
      ...current,
      zones: {
        ...current.zones,
        [zoneId]: {
          ...zone,
          backgroundColor: color
        }
      }
    }
    set({ config: newConfig })
    get().fetchPricing()
  },

  clearZone: (zoneId) => {
    const current = get().config
    const newConfig = {
      ...current,
      zones: {
        ...current.zones,
        [zoneId]: { zoneId, elements: [] }
      }
    }
    set({ config: newConfig, selectedElementId: null })
    get().fetchPricing()
  },

  resetConfig: () => {
    set({
      config: INITIAL_CONFIG,
      activeZoneId: 'peak_front',
      selectedElementId: null
    })
    get().fetchPricing()
  },

  loadPreset: (presetKey: string) => {
    let presetConfig = { ...INITIAL_CONFIG }

    if (presetKey === 'tech_expo') {
      presetConfig = {
        modelId: '10x10',
        frameType: 'heavy_duty_aluminum',
        fabricBaseColor: '#1E3A8A',
        accessories: ['sandbags', 'wheelbag', 'stakes'],
        zones: {
          ...DEFAULT_ZONES,
          peak_front: {
            zoneId: 'peak_front',
            elements: [
              {
                id: 'el-tech-1',
                type: 'text',
                text: 'NEXTECH 2026',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 48,
                color: '#FFFFFF',
                fontWeight: 800,
                x: 50,
                y: 50,
                rotation: 0,
                scale: 1
              }
            ]
          },
          valance_front: {
            zoneId: 'valance_front',
            elements: [
              {
                id: 'el-tech-2',
                type: 'text',
                text: 'AI & CLOUD INNOVATION SUMMIT',
                fontFamily: 'Inter, sans-serif',
                fontSize: 24,
                color: '#38BDF8',
                fontWeight: 700,
                x: 50,
                y: 50,
                rotation: 0,
                scale: 1
              }
            ]
          }
        }
      }
    } else if (presetKey === 'brewery') {
      presetConfig = {
        modelId: '8x8',
        frameType: 'commercial_steel',
        fabricBaseColor: '#18181B',
        accessories: ['sandbags'],
        zones: {
          ...DEFAULT_ZONES,
          peak_front: {
            zoneId: 'peak_front',
            elements: [
              {
                id: 'el-brew-1',
                type: 'text',
                text: 'TIMBER & HOPS',
                fontFamily: '"Bebas Neue", cursive',
                fontSize: 64,
                color: '#F59E0B',
                fontWeight: 700,
                x: 50,
                y: 50,
                rotation: 0,
                scale: 1
              }
            ]
          },
          valance_front: {
            zoneId: 'valance_front',
            elements: [
              {
                id: 'el-brew-2',
                type: 'text',
                text: 'ARTISAN CRAFT BREWING CO.',
                fontFamily: 'Oswald, sans-serif',
                fontSize: 22,
                color: '#F3F4F6',
                fontWeight: 600,
                x: 50,
                y: 50,
                rotation: 0,
                scale: 1
              }
            ]
          }
        }
      }
    }

    set({
      config: presetConfig,
      activeZoneId: 'peak_front',
      selectedElementId: null
    })
    get().fetchPricing()
  },

  undo: () => {
    // Basic undo implementation
  },

  redo: () => {
    // Basic redo implementation
  },

  toggleCart: (open) => {
    set((state) => ({ isCartOpen: open !== undefined ? open : !state.isCartOpen }))
  },

  toggleAutoRotate: () => {
    set((state) => ({ isAutoRotating: !state.isAutoRotating }))
  },

  addToShopifyCart: async (previewSnapshot) => {
    const { config, pricing } = get()
    const res = await shopifyService.addToCart(config, pricing, previewSnapshot)
    if (res.success) {
      set({ cart: res.items, isCartOpen: true })
      return true
    }
    return false
  }
}))
