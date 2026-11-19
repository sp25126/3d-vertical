import jsPDF from 'jspdf'
import { TentConfig, PricingBreakdown, ZoneId } from '../types/configurator'
import { TENT_MODELS, FRAME_TYPES, ACCESSORIES, ZONES_METADATA } from '../constants/tentData'

interface PdfExportOptions {
  config: TentConfig
  pricing: PricingBreakdown
  perspectiveSnapshotDataUrl?: string
  zoneSnapshots?: Record<ZoneId, string>
}

export async function generateProductionPdf({
  config,
  pricing,
  perspectiveSnapshotDataUrl,
  zoneSnapshots = {} as Record<ZoneId, string>
}: PdfExportOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  let y = margin

  const model = TENT_MODELS[config.modelId]
  const frame = FRAME_TYPES[config.frameType]
  const orderRef = `MVP-ORD-${Date.now().toString(36).toUpperCase()}`

  // 1. Header Banner
  doc.setFillColor(15, 23, 42) // Slate 900
  doc.rect(0, 0, pageWidth, 28, 'F')

  doc.setTextColor(246, 175, 45) // MVP Gold
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('MVP VISUALS', margin, 12)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Custom Canopy Production Proof & Order Summary', margin, 18)

  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Order Ref: ${orderRef}`, pageWidth - margin, 12, { align: 'right' })
  doc.text(`Date: ${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()}`, pageWidth - margin, 18, { align: 'right' })

  y = 35

  // 2. Specifications Table & 3D Render Side-by-Side
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('1. Product & Hardware Configuration', margin, y)
  y += 5

  const leftColWidth = 90
  const startY = y

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)

  const specRows: [string, string][] = [
    ['Canopy Model:', model.name],
    ['Footprint:', model.dimensions],
    ['Frame Hardware:', frame.name],
    ['Fabric Base Color:', config.fabricBaseColor.toUpperCase()],
    ['Fabric Grade:', '600D Heavy-Duty UV Polyester'],
    ['Printing Process:', 'Full Dye-Sublimation (Edge-to-Edge)'],
    ['Included Accessories:', config.accessories.length > 0
      ? config.accessories.map((id) => ACCESSORIES.find((a) => a.id === id)?.name).join(', ')
      : 'None (Base Hardware Only)']
  ]

  specRows.forEach(([key, val]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(key, margin, y)
    doc.setFont('helvetica', 'normal')
    // Wrap text if needed
    const splitVal = doc.splitTextToSize(val, leftColWidth - 32)
    doc.text(splitVal, margin + 32, y)
    y += Math.max(splitVal.length * 4.5, 5.5)
  })

  // 3. 3D Perspective Snapshot Box on the Right
  const rightColX = margin + leftColWidth + 6
  const imageBoxWidth = pageWidth - rightColX - margin
  const imageBoxHeight = y - startY + 10

  doc.setDrawColor(226, 232, 240)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(rightColX, startY - 2, imageBoxWidth, imageBoxHeight, 2, 2, 'FD')

  if (perspectiveSnapshotDataUrl) {
    try {
      doc.addImage(perspectiveSnapshotDataUrl, 'PNG', rightColX + 2, startY, imageBoxWidth - 4, imageBoxHeight - 4)
    } catch (err) {
      console.warn('Could not render perspective image into PDF', err)
    }
  } else {
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('3D Perspective View', rightColX + imageBoxWidth / 2, startY + imageBoxHeight / 2, { align: 'center' })
  }

  y = Math.max(y + 8, startY + imageBoxHeight + 8)

  // 4. Financial & Pricing Breakdown
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text('2. Financial Breakdown (Dynamic Quote)', margin, y)
  y += 5

  doc.setFillColor(241, 245, 249)
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Item Description', margin + 3, y + 4.2)
  doc.text('Qty', margin + 95, y + 4.2)
  doc.text('Unit Price', margin + 115, y + 4.2)
  doc.text('Total', pageWidth - margin - 3, y + 4.2, { align: 'right' })
  y += 6

  const lineItems = [
    { desc: `${model.name} (Base Fabric + Hardware)`, qty: 1, unit: `$${pricing.basePrice.toFixed(2)}`, total: `$${pricing.basePrice.toFixed(2)}` },
    ...(pricing.frameUpgradeCost > 0 ? [{ desc: frame.name, qty: 1, unit: `$${pricing.frameUpgradeCost.toFixed(2)}`, total: `$${pricing.frameUpgradeCost.toFixed(2)}` }] : []),
    ...(pricing.printTotal > 0 ? [{ desc: `Custom Printed Locations (${pricing.customizedZonesCount} zones)`, qty: pricing.customizedZonesCount, unit: 'Variable', total: `$${pricing.printTotal.toFixed(2)}` }] : []),
    ...(pricing.accessoriesTotal > 0 ? [{ desc: 'Selected Hardware Accessories', qty: config.accessories.length, unit: 'Misc', total: `$${pricing.accessoriesTotal.toFixed(2)}` }] : []),
  ]

  doc.setFont('helvetica', 'normal')
  lineItems.forEach((item) => {
    doc.text(item.desc, margin + 3, y + 4)
    doc.text(String(item.qty), margin + 95, y + 4)
    doc.text(item.unit, margin + 115, y + 4)
    doc.text(item.total, pageWidth - margin - 3, y + 4, { align: 'right' })
    y += 5.5
  })

  doc.setDrawColor(203, 213, 225)
  doc.line(margin, y, pageWidth - margin, y)
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.text('Estimated Sales Tax (8%):', margin + 105, y)
  doc.text(`$${pricing.estimatedTax.toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' })
  y += 5
  doc.setFontSize(10)
  doc.setTextColor(249, 115, 22)
  doc.text('Final Order Total:', margin + 105, y)
  doc.text(`$${pricing.finalTotal.toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' })
  y += 10

  // 5. Zone Proofs Section
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('3. Detailed Surface Customization Proofs', margin, y)
  y += 5

  const customizedZones = Object.values(config.zones).filter((z) => z.elements.length > 0)

  if (customizedZones.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('No custom graphics uploaded. Solid color dye selected for all panels.', margin, y + 4)
  } else {
    // Render 2-column grid of customized panels
    const colW = (pageWidth - margin * 2 - 8) / 2
    let col = 0
    let rowStartY = y

    customizedZones.forEach((zone, idx) => {
      const meta = ZONES_METADATA[zone.zoneId]
      const cardX = margin + col * (colW + 8)

      // Check if we need page break
      if (rowStartY + 50 > pageHeight - margin) {
        doc.addPage()
        rowStartY = margin + 10
        y = rowStartY
      }

      doc.setDrawColor(226, 232, 240)
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(cardX, rowStartY, colW, 45, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(15, 23, 42)
      doc.text(meta ? meta.label : zone.zoneId, cardX + 3, rowStartY + 6)

      // Add thumbnail snapshot if available
      const snapshot = zoneSnapshots[zone.zoneId]
      if (snapshot) {
        try {
          doc.addImage(snapshot, 'PNG', cardX + 3, rowStartY + 9, 36, 32)
        } catch (e) {
          console.warn('Could not add zone proof image', e)
        }
      }

      // Metadata details
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(71, 85, 105)
      let metaY = rowStartY + 12
      doc.text(`Elements: ${zone.elements.length}`, cardX + 42, metaY)
      metaY += 4
      doc.text(`Background: ${zone.backgroundColor || config.fabricBaseColor}`, cardX + 42, metaY)
      metaY += 4

      zone.elements.slice(0, 3).forEach((el, elIdx) => {
        if (el.type === 'text') {
          doc.text(`• Text: "${el.text.substring(0, 15)}"`, cardX + 42, metaY)
        } else {
          doc.text(`• Image: ${el.name.substring(0, 15)}`, cardX + 42, metaY)
        }
        metaY += 3.8
      })

      if (col === 0) {
        col = 1
      } else {
        col = 0
        rowStartY += 48
      }
    })
  }

  // Footer Disclaimers
  const footerY = pageHeight - 12
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Confidential Production Specification • MVP Visuals Interactive Configurator • All rights reserved', margin, footerY)
  doc.text(`Page 1 of 1`, pageWidth - margin, footerY, { align: 'right' })

  // Trigger Save
  doc.save(`Canopy_Spec_${config.modelId}_${orderRef}.pdf`)
}
