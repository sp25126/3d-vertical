import React, { useState } from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import {
  TENT_MODELS,
  FRAME_TYPES,
  PRESET_COLORS,
  ACCESSORIES
} from '../../constants/tentData'
import { ProductModelId, FrameType } from '../../types/configurator'
import {
  Maximize2,
  Shield,
  Palette,
  PackagePlus,
  Check,
  ChevronDown,
  ChevronUp,
  Receipt
} from 'lucide-react'

export const OptionsDrawer: React.FC = () => {
  const {
    config,
    pricing,
    setModelId,
    setFrameType,
    setFabricBaseColor,
    toggleAccessory
  } = useConfiguratorStore()

  // Collapsible section states
  const [openSection, setOpenSection] = useState<'size' | 'frame' | 'color' | 'accessories' | 'pricing'>('color')

  const toggleSection = (section: 'size' | 'frame' | 'color' | 'accessories' | 'pricing') => {
    setOpenSection(openSection === section ? 'color' : section)
  }

  return (
    <div className="bg-slate-900 border-t border-slate-800 text-slate-200 overflow-y-auto max-h-[380px]">
      {/* 1. Size & Dimensions */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => toggleSection('size')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Maximize2 className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">1. Canopy Footprint</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-brand-300">
              {TENT_MODELS[config.modelId].name}
            </span>
            {openSection === 'size' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {openSection === 'size' && (
          <div className="p-3.5 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(TENT_MODELS) as ProductModelId[]).map((mId) => {
              const model = TENT_MODELS[mId]
              const isSelected = config.modelId === mId
              return (
                <button
                  key={mId}
                  onClick={() => setModelId(mId)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/10 shadow-sm'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{model.name}</span>
                    <span className="text-xs font-mono font-bold text-brand-400">${model.basePrice}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{model.dimensions}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 2. Hardware Frame */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => toggleSection('frame')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">2. Frame Hardware</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-brand-300">
              {FRAME_TYPES[config.frameType].name}
            </span>
            {openSection === 'frame' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {openSection === 'frame' && (
          <div className="p-3.5 pt-0 space-y-2">
            {(Object.keys(FRAME_TYPES) as FrameType[]).map((fKey) => {
              const frame = FRAME_TYPES[fKey]
              const isSelected = config.frameType === fKey
              return (
                <button
                  key={fKey}
                  onClick={() => setFrameType(fKey)}
                  className={`w-full p-3 rounded-xl border text-left flex items-start justify-between transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/10 shadow-sm'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{frame.name}</span>
                      {frame.priceDelta > 0 && (
                        <span className="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded font-mono">
                          +${frame.priceDelta}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{frame.desc}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-400 shrink-0 ml-2 mt-0.5" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. Fabric Base Color */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => toggleSection('color')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">3. Canopy Base Dye Color</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full border border-slate-600 shadow-inner"
              style={{ backgroundColor: config.fabricBaseColor }}
            />
            {openSection === 'color' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {openSection === 'color' && (
          <div className="p-3.5 pt-0">
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESET_COLORS.map((c) => {
                const isSelected = config.fabricBaseColor.toLowerCase() === c.hex.toLowerCase()
                return (
                  <button
                    key={c.hex}
                    onClick={() => setFabricBaseColor(c.hex)}
                    title={c.name}
                    className={`h-9 rounded-xl border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-white scale-105 shadow-md ring-2 ring-brand-500'
                        : 'border-slate-700/80 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && <Check className={`w-4 h-4 ${c.hex === '#F8FAFC' ? 'text-slate-900' : 'text-white'}`} />}
                  </button>
                )
              })}
            </div>

            {/* Custom Hex Color Picker */}
            <div className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-300">Custom Pantone / Hex Dye:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={config.fabricBaseColor}
                  onChange={(e) => setFabricBaseColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-600 cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs uppercase text-brand-300 font-bold">
                  {config.fabricBaseColor}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Accessories */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => toggleSection('accessories')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <PackagePlus className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">4. Hardware Accessories</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-brand-300">
              {config.accessories.length} Selected
            </span>
            {openSection === 'accessories' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {openSection === 'accessories' && (
          <div className="p-3.5 pt-0 space-y-2">
            {ACCESSORIES.map((acc) => {
              const isSelected = config.accessories.includes(acc.id)
              return (
                <button
                  key={acc.id}
                  onClick={() => toggleAccessory(acc.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/10 shadow-sm'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                  }`}
                >
                  <div className="pr-3">
                    <span className="text-xs font-bold text-white block">{acc.name}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{acc.description}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-brand-400">+${acc.price}</span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        isSelected ? 'bg-brand-500 border-brand-400 text-white' : 'border-slate-700 bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 5. Dynamic Pricing Breakdown */}
      <div>
        <button
          onClick={() => toggleSection('pricing')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">5. Dynamic Pricing Breakdown</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-emerald-400">
              ${pricing.finalTotal.toFixed(2)}
            </span>
            {openSection === 'pricing' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {openSection === 'pricing' && (
          <div className="p-3.5 pt-0 space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Base Canopy & Frame:</span>
              <span className="font-mono">${pricing.basePrice.toFixed(2)}</span>
            </div>
            {pricing.frameUpgradeCost > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Aluminum Frame Upgrade:</span>
                <span className="font-mono">+${pricing.frameUpgradeCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">
                Printed Zones ({pricing.customizedZonesCount} locations):
              </span>
              <span className="font-mono">+${pricing.printTotal.toFixed(2)}</span>
            </div>
            {pricing.accessoriesTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Accessories Total:</span>
                <span className="font-mono">+${pricing.accessoriesTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Estimated Sales Tax (8%):</span>
              <span className="font-mono">${pricing.estimatedTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-700 font-bold text-white text-sm">
              <span>Final Total:</span>
              <span className="text-brand-400 font-mono">${pricing.finalTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
