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
}

// 4-way radial unfold atlas mapping based on exact GLB mesh UVs
export const ZONE_ATLAS_MAPPINGS: Record<ZoneId, ZoneAtlasMapping> = {
  peak_front: {
    zoneId: 'peak_front',
    u: 0.50,
    v: 0.28, // 1.0 - 0.72 = 0.28 from top
    w: 0.38,
    h: 0.26,
    rotation: 0
  },
  peak_back: {
    zoneId: 'peak_back',
    u: 0.50,
    v: 0.72, // 1.0 - 0.28 = 0.72 from top
    w: 0.38,
    h: 0.26,
    rotation: Math.PI // 180 degrees
  },
  peak_right: {
    zoneId: 'peak_right',
    u: 0.72,
    v: 0.50,
    w: 0.38,
    h: 0.26,
    rotation: -Math.PI / 2 // -90 degrees
  },
  peak_left: {
    zoneId: 'peak_left',
    u: 0.28,
    v: 0.50,
    w: 0.38,
    h: 0.26,
    rotation: Math.PI / 2 // +90 degrees
  },
  valance_front: {
    zoneId: 'valance_front',
    u: 0.50,
    v: 0.065, // top edge
    w: 0.42,
    h: 0.075,
    rotation: 0
  },
  valance_back: {
    zoneId: 'valance_back',
    u: 0.50,
    v: 0.935, // bottom edge
    w: 0.42,
    h: 0.075,
    rotation: Math.PI
  },
  valance_right: {
    zoneId: 'valance_right',
    u: 0.935,
    v: 0.50, // right edge
    w: 0.42,
    h: 0.075,
    rotation: -Math.PI / 2
  },
  valance_left: {
    zoneId: 'valance_left',
    u: 0.065,
    v: 0.50, // left edge
    w: 0.42,
    h: 0.075,
    rotation: Math.PI / 2
  }
}

class TextureSyncService {
  private masterCanvas: HTMLCanvasElement | null = null
  private masterCtx: CanvasRenderingContext2D | null = null
  private canvasTexture: THREE.CanvasTexture | null = null
  private baseFabricImg: HTMLImageElement | null = null
  private isImageLoaded = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.masterCanvas = document.createElement('canvas')
      this.masterCanvas.width = 2048
      this.masterCanvas.height = 2048
      this.masterCtx = this.masterCanvas.getContext('2d', { willReadFrequently: true })

      this.canvasTexture = new THREE.CanvasTexture(this.masterCanvas)
      this.canvasTexture.colorSpace = THREE.SRGBColorSpace
      this.canvasTexture.generateMipmaps = true
      this.canvasTexture.minFilter = THREE.LinearMipmapLinearFilter
      this.canvasTexture.magFilter = THREE.LinearFilter
      this.canvasTexture.anisotropy = 8

      // Preload base fabric normal / diffuse if desired
      this.baseFabricImg = new Image()
      this.baseFabricImg.crossOrigin = 'anonymous'
      this.baseFabricImg.onload = () => {
        this.isImageLoaded = true
      }
      this.baseFabricImg.src = '/textures/fabric_base.png'
    }
  }

  getTexture(): THREE.CanvasTexture | null {
    return this.canvasTexture
  }

  getMasterCanvas(): HTMLCanvasElement | null {
    return this.masterCanvas
  }

  /**
   * Updates the master 3D canvas texture with current tent configuration and zone canvases
   */
  updateMasterTexture(
    config: TentConfig,
    zoneCanvases: Record<string, HTMLCanvasElement>
  ): void {
    if (!this.masterCanvas || !this.masterCtx || !this.canvasTexture) return

    const ctx = this.masterCtx
    const w = this.masterCanvas.width
    const h = this.masterCanvas.height

    // 1. Fill base tent color
    ctx.fillStyle = config.fabricBaseColor
    ctx.fillRect(0, 0, w, h)

    // 2. Add subtle procedural fabric grain overlay for realism
    ctx.save()
    ctx.globalAlpha = 0.08
    ctx.fillStyle = '#000000'
    for (let y = 0; y < h; y += 4) {
      if (y % 8 === 0) {
        ctx.fillRect(0, y, w, 1)
      }
    }
    ctx.restore()

    // 3. Render each zone onto the master texture according to atlas mappings
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

      // Optional zone-specific background override
      if (zoneData?.backgroundColor && zoneData.backgroundColor !== config.fabricBaseColor) {
        ctx.fillStyle = zoneData.backgroundColor
        ctx.fillRect(-targetW / 2, -targetH / 2, targetW, targetH)
      }

      // Draw the customized zone canvas if available
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

    // Notify Three.js that texture buffer changed
    this.canvasTexture.needsUpdate = true
  }
}

export const textureSyncService = new TextureSyncService()
