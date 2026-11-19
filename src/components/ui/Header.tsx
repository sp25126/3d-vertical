import React, { useState } from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { TENT_MODELS } from '../../constants/tentData'
import { ProductModelId } from '../../types/configurator'
import { ShoppingBag, FileDown, RotateCcw, Sparkles, ChevronDown } from 'lucide-react'

interface HeaderProps {
  onExportPdf: () => void
  onAddToCart: () => void
}

export const Header: React.FC<HeaderProps> = ({ onExportPdf, onAddToCart }) => {
  const {
    config,
    pricing,
    isPricingLoading,
    cart,
    setModelId,
    loadPreset,
    resetConfig
  } = useConfiguratorStore()

  const [isPresetsOpen, setIsPresetsOpen] = useState(false)

  return (
    <header className="h-16 px-4 md:px-6 bg-studio-950/95 border-b border-white/10 flex items-center justify-between z-30 sticky top-0 backdrop-blur-xl select-none">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-gold-600 via-gold-500 to-amber-300 flex items-center justify-center font-black text-slate-950 text-sm shadow-glow-gold tracking-tight">
            MVP
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-black tracking-tight text-white font-display">
                CANOPY STUDIO
              </span>
              <span className="text-[9px] bg-gold-500/15 text-gold-400 border border-gold-500/30 px-1.5 py-0.2 rounded font-mono font-bold tracking-wider">
                PRO 3D
              </span>
            </div>
            <p className="text-[10px] text-studio-500 font-mono hidden sm:block">Commercial Interactive Configurator</p>
          </div>
        </div>

        {/* Model Dimension Selector Segmented Pills */}
        <div className="hidden lg:flex items-center bg-studio-900 p-1 rounded-xl border border-white/5 ml-4">
          {(Object.keys(TENT_MODELS) as ProductModelId[]).map((mId) => {
            const isSelected = config.modelId === mId
            const m = TENT_MODELS[mId]
            return (
              <button
                key={mId}
                onClick={() => setModelId(mId)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-gold-500 text-slate-950 shadow-glow-gold'
                    : 'text-slate-400 hover:text-white hover:bg-studio-800'
                }`}
              >
                <span>{mId}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Center Actions: Brand Presets & Reset */}
      <div className="flex items-center space-x-2">
        {/* Presets Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsPresetsOpen(!isPresetsOpen)}
            className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-studio-850 text-slate-200 border border-white/10 hover:bg-studio-800 transition-all shadow-studio-card"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span className="hidden sm:inline">Brand Presets</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isPresetsOpen && (
            <div className="absolute top-full mt-2 left-0 w-52 bg-studio-900 border border-white/10 rounded-2xl shadow-2xl py-1.5 z-50 backdrop-blur-xl">
              <button
                onClick={() => {
                  loadPreset('tech_expo')
                  setIsPresetsOpen(false)
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-studio-800 flex flex-col transition-colors"
              >
                <span className="font-bold text-white font-display">Tech Expo 2026</span>
                <span className="text-[10px] text-studio-500 mt-0.5">10x10 • Royal Blue • Aluminum Frame</span>
              </button>
              <button
                onClick={() => {
                  loadPreset('brewery')
                  setIsPresetsOpen(false)
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-studio-800 flex flex-col transition-colors"
              >
                <span className="font-bold text-white font-display">Timber & Hops Craft</span>
                <span className="text-[10px] text-studio-500 mt-0.5">8x8 • Jet Black • Steel Hardware</span>
              </button>
              <button
                onClick={() => {
                  resetConfig()
                  setIsPresetsOpen(false)
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-studio-800 flex flex-col border-t border-white/5 transition-colors"
              >
                <span className="font-bold text-gold-400 font-display">MVP Visuals Signature</span>
                <span className="text-[10px] text-studio-500 mt-0.5">8x8 • Amber Gold Poly</span>
              </button>
            </div>
          )}
        </div>

        {/* Reset Button */}
        <button
          onClick={resetConfig}
          title="Reset to Default"
          className="p-2 text-slate-400 hover:text-white hover:bg-studio-850 rounded-xl transition-all border border-transparent hover:border-white/5"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Right Actions: Live Price Pill, PDF, Shopify Cart */}
      <div className="flex items-center space-x-3">
        {/* Dynamic Price Telemetry */}
        <div className="flex flex-col items-end">
          <span className="text-[9px] uppercase tracking-widest font-mono text-studio-500 font-bold">
            Live Quote
          </span>
          <div className="flex items-center space-x-1 font-mono text-base font-black text-gold-400">
            {isPricingLoading ? (
              <span className="text-xs text-studio-500 animate-pulse font-mono">Syncing...</span>
            ) : (
              <span>${pricing.finalTotal.toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Export Production PDF Button */}
        <button
          onClick={onExportPdf}
          title="Download Print Production Spec Sheet"
          className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-studio-850 hover:bg-studio-800 border border-white/10 text-xs font-bold text-slate-200 transition-all shadow-studio-card"
        >
          <FileDown className="w-3.5 h-3.5 text-gold-400" />
          <span>Spec Sheet</span>
        </button>

        {/* Add to Shopify Cart Button */}
        <button
          onClick={onAddToCart}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-600 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-glow-gold active:scale-95 font-display"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden xs:inline">Add to Cart</span>
          {cart.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-slate-950 text-gold-400 text-[10px] flex items-center justify-center font-mono font-bold">
              {cart.length}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
