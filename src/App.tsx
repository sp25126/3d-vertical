import React, { useRef, useState, useEffect } from 'react'
import { Header } from './components/ui/Header'
import { TentViewport } from './components/viewer3d/TentViewport'
import { ZoneSelector } from './components/ui/ZoneSelector'
import { ZoneEditor2D } from './components/canvas2d/ZoneEditor2D'
import { OptionsDrawer } from './components/ui/OptionsDrawer'
import { CartDrawer } from './components/ui/CartDrawer'
import { useConfiguratorStore } from './store/useConfiguratorStore'
import { generateProductionPdf } from './services/pdfService'
import { Eye, Edit3, Sliders, CheckCircle } from 'lucide-react'

export const App: React.FC = () => {
  const { config, pricing, addToShopifyCart, fetchPricing, setFabricBaseColor, setModelId } = useConfiguratorStore()
  const captureSnapshotRef = useRef<(() => string) | null>(null)
  const [mobileTab, setMobileTab] = useState<'3d' | '2d' | 'options'>('3d')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Initialize initial pricing on mount
  useEffect(() => {
    fetchPricing()
  }, [])

  // Show auto-dismissing toast notifications
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Handle PDF Export
  const handleExportPdf = async () => {
    showToast('Generating high-resolution Production Spec PDF...')
    const snapshotUrl = captureSnapshotRef.current ? captureSnapshotRef.current() : undefined
    await generateProductionPdf({
      config,
      pricing,
      perspectiveSnapshotDataUrl: snapshotUrl
    })
    showToast('PDF downloaded successfully!')
  }

  // Handle Add to Cart
  const handleAddToCart = async () => {
    const snapshotUrl = captureSnapshotRef.current ? captureSnapshotRef.current() : undefined
    const success = await addToShopifyCart(snapshotUrl)
    if (success) {
      showToast('Custom canopy added to Shopify Cart!')
    }
  }

  // Handle Iframe Parent Communication
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
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-400 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Global Header */}
      <Header onExportPdf={handleExportPdf} onAddToCart={handleAddToCart} />

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-slate-800 bg-slate-900 text-xs">
        <button
          onClick={() => setMobileTab('3d')}
          className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 font-bold transition-all ${
            mobileTab === '3d' ? 'bg-brand-500 text-white' : 'text-slate-400'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>3D View</span>
        </button>
        <button
          onClick={() => setMobileTab('2d')}
          className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 font-bold transition-all ${
            mobileTab === '2d' ? 'bg-brand-500 text-white' : 'text-slate-400'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>2D Design</span>
        </button>
        <button
          onClick={() => setMobileTab('options')}
          className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 font-bold transition-all ${
            mobileTab === 'options' ? 'bg-brand-500 text-white' : 'text-slate-400'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Options</span>
        </button>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left: 3D Viewport Area */}
        <div
          className={`w-full md:w-[54%] lg:w-[58%] h-full relative ${
            mobileTab !== '3d' ? 'hidden md:block' : 'block'
          }`}
        >
          <TentViewport
            onCaptureSnapshotRef={(fn) => {
              captureSnapshotRef.current = fn
            }}
          />
        </div>

        {/* Right: 2D Design & Customization Panel */}
        <div
          className={`w-full md:w-[46%] lg:w-[42%] h-full flex flex-col bg-slate-900 border-l border-slate-800 overflow-y-auto ${
            mobileTab === '3d' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Surface Zone Selector */}
          <ZoneSelector />

          {/* 2D Canvas Interactive Surface Editor */}
          <div className="flex-1 min-h-[360px]">
            <ZoneEditor2D />
          </div>

          {/* Product Specifications & Accessories Options */}
          <OptionsDrawer />
        </div>
      </div>

      {/* Shopify Cart Drawer */}
      <CartDrawer onExportPdf={handleExportPdf} />
    </div>
  )
}
export default App
