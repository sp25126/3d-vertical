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
  PanelRightClose,
  Copy,
  Trash2,
  Layers
} from 'lucide-react'
import { formatCurrency, formatInvoiceAmount } from '../../utils/gstUtils'

interface ShopifyCustomizerPanelProps {
  onAddToCart: () => void
  onExportPdf: () => void
  onClose?: () => void
}

type SideKey = 'front' | 'right' | 'back' | 'left'

interface WallPreset {
  id: string
  name: string
  desc: string
  wallIds: string[]
  check: (accs: string[]) => boolean
}

const WALL_PRESETS: WallPreset[] = [
  {
    id: 'preset_open',
    name: 'Open Canopy',
    desc: 'Base frame (0 walls)',
    wallIds: [],
    check: (accs: string[]) => !accs.some((id) => id.startsWith('wall_'))
  },
  {
    id: 'preset_backdrop',
    name: 'Backdrop Only',
    desc: 'Full back wall',
    wallIds: ['wall_back_full'],
    check: (accs: string[]) => {
      const walls = accs.filter((id) => id.startsWith('wall_'))
      return walls.length === 1 && walls[0] === 'wall_back_full'
    }
  },
  {
    id: 'preset_booth3',
    name: '3-Sided Booth',
    desc: 'Back + 2 full sides',
    wallIds: ['wall_back_full', 'wall_left_full', 'wall_right_full'],
    check: (accs: string[]) =>
      accs.includes('wall_back_full') &&
      accs.includes('wall_left_full') &&
      accs.includes('wall_right_full')
  },
  {
    id: 'preset_skirts',
    name: 'Showroom Skirts',
    desc: 'Dual half rail skirts',
    wallIds: ['wall_left_half', 'wall_right_half'],
    check: (accs: string[]) =>
      accs.includes('wall_left_half') &&
      accs.includes('wall_right_half') &&
      !accs.includes('wall_back_full')
  },
  {
    id: 'preset_kiosk',
    name: 'Trade Show Kiosk',
    desc: 'Back + side + 2 half',
    wallIds: ['wall_back_full', 'wall_right_full', 'wall_left_half', 'wall_front_half'],
    check: (accs: string[]) =>
      accs.includes('wall_back_full') &&
      accs.includes('wall_right_full') &&
      accs.includes('wall_left_half') &&
      accs.includes('wall_front_half')
  }
]

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
    setCustomDimensions,
    setFrameType,
    setFabricBaseColor,
    toggleAccessory,
    setAccessories,
    copyZoneToAllSides,
    clearAllZones,
    clearZone
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(Object.keys(TENT_MODELS) as ProductModelId[]).map((mId) => {
              const m = TENT_MODELS[mId]
              const isSelected = config.modelId === mId
              const itemBase = isINR ? m.basePriceINR : m.basePriceUSD
              return (
                <button
                  key={mId}
                  onClick={() => setModelId(mId)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  <span className="text-xs font-black block capitalize">{mId}</span>
                  <span className={`text-[9.5px] block mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {mId === 'custom' ? 'Bespoke' : `from ${formatCurrency(itemBase, currency)}`}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Interactive Custom Sizing Controls */}
          {config.modelId === 'custom' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 mt-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                  Custom Dimensional Parameters
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200/60">
                  {(config.customDimensions?.widthFt || 10) * (config.customDimensions?.depthFt || 10)} sq ft • {((config.customDimensions?.widthM || 3.05) * (config.customDimensions?.depthM || 3.05)).toFixed(1)} m²
                </span>
              </div>

              {/* Quick Dimension Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '10x10 ft', w: 10, d: 10 },
                  { label: '10x15 ft', w: 10, d: 15 },
                  { label: '10x20 ft', w: 10, d: 20 },
                  { label: '12x12 ft', w: 12, d: 12 },
                  { label: '15x15 ft', w: 15, d: 15 }
                ].map((pre) => {
                  const isCur =
                    (config.customDimensions?.widthFt || 10) === pre.w &&
                    (config.customDimensions?.depthFt || 10) === pre.d
                  return (
                    <button
                      key={pre.label}
                      onClick={() => setCustomDimensions({ widthFt: pre.w, depthFt: pre.d })}
                      className={`text-[10.5px] px-2 py-1 rounded-lg font-bold border transition-all ${
                        isCur
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      {pre.label}
                    </button>
                  )
                })}
              </div>

              {/* Width Slider & Input */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                  <span>Width (Front & Back Span)</span>
                  <span className="font-mono text-amber-900">
                    {config.customDimensions?.widthFt || 10} ft ({config.customDimensions?.widthM || 3.05} m)
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="0.5"
                  value={config.customDimensions?.widthFt || 10}
                  onChange={(e) => setCustomDimensions({ widthFt: parseFloat(e.target.value) })}
                  className="w-full accent-amber-600 cursor-pointer h-1.5 bg-amber-200/60 rounded-lg"
                />
              </div>

              {/* Depth Slider & Input */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                  <span>Depth (Left & Right Flank Span)</span>
                  <span className="font-mono text-amber-900">
                    {config.customDimensions?.depthFt || 10} ft ({config.customDimensions?.depthM || 3.05} m)
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="0.5"
                  value={config.customDimensions?.depthFt || 10}
                  onChange={(e) => setCustomDimensions({ depthFt: parseFloat(e.target.value) })}
                  className="w-full accent-amber-600 cursor-pointer h-1.5 bg-amber-200/60 rounded-lg"
                />
              </div>
            </div>
          )}
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
        <div className="space-y-3.5 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
                4. Customize Print Surfaces (4 Peaks & 4 Valances)
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Edge-to-edge 4K dye sublimation. Click any surface to inspect in 3D.
              </p>
            </div>

            {/* Customization Count Badge */}
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-900 text-amber-400 border border-slate-700 shadow-xs">
              {pricing.customizedZonesCount} / 8 printed
            </span>
          </div>

          {/* Quick Replication & Reset Productivity Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[10px] font-bold text-amber-900 uppercase flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Bulk Tools:</span>
            </span>
            <button
              onClick={() => copyZoneToAllSides('peak_front')}
              disabled={(config.zones['peak_front']?.elements.length || 0) === 0}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                (config.zones['peak_front']?.elements.length || 0) > 0
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer'
                  : 'bg-amber-200/60 text-amber-800/50 cursor-not-allowed'
              }`}
              title="Copy Front Peak graphics to Right, Back, and Left peaks"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Front to All 4 Peaks</span>
            </button>

            <button
              onClick={() => copyZoneToAllSides('valance_front')}
              disabled={(config.zones['valance_front']?.elements.length || 0) === 0}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                (config.zones['valance_front']?.elements.length || 0) > 0
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer'
                  : 'bg-amber-200/60 text-amber-800/50 cursor-not-allowed'
              }`}
              title="Copy Front Valance graphics to Right, Back, and Left valances"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Front to All 4 Valances</span>
            </button>

            {pricing.customizedZonesCount > 0 && (
              <button
                onClick={clearAllZones}
                className="flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-bold text-red-600 hover:bg-red-100 transition-all ml-auto"
                title="Clear all 8 surfaces"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            )}
          </div>

          {/* 8-Surface Selection Matrix */}
          <div className="space-y-2.5">
            {/* 1. Roof Peaks (4 Sloped Panels) */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5 px-0.5">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Roof Peaks (+{formatCurrency(isINR ? 950 : 45, currency)} ea)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Sloped High-Vis Panels</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['front', 'right', 'back', 'left'] as SideKey[]).map((side) => {
                  const zId = `peak_${side}` as ZoneId
                  const isSelected = activeZoneId === zId
                  const count = config.zones[zId]?.elements.length || 0
                  return (
                    <button
                      key={zId}
                      onClick={() => setActiveZoneId(zId)}
                      className={`p-2 rounded-xl text-center border transition-all relative ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div className="text-[11px] font-bold capitalize">{side} Peak</div>
                      <div className="mt-0.5">
                        {count > 0 ? (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-amber-400 text-slate-900 font-black' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            ✓ {count} {count === 1 ? 'art' : 'arts'}
                          </span>
                        ) : (
                          <span className={`text-[9px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            Blank
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Drop Valances (4 Hanging Trim Panels) */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5 px-0.5">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Drop Valances (+{formatCurrency(isINR ? 550 : 25, currency)} ea)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Eye-Level Border Strips</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['front', 'right', 'back', 'left'] as SideKey[]).map((side) => {
                  const zId = `valance_${side}` as ZoneId
                  const isSelected = activeZoneId === zId
                  const count = config.zones[zId]?.elements.length || 0
                  return (
                    <button
                      key={zId}
                      onClick={() => setActiveZoneId(zId)}
                      className={`p-2 rounded-xl text-center border transition-all relative ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div className="text-[11px] font-bold capitalize">{side} Valance</div>
                      <div className="mt-0.5">
                        {count > 0 ? (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-amber-400 text-slate-900 font-black' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            ✓ {count} {count === 1 ? 'art' : 'arts'}
                          </span>
                        ) : (
                          <span className={`text-[9px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            Blank
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Active Editing Surface Header & Clear Button */}
          <div className="flex items-center justify-between pt-1 px-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                Now Customizing: {ZONES_METADATA[activeZoneId]?.label || activeZoneId}
              </span>
            </div>
            {(config.zones[activeZoneId]?.elements.length || 0) > 0 && (
              <button
                onClick={() => clearZone(activeZoneId)}
                className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center space-x-1 hover:underline"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Surface</span>
              </button>
            )}
          </div>

          {/* Clean Embedded 2D Surface Editor */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-sm">
            <ZoneEditor2D />
          </div>
        </div>

        {/* 5. Modular Fabric Walls & Accessories (MVP Architecture) */}
        <div className="space-y-3.5 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
              5. Modular Walls & Accessories
            </label>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              MVP Visuals Configs
            </span>
          </div>

          {/* 1-Click MVP Visuals Structure Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Quick Structure Presets
              </span>
              <span className="text-[10px] text-slate-400">Ref. MVP 10x10 Series</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {WALL_PRESETS.map((preset) => {
                const isActive = preset.check(config.accessories)
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      const hardwareOnly = config.accessories.filter(
                        (id) => !id.startsWith('wall_')
                      )
                      setAccessories([...hardwareOnly, ...preset.wallIds])
                    }}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-bold block truncate">{preset.name}</span>
                    <span className={`text-[9.5px] block truncate ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                      {preset.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Modular Fabric Enclosures & Rail Skirts */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
              Modular Fabric Enclosures & Rail Skirts
            </span>
            <div className="space-y-1.5">
              {ACCESSORIES.filter((a) => a.category === 'wall').map((acc) => {
                const isSelected = config.accessories.includes(acc.id)
                const accPrice = isINR ? (acc.priceINR || acc.price) : (acc.priceUSD || acc.price)
                const isHalf = acc.id.includes('half')
                return (
                  <button
                    key={acc.id}
                    onClick={() => toggleAccessory(acc.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900">{acc.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          isHalf
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isHalf ? 'Half Skirt + Rail' : 'Full Wall'}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-slate-500 block mt-0.5 leading-snug">{acc.description}</span>
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

          {/* Ground Anchors & Transit Hardware */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
              Ground Anchoring & Transit Gear
            </span>
            <div className="space-y-1.5">
              {ACCESSORIES.filter((a) => a.category === 'hardware' || !a.category).map((acc) => {
                const isSelected = config.accessories.includes(acc.id)
                const accPrice = isINR ? (acc.priceINR || acc.price) : (acc.priceUSD || acc.price)
                return (
                  <button
                    key={acc.id}
                    onClick={() => toggleAccessory(acc.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="pr-2">
                      <span className="text-xs font-bold text-slate-900 block">{acc.name}</span>
                      <span className="text-[10.5px] text-slate-500 block mt-0.5 leading-snug">{acc.description}</span>
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
