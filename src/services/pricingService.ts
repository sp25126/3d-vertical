import { TentConfig, PricingBreakdown, ZoneId } from '../types/configurator'
import { TENT_MODELS, FRAME_TYPES, ACCESSORIES, ZONES_METADATA } from '../constants/tentData'

/**
 * Service simulating remote ERP / Shopify Cart calculation API
 */
class PricingService {
  private cache: Map<string, PricingBreakdown> = new Map()

  /**
   * Asynchronously calculates real-time price based on tent configuration
   */
  async calculatePrice(config: TentConfig): Promise<PricingBreakdown> {
    // Generate deterministic hash for cache
    const cacheKey = this.serializeConfig(config)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // Simulate network API latency (50-100ms)
    await new Promise((resolve) => setTimeout(resolve, 80))

    const model = TENT_MODELS[config.modelId]
    const basePrice = model ? model.basePrice : 899

    // Frame type delta
    const frame = FRAME_TYPES[config.frameType]
    const frameUpgradeCost = frame ? frame.priceDelta : 0

    // Customization zones print cost
    let printTotal = 0
    let customizedZonesCount = 0

    Object.entries(config.zones).forEach(([zoneKey, zone]) => {
      const zoneId = zoneKey as ZoneId
      if (zone.elements.length > 0) {
        customizedZonesCount += 1
        const meta = ZONES_METADATA[zoneId]
        printTotal += meta ? meta.printCost : 40
      }
    })

    // Accessories cost
    let accessoriesTotal = 0
    config.accessories.forEach((accId) => {
      const item = ACCESSORIES.find((a) => a.id === accId)
      if (item) {
        accessoriesTotal += item.price
      }
    })

    const subtotal = basePrice + frameUpgradeCost + printTotal + accessoriesTotal
    const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100 // 8% estimated sales tax
    const finalTotal = subtotal + estimatedTax

    const breakdown: PricingBreakdown = {
      basePrice,
      printCostPerZone: 45,
      customizedZonesCount,
      printTotal,
      frameUpgradeCost,
      accessoriesTotal,
      subtotal,
      estimatedTax,
      finalTotal
    }

    this.cache.set(cacheKey, breakdown)
    return breakdown
  }

  private serializeConfig(config: TentConfig): string {
    const customizedZoneSummary = Object.entries(config.zones)
      .map(([k, v]) => `${k}:${v.elements.length}:${v.backgroundColor || ''}`)
      .join('|')
    const accessoriesSummary = [...config.accessories].sort().join(',')
    return `${config.modelId}__${config.frameType}__${config.fabricBaseColor}__${customizedZoneSummary}__${accessoriesSummary}`
  }
}

export const pricingService = new PricingService()
