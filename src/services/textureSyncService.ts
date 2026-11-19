import * as THREE from 'three'
import { TentConfig, ZoneId } from '../types/configurator'

export interface ZoneAtlasMapping {
  zoneId: ZoneId
  // Normalized center on canvas [0..1]
  u: number
  v: number
  // Normalized width & height on canvas [0..1]
  w: number
  h: number
  // Rotation in radians
  rotation: number
  // Vertical flip required due to Three.js canvasTexture flipY
  flipY: boolean
}

// Exact mathematical 4-way radial atlas mappings matching GLB UV unwraps
export const ZONE_ATLAS_MAPPINGS: Record<ZoneId, ZoneAtlasMapping> = {
  peak_front: {
    zoneId: 'peak_front',
    u: 0.500,
    v: 0.740,
    w: 0.44,
    h: 0.28,
    rotation: 0,
    flipY: false
  },
  valance_front: {
    zoneId: 'valance_front',
    u: 0.500,
    v: 0.940,
    w: 0.84,
    h: 0.065,
    rotation: 0,
    flipY: false
  },
  peak_back: {
    zoneId: 'peak_back',
    u: 0.500,
    v: 0.260,
    w: 0.44,
    h: 0.28,
    rotation: Math.PI,
    flipY: false
  },
  valance_back: {
    zoneId: 'valance_back',
    u: 0.500,
    v: 0.060,
    w: 0.84,
    h: 0.065,
    rotation: Math.PI,
    flipY: false
  },
  peak_right: {
    zoneId: 'peak_right',
    u: 0.740,
    v: 0.500,
    w: 0.44,
    h: 0.28,
    rotation: -Math.PI / 2,
    flipY: false
  },
  valance_right: {
    zoneId: 'valance_right',
    u: 0.940,
    v: 0.500,
    w: 0.84,
    h: 0.065,
    rotation: -Math.PI / 2,
    flipY: false
  },
  peak_left: {
    zoneId: 'peak_left',
    u: 0.260,
    v: 0.500,
    w: 0.44,
    h: 0.28,
    rotation: Math.PI / 2,
    flipY: false
  },
  valance_left: {
    zoneId: 'valance_left',
    u: 0.060,
    v: 0.500,
    w: 0.84,
    h: 0.065,
    rotation: Math.PI / 2,
    flipY: false
  }
}

class TextureSyncService {
  private masterCanvas: HTMLCanvasElement | null = null
  private masterCtx: CanvasRenderingContext2D | null = null
  private canvasTexture: THREE.CanvasTexture | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.masterCanvas = document.createElement('canvas')
      this.masterCanvas.width = 2048
      this.masterCanvas.height = 2048
      this.masterCtx = this.masterCanvas.getContext('2d', { willReadFrequently: true })

      this.canvasTexture = new THREE.CanvasTexture(this.masterCanvas)
      this.canvasTexture.colorSpace = THREE.SRGBColorSpace
      this.canvasTexture.flipY = false
      this.canvasTexture.generateMipmaps = true
      this.canvasTexture.minFilter = THREE.LinearMipmapLinearFilter
      this.canvasTexture.magFilter = THREE.LinearFilter
      this.canvasTexture.anisotropy = 16
    }
  }

  getTexture(): THREE.CanvasTexture | null {
    return this.canvasTexture
  }

  getMasterCanvas(): HTMLCanvasElement | null {
    return this.masterCanvas
  }

  updateMasterTexture(
    config: TentConfig,
    zoneCanvases: Record<string, HTMLCanvasElement>
  ): void {
    if (!this.masterCanvas || !this.masterCtx || !this.canvasTexture) return

    const ctx = this.masterCtx
    const w = this.masterCanvas.width
    const h = this.masterCanvas.height

    // 1. Fill base tent fabric color
    ctx.fillStyle = config.fabricBaseColor
    ctx.fillRect(0, 0, w, h)

    // 2. Subtle weave texture for realism
    ctx.save()
    ctx.globalAlpha = 0.06
    ctx.fillStyle = '#000000'
    for (let y = 0; y < h; y += 4) {
      if (y % 8 === 0) {
        ctx.fillRect(0, y, w, 1)
      }
    }
    ctx.restore()

    // 3. Render each zone onto the master texture
    Object.entries(ZONE_ATLAS_MAPPINGS).forEach(([zoneKey, mapping]) => {
      const zoneId = zoneKey as ZoneId
      const zoneCanvas = zoneCanvases[zoneId]
      const zoneData = config.zones[zoneId]

      if (!zoneCanvas && !zoneData) return

      const centerX = mapping.u * w
      const centerY = mapping.v * h
      const targetW = mapping.w * w
      const targetH = mapping.h * h

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(mapping.rotation)
      if (mapping.flipY) {
        ctx.scale(1, -1)
      }

      // Optional zone-specific background override
      if (zoneData?.backgroundColor && zoneData.backgroundColor !== config.fabricBaseColor) {
        ctx.fillStyle = zoneData.backgroundColor
        ctx.fillRect(-targetW / 2, -targetH / 2, targetW, targetH)
      }

      // Draw the customized zone canvas right side up
      if (zoneCanvas && zoneData && zoneData.elements.length > 0) {
        ctx.drawImage(
          zoneCanvas,
          -targetW / 2,
          -targetH / 2,
          targetW,
          targetH
        )
      }

      ctx.restore()
    })

    this.canvasTexture.needsUpdate = true
  }
}

export const textureSyncService = new TextureSyncService()
