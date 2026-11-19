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
  Receipt,
  Sparkles
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

  const [openSection, setOpenSection] = useState<'size' | 'frame' | 'color' | 'accessories' | 'pricing'>('color')

  const toggleSection = (section: 'size' | 'frame' | 'color' | 'accessories' | 'pricing') => {
    setOpenSection(openSection === section ? 'color' : section)
  }

  return (
    <div className="bg-studio-900 border-t border-white/10 text-slate-200 overflow-y-auto max-h-[380px]">
      {/* 1. Size & Footprint */}
      <div className="border-b border-white/5">
        <button
          onClick={() => toggleSection('size')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-studio-850/60 transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <Maximize2 className="w-4 h-4 text-gold-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white font-display">
              1. Footprint & Model
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gold-400 font-display">
              {TENT_MODELS[config.modelId].name}
            </span>
            {openSection === 'size' ? <ChevronUp className="w-4 h-4 text-studio-500" /> : <ChevronDown className="w-4 h-4 text-studio-500" />}
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
                      ? 'border-gold-500 bg-gold-500/10 shadow-glow-gold'
                      : 'border-white/5 bg-studio-850/60 hover:bg-studio-850 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-display">{model.name}</span>
                    <span className="text-xs font-mono font-bold text-gold-400">${model.basePrice}</span>
                  </div>
                  <span className="text-[11px] text-studio-500 block mt-0.5">{model.dimensions}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 2. Hardware Frame */}
      <div className="border-b border-white/5">
        <button
          onClick={() => toggleSection('frame')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-studio-850/60 transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <Shield className="w-4 h-4 text-gold-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white font-display">
              2. Frame Engineering
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gold-400 font-display">
              {FRAME_TYPES[config.frameType].name}
            </span>
            {openSection === 'frame' ? <ChevronUp className="w-4 h-4 text-studio-500" /> : <ChevronDown className="w-4 h-4 text-studio-500" />}
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
                      ? 'border-gold-500 bg-gold-500/10 shadow-glow-gold'
                      : 'border-white/5 bg-studio-850/60 hover:bg-studio-850 hover:border-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white font-display">{frame.name}</span>
                      {frame.priceDelta > 0 && (
                        <span className="text-[9px] bg-gold-500/20 text-gold-300 px-1.5 py-0.5 rounded font-mono font-bold">
                          +${frame.priceDelta}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-studio-500 mt-1">{frame.desc}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-gold-400 shrink-0 ml-2 mt-0.5" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. Fabric Dye Base Color */}
      <div className="border-b border-white/5">
        <button
          onClick={() => toggleSection('color')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-studio-850/60 transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <Palette className="w-4 h-4 text-gold-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white font-display">
              3. Fabric Dye Color
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
              style={{ backgroundColor: config.fabricBaseColor }}
            />
            {openSection === 'color' ? <ChevronUp className="w-4 h-4 text-studio-500" /> : <ChevronDown className="w-4 h-4 text-studio-500" />}
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
                        ? 'border-white scale-105 shadow-glow-gold ring-2 ring-gold-500'
                        : 'border-white/10 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && <Check className={`w-4 h-4 ${c.hex === '#F8FAFC' ? 'text-slate-900' : 'text-white'}`} />}
                  </button>
                )
              })}
            </div>

            {/* Custom Hex Color Picker */}
            <div className="flex items-center justify-between bg-studio-850 p-2.5 rounded-xl border border-white/10">
              <span className="text-xs text-slate-300">Pantone / Hex Dye:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={config.fabricBaseColor}
                  onChange={(e) => setFabricBaseColor(e.target.value)}
                  className="w-8 h-8 rounded border border-white/10 cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs uppercase text-gold-400 font-bold">
                  {config.fabricBaseColor}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Accessories */}
      <div className="border-b border-white/5">
        <button
          onClick={() => toggleSection('accessories')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-studio-850/60 transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <PackagePlus className="w-4 h-4 text-gold-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white font-display">
              4. Hardware Accessories
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gold-400 font-display">
              {config.accessories.length} Selected
            </span>
            {openSection === 'accessories' ? <ChevronUp className="w-4 h-4 text-studio-500" /> : <ChevronDown className="w-4 h-4 text-studio-500" />}
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
                      ? 'border-gold-500 bg-gold-500/10 shadow-glow-gold'
                      : 'border-white/5 bg-studio-850/60 hover:bg-studio-850 hover:border-white/10'
                  }`}
                >
                  <div className="pr-3">
                    <span className="text-xs font-bold text-white block font-display">{acc.name}</span>
                    <span className="text-[11px] text-studio-500 block mt-0.5">{acc.description}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-gold-400">+${acc.price}</span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        isSelected ? 'bg-gold-500 border-gold-400 text-slate-950 font-black' : 'border-white/10 bg-studio-950'
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
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-studio-850/60 transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white font-display">
              5. Dynamic Quote Breakdown
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-emerald-400">
              ${pricing.finalTotal.toFixed(2)}
            </span>
            {openSection === 'pricing' ? <ChevronUp className="w-4 h-4 text-studio-500" /> : <ChevronDown className="w-4 h-4 text-studio-500" />}
          </div>
        </button>

        {openSection === 'pricing' && (
          <div className="p-3.5 pt-0 space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-studio-500">Base Canopy & Frame:</span>
              <span className="font-mono text-white">${pricing.basePrice.toFixed(2)}</span>
            </div>
            {pricing.frameUpgradeCost > 0 && (
              <div className="flex justify-between">
                <span className="text-studio-500">Aluminum Frame Upgrade:</span>
                <span className="font-mono text-gold-400">+${pricing.frameUpgradeCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-studio-500">
                Printed Zones ({pricing.customizedZonesCount} locations):
              </span>
              <span className="font-mono text-gold-400">+${pricing.printTotal.toFixed(2)}</span>
            </div>
            {pricing.accessoriesTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-studio-500">Hardware Accessories:</span>
                <span className="font-mono text-gold-400">+${pricing.accessoriesTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-white/5">
              <span className="text-studio-500">Estimated Sales Tax (8%):</span>
              <span className="font-mono text-white">${pricing.estimatedTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-white/10 font-bold text-white text-sm">
              <span className="font-display">Total Investment:</span>
              <span className="text-gold-400 font-mono text-base font-black">${pricing.finalTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
