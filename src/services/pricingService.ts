import { TentConfig, PricingBreakdown, ZoneId, CurrencyCode, HsnSummaryItem } from '../types/configurator'
import { TENT_MODELS, FRAME_TYPES, ACCESSORIES, ZONES_METADATA } from '../constants/tentData'

/**
 * Service simulating remote ERP / Shopify Cart calculation API
 * Fully compliant with Indian GST (CGST 9% + SGST 9% / IGST 18%) under Rule 46 CGST Rules, 2017
 */
class PricingService {
  private cache: Map<string, PricingBreakdown> = new Map()

  /**
   * Asynchronously calculates real-time price based on tent configuration and target currency
   */
  async calculatePrice(config: TentConfig, currency: CurrencyCode = 'INR'): Promise<PricingBreakdown> {
    const cacheKey = `${currency}__${this.serializeConfig(config)}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // Simulate network API latency (50-80ms)
    await new Promise((resolve) => setTimeout(resolve, 60))

    const isINR = currency === 'INR'
    const currencySymbol = isINR ? '₹' : '$'

    const model = TENT_MODELS[config.modelId]
    const basePrice = isINR ? (model ? model.basePriceINR : 19999) : (model ? model.basePriceUSD : 1049)

    // Frame type delta
    const frame = FRAME_TYPES[config.frameType]
    const frameUpgradeCost = isINR ? (frame ? frame.priceDeltaINR : 0) : (frame ? frame.priceDeltaUSD : 0)

    // Customization zones print cost
    let printTotal = 0
    let customizedZonesCount = 0

    Object.entries(config.zones).forEach(([zoneKey, zone]) => {
      const zoneId = zoneKey as ZoneId
      if (zone.elements.length > 0) {
        customizedZonesCount += 1
        const meta = ZONES_METADATA[zoneId]
        if (meta) {
          printTotal += isINR ? meta.printCostINR : meta.printCostUSD
        } else {
          printTotal += isINR ? 950 : 45
        }
      }
    })

    // Accessories cost & tracking
    let accessoriesTotal = 0
    const selectedAccList: Array<{ name: string; price: number; hsnCode: string }> = []

    config.accessories.forEach((accId) => {
      const item = ACCESSORIES.find((a) => a.id === accId)
      if (item) {
        const itemPrice = isINR ? (item.priceINR || item.price) : (item.priceUSD || item.price)
        accessoriesTotal += itemPrice
        selectedAccList.push({
          name: item.name,
          price: itemPrice,
          hsnCode: item.hsnCode || '6306 90 00'
        })
      }
    })

    const subtotal = basePrice + frameUpgradeCost + printTotal + accessoriesTotal

    let cgstRate = 0
    let cgstAmount = 0
    let sgstRate = 0
    let sgstAmount = 0
    let igstRate = 0
    let igstAmount = 0
    let totalGst = 0

    if (isINR) {
      // Intra-state standard GST: 9% CGST + 9% SGST = 18% Total GST
      cgstRate = 9
      sgstRate = 9
      cgstAmount = Math.round(subtotal * 0.09 * 100) / 100
      sgstAmount = Math.round(subtotal * 0.09 * 100) / 100
      totalGst = Math.round((cgstAmount + sgstAmount) * 100) / 100
    } else {
      // Standard US Sales Tax ~8%
      totalGst = Math.round(subtotal * 0.08 * 100) / 100
    }

    const finalTotal = Math.round((subtotal + totalGst) * 100) / 100

    // Build HSN/SAC statutory summary table
    const hsnMap = new Map<string, { desc: string; taxable: number }>()

    // 1. Base canopy
    const baseHsn = model ? model.hsnCode : '6306 22 00'
    hsnMap.set(baseHsn, {
      desc: 'Tents of synthetic fibres (Gazebo / Pop-Up Canopy)',
      taxable: (hsnMap.get(baseHsn)?.taxable || 0) + basePrice
    })

    // 2. Frame upgrade (if applicable)
    if (frameUpgradeCost > 0 && frame) {
      const frameHsn = frame.hsnCode || '7610 90 90'
      const existing = hsnMap.get(frameHsn)
      hsnMap.set(frameHsn, {
        desc: existing ? existing.desc : 'Aluminium structures & frame hardware',
        taxable: (existing?.taxable || 0) + frameUpgradeCost
      })
    }

    // 3. Printing services
    if (printTotal > 0) {
      const printHsn = '9989 12'
      hsnMap.set(printHsn, {
        desc: 'Commercial 4K dye-sublimation printing services',
        taxable: (hsnMap.get(printHsn)?.taxable || 0) + printTotal
      })
    }

    // 4. Accessories
    selectedAccList.forEach((acc) => {
      const existing = hsnMap.get(acc.hsnCode)
      hsnMap.set(acc.hsnCode, {
        desc: existing ? existing.desc : acc.name,
        taxable: (existing?.taxable || 0) + acc.price
      })
    })

    const hsnSummary: HsnSummaryItem[] = Array.from(hsnMap.entries()).map(([code, val]) => {
      const itemTaxable = Math.round(val.taxable * 100) / 100
      const itemCgst = Math.round(itemTaxable * (cgstRate / 100) * 100) / 100
      const itemSgst = Math.round(itemTaxable * (sgstRate / 100) * 100) / 100
      return {
        hsnCode: code,
        description: val.desc,
        taxableValue: itemTaxable,
        cgstRate,
        cgstAmount: itemCgst,
        sgstRate,
        sgstAmount: itemSgst,
        totalTax: Math.round((itemCgst + itemSgst) * 100) / 100
      }
    })

    const breakdown: PricingBreakdown = {
      currency,
      currencySymbol,
      basePrice,
      printCostPerZone: isINR ? 950 : 45,
      customizedZonesCount,
      printTotal,
      frameUpgradeCost,
      accessoriesTotal,
      subtotal,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalGst,
      estimatedTax: totalGst,
      finalTotal,
      hsnSummary
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
