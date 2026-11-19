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

  useEffect(() => {
    fetchPricing()
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleExportPdf = async () => {
    showToast('Compiling High-Resolution Production Spec PDF...')
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
      showToast('Custom canopy added to Shopify Cart payload!')
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
    <div className="flex flex-col h-screen w-screen bg-studio-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-2.5 bg-studio-900/95 text-white px-4 py-3 rounded-2xl shadow-glow-gold border border-gold-500/40 text-xs font-bold font-display backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle className="w-4 h-4 text-gold-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Global Header */}
      <Header onExportPdf={handleExportPdf} onAddToCart={handleAddToCart} />

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-white/10 bg-studio-900 text-xs">
        <button
          onClick={() => setMobileTab('3d')}
          className={`flex-1 py-3 flex items-center justify-center space-x-1.5 font-bold transition-all ${
            mobileTab === '3d' ? 'bg-gold-500 text-slate-950 shadow-glow-gold' : 'text-studio-500'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>3D View</span>
        </button>
        <button
          onClick={() => setMobileTab('2d')}
          className={`flex-1 py-3 flex items-center justify-center space-x-1.5 font-bold transition-all ${
            mobileTab === '2d' ? 'bg-gold-500 text-slate-950 shadow-glow-gold' : 'text-studio-500'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>2D Prepress</span>
        </button>
        <button
          onClick={() => setMobileTab('options')}
          className={`flex-1 py-3 flex items-center justify-center space-x-1.5 font-bold transition-all ${
            mobileTab === 'options' ? 'bg-gold-500 text-slate-950 shadow-glow-gold' : 'text-studio-500'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Specs</span>
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

        {/* Right: 2D Prepress & Customization Panel */}
        <div
          className={`w-full md:w-[46%] lg:w-[42%] h-full flex flex-col bg-studio-900 border-l border-white/10 overflow-y-auto ${
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
