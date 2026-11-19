import React, { useState } from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { X, ShoppingBag, ArrowRight, CheckCircle2, FileDown, ExternalLink } from 'lucide-react'
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
          particleCount: 120,
          spread: 70,
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
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col z-10 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-bold text-white">Your Shopify Cart</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <button
            onClick={() => toggleCart(false)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {checkoutCompleted ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Order Received & Sent to Production!</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Your custom canopy order and print proofs have been associated with Shopify Draft Order #MVP-
                {Math.floor(100000 + Math.random() * 900000)}.
              </p>

              <div className="w-full space-y-2 pt-4">
                <button
                  onClick={onExportPdf}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex items-center justify-center space-x-2 transition-all"
                >
                  <FileDown className="w-4 h-4 text-brand-400" />
                  <span>Download Production Spec PDF</span>
                </button>

                <button
                  onClick={() => {
                    setCheckoutCompleted(false)
                    toggleCart(false)
                  }}
                  className="w-full py-2 px-4 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Return to Configurator
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <ShoppingBag className="w-12 h-12 text-slate-700 stroke-1" />
              <p className="text-sm font-medium text-slate-400">Your cart is currently empty.</p>
              <p className="text-xs max-w-xs">
                Customize your canopy tent surfaces and click "Add to Cart" to generate your order payload.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/70 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <span className="text-[11px] text-slate-400">Qty: {item.quantity}</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-brand-400">
                    ${item.price.toFixed(2)}
                  </span>
                </div>

                {/* Shopify Line-Item Properties */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1">
                  <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider block mb-1">
                    Custom Line-Item Properties (Shopify Payload)
                  </span>
                  {Object.entries(item.properties)
                    .filter(([k]) => !k.startsWith('_'))
                    .map(([propKey, propVal]) => (
                      <div key={propKey} className="flex justify-between">
                        <span className="text-slate-400">{propKey}:</span>
                        <span className="text-slate-200 font-medium truncate max-w-[190px]">
                          {propVal}
                        </span>
                      </div>
                    ))}
                  {item.properties['_config_id'] && (
                    <div className="flex justify-between pt-1 border-t border-slate-800 font-mono text-[10px] text-brand-400">
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
          <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-3">
            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Cart Subtotal:</span>
                <span className="font-mono text-white font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Free 2-Day Rush Production:</span>
                <span className="text-emerald-400 font-semibold">$0.00 (Promo)</span>
              </div>
            </div>

            <button
              onClick={handleMockCheckout}
              disabled={isCheckingOut}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-brand-500/20 active:scale-98 disabled:opacity-50"
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
