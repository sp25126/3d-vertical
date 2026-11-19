import React, { useRef, useState, useEffect } from 'react'
import { Header } from './components/ui/Header'
import { TentViewport } from './components/viewer3d/TentViewport'
import { ShopifyCustomizerPanel } from './components/ui/ShopifyCustomizerPanel'
import { CartDrawer } from './components/ui/CartDrawer'
import { useConfiguratorStore } from './store/useConfiguratorStore'
import { generateProductionPdf } from './services/pdfService'
import { Eye, Sliders, CheckCircle } from 'lucide-react'

export const App: React.FC = () => {
  const { config, pricing, addToShopifyCart, fetchPricing, setFabricBaseColor, setModelId } = useConfiguratorStore()
  const captureSnapshotRef = useRef<(() => string) | null>(null)
  const [mobileTab, setMobileTab] = useState<'3d' | 'customize'>('3d')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchPricing()
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleExportPdf = async () => {
    showToast('Compiling Production Spec Sheet (PDF)...')
    const snapshotUrl = captureSnapshotRef.current ? captureSnapshotRef.current() : undefined
    await generateProductionPdf({
      config,
      pricing,
      perspectiveSnapshotDataUrl: snapshotUrl
    })
    showToast('Production Spec PDF exported successfully!')
  }

  const handleAddToCart = async () => {
    const snapshotUrl = captureSnapshotRef.current ? captureSnapshotRef.current() : undefined
    const success = await addToShopifyCart(snapshotUrl)
    if (success) {
      showToast('Custom canopy added to your Shopify Cart!')
    }
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {}
      if (type === 'CONFIGURATOR_SET_MODEL' && payload?.modelId) {
        setModelId(payload.modelId)
      } else if (type === 'CONFIGURATOR_SET_COLOR' && payload?.color) {
        setFabricBaseColor(payload.color)
      } else if (type === 'CONFIGURATOR_ADD_TO_CART') {
        handleAddToCart()
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div className="flex flex-col h-screen w-screen bg-white text-slate-900 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold font-sans animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Global Shopify Store Header */}
      <Header onExportPdf={handleExportPdf} onAddToCart={handleAddToCart} />

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-slate-200 bg-white text-xs font-bold">
        <button
          onClick={() => setMobileTab('3d')}
          className={`flex-1 py-3 flex items-center justify-center space-x-1.5 transition-all ${
            mobileTab === '3d' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Interactive 3D Stage</span>
        </button>
        <button
          onClick={() => setMobileTab('customize')}
          className={`flex-1 py-3 flex items-center justify-center space-x-1.5 transition-all ${
            mobileTab === 'customize' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Product Options & Prepress</span>
        </button>
      </div>

      {/* Main Workspace Body (Shopify PDP 2-Column Standard) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Column: 3D Studio Stage (55% width) */}
        <div
          className={`w-full md:w-[55%] lg:w-[58%] h-full relative border-r border-slate-200 ${
            mobileTab !== '3d' ? 'hidden md:block' : 'block'
          }`}
        >
          <TentViewport
            onCaptureSnapshotRef={(fn) => {
              captureSnapshotRef.current = fn
            }}
          />
        </div>

        {/* Right Column: Shopify Customizer PDP Flow (45% width) */}
        <div
          className={`w-full md:w-[45%] lg:w-[42%] h-full flex flex-col bg-white overflow-hidden ${
            mobileTab === '3d' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ShopifyCustomizerPanel
            onAddToCart={handleAddToCart}
            onExportPdf={handleExportPdf}
          />
        </div>
      </div>

      {/* Shopify Cart Slide-Over Drawer */}
      <CartDrawer onExportPdf={handleExportPdf} />
    </div>
  )
}
export default App
