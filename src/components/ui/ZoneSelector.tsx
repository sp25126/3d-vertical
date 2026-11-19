import React from 'react'
import { useConfiguratorStore } from '../../store/useConfiguratorStore'
import { ZONES_METADATA } from '../../constants/tentData'
import { ZoneId } from '../../types/configurator'
import { Layers } from 'lucide-react'

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
        className={`relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
          isSelected
            ? 'bg-brand-500/15 border-brand-500 text-brand-300 shadow-sm'
            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-brand-400' : 'bg-slate-600'}`} />
          <span>{meta.shortLabel}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          {elementCount > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              {elementCount} {elementCount === 1 ? 'item' : 'items'}
            </span>
          ) : (
            <span className="text-[10px] text-slate-500 font-normal">Blank</span>
          )}
          <span className="text-[10px] text-slate-400 font-mono">+${meta.printCost}</span>
        </div>
      </button>
    )
  }

  return (
    <div className="p-4 bg-slate-900 border-b border-slate-800">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          <span>Customizable Surfaces ({Object.values(config.zones).filter(z => z.elements.length > 0).length} of 8 printed)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Peaks Section */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Canopy Roof Peaks (4)
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {peaks.map(renderZoneButton)}
          </div>
        </div>

        {/* Valances Section */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
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
