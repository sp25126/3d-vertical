import React, { useRef, useState, useEffect } from 'react'
import { Header } from './components/ui/Header'
import { TentViewport } from './components/viewer3d/TentViewport'
import { ShopifyCustomizerPanel } from './components/ui/ShopifyCustomizerPanel'
import { CartDrawer } from './components/ui/CartDrawer'
import { useConfiguratorStore } from './store/useConfiguratorStore'
import { generateProductionPdf } from './services/pdfService'
import { Eye, Sliders, CheckCircle, ChevronLeft } from 'lucide-react'
import { formatCurrency } from './utils/gstUtils'

export const App: React.FC = () => {
  const { config, pricing, currency, addToShopifyCart, fetchPricing, setFabricBaseColor, setModelId } = useConfiguratorStore()
  const captureSnapshotRef = useRef<(() => string) | null>(null)
  const [mobileTab, setMobileTab] = useState<'3d' | 'customize'>('3d')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true)

  useEffect(() => {
    fetchPricing()
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
    // Dispatch resize event so Three.js adapts viewport canvas smoothly
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 50)
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 320)
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

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Column: 3D Studio Stage (Expands to 100% when sidebar is closed) */}
        <div
          className={`${
            isSidebarOpen
              ? 'w-full md:w-[55%] lg:w-[58%]'
              : 'w-full md:w-full'
          } h-full relative transition-all duration-300 ease-in-out border-r border-slate-200 ${
            mobileTab !== '3d' ? 'hidden md:block' : 'block'
          }`}
        >
          <TentViewport
            onCaptureSnapshotRef={(fn) => {
              captureSnapshotRef.current = fn
            }}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />
        </div>

        {/* Floating Toggle Button when Sidebar is closed */}
        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="hidden md:flex fixed right-6 bottom-6 z-40 items-center space-x-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl hover:bg-black hover:scale-105 active:scale-95 transition-all group font-sans text-xs font-bold border border-slate-700/80 backdrop-blur-md"
            title="Open Product Options & Customizer"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <Sliders className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            <span>Customize Canopy</span>
            <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md font-mono text-[11px]">
              {formatCurrency(pricing.finalTotal, currency)}
            </span>
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
        )}

        {/* Right Column: Shopify Customizer PDP Flow (Collapsible) */}
        <div
          className={`${
            isSidebarOpen
              ? 'w-full md:w-[45%] lg:w-[42%] translate-x-0 opacity-100'
              : 'w-0 max-w-0 translate-x-full opacity-0 pointer-events-none'
          } h-full flex flex-col bg-white transition-all duration-300 ease-in-out overflow-hidden ${
            mobileTab === '3d' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ShopifyCustomizerPanel
            onAddToCart={handleAddToCart}
            onExportPdf={handleExportPdf}
            onClose={toggleSidebar}
          />
        </div>
      </div>

      {/* Shopify Cart Slide-Over Drawer */}
      <CartDrawer onExportPdf={handleExportPdf} />
    </div>
  )
}
export default App
