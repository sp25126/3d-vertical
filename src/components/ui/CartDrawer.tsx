import React, { useState } from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { X, ShoppingBag, ArrowRight, CheckCircle2, FileDown, ShieldCheck, Receipt } from 'lucide-react'
import confetti from 'canvas-confetti'
import { formatCurrency, formatInvoiceAmount } from '../../utils/gstUtils'

interface CartDrawerProps {
  onExportPdf: () => void
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onExportPdf }) => {
  const { isCartOpen, toggleCart, cart, currency, pricing } = useConfiguratorStore()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutCompleted, setCheckoutCompleted] = useState(false)

  if (!isCartOpen) return null

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const isINR = currency === 'INR'

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
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col z-10 shadow-2xl text-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <ShoppingBag className="w-5 h-5 text-slate-900" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Cart</h2>
              <span className="text-[11px] text-slate-500 font-medium">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          <button
            onClick={() => toggleCart(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {checkoutCompleted ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Order Sent to Production!</h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Your custom canopy order and high-res print proofs have been associated with Shopify Draft Order #MVP-
                {Math.floor(100000 + Math.random() * 900000)}.
              </p>

              <div className="w-full space-y-2.5 pt-4">
                <button
                  onClick={onExportPdf}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{isINR ? 'Download GST Tax Invoice & Spec PDF' : 'Download Production Spec PDF'}</span>
                </button>

                <button
                  onClick={() => {
                    setCheckoutCompleted(false)
                    toggleCart(false)
                  }}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Return to Customizer
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <ShoppingBag className="w-12 h-12 text-slate-300 stroke-1" />
              <p className="text-sm font-bold text-slate-700">Your cart is empty</p>
              <p className="text-xs max-w-xs text-slate-500">
                Configure your canopy footprint, colors, and graphics, then click "Add to Cart" to generate your order payload.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">Qty: {item.quantity}</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {formatCurrency(item.price, currency)}
                  </span>
                </div>

                {/* Shopify Line-Item Properties */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] space-y-1.5 font-mono">
                  <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider block mb-1">
                    Shopify Line-Item Properties
                  </span>
                  {Object.entries(item.properties)
                    .filter(([k]) => !k.startsWith('_'))
                    .map(([propKey, propVal]) => (
                      <div key={propKey} className="flex justify-between">
                        <span className="text-slate-500">{propKey}:</span>
                        <span className="text-slate-900 font-semibold truncate max-w-[200px]">
                          {propVal}
                        </span>
                      </div>
                    ))}
                  {item.properties['_config_id'] && (
                    <div className="flex justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-600">
                      <span>Config Hash:</span>
                      <span>{item.properties['_config_id']}</span>
                    </div>
                  )}
                  {isINR && (
                    <div className="flex items-center space-x-1.5 pt-1 text-[10px] text-blue-700 font-bold border-t border-slate-100">
                      <Receipt className="w-3 h-3" />
                      <span>HSN: 6306 22 00 • GST 18% Compliant</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Actions */}
        {!checkoutCompleted && cart.length > 0 && (
          <div className="p-5 border-t border-slate-200 bg-white space-y-3">
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Total {isINR ? '(Incl. 18% GST):' : 'Estimated Total:'}</span>
                <span className="text-slate-900 font-bold text-sm">
                  {formatCurrency(subtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-sans">
                <span>Shipping:</span>
                <span className="text-emerald-600 font-semibold">Free Surface / Ground Shipping</span>
              </div>
            </div>

            <button
              onClick={handleMockCheckout}
              disabled={isCheckingOut}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-98 disabled:opacity-50"
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

            <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Encrypted 256-bit SSL Checkout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
