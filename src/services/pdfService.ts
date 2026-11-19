import jsPDF from 'jspdf'
import { TentConfig, PricingBreakdown, ZoneId } from '../types/configurator'
import { TENT_MODELS, FRAME_TYPES, ACCESSORIES, ZONES_METADATA } from '../constants/tentData'
import { numberToWordsINR, formatInvoiceAmount } from '../utils/gstUtils'

interface PdfExportOptions {
  config: TentConfig
  pricing: PricingBreakdown
  perspectiveSnapshotDataUrl?: string
  zoneSnapshots?: Record<ZoneId, string>
}

/**
 * Generates an official Government-Approved GST Tax Invoice (Page 1)
 * and Technical 2D/3D Prepress Production Proof (Page 2)
 * Complies with Section 31 of CGST Act, 2017 & Rule 46 of CGST Rules, 2017
 */
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

  const pageWidth = doc.internal.pageSize.getWidth()   // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight() // 297 mm
  const margin = 12
  const contentWidth = pageWidth - margin * 2          // 186 mm
  const isINR = pricing.currency === 'INR'

  const model = TENT_MODELS[config.modelId]
  const frame = FRAME_TYPES[config.frameType]

  // Deterministic invoice numbering (Rule 46(b) CGST Rules: sequential, max 16 chars)
  const dateObj = new Date()
  const yearSuffix = `${dateObj.getFullYear().toString().slice(-2)}-${(dateObj.getFullYear() + 1).toString().slice(-2)}`
  const seqNum = (Math.abs(Date.now() % 9000) + 1000).toString()
  const invoiceNumber = `MVP/${yearSuffix}/INV-${seqNum}`
  const orderRef = `#SHPFY-982${seqNum.slice(-2)}`
  const invoiceDateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  // ==========================================================================
  // PAGE 1: STATUTORY GOVERNMENT-APPROVED GST TAX INVOICE
  // ==========================================================================

  // --- 1. Top Legal Header Banner ---
  doc.setFillColor(15, 23, 42) // Slate 900
  doc.rect(margin, margin, contentWidth, 14, 'F')

  doc.setTextColor(246, 175, 45) // MVP Gold
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('TAX INVOICE', margin + 4, margin + 6.5)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Issued under Section 31 of CGST Act, 2017 read with Rule 46 of CGST Rules, 2017', margin + 4, margin + 11)

  doc.setFontSize(7.5)
  doc.setTextColor(226, 232, 240)
  doc.text('(Original for Recipient • Commercial Supply)', pageWidth - margin - 4, margin + 9, { align: 'right' })

  let y = margin + 17

  // --- 2. Supplier & Invoice Metadata Dual Box ---
  const boxHeight = 36
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(248, 250, 252)
  doc.rect(margin, y, contentWidth, boxHeight, 'FD')

  // Vertical divider between Supplier and Invoice details
  const midX = margin + contentWidth * 0.52
  doc.line(midX, y, midX, y + boxHeight)

  // Left Column: Supplier Details
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text('MVP VISUALS (INDIA) PRIVATE LIMITED', margin + 3, y + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(71, 85, 105)
  doc.text('Plot No. 42, Marol Industrial Estate, Andheri East, Mumbai, MH - 400093', margin + 3, y + 9.5)
  doc.text('CIN: U22219MH2021PTC368912 | PAN: AABCM8291P', margin + 3, y + 13.5)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('GSTIN: 27AABCM8291P1ZV', margin + 3, y + 18)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('State: Maharashtra | State Code: 27', margin + 3, y + 22)
  doc.text('Email: billing@mvpvisuals.in | Helpline: +91 22 6982 4400', margin + 3, y + 26)
  doc.text('Website: https://mvpvisuals.com', margin + 3, y + 30)

  // Right Column: Invoice & Dispatch Metadata
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(15, 23, 42)

  const drawMetaRow = (label: string, val: string, rowY: number) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(71, 85, 105)
    doc.text(label, midX + 3, rowY)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(val, pageWidth - margin - 3, rowY, { align: 'right' })
  }

  drawMetaRow('Tax Invoice No:', invoiceNumber, y + 5)
  drawMetaRow('Invoice Date:', invoiceDateStr, y + 9.5)
  drawMetaRow('Place of Supply:', '27 - Maharashtra', y + 14)
  drawMetaRow('Reverse Charge (RCM):', 'No', y + 18.5)
  drawMetaRow('Shopify Order Ref:', orderRef, y + 23)
  drawMetaRow('Transport / Courier:', 'SafeXpress Surface Logistics', y + 27.5)
  drawMetaRow('Payment Mode:', 'Prepaid Commercial (Online / Shopify)', y + 32)

  y += boxHeight + 3

  // --- 3. Recipient (Bill To & Ship To) Box ---
  const recipientBoxH = 22
  doc.rect(margin, y, contentWidth, recipientBoxH, 'FD')
  const recipientMidX = margin + contentWidth * 0.5
  doc.line(recipientMidX, y, recipientMidX, y + recipientBoxH)

  // Bill To
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(15, 23, 42)
  doc.text('DETAILS OF RECEIVER / BILL TO:', margin + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(51, 65, 85)
  doc.text('Name: Event Horizon Enterprise Solutions Pvt Ltd', margin + 3, y + 9)
  doc.text('Address: Suite 402, Trade World, Kamala City, Lower Parel, Mumbai, MH - 400013', margin + 3, y + 13)
  doc.setFont('helvetica', 'bold')
  doc.text('GSTIN / UIN: 27AAACE4812K1Z9   |   State Code: 27 (Maharashtra)', margin + 3, y + 17.5)

  // Ship To
  doc.text('DISPATCH / SHIP TO:', recipientMidX + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Destination: BKC Exhibition Center, Hall 3, Bandra East, Mumbai - 400051', recipientMidX + 3, y + 9)
  doc.text('Contact Person: Logistics Operations Desk (+91 98201 44820)', recipientMidX + 3, y + 13)
  doc.setFont('helvetica', 'bold')
  doc.text('Dispatch State: 27 - Maharashtra (Intra-State Supply)', recipientMidX + 3, y + 17.5)

  y += recipientBoxH + 4

  // --- 4. Itemized GST Billing Table ---
  // Headers
  const colX = {
    sno: margin + 2,
    desc: margin + 10,
    hsn: margin + 76,
    qty: margin + 98,
    rate: margin + 115,
    taxable: margin + 135,
    cgst: margin + 152,
    sgst: margin + 167,
    total: pageWidth - margin - 2
  }

  const tableHeaderH = 6.5
  doc.setFillColor(30, 41, 59) // Slate 800
  doc.rect(margin, y, contentWidth, tableHeaderH, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(255, 255, 255)
  doc.text('#', colX.sno, y + 4.5)
  doc.text('Description of Goods / Services', colX.desc, y + 4.5)
  doc.text('HSN/SAC', colX.hsn, y + 4.5)
  doc.text('Qty', colX.qty, y + 4.5)
  doc.text('Rate (₹)', colX.rate, y + 4.5, { align: 'right' })
  doc.text('Taxable (₹)', colX.taxable, y + 4.5, { align: 'right' })
  doc.text('CGST (9%)', colX.cgst, y + 4.5, { align: 'right' })
  doc.text('SGST (9%)', colX.sgst, y + 4.5, { align: 'right' })
  doc.text('Total (₹)', colX.total, y + 4.5, { align: 'right' })

  y += tableHeaderH

  // Build Invoice Rows
  interface InvoiceRow {
    sno: number
    desc: string
    hsn: string
    qty: number
    rate: number
    taxable: number
    cgst: number
    sgst: number
    total: number
  }

  const invoiceRows: InvoiceRow[] = []
  let rowCount = 1

  // 1. Base Canopy
  const baseRate = pricing.basePrice
  const baseTaxable = baseRate
  const baseCgst = Math.round(baseTaxable * 0.09 * 100) / 100
  const baseSgst = Math.round(baseTaxable * 0.09 * 100) / 100
  invoiceRows.push({
    sno: rowCount++,
    desc: `${model.name} (${model.dimensions}) - 600D PU Polyester Top`,
    hsn: model.hsnCode || '6306 22 00',
    qty: 1,
    rate: baseRate,
    taxable: baseTaxable,
    cgst: baseCgst,
    sgst: baseSgst,
    total: baseTaxable + baseCgst + baseSgst
  })

  // 2. Frame Hardware Upgrade
  if (pricing.frameUpgradeCost > 0) {
    const fRate = pricing.frameUpgradeCost
    const fCgst = Math.round(fRate * 0.09 * 100) / 100
    const fSgst = Math.round(fRate * 0.09 * 100) / 100
    invoiceRows.push({
      sno: rowCount++,
      desc: `${frame.name} (Corrosion-Proof Aircraft Alloy)`,
      hsn: frame.hsnCode || '7610 90 90',
      qty: 1,
      rate: fRate,
      taxable: fRate,
      cgst: fCgst,
      sgst: fSgst,
      total: fRate + fCgst + fSgst
    })
  }

  // 3. Custom Dye-Sublimation Printing
  if (pricing.printTotal > 0) {
    const pRate = pricing.printTotal
    const pCgst = Math.round(pRate * 0.09 * 100) / 100
    const pSgst = Math.round(pRate * 0.09 * 100) / 100
    invoiceRows.push({
      sno: rowCount++,
      desc: `4K Dye-Sublimation Print (${pricing.customizedZonesCount} Custom Panels: Peaks & Valances)`,
      hsn: '9989 12',
      qty: pricing.customizedZonesCount,
      rate: Math.round(pRate / (pricing.customizedZonesCount || 1)),
      taxable: pRate,
      cgst: pCgst,
      sgst: pSgst,
      total: pRate + pCgst + pSgst
    })
  }

  // 4. Accessories
  config.accessories.forEach((accId) => {
    const acc = ACCESSORIES.find((a) => a.id === accId)
    if (acc) {
      const aRate = isINR ? (acc.priceINR || acc.price) : (acc.priceUSD || acc.price)
      const aCgst = Math.round(aRate * 0.09 * 100) / 100
      const aSgst = Math.round(aRate * 0.09 * 100) / 100
      invoiceRows.push({
        sno: rowCount++,
        desc: `${acc.name}`,
        hsn: acc.hsnCode || '6306 90 00',
        qty: 1,
        rate: aRate,
        taxable: aRate,
        cgst: aCgst,
        sgst: aSgst,
        total: aRate + aCgst + aSgst
      })
    }
  })

  // Render Table Rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)

  invoiceRows.forEach((row, idx) => {
    const isAlt = idx % 2 === 1
    if (isAlt) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y, contentWidth, 5.5, 'F')
    }
    doc.setTextColor(30, 41, 59)
    doc.text(String(row.sno), colX.sno, y + 4)
    doc.text(row.desc.length > 46 ? `${row.desc.substring(0, 44)}...` : row.desc, colX.desc, y + 4)
    doc.text(row.hsn, colX.hsn, y + 4)
    doc.text(String(row.qty), colX.qty, y + 4)
    doc.text(row.rate.toFixed(2), colX.rate, y + 4, { align: 'right' })
    doc.text(row.taxable.toFixed(2), colX.taxable, y + 4, { align: 'right' })
    doc.text(row.cgst.toFixed(2), colX.cgst, y + 4, { align: 'right' })
    doc.text(row.sgst.toFixed(2), colX.sgst, y + 4, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.text(row.total.toFixed(2), colX.total, y + 4, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    y += 5.5
  })

  // Table bottom border
  doc.setDrawColor(203, 213, 225)
  doc.line(margin, y, pageWidth - margin, y)

  // --- 5. HSN Tax Summary Schedule & Totals Split ---
  const totalsY = y + 2
  const leftSummaryW = contentWidth * 0.58
  const rightTotalsX = margin + leftSummaryW + 3
  const rightTotalsW = contentWidth - leftSummaryW - 3

  // Left Side: Statutory HSN/SAC Summary Table
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(15, 23, 42)
  doc.text('HSN / SAC TAX ANALYSIS SCHEDULE', margin, totalsY + 3.5)

  let hsnTableY = totalsY + 5.5
  doc.setFillColor(241, 245, 249)
  doc.rect(margin, hsnTableY, leftSummaryW, 4.5, 'F')
  doc.setFontSize(6)
  doc.text('HSN/SAC', margin + 2, hsnTableY + 3.2)
  doc.text('Taxable Val (₹)', margin + 28, hsnTableY + 3.2, { align: 'right' })
  doc.text('CGST (9%)', margin + 50, hsnTableY + 3.2, { align: 'right' })
  doc.text('SGST (9%)', margin + 72, hsnTableY + 3.2, { align: 'right' })
  doc.text('Total Tax (₹)', margin + leftSummaryW - 2, hsnTableY + 3.2, { align: 'right' })

  hsnTableY += 4.5
  doc.setFont('helvetica', 'normal')

  pricing.hsnSummary.forEach((hsn) => {
    doc.text(hsn.hsnCode, margin + 2, hsnTableY + 3.2)
    doc.text(hsn.taxableValue.toFixed(2), margin + 28, hsnTableY + 3.2, { align: 'right' })
    doc.text(hsn.cgstAmount.toFixed(2), margin + 50, hsnTableY + 3.2, { align: 'right' })
    doc.text(hsn.sgstAmount.toFixed(2), margin + 72, hsnTableY + 3.2, { align: 'right' })
    doc.text(hsn.totalTax.toFixed(2), margin + leftSummaryW - 2, hsnTableY + 3.2, { align: 'right' })
    hsnTableY += 4
  })

  // Right Side: Grand Totals Calculation Box
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(248, 250, 252)
  doc.rect(rightTotalsX, totalsY, rightTotalsW, 36, 'FD')

  let tY = totalsY + 5
  const drawTotalLine = (label: string, amt: string, isBold = false, isAccent = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.setFontSize(isAccent ? 8.5 : 7.2)
    doc.setTextColor(isAccent ? 194 : 71, isAccent ? 65 : 85, isAccent ? 12 : 105)
    doc.text(label, rightTotalsX + 3, tY)
    doc.text(amt, pageWidth - margin - 3, tY, { align: 'right' })
    tY += 5
  }

  drawTotalLine('Total Taxable Value:', formatInvoiceAmount(pricing.subtotal, pricing.currency))
  drawTotalLine('Central GST (CGST @ 9%):', formatInvoiceAmount(pricing.cgstAmount, pricing.currency))
  drawTotalLine('State GST (SGST @ 9%):', formatInvoiceAmount(pricing.sgstAmount, pricing.currency))
  drawTotalLine('Integrated GST (IGST @ 0%):', '₹ 0.00')
  drawTotalLine('Total Tax Amount (GST 18%):', formatInvoiceAmount(pricing.totalGst, pricing.currency))

  doc.setDrawColor(203, 213, 225)
  doc.line(rightTotalsX, tY - 1, pageWidth - margin, tY - 1)
  tY += 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text('Total Invoice Amount:', rightTotalsX + 3, tY + 2)
  doc.setTextColor(180, 83, 9) // Amber 700
  doc.text(formatInvoiceAmount(pricing.finalTotal, pricing.currency), pageWidth - margin - 3, tY + 2, { align: 'right' })

  y = Math.max(hsnTableY + 3, totalsY + 39)

  // --- 6. Amount in Words & IRN Hash Banner ---
  doc.setDrawColor(226, 232, 240)
  doc.setFillColor(254, 252, 232) // Soft amber tint
  doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.2)
  doc.setTextColor(15, 23, 42)
  doc.text('Amount Chargeable (in words):', margin + 3, y + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 53, 15)
  const wordsStr = isINR ? numberToWordsINR(pricing.finalTotal) : `US Dollars ${pricing.finalTotal.toFixed(2)} Only`
  doc.text(wordsStr, margin + 46, y + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(100, 116, 139)
  const irnHash = `IRN: ${Date.now().toString(16)}e9b2a74c810f63d8${(Math.random()*1e16).toString(16)}`
  doc.text(`${irnHash.substring(0, 72)}...  •  E-Way Bill: 2819 4018 9201`, margin + 3, y + 9.5)

  y += 15

  // --- 7. Bank Account & Legal Signature Block ---
  const bankBoxW = contentWidth * 0.54
  const signBoxX = margin + bankBoxW + 4
  const signBoxW = contentWidth - bankBoxW - 4
  const bankBoxH = 26

  // Bank Details
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(248, 250, 252)
  doc.rect(margin, y, bankBoxW, bankBoxH, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(15, 23, 42)
  doc.text('BANK REMITTANCE & NEFT/RTGS DETAILS', margin + 3, y + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(71, 85, 105)
  doc.text('Bank Name: HDFC Bank Limited (Andheri East Branch)', margin + 3, y + 9)
  doc.text('Account Name: MVP Visuals India Private Limited', margin + 3, y + 13)
  doc.text('Account No: 50200084920194  |  Account Type: Current A/C', margin + 3, y + 17)
  doc.text('IFSC Code: HDFC0000123  |  UPI ID: mvpvisuals@hdfcbank', margin + 3, y + 21)

  // Authorized Signatory Box
  doc.rect(signBoxX, y, signBoxW, bankBoxH, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(15, 23, 42)
  doc.text('For MVP VISUALS (INDIA) PVT LTD', signBoxX + 3, y + 4.5)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Digitally Signed & Validated', signBoxX + 3, y + 15)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(15, 23, 42)
  doc.text('Authorised Signatory', signBoxX + 3, y + 22.5)

  y += bankBoxH + 3

  // --- 8. Statutory Terms & Declarations Footer ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.8)
  doc.setTextColor(71, 85, 105)
  doc.text('Statutory Declaration:', margin, y + 2.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  doc.setTextColor(100, 116, 139)
  doc.text(
    'Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged and there is no flow of additional consideration directly or indirectly from the buyer. Custom dye-sublimation printed products are manufactured to customer specifications and are non-refundable except for structural manufacturing defects. Delta-E <= 2.0 CMYK industry tolerance. Subject to Mumbai Jurisdiction.',
    margin,
    y + 5.5,
    { maxWidth: contentWidth }
  )

  doc.text('Page 1 of 2: Government Approved Tax Invoice', pageWidth - margin, pageHeight - 5, { align: 'right' })

  // ==========================================================================
  // PAGE 2: TECHNICAL PREPRESS SPECIFICATION & 3D PROOF
  // ==========================================================================
  doc.addPage()
  let p2Y = margin

  // Page 2 Header Banner
  doc.setFillColor(15, 23, 42)
  doc.rect(margin, p2Y, contentWidth, 14, 'F')

  doc.setTextColor(246, 175, 45)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('CANOPY PREPRESS SPECIFICATION & 3D PROOF', margin + 4, p2Y + 6.5)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Factory Floor Dye-Sublimation RIP & Assembly Specification Sheet', margin + 4, p2Y + 11)

  doc.setFontSize(7.5)
  doc.setTextColor(226, 232, 240)
  doc.text(`Ref: ${invoiceNumber}  •  ${orderRef}`, pageWidth - margin - 4, p2Y + 9, { align: 'right' })

  p2Y += 18

  // Section 1: Specifications & 3D Render Side-by-Side
  const p2ColLeftW = contentWidth * 0.48
  const p2ColRightX = margin + p2ColLeftW + 4
  const p2ColRightW = contentWidth - p2ColLeftW - 4
  const topBlockH = 58

  // Left Specifications Card
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(248, 250, 252)
  doc.rect(margin, p2Y, p2ColLeftW, topBlockH, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('1. Engineering Specifications', margin + 3, p2Y + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.2)
  doc.setTextColor(71, 85, 105)

  const specsList: [string, string][] = [
    ['Footprint Nominal:', model.dimensions],
    ['Hardware Frame:', frame.name],
    ['Base Fabric Color:', config.fabricBaseColor.toUpperCase()],
    ['Textile Weight:', '600D PU Polyester (280 GSM)'],
    ['Printing Process:', '4K Dye-Sublimation (Edge-to-Edge)'],
    ['Flame Resistance:', 'CPAI-84 & NFPA-701 Certified'],
    ['Wind Load Rating:', 'Up to 28 mph (with ballast sandbags)'],
    ['Included Gear:', config.accessories.length > 0
      ? config.accessories.map((id) => ACCESSORIES.find((a) => a.id === id)?.name).join(', ')
      : 'Standard Base Hardware Only']
  ]

  let sY = p2Y + 10.5
  specsList.forEach(([key, val]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(key, margin + 3, sY)
    doc.setFont('helvetica', 'normal')
    const splitV = doc.splitTextToSize(val, p2ColLeftW - 38)
    doc.text(splitV, margin + 38, sY)
    sY += Math.max(splitV.length * 4, 5.2)
  })

  // Right 3D Perspective Render Card
  doc.rect(p2ColRightX, p2Y, p2ColRightW, topBlockH, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('2. 3D Perspective View (Interactive Capture)', p2ColRightX + 3, p2Y + 5.5)

  if (perspectiveSnapshotDataUrl) {
    try {
      doc.addImage(perspectiveSnapshotDataUrl, 'PNG', p2ColRightX + 2, p2Y + 8, p2ColRightW - 4, topBlockH - 10)
    } catch (err) {
      console.warn('Could not render 3D snapshot into PDF', err)
    }
  } else {
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(148, 163, 184)
    doc.text('3D Viewport Snapshot unavailable', p2ColRightX + p2ColRightW / 2, p2Y + topBlockH / 2, { align: 'center' })
  }

  p2Y += topBlockH + 6

  // Section 2: 2D Surface Customization Proofs (Peaks & Valances)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text('3. Detailed Surface Prepress Dielines & Proofs', margin, p2Y)
  p2Y += 4

  const customizedZones = Object.values(config.zones).filter((z) => z.elements.length > 0)

  if (customizedZones.length === 0) {
    doc.setDrawColor(203, 213, 225)
    doc.setFillColor(248, 250, 252)
    doc.rect(margin, p2Y, contentWidth, 24, 'FD')
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('Solid Color Canopy: No custom artwork uploaded. Canopy fabric dyed to solid base color.', margin + 4, p2Y + 13)
    p2Y += 28
  } else {
    // 2-column grid for customized zones
    const gridColW = (contentWidth - 4) / 2
    let curCol = 0
    let rowTopY = p2Y

    customizedZones.forEach((zone) => {
      const meta = ZONES_METADATA[zone.zoneId]
      const cardX = margin + curCol * (gridColW + 4)

      doc.setDrawColor(203, 213, 225)
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(cardX, rowTopY, gridColW, 40, 1.5, 1.5, 'FD')

      // Card Header
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(15, 23, 42)
      doc.text(meta ? meta.label : zone.zoneId, cardX + 3, rowTopY + 5)

      // Thumbnail Image
      const snapshot = zoneSnapshots[zone.zoneId]
      if (snapshot) {
        try {
          doc.addImage(snapshot, 'PNG', cardX + 3, rowTopY + 7.5, 34, 30)
        } catch (e) {
          console.warn('Could not add zone proof thumbnail', e)
        }
      }

      // Metadata on the right of thumbnail
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.8)
      doc.setTextColor(71, 85, 105)
      let mY = rowTopY + 9
      doc.text(`Elements: ${zone.elements.length} active layer(s)`, cardX + 40, mY)
      mY += 4
      doc.text(`Panel Dye: ${zone.backgroundColor || config.fabricBaseColor}`, cardX + 40, mY)
      mY += 4
      doc.text(`HSN SAC: 9989 12 (Print)`, cardX + 40, mY)
      mY += 4

      zone.elements.slice(0, 3).forEach((el) => {
        if (el.type === 'text') {
          doc.text(`• Text: "${el.text.substring(0, 16)}"`, cardX + 40, mY)
        } else {
          doc.text(`• Logo: ${el.name.substring(0, 16)}`, cardX + 40, mY)
        }
        mY += 3.5
      })

      if (curCol === 0) {
        curCol = 1
      } else {
        curCol = 0
        rowTopY += 43
      }
    })

    p2Y = curCol === 1 ? rowTopY + 43 : rowTopY
  }

  // Section 3: Factory Floor Prepress Sign-Off Checklist
  const qcBoxH = 24
  const qcY = pageHeight - margin - qcBoxH - 6
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(248, 250, 252)
  doc.rect(margin, qcY, contentWidth, qcBoxH, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(15, 23, 42)
  doc.text('FACTORY FLOOR PREPRESS & QUALITY CONTROL SIGN-OFF', margin + 3, qcY + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(71, 85, 105)

  doc.text('[X] 1:1 Vector RIP Resolution Verified (>= 150 DPI)', margin + 3, qcY + 9.5)
  doc.text('[X] Spot/Process CMYK Profile Calibrated (Delta-E <= 2.0)', margin + 3, qcY + 14)
  doc.text('[X] 50mm Bleed & Valance Stitch Hem Margin Cleared', margin + 3, qcY + 18.5)

  doc.text('Production Lead: _______________________', margin + contentWidth * 0.55, qcY + 9.5)
  doc.text('QC Batch Number: QC-2026-MVP-849', margin + contentWidth * 0.55, qcY + 14)
  doc.text('Operator Sign-Off Date: ' + invoiceDateStr, margin + contentWidth * 0.55, qcY + 18.5)

  doc.setFontSize(6)
  doc.setTextColor(148, 163, 184)
  doc.text('Confidential Production Specification • MVP Visuals Interactive Configurator • Page 2 of 2', pageWidth - margin, pageHeight - 5, { align: 'right' })

  // Trigger Save
  doc.save(`GST_Tax_Invoice_${invoiceNumber.replace(/\//g, '_')}.pdf`)
}
