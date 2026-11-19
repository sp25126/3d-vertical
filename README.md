# 🎪 3D Interactive Canopy Tent Configurator
### Production-Grade Replica of MVP Visuals Custom Canopy Tent Experience

A high-performance, real-time 3D/2D custom product configurator built in **React + TypeScript + Three.js**. Designed for commercial e-commerce scalability, Shopify Storefront integration, statutory Indian GST invoicing (Rule 46 CGST Rules), dynamic server-driven pricing, and factory prepress production PDF proof generation.

**GitHub Repository:** [https://github.com/sp25126/3d-vertical](https://github.com/sp25126/3d-vertical)

---

## 🌟 Comprehensive Feature Matrix

### 1. Multi-Footprint 3D Viewport (`Three.js` & `WebGL`)
- **4 Commercial Sizes:** **5' x 5'**, **6.5' x 6.5'**, **8' x 8'**, and **10' x 10'** (MVP Flagship standard).
- **Physical Calibration:** Parametric bracket heights, leg dimensions, apex heights, and lift offsets tailored to physical GLB mesh bounds.
- **Hardware Materials:** Real-time PBR material switching between **Commercial White Steel** and **Heavy-Duty Aircraft Aluminum Alloy**.
- **Studio 3-Point Lighting:** Directional Key Light (`#fffbeb`, 1.35), Fill Light (`#f1f5f9`, 0.60), Rim Light (`#e0f2fe`, 0.80), and Front Fill with **ACESFilmic Tone Mapping** (`exposure: 1.0`) ensuring rich, saturated fabric colors without washout.
- **Collapsible Sidebar:** 1-click toggle to collapse the PDP customizer and enter a clean 100% full-screen 3D viewport mode.

### 2. Real-World Contextual Environments
- **Studio Mode:** Clean neutral showroom floor with 360° rotation guidelines and soft contact shadows.
- **Trade Show Mode:** Indoor exhibition convention hall with commercial carpet tiling and overhead event floodlights.
- **Street Expo Mode:** Outdoor festival with asphalt pavement, warm directional sunlight, and street curb ambiance.
- **Park Lawn Mode:** Outdoor event lawn with lush procedural grass patterning, park bench prop, and natural sun casting.

### 3. Human Scale Verification
- **Realistic 1.80m (5'11") Model:** Standing alongside the tent outside the footprint at a natural angle.
- **Dual Measurement Ruler:** 3D vertical reference guide showing dimensions in both **meters and feet/inches** (`1.80 m / 5 ft 11 in` person height, `2.10 m / 6 ft 11 in` valance clearance, `3.40 m / 11 ft 2 in` peak apex).

### 4. Modular Interactive Accessories
- **Saddle Sandbags (Set of 4):** Dual-cylinder saddle ballasts (120 lbs wind resistance) that snap firmly to the base of all 4 legs across all tent footprints with a smooth physical drop animation.
- **Heavy-Duty Spiral Earth Stakes & Ropes:** 12-inch corkscrew auger stakes anchored 100% to the ground plane with tensioned guy lines connecting directly to the 4 canopy corner brackets.
- **All-Terrain Wheeled Transit Bag:** 1680D ballistic nylon roller case with sealed bearing wheels.
- **Interactive 3D Part Inspection:** Clicking on legs, canopy fabric, scissor mechanism, sandbags, stakes, or roller bag opens an engineering inspector displaying specifications, materials, and load ratings.

### 5. Multi-Tier Exploded Engineering View
- Smooth physical component separation:
  - **Tier 1 (Top):** Canopy fabric lifts as a single unified roof.
  - **Tier 2 (Middle):** Scissor pantograph truss mechanism expands into the middle tier.
  - **Tier 3 (Base):** Upright legs and footpads remain firmly grounded on the floor ($Y = 0.00\text{m}$).

### 6. 8-Surface Independent 2D Prepress Customizer
- **4 Roof Peaks & 4 Drop Valances:** Dedicated independent customization of Front, Right, Back, and Left panels.
- **Direct Pointer Manipulation:** Drag, scale, rotate, and center text and graphic layers on the canvas.
- **Typography Engine:** Support for custom fonts (*Inter, Montserrat, Bebas Neue, Oswald, Pacifico*), sizes, weights, letter-spacing, and hex color pickers.
- **Logo & Artwork Uploader:** PNG, SVG, JPG, WebP upload with auto-centering and bleed margin safety guides.
- **1-Click Bulk Tools:** "Copy to all 4 Peaks" and "Copy to all 4 Valances" for instant 360° branding.
- **Two-Way 3D Camera Sync:** Switching active customization panels automatically orbits the 3D camera to face that specific surface directly.

### 7. Sub-Millisecond 2D ⇄ 3D Radial UV Atlas Engine
- Exact 4-way radial atlas layout with `flipY: false` matching glTF UV specifications.
- Eliminates flipped, mirrored, or upside-down graphics, ensuring text reads upright from left to right on all 4 peaks and valances.

### 8. Statutory Indian GST Tax Invoicing (Page 1) & Prepress Proof (Page 2)
- **Section 31 CGST Act & Rule 46 CGST Rules, 2017 Compliant:**
  - Sequential deterministic tax invoice numbering (`MVP/26-27/INV-XXXX`).
  - Supplier & Recipient GSTIN, PAN, CIN, State Code (27 - Maharashtra).
  - Itemized table with HSN/SAC codes (`6306 22 00` for tents, `7610 90 90` for alloy frames, `9989 12` for dye-sub printing, `6306 90 00` for accessories).
  - Statutory 18% GST split: CGST (9.0%) + SGST (9.0%) + IGST (0.0%).
  - HSN / SAC Tax Analysis Schedule with taxable values and tax totals.
  - Amount Chargeable in words (`numberToWordsINR`).
  - Bank remittance details (NEFT/RTGS/UPI) and digitally signed authorization block.
  - Standard ASCII `INR` currency formatting eliminating jsPDF Unicode glyph bugs.
- **Factory Prepress Proof (Page 2):**
  - Side-by-side engineering specifications and **Full-Bleed 3D Perspective Hero Photo** captured at a calibrated 34° isometric beauty angle.
  - 2D surface prepress dielines and thumbnails with bleed margin certifications.
  - Factory floor Quality Control sign-off checklist (Vector RIP resolution, Delta-E CMYK calibration, hem clearances).

### 9. Decoupled Pricing Engine & Shopify Cart Integration
- Real-time dual currency switching (**INR / USD**).
- Simulated Shopify Storefront slide-over cart with full line-item properties (`_config_id`, `Dimensions`, `Frame Type`, `Customized Zones`, `_preview_thumbnail`).
- Bi-directional `postMessage` protocol for embedding in Shopify themes (`embed-demo.html`).

---

## 📐 Project Structure

```
src/
├── types/configurator.ts         # Central product variant, zone & pricing schema
├── constants/tentData.ts         # Footprints, frame hardware, accessories & HSN codes
├── store/useConfiguratorStore.ts # Centralized Zustand state management
├── services/
│   ├── pricingService.ts         # Asynchronous pricing & tax calculation engine
│   ├── shopifyService.ts         # Shopify cart line items & postMessage bridge
│   ├── pdfService.ts             # Statutory GST Tax Invoice & Prepress PDF generator
│   └── textureSyncService.ts     # 2048x2048 4-way radial UV texture atlas engine
├── utils/
│   └── gstUtils.ts               # Indian Rupee to words converter & currency formatters
├── components/
│   ├── viewer3d/
│   │   ├── TentViewport.tsx      # Three.js scene, PBR lighting, camera animation & accessories
│   │   └── EnvironmentBuilder.ts # Contextual 3D environments (Studio, Trade Show, Expo, Lawn)
│   ├── canvas2d/
│   │   └── ZoneEditor2D.tsx      # Interactive 2D dieline canvas with transform handles
│   └── ui/
│       ├── Header.tsx            # Global top bar, currency toggle, size pills, PDF export
│       ├── ShopifyCustomizerPanel.tsx # Collapsible e-commerce PDP flow
│       ├── ZoneSelector.tsx      # 8-surface selection matrix with art count badges
│       └── CartDrawer.tsx        # Shopify cart drawer with line-item metadata
├── App.tsx                       # Main application shell with split-view & full-bleed modes
└── embed-demo.html               # Storefront test harness demonstrating iframe embedding
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+ (tested on Node v22+)
- npm 9+

### Commands
```bash
# Clone the repository
git clone https://github.com/sp25126/3d-vertical.git
cd 3din

# Install dependencies
npm install

# Start local development server
npm run dev
# Server runs on http://localhost:3002/

# Verify production build
npm run build
npm run preview
```

### Testing Shopify Iframe Embedding
1. Ensure the development server is running on `http://localhost:3002`.
2. Open `embed-demo.html` in your browser.
3. Use the host controls to test size changes, dye color presets, and cart payloads via the `postMessage` bridge.

---

## 📄 License
MIT License. Created for the Interactive 3D Product Configurator Technical Assessment.
