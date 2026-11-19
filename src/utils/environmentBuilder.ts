import * as THREE from 'three'

export type EnvironmentType = 'studio' | 'tradeshow' | 'street' | 'park'

/**
 * Procedurally generates an asphalt street pavement texture with cobblestone aggregate
 */
function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#2b2d31'
  ctx.fillRect(0, 0, 512, 512)

  // Aggregate noise
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const s = Math.random() * 2 + 1
    const val = Math.floor(Math.random() * 80 + 40)
    ctx.fillStyle = `rgb(${val},${val},${val})`
    ctx.fillRect(x, y, s, s)
  }

  // Street chalk line / pavement markings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
  ctx.lineWidth = 4
  ctx.setLineDash([16, 16])
  ctx.strokeRect(16, 16, 480, 480)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4)
  return texture
}

/**
 * Procedurally generates a polished trade show / convention center epoxy floor
 * with 10x10 ft booth tape markings
 */
function createTradeShowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  // Polished grey epoxy
  ctx.fillStyle = '#374151'
  ctx.fillRect(0, 0, 512, 512)

  // Subtle grid lines
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 1
  for (let x = 0; x <= 512; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 512)
    ctx.stroke()
  }
  for (let y = 0; y <= 512; y += 64) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(512, y)
    ctx.stroke()
  }

  // Hazard booth tape border (Yellow & Black diagonal stripes)
  ctx.lineWidth = 12
  ctx.strokeStyle = '#eab308'
  ctx.strokeRect(6, 6, 500, 500)

  // Booth Text
  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('10x10 EXHIBITION BOOTH #402', 32, 40)

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

/**
 * Procedurally generates a lush green event lawn grass texture
 */
function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#1e3a1e'
  ctx.fillRect(0, 0, 512, 512)

  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const h = Math.random() * 4 + 2
    const g = Math.floor(Math.random() * 70 + 70)
    ctx.fillStyle = `rgb(${Math.floor(g * 0.35)}, ${g}, ${Math.floor(g * 0.2)})`
    ctx.fillRect(x, y, 1.5, h)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(6, 6)
  return texture
}

export class EnvironmentBuilder {
  private group: THREE.Group = new THREE.Group()
  private currentEnv: EnvironmentType = 'studio'

  getGroup(): THREE.Group {
    return this.group
  }

  setEnvironment(env: EnvironmentType) {
    this.currentEnv = env
    this.rebuild()
  }

  getCurrentEnvironment(): EnvironmentType {
    return this.currentEnv
  }

  private rebuild() {
    while (this.group.children.length > 0) {
      const child = this.group.children[0]
      this.group.remove(child)
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose()
    }

    switch (this.currentEnv) {
      case 'studio':
        this.buildStudio()
        break
      case 'tradeshow':
        this.buildTradeShow()
        break
      case 'street':
        this.buildStreet()
        break
      case 'park':
        this.buildPark()
        break
    }
  }

  private buildStudio() {
    // Soft Studio Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(12, 12)
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.22 })
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
    shadowMesh.rotation.x = -Math.PI / 2
    shadowMesh.position.y = -0.005
    shadowMesh.receiveShadow = true
    this.group.add(shadowMesh)

    // Studio Ring Decals
    const ringGeo = new THREE.RingGeometry(1.6, 1.62, 64)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.rotation.x = -Math.PI / 2
    ringMesh.position.y = 0.001
    this.group.add(ringMesh)
  }

  private buildTradeShow() {
    // Polished convention center epoxy floor
    const floorGeo = new THREE.PlaneGeometry(16, 16)
    const floorTex = createTradeShowTexture()
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.35,
      metalness: 0.1
    })
    const floorMesh = new THREE.Mesh(floorGeo, floorMat)
    floorMesh.rotation.x = -Math.PI / 2
    floorMesh.position.y = 0.001
    floorMesh.receiveShadow = true
    this.group.add(floorMesh)

    // Backdrop modular exhibition booth wall (Behind the tent, Z = -2.2m)
    const wallGeo = new THREE.BoxGeometry(7.0, 2.8, 0.08)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.5,
      metalness: 0.05
    })
    const wallMesh = new THREE.Mesh(wallGeo, wallMat)
    wallMesh.position.set(0, 1.4, -2.2)
    wallMesh.castShadow = true
    wallMesh.receiveShadow = true
    this.group.add(wallMesh)

    // Silver aluminum frame trim on booth wall
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
    const trimGeo = new THREE.BoxGeometry(7.05, 0.06, 0.1)
    const topTrim = new THREE.Mesh(trimGeo, trimMat)
    topTrim.position.set(0, 2.8, -2.2)
    this.group.add(topTrim)

    // Overhead exhibition lighting truss frame
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 })
    const trussGeo = new THREE.CylinderGeometry(0.04, 0.04, 7.2, 12)
    const trussMesh = new THREE.Mesh(trussGeo, trussMat)
    trussMesh.rotation.z = Math.PI / 2
    trussMesh.position.set(0, 3.8, 0)
    this.group.add(trussMesh)

    // Spotlights on truss
    for (let x of [-1.8, 0, 1.8]) {
      const spotLight = new THREE.SpotLight(0xfff7ed, 1.2, 12, Math.PI / 4, 0.5)
      spotLight.position.set(x, 3.8, 0)
      spotLight.target.position.set(x * 0.6, 1.2, 0)
      this.group.add(spotLight)
      this.group.add(spotLight.target)
    }
  }

  private buildStreet() {
    // Dark asphalt roadway
    const roadGeo = new THREE.PlaneGeometry(20, 20)
    const roadTex = createAsphaltTexture()
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.8,
      metalness: 0.02
    })
    const roadMesh = new THREE.Mesh(roadGeo, roadMat)
    roadMesh.rotation.x = -Math.PI / 2
    roadMesh.position.y = 0.001
    roadMesh.receiveShadow = true
    this.group.add(roadMesh)

    // Concrete curb border along the rear
    const curbGeo = new THREE.BoxGeometry(20, 0.18, 0.4)
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 })
    const curbMesh = new THREE.Mesh(curbGeo, curbMat)
    curbMesh.position.set(0, 0.09, -3.2)
    curbMesh.castShadow = true
    curbMesh.receiveShadow = true
    this.group.add(curbMesh)
  }

  private buildPark() {
    // Lush lawn grass plane
    const grassGeo = new THREE.PlaneGeometry(24, 24)
    const grassTex = createGrassTexture()
    const grassMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.9,
      metalness: 0.0
    })
    const grassMesh = new THREE.Mesh(grassGeo, grassMat)
    grassMesh.rotation.x = -Math.PI / 2
    grassMesh.position.y = 0.001
    grassMesh.receiveShadow = true
    this.group.add(grassMesh)

    // Wooden park bench in the background (Z = -3.5m)
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
    const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.45), woodMat)
    benchSeat.position.set(-2.5, 0.45, -3.2)
    benchSeat.castShadow = true
    benchSeat.receiveShadow = true
    this.group.add(benchSeat)

    const benchBack = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.06), woodMat)
    benchBack.position.set(-2.5, 0.75, -3.4)
    benchBack.castShadow = true
    this.group.add(benchBack)
  }
}
