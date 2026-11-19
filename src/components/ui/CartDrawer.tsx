import React, { useState } from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { X, ShoppingBag, ArrowRight, CheckCircle2, FileDown } from 'lucide-react'
import confetti from 'canvas-confetti'

interface CartDrawerProps {
  onExportPdf: () => void
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onExportPdf }) => {
  const { isCartOpen, toggleCart, cart } = useConfiguratorStore()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutCompleted, setCheckoutCompleted] = useState(false)

  if (!isCartOpen) return null

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleMockCheckout = () => {
    setIsCheckingOut(true)
    setTimeout(() => {
      setIsCheckingOut(false)
      setCheckoutCompleted(true)
      try {
        confetti({
          particleCount: 140,
          spread: 80,
          origin: { y: 0.6 }
        })
      } catch (_) {}
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={() => toggleCart(false)}
        className="fixed inset-0 bg-studio-950/80 backdrop-blur-md transition-opacity"
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-studio-900 border-l border-white/10 h-full flex flex-col z-10 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-studio-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white font-display">Shopify Storefront Cart</h2>
              <span className="text-[10px] text-studio-500 font-mono">
                {cart.length} {cart.length === 1 ? 'line item' : 'line items'}
              </span>
            </div>
          </div>

          <button
            onClick={() => toggleCart(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-studio-850 rounded-xl transition-colors border border-transparent hover:border-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {checkoutCompleted ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-glow-cyan">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">Order Transmitted to Production!</h3>
              <p className="text-xs text-studio-500 max-w-xs leading-relaxed">
                Your custom canopy order and high-res print proofs have been associated with Shopify Draft Order #MVP-
                {Math.floor(100000 + Math.random() * 900000)}.
              </p>

              <div className="w-full space-y-2.5 pt-4">
                <button
                  onClick={onExportPdf}
                  className="w-full py-3 px-4 rounded-xl bg-gold-500 hover:bg-gold-600 text-slate-950 text-xs font-black flex items-center justify-center space-x-2 transition-all shadow-glow-gold font-display"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Production Spec PDF</span>
                </button>

                <button
                  onClick={() => {
                    setCheckoutCompleted(false)
                    toggleCart(false)
                  }}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Back to Configurator
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-studio-500 space-y-2">
              <ShoppingBag className="w-12 h-12 text-studio-700 stroke-1" />
              <p className="text-sm font-bold text-slate-300 font-display">Your cart is empty</p>
              <p className="text-xs max-w-xs text-studio-500">
                Customize your canopy tent surfaces and click "Add to Cart" to generate your order payload.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-studio-850/80 rounded-2xl border border-white/10 shadow-studio-card space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-white font-display">{item.title}</h4>
                    <span className="text-[10px] text-studio-500 font-mono">Qty: {item.quantity}</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-gold-400">
                    ${item.price.toFixed(2)}
                  </span>
                </div>

                {/* Shopify Line-Item Properties */}
                <div className="bg-studio-950 p-3 rounded-xl border border-white/5 text-[11px] space-y-1.5 font-mono">
                  <span className="font-bold text-gold-500 uppercase text-[9px] tracking-widest block mb-1">
                    Shopify Line-Item Properties
                  </span>
                  {Object.entries(item.properties)
                    .filter(([k]) => !k.startsWith('_'))
                    .map(([propKey, propVal]) => (
                      <div key={propKey} className="flex justify-between">
                        <span className="text-studio-500">{propKey}:</span>
                        <span className="text-slate-200 font-semibold truncate max-w-[190px]">
                          {propVal}
                        </span>
                      </div>
                    ))}
                  {item.properties['_config_id'] && (
                    <div className="flex justify-between pt-1 border-t border-white/5 text-[10px] text-gold-400">
                      <span>Config Hash:</span>
                      <span>{item.properties['_config_id']}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Actions */}
        {!checkoutCompleted && cart.length > 0 && (
          <div className="p-4 border-t border-white/10 bg-studio-950/70 space-y-3">
            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-studio-500">Order Subtotal:</span>
                <span className="font-mono text-white font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-studio-500">2-Day Rush Production:</span>
                <span className="text-emerald-400 font-mono font-bold">Complimentary</span>
              </div>
            </div>

            <button
              onClick={handleMockCheckout}
              disabled={isCheckingOut}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-600 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 transition-all shadow-glow-gold active:scale-98 disabled:opacity-50 font-display"
            >
              {isCheckingOut ? (
                <span>Connecting to Shopify Checkout...</span>
              ) : (
                <>
                  <span>Proceed to Shopify Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
