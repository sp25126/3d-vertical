import React, { useState } from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { ShoppingBag, FileDown, RotateCcw, Sparkles, ChevronDown } from 'lucide-react'
import { formatCurrency } from '../../utils/gstUtils'

interface HeaderProps {
  onExportPdf: () => void
  onAddToCart: () => void
}

export const Header: React.FC<HeaderProps> = ({ onExportPdf, onAddToCart }) => {
  const {
    pricing,
    currency,
    setCurrency,
    isPricingLoading,
    cart,
    toggleCart,
    loadPreset,
    resetConfig
  } = useConfiguratorStore()

  const [isPresetsOpen, setIsPresetsOpen] = useState(false)

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between z-30 sticky top-0 shadow-sm select-none">
      {/* Brand & Store Nav */}
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-white text-sm tracking-tight shadow-sm">
            MVP
          </div>
          <div>
            <span className="text-sm font-extrabold tracking-tight text-slate-900 font-sans uppercase">
              MVP Visuals
            </span>
            <span className="text-[10px] text-slate-400 block -mt-0.5 font-medium">3D Custom Studio</span>
          </div>
        </div>

        {/* Shopify Theme Nav Links */}
        <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-600">
          <span className="text-slate-900 border-b-2 border-slate-900 pb-0.5 cursor-pointer">Custom Canopy Tents</span>
          <span className="hover:text-slate-900 transition-colors cursor-pointer">Table Covers</span>
          <span className="hover:text-slate-900 transition-colors cursor-pointer">Feather Flags</span>
          <span className="hover:text-slate-900 transition-colors cursor-pointer">Trade Show Displays</span>
        </nav>
      </div>

      {/* Right Actions: Presets, Currency Toggle, Live Price & Shopify Cart */}
      <div className="flex items-center space-x-3.5">
        {/* Currency Switcher (INR / USD) */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px] font-bold">
          <button
            onClick={() => setCurrency('INR')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              currency === 'INR'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ₹ INR (GST)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              currency === 'USD'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            $ USD
          </button>
        </div>

        {/* Sample Brand Presets */}
        <div className="relative">
          <button
            onClick={() => setIsPresetsOpen(!isPresetsOpen)}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Presets</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isPresetsOpen && (
            <div className="absolute top-full mt-2 right-0 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  loadPreset('tech_expo')
                  setIsPresetsOpen(false)
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex flex-col"
              >
                <span className="font-bold text-slate-900">Tech Expo 2026</span>
                <span className="text-[10px] text-slate-500">10x10 • Royal Blue • Aluminum Frame</span>
              </button>
              <button
                onClick={() => {
                  loadPreset('brewery')
                  setIsPresetsOpen(false)
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex flex-col"
              >
                <span className="font-bold text-slate-900">Timber & Hops Craft</span>
                <span className="text-[10px] text-slate-500">8x8 • Jet Black • Steel Frame</span>
              </button>
              <button
                onClick={() => {
                  resetConfig()
                  setIsPresetsOpen(false)
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex flex-col border-t border-slate-100"
              >
                <span className="font-bold text-amber-600">Default MVP Amber</span>
                <span className="text-[10px] text-slate-500">10x10 • Classic Gold Dye</span>
              </button>
            </div>
          )}
        </div>

        {/* Reset */}
        <button
          onClick={resetConfig}
          title="Reset Customizer"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Dynamic Price Block */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {currency === 'INR' ? 'Total (Incl. 18% GST)' : 'Total Quote'}
          </span>
          <span className="font-mono text-base font-extrabold text-slate-900">
            {isPricingLoading ? '...' : formatCurrency(pricing.finalTotal, currency)}
          </span>
        </div>

        {/* GST Invoice / Spec PDF Button */}
        <button
          onClick={onExportPdf}
          title="Download Official GST Tax Invoice & Technical Prepress Proof"
          className="hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-900 transition-colors shadow-xs"
        >
          <FileDown className="w-3.5 h-3.5 text-amber-600" />
          <span>GST Bill (PDF)</span>
        </button>

        {/* Shopify Cart Trigger Button */}
        <button
          onClick={onAddToCart}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-xs transition-all shadow-sm active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Cart</span>
          {cart.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-900 text-[10px] flex items-center justify-center font-bold">
              {cart.length}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
