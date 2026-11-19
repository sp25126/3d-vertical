# 🎪 3D Interactive Canopy Tent Configurator
### Production-Grade Replica of MVP Visuals Custom Canopy Tent Experience

A high-performance, real-time 3D/2D custom product configurator built in **React + TypeScript + Three.js**. Designed for e-commerce scalability, Shopify Storefront integration, dynamic server-driven pricing, and print-ready production PDF proof generation.

---

## 🌟 Key Features

1. **Multi-Model 3D Viewport (Three.js)**
   - Supports 4 standard industry footprints: **5' x 5'**, **6.5' x 6.5'**, **8' x 8'**, and **10' x 10'** (MVP Flagship spec).
   - Realistic PBR studio lighting, directional key lights, ambient fill, and soft contact ground shadows.
   - 360° damped OrbitControls, zoom bounds, auto-rotation toggle, and zone-focus camera animations.
   - Real-time material switching between **Commercial Steel** and **Heavy-Duty Hexagonal Aluminum** hardware.

2. **Multi-Zone Independent 2D Surface Editor**
   - Direct customization of **4 Canopy Roof Peaks** (Front, Right, Back, Left) and **4 Drop Valances** (Front, Right, Back, Left).
   - Real-time interactive canvas with direct pointer manipulation: move, scale, rotate, and center objects.
   - Text engine supporting custom fonts (*Inter, Montserrat, Bebas Neue, Oswald, Pacifico*), sizes, weights, and color pickers.
   - Image & brand logo uploader (PNG, SVG, JPG, WebP) with auto-centering and bleed margin safety guides.
   - Quick preset logos (*Summit Athletics, Tech Horizon, Craft Falcon*) for 1-click test evaluation.

3. **Sub-Millisecond 2D ⇄ 3D Texture Synchronization**
   - Custom **4-way radial UV unfold atlas engine** (`textureSyncService.ts`) mapping 2D designs directly to the GLB mesh coordinates.
   - Zero-overhead offscreen canvas compositing directly updating `THREE.CanvasTexture` with anisotropic filtering (8x) and linear mipmapping.

4. **Decoupled Dynamic Pricing Service**
   - Asynchronous `PricingService` simulating remote ERP/Shopify API latency.
   - Formula-driven pricing:
     $$\text{Final Price} = \text{Base Model Cost} + \text{Frame Upgrade} + (\text{Printed Zones} \times \text{Print Fee}) + \text{Accessories} + \text{Estimated Tax}$$
   - Transparent cost attribution breakdown tooltip.

5. **Shopify Storefront Cart & Iframe Integration**
   - Simulated Shopify Cart slide-over drawer with line-item properties (`_config_id`, `Canopy Dimensions`, `Frame Type`, `Customized Zones`, `_print_cost`, `_preview_thumbnail`).
   - Mock checkout flow with order confirmation and confetti celebration.
   - Bi-directional `postMessage` protocol enabling embedding in parent Shopify themes via `<iframe>` (`embed-demo.html`).

6. **Production Spec Sheet PDF Generator**
   - Client-side vector & raster PDF export via `jsPDF`.
   - Compiles order reference, customer timestamp, hardware specs, 3D perspective thumbnail render, 2D flat panel proofs with safety guides, Bill of Materials (BOM), and dynamic quote breakdown.

---

## 📐 Architecture & Key Technical Decisions

```
src/
├── types/configurator.ts         # Generic, reusable schema for product variants & zones
├── constants/tentData.ts         # Tent models, hardware frames, colors, accessories & camera angles
├── store/useConfiguratorStore.ts # Centralized Zustand state management
├── services/
│   ├── pricingService.ts         # Async decoupled pricing engine with caching
│   ├── shopifyService.ts         # Mock Shopify Storefront API & postMessage dispatcher
│   ├── pdfService.ts             # jsPDF production spec sheet generator
│   └── textureSyncService.ts     # Master 2048x2048 canvas texture atlas & 3D sync
├── components/
│   ├── viewer3d/
│   │   └── TentViewport.tsx      # Three.js WebGL scene, lighting, glTF loader & camera lerp
│   ├── canvas2d/
│   │   └── ZoneEditor2D.tsx      # Interactive 2D editing surface with transform handles
│   └── ui/
│       ├── Header.tsx            # Navigation, size selector, presets, live price pill
│       ├── ZoneSelector.tsx      # 8-surface selector with print count indicators
│       ├── OptionsDrawer.tsx     # Accordion for footprint, hardware, base dye & accessories
│       └── CartDrawer.tsx        # Shopify cart drawer with line-item properties
├── App.tsx                       # Root container with responsive desktop/mobile layouts
└── embed-demo.html               # Parent storefront test page demonstrating iframe embedding
```

### Why Zustand?
Zustand provides a minimal, un-opinionated store outside of React's component lifecycle. This allows the 3D canvas render loop and the 2D canvas editor to access and update configuration state without triggering unnecessary top-to-bottom React re-renders.

### Why Direct Three.js with Custom Canvas Hooks?
While React Three Fiber (R3F) is popular, direct Three.js lifecycle management allows:
1. Absolute control over `texture.needsUpdate = true` and WebGL context memory disposal.
2. Zero compatibility bottlenecks across major React versions (e.g. React 19).
3. Precision camera animation lerping and smooth model geometry swapping.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24.11.0)
- npm 9+

### Installation & Local Run
```bash
# Clone the repository
git clone <repo-url>
cd 3din

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser to `http://localhost:3000` to use the configurator.

### Testing Iframe Embedding
To test the parent Shopify storefront embedding demo:
1. Ensure the dev server is running on `http://localhost:3000`.
2. Open `embed-demo.html` directly in your browser.
3. Test sending parent commands (`Set 10x10`, `Navy Dye`, `Red Dye`) and inspect live `postMessage` event logs when adding to cart.

### Production Build
```bash
npm run build
npm run preview
```

---

## 📄 License
MIT License. Created for the Interactive Product Configurator Technical Assessment.
