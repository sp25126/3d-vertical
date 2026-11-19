import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { ZONES_METADATA, FONT_OPTIONS } from '../../constants/tentData'
import { CustomElement, TextElement, ImageElement } from '../../types/configurator'
import { textureSyncService } from '../../services/textureSyncService'
import {
  Type,
  Image as ImageIcon,
  Trash2,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  Sparkles,
  Info,
  Copy,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'

// Built-in vector SVG logos for instant evaluation
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
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23F6AF2D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
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
  const [letterSpacing, setLetterSpacing] = useState(0)
  const [isBold, setIsBold] = useState(true)

  // Dragging & transformation state
  const isDraggingRef = useRef(false)
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const initialElementStateRef = useRef<CustomElement | null>(null)
  const [isSnappingCenter, setIsSnappingCenter] = useState(false)

  const isPeak = zoneMeta?.group === 'peak'
  const canvasWidth = 800
  const canvasHeight = isPeak ? 600 : 220

  // 1. Render 2D Canvas for this Zone
  const renderZoneToCanvas = useCallback(
    (canvas: HTMLCanvasElement, zoneData: typeof currentZone, isInteractive: boolean = false) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = canvas.width
      const h = canvas.height

      // Clear & fill background
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = zoneData.backgroundColor || config.fabricBaseColor
      ctx.fillRect(0, 0, w, h)

      // Draw Safety Bleed Margins (ONLY on interactive screen editor, NEVER on 3D master texture)
      if (isInteractive) {
        ctx.save()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.setLineDash([6, 6])
        ctx.lineWidth = 2

        if (isPeak) {
          ctx.beginPath()
          ctx.moveTo(w / 2, 28)
          ctx.lineTo(w - 28, h - 28)
          ctx.lineTo(28, h - 28)
          ctx.closePath()
          ctx.stroke()
        } else {
          ctx.strokeRect(24, 18, w - 48, h - 36)
        }
        ctx.restore()
      }

      // Render Elements
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

          if (el.letterSpacing && 'letterSpacing' in ctx) {
            ;(ctx as any).letterSpacing = `${el.letterSpacing}px`
          }

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
              renderZoneToCanvas(canvas, zoneData, isInteractive)
            }
          } else if (img.complete) {
            const aspect = (img.naturalWidth || 100) / (img.naturalHeight || 100)
            const baseSize = 140
            const imgW = baseSize * Math.min(aspect, 1.8)
            const imgH = baseSize / Math.max(aspect, 0.6)
            ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH)
          }
        }

        // Bounding Box on Selection (ONLY for interactive screen editor, NEVER on 3D fabric)
        if (isInteractive && el.id === selectedElementId) {
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

          ctx.strokeStyle = '#0F172A' // Clean black stroke
          ctx.lineWidth = 2
          ctx.setLineDash([4, 4])
          ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH)

          ctx.fillStyle = '#0F172A'
          ctx.fillRect(boxW / 2 - 5, boxH / 2 - 5, 10, 10)

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

      // Snap Crosshairs (ONLY for interactive screen editor)
      if (isInteractive && isDraggingRef.current && isSnappingCenter) {
        ctx.save()
        ctx.strokeStyle = '#0284C7'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(w / 2, 0)
        ctx.lineTo(w / 2, h)
        ctx.stroke()
        ctx.restore()
      }
    },
    [config.fabricBaseColor, isPeak, selectedElementId, isSnappingCenter]
  )

  // 2. Sync All Zones
  useEffect(() => {
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
      renderZoneToCanvas(c, config.zones[zoneId], false) // Clean 3D texture
    })

    if (canvasRef.current) {
      renderZoneToCanvas(canvasRef.current, currentZone, true) // Interactive canvas with UI handles
    }

    textureSyncService.updateMasterTexture(config, zoneCanvasesCacheRef.current)
  }, [config, activeZoneId, selectedElementId, renderZoneToCanvas])

  // 3. Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY

    let hitEl: CustomElement | null = null

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
    let newPercentX = initial.x + (deltaX / canvas.width) * 100
    let newPercentY = initial.y + (deltaY / canvas.height) * 100

    const snapsToCenter = Math.abs(newPercentX - 50) < 2.5
    if (snapsToCenter) {
      newPercentX = 50
    }
    setIsSnappingCenter(snapsToCenter)

    newPercentX = Math.max(5, Math.min(95, newPercentX))
    newPercentY = Math.max(5, Math.min(95, newPercentY))

    updateElement(activeZoneId, selectedElementId, {
      x: Math.round(newPercentX * 10) / 10,
      y: Math.round(newPercentY * 10) / 10
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false
    setIsSnappingCenter(false)
    initialElementStateRef.current = null
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch (_) {}
  }

  const handleAddText = () => {
    if (!textInput.trim()) return
    addElement(activeZoneId, {
      type: 'text',
      text: textInput.trim(),
      fontFamily,
      fontSize,
      color: textColor,
      fontWeight: isBold ? 700 : 400,
      letterSpacing: letterSpacing !== 0 ? letterSpacing : undefined,
      x: 50,
      y: isPeak ? 60 : 50,
      rotation: 0,
      scale: 1
    })
  }

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

  const handleDuplicate = () => {
    if (!selectedElement) return
    const { id, ...rest } = selectedElement
    addElement(activeZoneId, { ...rest, x: Math.min(90, rest.x + 4), y: Math.min(90, rest.y + 4) })
  }

  const handleNudge = (dx: number, dy: number) => {
    if (!selectedElement) return
    updateElement(activeZoneId, selectedElement.id, {
      x: Math.max(5, Math.min(95, selectedElement.x + dx)),
      y: Math.max(5, Math.min(95, selectedElement.y + dy))
    })
  }

  const selectedElement = currentZone.elements.find((el) => el.id === selectedElementId)

  return (
    <div className="flex flex-col bg-white text-slate-800">
      {/* 2D Canvas Area */}
      <div className="p-4 flex flex-col items-center justify-center bg-slate-50 border-b border-slate-200">
        <div className="relative border border-slate-300 rounded-xl shadow-inner overflow-hidden bg-slate-200/50">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="cursor-crosshair max-w-full max-h-[220px] object-contain touch-none"
          />

          <div className="absolute top-2 left-2 pointer-events-none">
            <span className="text-[10px] text-slate-600 bg-white/90 px-2 py-0.5 rounded shadow-sm border border-slate-200 flex items-center space-x-1">
              <Info className="w-3 h-3 text-slate-500" />
              <span>Dashed line is safe print zone</span>
            </span>
          </div>
        </div>

        {/* Selected Element Quick Toolbar */}
        {selectedElement && (
          <div className="mt-3 w-full px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-xs">
                {selectedElement.type === 'text' ? 'Text' : 'Image'}
              </span>

              {/* Alignments */}
              <button
                onClick={() => updateElement(activeZoneId, selectedElement.id, { x: 50 })}
                title="Center Horizontally"
                className="p-1 hover:bg-slate-100 rounded text-slate-700"
              >
                <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateElement(activeZoneId, selectedElement.id, { y: 50 })}
                title="Center Vertically"
                className="p-1 hover:bg-slate-100 rounded text-slate-700"
              >
                <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
              </button>

              {/* Nudge Arrows */}
              <div className="flex items-center bg-slate-100 px-1 py-0.5 rounded border border-slate-200 space-x-0.5">
                <button onClick={() => handleNudge(-1, 0)} className="p-0.5 hover:text-black text-slate-500">
                  <ArrowLeft className="w-3 h-3" />
                </button>
                <button onClick={() => handleNudge(1, 0)} className="p-0.5 hover:text-black text-slate-500">
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button onClick={() => handleNudge(0, -1)} className="p-0.5 hover:text-black text-slate-500">
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button onClick={() => handleNudge(0, 1)} className="p-0.5 hover:text-black text-slate-500">
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>

              {/* Duplicate */}
              <button onClick={handleDuplicate} title="Duplicate" className="p-1 hover:bg-slate-100 rounded text-slate-700">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sliders */}
            <div className="flex items-center space-x-2 text-[11px] text-slate-600 font-mono">
              <div className="flex items-center space-x-1">
                <span>Scale:</span>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.05"
                  value={selectedElement.scale}
                  onChange={(e) => updateElement(activeZoneId, selectedElement.id, { scale: parseFloat(e.target.value) })}
                  className="w-14 accent-slate-900 cursor-pointer"
                />
              </div>

              <div className="flex items-center space-x-1">
                <span>Rot:</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={selectedElement.rotation}
                  onChange={(e) => updateElement(activeZoneId, selectedElement.id, { rotation: parseInt(e.target.value) })}
                  className="w-14 accent-slate-900 cursor-pointer"
                />
              </div>

              <button
                onClick={() => removeElement(activeZoneId, selectedElement.id)}
                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editing Tool Tabs */}
      <div className="p-4 bg-white space-y-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'text'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Add Text</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'image'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Upload Logo</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'presets'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sample Badges</span>
          </button>

          {currentZone.elements.length > 0 && (
            <button
              onClick={() => clearZone(activeZoneId)}
              className="ml-auto flex items-center space-x-1 text-xs text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Tab Content: Text */}
        {activeTab === 'text' && (
          <div className="space-y-2.5">
            <div className="flex space-x-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter company name, website or slogan..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
              />
              <button
                onClick={handleAddText}
                className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
              >
                Add Layer
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-semibold uppercase">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.family} value={f.family}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-semibold uppercase">Text Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-7 h-7 rounded border border-slate-300 cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-xs text-slate-700 uppercase">{textColor}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Image */}
        {activeTab === 'image' && (
          <div>
            <label className="border-2 border-dashed border-slate-300 hover:border-slate-900 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
              <ImageIcon className="w-6 h-6 text-slate-500 mb-1" />
              <span className="text-xs font-bold text-slate-800">Choose Brand Logo File</span>
              <span className="text-[10px] text-slate-500 mt-0.5">High-res PNG, SVG, JPG, WebP</span>
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
                className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-900 flex flex-col items-center justify-center transition-all group"
              >
                <img src={p.dataUrl} alt={p.name} className="w-7 h-7 object-contain mb-1 group-hover:scale-105" />
                <span className="text-[10px] text-slate-700 font-semibold truncate w-full text-center">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
