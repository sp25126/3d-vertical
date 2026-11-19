import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { ZONES_METADATA, FONT_OPTIONS } from '../../constants/tentData'
import { CustomElement, TextElement, ImageElement } from '../../types/configurator'
import { textureSyncService } from '../../services/textureSyncService'
import {
  Type,
  Image as ImageIcon,
  Trash2,
  Move,
  RotateCw,
  Maximize,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  Sparkles,
  Info
} from 'lucide-react'

// Built-in vector SVG logos for one-click testing
const PRESET_LOGOS = [
  {
    name: 'Summit Athletics',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>'
  },
  {
    name: 'Tech Horizon',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%2338BDF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>'
  },
  {
    name: 'Craft Falcon',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
  }
]

export const ZoneEditor2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const zoneCanvasesCacheRef = useRef<Record<string, HTMLCanvasElement>>({})
  const imageElementsMapRef = useRef<Record<string, HTMLImageElement>>({})

  const {
    config,
    activeZoneId,
    selectedElementId,
    setSelectedElementId,
    addElement,
    updateElement,
    removeElement,
    clearZone
  } = useConfiguratorStore()

  const currentZone = config.zones[activeZoneId] || { zoneId: activeZoneId, elements: [] }
  const zoneMeta = ZONES_METADATA[activeZoneId]

  // Editing UI state
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'presets'>('text')
  const [textInput, setTextInput] = useState('YOUR LOGO')
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].family)
  const [fontSize, setFontSize] = useState(48)
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [isBold, setIsBold] = useState(true)

  // Dragging / transformation interaction state
  const isDraggingRef = useRef(false)
  const dragHandleRef = useRef<'move' | 'scale' | 'rotate' | null>(null)
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const initialElementStateRef = useRef<CustomElement | null>(null)

  // Determine canvas aspect ratio based on Peak (triangular/trapezoid) vs Valance (horizontal strip)
  const isPeak = zoneMeta.group === 'peak'
  const canvasWidth = 800
  const canvasHeight = isPeak ? 600 : 220

  // 1. Draw 2D Zone Canvas
  const renderZoneToCanvas = useCallback(
    (canvas: HTMLCanvasElement, zoneData: typeof currentZone) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = canvas.width
      const h = canvas.height

      // Clear & fill background
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = zoneData.backgroundColor || config.fabricBaseColor
      ctx.fillRect(0, 0, w, h)

      // Draw Safety / Bleed guides
      ctx.save()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
      ctx.setLineDash([6, 6])
      ctx.lineWidth = 2

      if (isPeak) {
        // Triangular roof peak guide
        ctx.beginPath()
        ctx.moveTo(w / 2, 24)
        ctx.lineTo(w - 24, h - 24)
        ctx.lineTo(24, h - 24)
        ctx.closePath()
        ctx.stroke()
      } else {
        // Valance drop banner rect guide
        ctx.strokeRect(20, 16, w - 40, h - 32)
      }
      ctx.restore()

      // Render elements
      zoneData.elements.forEach((el) => {
        ctx.save()
        const centerX = (el.x / 100) * w
        const centerY = (el.y / 100) * h

        ctx.translate(centerX, centerY)
        ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.scale(el.scale, el.scale)

        if (el.type === 'text') {
          ctx.font = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`
          ctx.fillStyle = el.color
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          // Optional subtle text shadow for high contrast legibility
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
          ctx.shadowBlur = 4
          ctx.shadowOffsetX = 1
          ctx.shadowOffsetY = 2

          ctx.fillText(el.text, 0, 0)
        } else if (el.type === 'image') {
          let img = imageElementsMapRef.current[el.id]
          if (!img) {
            img = new Image()
            img.crossOrigin = 'anonymous'
            img.src = el.url
            img.onload = () => {
              imageElementsMapRef.current[el.id] = img
              renderZoneToCanvas(canvas, zoneData)
            }
          } else if (img.complete) {
            const aspect = (img.naturalWidth || 100) / (img.naturalHeight || 100)
            const baseSize = 140
            const imgW = baseSize * Math.min(aspect, 1.8)
            const imgH = baseSize / Math.max(aspect, 0.6)
            ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH)
          }
        }

        // Draw Selection Bounding Box if selected
        if (el.id === selectedElementId) {
          ctx.restore()
          ctx.save()
          ctx.translate(centerX, centerY)
          ctx.rotate((el.rotation * Math.PI) / 180)

          let boxW = 120 * el.scale
          let boxH = 60 * el.scale
          if (el.type === 'text') {
            ctx.font = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`
            const metrics = ctx.measureText(el.text)
            boxW = (metrics.width + 24) * el.scale
            boxH = (el.fontSize + 16) * el.scale
          }

          ctx.strokeStyle = '#0284C7' // Accent blue
          ctx.lineWidth = 2
          ctx.setLineDash([4, 4])
          ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH)

          // Handles: Scale corner handle
          ctx.fillStyle = '#0284C7'
          ctx.fillRect(boxW / 2 - 5, boxH / 2 - 5, 10, 10)

          // Handles: Rotation top handle
          ctx.beginPath()
          ctx.arc(0, -boxH / 2 - 14, 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.moveTo(0, -boxH / 2)
          ctx.lineTo(0, -boxH / 2 - 14)
          ctx.stroke()
        }

        ctx.restore()
      })
    },
    [config.fabricBaseColor, isPeak, selectedElementId]
  )

  // 2. Synchronize all zone canvases into master 3D texture
  useEffect(() => {
    // Ensure canvas for each zone exists in cache
    Object.keys(config.zones).forEach((zk) => {
      const zoneId = zk as import('../../types/configurator').ZoneId
      if (!zoneCanvasesCacheRef.current[zoneId]) {
        const c = document.createElement('canvas')
        const isZPeak = zoneId.startsWith('peak')
        c.width = 800
        c.height = isZPeak ? 600 : 220
        zoneCanvasesCacheRef.current[zoneId] = c
      }
      const c = zoneCanvasesCacheRef.current[zoneId]
      renderZoneToCanvas(c, config.zones[zoneId])
    })

    // Also update current visible editor canvas
    if (canvasRef.current) {
      renderZoneToCanvas(canvasRef.current, currentZone)
    }

    // Pipe to 3D Three.js master texture
    textureSyncService.updateMasterTexture(config, zoneCanvasesCacheRef.current)
  }, [config, activeZoneId, selectedElementId, renderZoneToCanvas])

  // 3. Pointer event handlers for moving, scaling, rotating elements
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY

    // Check hit test against elements in reverse order (topmost first)
    let hitEl: CustomElement | null = null
    let handle: 'move' | 'scale' | 'rotate' = 'move'

    for (let i = currentZone.elements.length - 1; i >= 0; i--) {
      const el = currentZone.elements[i]
      const elX = (el.x / 100) * canvas.width
      const elY = (el.y / 100) * canvas.height
      const dist = Math.hypot(clickX - elX, clickY - elY)

      if (dist < 60 * el.scale) {
        hitEl = el
        break
      }
    }

    if (hitEl) {
      setSelectedElementId(hitEl.id)
      isDraggingRef.current = true
      dragHandleRef.current = handle
      dragStartPosRef.current = { x: clickX, y: clickY }
      initialElementStateRef.current = { ...hitEl }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } else {
      setSelectedElementId(null)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !selectedElementId || !canvasRef.current || !initialElementStateRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const currentX = (e.clientX - rect.left) * scaleX
    const currentY = (e.clientY - rect.top) * scaleY

    const deltaX = currentX - dragStartPosRef.current.x
    const deltaY = currentY - dragStartPosRef.current.y

    const initial = initialElementStateRef.current
    const newPercentX = Math.max(5, Math.min(95, initial.x + (deltaX / canvas.width) * 100))
    const newPercentY = Math.max(5, Math.min(95, initial.y + (deltaY / canvas.height) * 100))

    updateElement(activeZoneId, selectedElementId, {
      x: Math.round(newPercentX),
      y: Math.round(newPercentY)
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false
    dragHandleRef.current = null
    initialElementStateRef.current = null
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch (_) {}
  }

  // Add new Text Element
  const handleAddText = () => {
    if (!textInput.trim()) return
    addElement(activeZoneId, {
      type: 'text',
      text: textInput.trim(),
      fontFamily,
      fontSize,
      color: textColor,
      fontWeight: isBold ? 700 : 400,
      x: 50,
      y: isPeak ? 60 : 50,
      rotation: 0,
      scale: 1
    })
  }

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      if (!url) return

      const img = new Image()
      img.onload = () => {
        addElement(activeZoneId, {
          type: 'image',
          url,
          name: file.name,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          x: 50,
          y: isPeak ? 55 : 50,
          rotation: 0,
          scale: 1
        })
      }
      img.src = url
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Selected element for inspector controls
  const selectedElement = currentZone.elements.find((el) => el.id === selectedElementId)

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200">
      {/* Zone Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-brand-400">2D Surface Editor</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
              {canvasWidth} x {canvasHeight}px
            </span>
          </div>
          <h2 className="text-base font-bold text-white mt-0.5">{zoneMeta.label}</h2>
        </div>

        {currentZone.elements.length > 0 && (
          <button
            onClick={() => clearZone(activeZoneId)}
            className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Zone</span>
          </button>
        )}
      </div>

      {/* Interactive 2D Canvas Area */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center bg-slate-950/60 overflow-hidden relative">
        <div className="relative border border-slate-700/60 rounded-xl shadow-2xl overflow-hidden bg-slate-900/40">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="cursor-crosshair max-w-full max-h-[300px] object-contain touch-none"
          />

          {/* Guide Overlay Tag */}
          <div className="absolute top-2 left-2 pointer-events-none">
            <span className="text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 flex items-center space-x-1">
              <Info className="w-3 h-3 text-brand-400" />
              <span>Dashed line is safe print margin</span>
            </span>
          </div>
        </div>

        {/* Selected Element Quick Controls */}
        {selectedElement && (
          <div className="mt-3 w-full max-w-md px-3 py-2 bg-slate-800/90 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-brand-300">
                {selectedElement.type === 'text' ? 'Text' : 'Image'} Selected
              </span>

              {/* Center Alignments */}
              <button
                onClick={() => updateElement(activeZoneId, selectedElement.id, { x: 50 })}
                title="Center Horizontally"
                className="p-1 hover:bg-slate-700 rounded text-slate-300"
              >
                <AlignHorizontalJustifyCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateElement(activeZoneId, selectedElement.id, { y: 50 })}
                title="Center Vertically"
                className="p-1 hover:bg-slate-700 rounded text-slate-300"
              >
                <AlignVerticalJustifyCenter className="w-4 h-4" />
              </button>

              {/* Scale Slider */}
              <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                <span>Scale:</span>
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.05"
                  value={selectedElement.scale}
                  onChange={(e) =>
                    updateElement(activeZoneId, selectedElement.id, {
                      scale: parseFloat(e.target.value)
                    })
                  }
                  className="w-16 accent-brand-500 cursor-pointer"
                />
              </div>

              {/* Rotation Slider */}
              <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                <span>Rot:</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={selectedElement.rotation}
                  onChange={(e) =>
                    updateElement(activeZoneId, selectedElement.id, {
                      rotation: parseInt(e.target.value)
                    })
                  }
                  className="w-16 accent-brand-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => removeElement(activeZoneId, selectedElement.id)}
              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded"
              title="Delete Element"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Tool Tabs */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center space-x-2 mb-3">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Add Text</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'image'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Upload Logo</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'presets'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick Presets</span>
          </button>
        </div>

        {/* Tab Content: Text */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter custom slogan or company name..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={handleAddText}
                className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-1"
              >
                <span>Add</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.family} value={f.family}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Text Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-xs text-slate-300 uppercase">{textColor}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Image Upload */}
        {activeTab === 'image' && (
          <div className="space-y-3">
            <label className="border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-all">
              <ImageIcon className="w-8 h-8 text-brand-400 mb-2" />
              <span className="text-xs font-semibold text-white">Click to Upload Brand Logo</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Supports high-res PNG, SVG, JPG, WebP</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Tab Content: Presets */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-3 gap-2">
            {PRESET_LOGOS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  addElement(activeZoneId, {
                    type: 'image',
                    url: p.dataUrl,
                    name: p.name,
                    naturalWidth: 200,
                    naturalHeight: 200,
                    x: 50,
                    y: isPeak ? 55 : 50,
                    rotation: 0,
                    scale: 1
                  })
                }}
                className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-brand-500 flex flex-col items-center justify-center transition-all group"
              >
                <img src={p.dataUrl} alt={p.name} className="w-8 h-8 object-contain mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
