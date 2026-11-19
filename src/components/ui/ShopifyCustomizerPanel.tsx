import React, { useState } from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import {
  TENT_MODELS,
  FRAME_TYPES,
  PRESET_COLORS,
  ACCESSORIES,
  ZONES_METADATA
} from '../../constants/tentData'
import { ProductModelId, FrameType, ZoneId } from '../../types/configurator'
import { ZoneEditor2D } from '../canvas2d/ZoneEditor2D'
import {
  Star,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  FileDown,
  ShoppingBag,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  Receipt,
  ChevronRight,
  PanelRightClose
} from 'lucide-react'
import { formatCurrency, formatInvoiceAmount } from '../../utils/gstUtils'

interface ShopifyCustomizerPanelProps {
  onAddToCart: () => void
  onExportPdf: () => void
  onClose?: () => void
}

type SideKey = 'front' | 'right' | 'back' | 'left'

export const ShopifyCustomizerPanel: React.FC<ShopifyCustomizerPanelProps> = ({
  onAddToCart,
  onExportPdf,
  onClose
}) => {
  const {
    config,
    pricing,
    currency,
    isPricingLoading,
    activeZoneId,
    setActiveZoneId,
    setModelId,
    setFrameType,
    setFabricBaseColor,
    toggleAccessory
  } = useConfiguratorStore()

  // Active side tab
  const [selectedSide, setSelectedSide] = useState<SideKey>('front')
  // Sub-surface within the side (peak or valance)
  const [activeSurfaceType, setActiveSurfaceType] = useState<'peak' | 'valance'>('peak')
  const [isGstDetailsOpen, setIsGstDetailsOpen] = useState(false)

  const handleSelectSide = (side: SideKey, type: 'peak' | 'valance' = 'peak') => {
    setSelectedSide(side)
    setActiveSurfaceType(type)
    const targetZoneId = `${type}_${side}` as ZoneId
    setActiveZoneId(targetZoneId)
  }

  const model = TENT_MODELS[config.modelId]
  const currentZoneId = `${activeSurfaceType}_${selectedSide}` as ZoneId
  const currentZoneCustomized = (config.zones[currentZoneId]?.elements.length || 0) > 0
  const isINR = currency === 'INR'

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-y-auto">
      {/* Product Header / Title Block (Shopify PDP standard) */}
      <div className="p-6 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
            <span>Commercial Canopies</span>
            <span>/</span>
            <span className="text-slate-900 font-semibold">{model.name}</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center space-x-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-all"
              title="Close panel for full 3D viewport"
            >
              <span>Collapse</span>
              <PanelRightClose className="w-3.5 h-3.5 text-slate-600" />
            </button>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
          {model.name}
        </h1>

        {/* Social Proof & Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1 text-amber-500">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span className="font-bold text-slate-900 ml-1">4.9</span>
            <span className="text-slate-500">(184 reviews)</span>
          </div>

          <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
            <Truck className="w-3.5 h-3.5" />
            <span>Free 2-Day Rush Production</span>
          </div>

          {isINR && (
            <div className="flex items-center space-x-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-200">
              <Receipt className="w-3 h-3" />
              <span>GST 18% Compliant (HSN 6306)</span>
            </div>
          )}
        </div>

        {/* Dynamic Price Display */}
        <div className="flex items-baseline space-x-3 pt-1">
          <span className="text-2xl font-black text-slate-900 font-mono">
            {isPricingLoading ? 'Calculating...' : formatCurrency(pricing.finalTotal, currency)}
          </span>
          <span className="text-xs text-slate-500">
            {isINR ? 'Includes 18% GST (CGST 9% + SGST 9%) • Free Shipping' : 'Tax included • Free ground shipping'}
          </span>
        </div>
      </div>

      {/* Main Customization Sections */}
      <div className="p-6 space-y-6 flex-1">
        {/* 1. Footprint Size */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
            1. Select Canopy Footprint
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(TENT_MODELS) as ProductModelId[]).map((mId) => {
              const m = TENT_MODELS[mId]
              const isSelected = config.modelId === mId
              const itemBase = isINR ? m.basePriceINR : m.basePriceUSD
              return (
                <button
                  key={mId}
                  onClick={() => setModelId(mId)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  <span className="text-xs font-black block">{mId}</span>
                  <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    from {formatCurrency(itemBase, currency)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Frame Hardware */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
            2. Choose Frame Hardware
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(FRAME_TYPES) as FrameType[]).map((fKey) => {
              const frame = FRAME_TYPES[fKey]
              const isSelected = config.frameType === fKey
              const delta = isINR ? frame.priceDeltaINR : frame.priceDeltaUSD
              return (
                <button
                  key={fKey}
                  onClick={() => setFrameType(fKey)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-slate-900 ring-2 ring-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-900">{frame.name}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                      {frame.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{frame.desc}</p>
                  <div className="mt-2 text-xs font-mono font-bold text-slate-900">
                    {delta > 0 ? (
                      <span className="text-amber-600">+{formatCurrency(delta, currency)} Upgrade</span>
                    ) : (
                      <span className="text-slate-500">Included in Base</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Base Fabric Dye Color */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-900">
              3. Base Canopy Fabric Color
            </label>
            <span className="text-xs font-medium text-slate-500">
              {PRESET_COLORS.find((c) => c.hex.toLowerCase() === config.fabricBaseColor.toLowerCase())?.name || config.fabricBaseColor}
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {PRESET_COLORS.map((c) => {
              const isSelected = config.fabricBaseColor.toLowerCase() === c.hex.toLowerCase()
              return (
                <button
                  key={c.hex}
                  onClick={() => setFabricBaseColor(c.hex)}
                  title={c.name}
                  className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center ${
                    isSelected ? 'ring-2 ring-slate-900 ring-offset-2 scale-110 shadow-sm' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && <Check className={`w-3.5 h-3.5 ${c.hex === '#F8FAFC' ? 'text-slate-900' : 'text-white'}`} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* 4. Interactive 2D Prepress Surface Customizer */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
                4. Customize Print Surfaces (4 Peaks & 4 Valances)
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Edge-to-edge 4K dye sublimation on 600D heavy-duty polyester.
              </p>
            </div>

            {/* Customization Count Badge */}
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {pricing.customizedZonesCount} / 8 printed
            </span>
          </div>

          {/* 4-Way Side Selector (Front / Right / Back / Left) */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
            {(['front', 'right', 'back', 'left'] as SideKey[]).map((side) => {
              const isSelected = selectedSide === side
              const peakCount = config.zones[`peak_${side}` as ZoneId]?.elements.length || 0
              const valanceCount = config.zones[`valance_${side}` as ZoneId]?.elements.length || 0
              const totalLayers = peakCount + valanceCount

              return (
                <button
                  key={side}
                  onClick={() => handleSelectSide(side, activeSurfaceType)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold capitalize transition-all ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="block">{side}</span>
                  <span className={`text-[9px] block ${totalLayers > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                    {totalLayers > 0 ? `${totalLayers} artwork` : 'Blank'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Peak vs Valance Selector */}
          <div className="flex space-x-2 pt-1">
            <button
              onClick={() => handleSelectSide(selectedSide, 'peak')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                activeSurfaceType === 'peak'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Roof Peak (+{formatCurrency(isINR ? 950 : 45, currency)})
            </button>
            <button
              onClick={() => handleSelectSide(selectedSide, 'valance')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                activeSurfaceType === 'valance'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Drop Valance (+{formatCurrency(isINR ? 550 : 25, currency)})
            </button>
          </div>

          {/* Clean Embedded 2D Surface Editor */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-sm">
            <ZoneEditor2D />
          </div>
        </div>

        {/* 5. Accessories Add-ons */}
        <div className="space-y-2.5 pt-2 border-t border-slate-200">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
            5. Recommended Accessories
          </label>
          <div className="space-y-2">
            {ACCESSORIES.map((acc) => {
              const isSelected = config.accessories.includes(acc.id)
              const accPrice = isINR ? (acc.priceINR || acc.price) : (acc.priceUSD || acc.price)
              return (
                <button
                  key={acc.id}
                  onClick={() => toggleAccessory(acc.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="pr-3">
                    <span className="text-xs font-bold text-slate-900 block">{acc.name}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{acc.description}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-900">
                      +{formatCurrency(accPrice, currency)}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 6. GST Tax Analysis & Billing Schedule Breakdown (Collapsible) */}
        {isINR && (
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-3">
            <div
              onClick={() => setIsGstDetailsOpen(!isGstDetailsOpen)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold text-slate-900">
                  Government GST Tax Breakdown (18%)
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-blue-700 font-semibold">
                <span>{isGstDetailsOpen ? 'Hide' : 'View Tax Grid'}</span>
                {isGstDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </div>

            <div className="text-[11px] text-slate-600 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Taxable Value (Excl. Tax):</span>
                <span className="font-bold text-slate-900">{formatInvoiceAmount(pricing.subtotal, 'INR')}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (Central Tax @ 9%):</span>
                <span>{formatInvoiceAmount(pricing.cgstAmount, 'INR')}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (State Tax @ 9%):</span>
                <span>{formatInvoiceAmount(pricing.sgstAmount, 'INR')}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-blue-200 text-slate-900">
                <span>Total Tax (GST 18%):</span>
                <span className="text-blue-800">{formatInvoiceAmount(pricing.totalGst, 'INR')}</span>
              </div>
            </div>

            {isGstDetailsOpen && (
              <div className="pt-2 border-t border-blue-200 text-[10px] text-slate-500 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>HSN 6306 22 00 (Canopy Tent):</span>
                  <span>18% GST Applicable</span>
                </div>
                <div className="flex justify-between">
                  <span>HSN 9989 12 (Dye-Sub Printing):</span>
                  <span>18% GST Applicable</span>
                </div>
                <p className="text-[9.5px] text-slate-400 pt-1 italic font-sans">
                  * Official B2B Tax Invoice generated with valid 15-digit GSTIN, E-Way Bill & IRN on PDF export.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Shopify Purchase Actions Footer */}
      <div className="p-6 border-t border-slate-200 bg-white sticky bottom-0 shadow-lg space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Order Subtotal {isINR && '(Incl. 18% GST)'}</span>
          <span className="font-mono text-base font-black text-slate-900">
            {formatCurrency(pricing.finalTotal, currency)}
          </span>
        </div>

        <div className="flex space-x-2">
          {/* Add to Cart */}
          <button
            onClick={onAddToCart}
            className="flex-1 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-98"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart — {formatCurrency(pricing.finalTotal, currency)}</span>
          </button>

          {/* Export Spec PDF */}
          <button
            onClick={onExportPdf}
            title={isINR ? 'Download Government Approved GST Tax Invoice & Spec PDF' : 'Download Spec Sheet PDF'}
            className="py-3.5 px-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors flex items-center space-x-1"
          >
            <FileDown className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline text-[11px]">{isINR ? 'GST Bill' : 'PDF'}</span>
          </button>
        </div>

        {/* Guarantees */}
        <div className="flex items-center justify-center space-x-4 text-[10px] text-slate-500 pt-1">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lifetime Frame Warranty</span>
          </span>
          <span>•</span>
          <span>Prepress Proof Guaranteed</span>
          <span>•</span>
          <span>No Minimums</span>
        </div>
      </div>
    </div>
  )
}
