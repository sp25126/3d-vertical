import React from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { ZONES_METADATA } from '../../constants/tentData'
import { ZoneId } from '../../types/configurator'
import { Layers, Compass } from 'lucide-react'

export const ZoneSelector: React.FC = () => {
  const { activeZoneId, setActiveZoneId, config } = useConfiguratorStore()

  const peaks: ZoneId[] = ['peak_front', 'peak_right', 'peak_back', 'peak_left']
  const valances: ZoneId[] = ['valance_front', 'valance_right', 'valance_back', 'valance_left']

  const renderZoneButton = (zoneId: ZoneId) => {
    const meta = ZONES_METADATA[zoneId]
    const isSelected = activeZoneId === zoneId
    const elementCount = config.zones[zoneId]?.elements.length || 0

    return (
      <button
        key={zoneId}
        onClick={() => setActiveZoneId(zoneId)}
        className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
          isSelected
            ? 'bg-gold-500/15 border-gold-500 text-gold-300 shadow-glow-gold'
            : 'bg-studio-850/80 border-white/5 text-slate-300 hover:bg-studio-800 hover:text-white hover:border-white/10'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full transition-all ${
              isSelected ? 'bg-gold-400 scale-125' : 'bg-studio-600'
            }`}
          />
          <span className="font-display tracking-tight">{meta.shortLabel}</span>
        </div>

        <div className="flex items-center space-x-2">
          {elementCount > 0 ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold border border-emerald-500/30">
              {elementCount} {elementCount === 1 ? 'LAYER' : 'LAYERS'}
            </span>
          ) : (
            <span className="text-[10px] text-studio-500 font-normal">Blank</span>
          )}
          <span className="text-[10px] text-studio-500 font-mono">+${meta.printCost}</span>
        </div>
      </button>
    )
  }

  const customizedCount = Object.values(config.zones).filter((z) => z.elements.length > 0).length

  return (
    <div className="p-3.5 bg-studio-900 border-b border-white/10">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-widest text-slate-200 font-mono">
          <Compass className="w-3.5 h-3.5 text-gold-500" />
          <span>Active Canopy Surfaces ({customizedCount}/8 Printed)</span>
        </div>
        <span className="text-[10px] font-mono text-studio-500">Auto-glides camera to view</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Peaks Section */}
        <div>
          <span className="text-[10px] font-mono font-bold text-studio-500 uppercase tracking-widest block mb-1.5">
            Roof Peaks (4)
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {peaks.map(renderZoneButton)}
          </div>
        </div>

        {/* Valances Section */}
        <div>
          <span className="text-[10px] font-mono font-bold text-studio-500 uppercase tracking-widest block mb-1.5">
            Drop Valances (4)
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {valances.map(renderZoneButton)}
          </div>
        </div>
      </div>
    </div>
  )
}
