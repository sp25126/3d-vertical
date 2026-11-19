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
    toggleCart,
    setModelId,
    loadPreset,
    resetConfig
  } = useConfiguratorStore()

  const [isPresetsOpen, setIsPresetsOpen] = useState(false)

  return (
    <header className="h-16 px-4 md:px-6 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between z-30 sticky top-0 backdrop-blur select-none">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-amber-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-md">
            MVP
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center space-x-1.5">
              <span>CANOPY TENT</span>
              <span className="text-[10px] bg-brand-500/20 text-brand-400 border border-brand-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                3D STUDIO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Professional Interactive Configurator</p>
          </div>
        </div>

        {/* Model Dimension Selector Pills */}
        <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 ml-4">
          {(Object.keys(TENT_MODELS) as ProductModelId[]).map((mId) => {
            const isSelected = config.modelId === mId
            return (
              <button
                key={mId}
                onClick={() => setModelId(mId)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {mId}
              </button>
            )
          })}
        </div>
      </div>

      {/* Center Actions: Presets & Reset */}
      <div className="flex items-center space-x-2">
        {/* Presets Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsPresetsOpen(!isPresetsOpen)}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Presets</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isPresetsOpen && (
            <div className="absolute top-full mt-2 left-0 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50">
              <button
                onClick={() => {
                  loadPreset('tech_expo')
                  setIsPresetsOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex flex-col"
              >
                <span className="font-semibold text-white">Tech Expo 2026</span>
                <span className="text-[10px] text-slate-400">10x10 • Royal Blue • Aluminum</span>
              </button>
              <button
                onClick={() => {
                  loadPreset('brewery')
                  setIsPresetsOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex flex-col"
              >
                <span className="font-semibold text-white">Timber & Hops Craft</span>
                <span className="text-[10px] text-slate-400">8x8 • Jet Black • Steel</span>
              </button>
              <button
                onClick={() => {
                  resetConfig()
                  setIsPresetsOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex flex-col border-t border-slate-700/60"
              >
                <span className="font-semibold text-amber-400">Default MVP Visuals</span>
                <span className="text-[10px] text-slate-400">8x8 • Amber Gold</span>
              </button>
            </div>
          )}
        </div>

        {/* Reset Button */}
        <button
          onClick={resetConfig}
          title="Reset to Default"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Right Side: Dynamic Price & Cart Trigger */}
      <div className="flex items-center space-x-3">
        {/* Dynamic Price Pill */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
            Total (Estimated)
          </span>
          <div className="flex items-center space-x-1 font-mono text-base font-extrabold text-brand-400">
            {isPricingLoading ? (
              <span className="text-xs text-slate-400 animate-pulse">Calculating...</span>
            ) : (
              <span>${pricing.finalTotal.toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Export PDF Button */}
        <button
          onClick={onExportPdf}
          title="Download Production Spec Sheet PDF"
          className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-sm"
        >
          <FileDown className="w-4 h-4 text-brand-400" />
          <span>Spec PDF</span>
        </button>

        {/* Add to Shopify Cart Button */}
        <button
          onClick={onAddToCart}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-slate-950 font-black text-xs transition-all shadow-lg shadow-brand-500/20 active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden xs:inline">Add to Cart</span>
          {cart.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-slate-950 text-brand-400 text-[10px] flex items-center justify-center font-bold">
              {cart.length}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
