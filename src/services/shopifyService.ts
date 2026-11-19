import { TentConfig, PricingBreakdown, ShopifyCartLineItem } from '../types/configurator'
import { TENT_MODELS, FRAME_TYPES, ACCESSORIES, ZONES_METADATA } from '../constants/tentData'

export interface ShopifyCartResponse {
  success: boolean
  cartId: string
  items: ShopifyCartLineItem[]
  checkoutUrl: string
  totalPrice: number
}

class ShopifyService {
  private localCart: ShopifyCartLineItem[] = []

  /**
   * Adds the configured product to Shopify cart
   */
  async addToCart(
    config: TentConfig,
    pricing: PricingBreakdown,
    previewImageUrl?: string
  ): Promise<ShopifyCartResponse> {
    const model = TENT_MODELS[config.modelId]
    const frame = FRAME_TYPES[config.frameType]

    // Collect customized locations
    const printedZones: string[] = []
    Object.entries(config.zones).forEach(([k, zone]) => {
      if (zone.elements.length > 0) {
        const meta = ZONES_METADATA[zone.zoneId]
        printedZones.push(meta ? meta.label : zone.zoneId)
      }
    })

    // Collect accessories names
    const accessoriesNames = config.accessories
      .map((accId) => ACCESSORIES.find((a) => a.id === accId)?.name)
      .filter(Boolean)

    const configId = `CFG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const isINR = pricing.currency === 'INR'

    const lineItem: ShopifyCartLineItem = {
      id: `item-${Date.now()}`,
      variantId: `gid://shopify/ProductVariant/${config.modelId.replace('.', '_')}`,
      title: `${model.name} — Custom Print`,
      quantity: 1,
      price: pricing.finalTotal,
      properties: {
        'Canopy Dimensions': model.dimensions,
        'Frame Type': frame.name,
        'Canopy Color': config.fabricBaseColor,
        'Customized Zones': printedZones.length > 0 ? printedZones.join(', ') : 'None (Solid Blank)',
        'Included Accessories': accessoriesNames.length > 0 ? accessoriesNames.join(', ') : 'None',
        'Tax Compliance': isINR ? 'GST 18% (HSN 6306 22 00)' : 'Standard Sales Tax Included',
        '_config_id': configId,
        '_currency': pricing.currency,
        '_taxable_base_price': `${pricing.currencySymbol}${pricing.basePrice.toFixed(2)}`,
        '_print_cost': `${pricing.currencySymbol}${pricing.printTotal.toFixed(2)}`,
        '_accessories_cost': `${pricing.currencySymbol}${pricing.accessoriesTotal.toFixed(2)}`,
        '_tax_amount': `${pricing.currencySymbol}${pricing.totalGst.toFixed(2)}`,
        '_hsn_sac_codes': '63062200, 998912',
        '_preview_thumbnail': previewImageUrl || '',
        '_created_at': new Date().toISOString()
      }
    }

    this.localCart = [lineItem, ...this.localCart]

    // Dispatch iframe event to parent window if inside an iframe
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'SHOPIFY_CONFIGURATOR_ADD_TO_CART',
          payload: {
            lineItem,
            pricing,
            configId
          }
        },
        '*'
      )
    }

    return {
      success: true,
      cartId: `gid://shopify/Cart/${configId}`,
      items: this.localCart,
      checkoutUrl: `https://checkout.shopify.com/mock-checkout?cart=${configId}`,
      totalPrice: this.localCart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }
  }

  getCart(): ShopifyCartLineItem[] {
    return this.localCart
  }

  clearCart(): void {
    this.localCart = []
  }
}

export const shopifyService = new ShopifyService()
