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
  Info
} from 'lucide-react'

interface ShopifyCustomizerPanelProps {
  onAddToCart: () => void
  onExportPdf: () => void
}

type SideKey = 'front' | 'right' | 'back' | 'left'

export const ShopifyCustomizerPanel: React.FC<ShopifyCustomizerPanelProps> = ({
  onAddToCart,
  onExportPdf
}) => {
  const {
    config,
    pricing,
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

  const handleSelectSide = (side: SideKey, type: 'peak' | 'valance' = 'peak') => {
    setSelectedSide(side)
    setActiveSurfaceType(type)
    const targetZoneId = `${type}_${side}` as ZoneId
    setActiveZoneId(targetZoneId)
  }

  const model = TENT_MODELS[config.modelId]
  const currentZoneId = `${activeSurfaceType}_${selectedSide}` as ZoneId
  const currentZoneCustomized = (config.zones[currentZoneId]?.elements.length || 0) > 0

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-y-auto">
      {/* Product Header / Title Block (Shopify PDP standard) */}
      <div className="p-6 border-b border-slate-200 space-y-3">
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
          <span>Commercial Canopies</span>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{model.name}</span>
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
        </div>

        {/* Dynamic Price Display */}
        <div className="flex items-baseline space-x-3 pt-1">
          <span className="text-2xl font-black text-slate-900 font-mono">
            {isPricingLoading ? 'Calculating...' : `$${pricing.finalTotal.toFixed(2)}`}
          </span>
          <span className="text-xs text-slate-500">Tax included • Free ground shipping</span>
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
              return (
                <button
                  key={mId}
                  onClick={() => setModelId(mId)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 font-semibold bg-slate-50/50'
                  }`}
                >
                  <span className="text-xs block">{mId}</span>
                  <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    ${m.basePrice}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Hardware Frame */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
            2. Choose Frame Hardware
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(Object.keys(FRAME_TYPES) as FrameType[]).map((fKey) => {
              const frame = FRAME_TYPES[fKey]
              const isSelected = config.frameType === fKey
              return (
                <button
                  key={fKey}
                  onClick={() => setFrameType(fKey)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{frame.name}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-semibold">
                      {frame.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1 leading-relaxed">
                    {frame.desc}
                  </span>
                  {frame.priceDelta > 0 && (
                    <span className="text-[11px] font-bold text-amber-600 block mt-1.5 font-mono">
                      +${frame.priceDelta}.00 Upgrade
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Base Fabric Dye Color */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-900">
              3. Canopy Base Fabric Color
            </label>
            <span className="text-xs font-mono font-semibold text-slate-600">
              {PRESET_COLORS.find((c) => c.hex.toLowerCase() === config.fabricBaseColor.toLowerCase())?.name || config.fabricBaseColor}
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {PRESET_COLORS.map((c) => {
              const isSelected = config.fabricBaseColor.toLowerCase() === c.hex.toLowerCase()
              return (
                <button
                  key={c.hex}
                  onClick={() => setFabricBaseColor(c.hex)}
                  title={c.name}
                  className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-sm'
                      : 'border-slate-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && <Check className={`w-3.5 h-3.5 ${c.hex === '#F8FAFC' ? 'text-slate-900' : 'text-white'}`} />}
                </button>
              )
            })}

            {/* Custom Color Input */}
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
              <input
                type="color"
                value={config.fabricBaseColor}
                onChange={(e) => setFabricBaseColor(e.target.value)}
                className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer bg-transparent"
                title="Custom Pantone Color"
              />
              <span className="text-[10px] text-slate-500 font-mono">Custom</span>
            </div>
          </div>
        </div>

        {/* 4. Interactive Surface Customizer (Rotates model & opens clean editor) */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
                4. Customize Product Surfaces
              </label>
              <span className="text-[11px] text-slate-500">
                Click any side to rotate the 3D model and add your logos or text.
              </span>
            </div>
          </div>

          {/* 4 Sides Tabs */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {(['front', 'right', 'back', 'left'] as SideKey[]).map((side) => {
              const isSelected = selectedSide === side
              const peakCount = config.zones[`peak_${side}` as ZoneId]?.elements.length || 0
              const valanceCount = config.zones[`valance_${side}` as ZoneId]?.elements.length || 0
              const hasPrints = peakCount > 0 || valanceCount > 0

              return (
                <button
                  key={side}
                  onClick={() => handleSelectSide(side, activeSurfaceType)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold capitalize transition-all ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{side}</span>
                  {hasPrints && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block ml-1" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Surface Toggle: Peak vs Valance */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSelectSide(selectedSide, 'peak')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                activeSurfaceType === 'peak'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Roof Peak (+$45)
            </button>
            <button
              onClick={() => handleSelectSide(selectedSide, 'valance')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                activeSurfaceType === 'valance'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Drop Valance (+$25)
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
                    <span className="text-xs font-mono font-bold text-slate-900">+${acc.price}</span>
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
      </div>

      {/* Sticky Shopify Purchase Actions Footer */}
      <div className="p-6 border-t border-slate-200 bg-white sticky bottom-0 shadow-lg space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Order Subtotal</span>
          <span className="font-mono text-base font-black text-slate-900">
            ${pricing.finalTotal.toFixed(2)} USD
          </span>
        </div>

        <div className="flex space-x-2">
          {/* Add to Cart */}
          <button
            onClick={onAddToCart}
            className="flex-1 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-98"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart — ${pricing.finalTotal.toFixed(2)}</span>
          </button>

          {/* Export Spec PDF */}
          <button
            onClick={onExportPdf}
            title="Download Spec Sheet PDF"
            className="py-3.5 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
          >
            <FileDown className="w-4 h-4 text-slate-600" />
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
