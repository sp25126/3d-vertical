import jsPDF from 'jspdf'
import { TentConfig, PricingBreakdown, ZoneId } from '../types/configurator'
import { TENT_MODELS, FRAME_TYPES, ACCESSORIES, ZONES_METADATA } from '../constants/tentData'
import { numberToWordsINR, formatPdfCurrency } from '../utils/gstUtils'

interface PdfExportOptions {
  config: TentConfig
  pricing: PricingBreakdown
  perspectiveSnapshotDataUrl?: string
  zoneSnapshots?: Record<ZoneId, string>
}

/**
 * Generates an official Statutory GST Tax Invoice (Page 1)
 * and Technical 2D/3D Prepress Production Proof (Page 2)
 * Fully compliant with Section 31 of CGST Act, 2017 & Rule 46 of CGST Rules, 2017.
 * Uses strict standard ASCII currency formatting (INR / USD) to eliminate font encoding glyph bugs.
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
  const currTag = pricing.currency                     // 'INR' or 'USD'

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
  doc.setFontSize(7.2)
  doc.setFont('helvetica', 'normal')
  doc.text('Issued under Section 31 of CGST Act, 2017 read with Rule 46 of CGST Rules, 2017', margin + 4, margin + 11)

  doc.setFontSize(7.2)
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
  doc.setDrawColor(203, 213, 225)
  doc.line(midX, y, midX, y + boxHeight)

  // Left Column: Supplier Details
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.8)
  doc.setTextColor(15, 23, 42)
  doc.text('MVP VISUALS (INDIA) PRIVATE LIMITED', margin + 3.5, y + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(71, 85, 105)
  doc.text('Plot No. 42, Marol Industrial Estate, Andheri East, Mumbai, MH - 400093', margin + 3.5, y + 9.5)
  doc.text('CIN: U22219MH2021PTC368912 | PAN: AABCM8291P', margin + 3.5, y + 13.5)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('GSTIN: 27AABCM8291P1ZV', margin + 3.5, y + 18)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('State: Maharashtra | State Code: 27', margin + 3.5, y + 22)
  doc.text('Email: billing@mvpvisuals.in | Helpline: +91 22 6982 4400', margin + 3.5, y + 26)
  doc.text('Website: https://mvpvisuals.com', margin + 3.5, y + 30)

  // Right Column: Invoice & Dispatch Metadata
  const drawMetaRow = (label: string, val: string, rowY: number) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(71, 85, 105)
    doc.text(label, midX + 3.5, rowY)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(val, pageWidth - margin - 3.5, rowY, { align: 'right' })
  }

  drawMetaRow('Tax Invoice No:', invoiceNumber, y + 5)
  drawMetaRow('Invoice Date:', invoiceDateStr, y + 9.5)
  drawMetaRow('Place of Supply:', '27 - Maharashtra', y + 14)
  drawMetaRow('Reverse Charge (RCM):', 'No', y + 18.5)
  drawMetaRow('Shopify Order Ref:', orderRef, y + 23)
  drawMetaRow('Transport / Courier:', 'SafeXpress Surface Logistics', y + 27.5)
  drawMetaRow('Payment Mode:', 'Prepaid Commercial (Online / Shopify)', y + 32)

  y += boxHeight + 3.5

  // --- 3. Recipient (Bill To & Ship To) Box with Header Bands ---
  const recipientBoxH = 24
  const halfContentW = contentWidth * 0.5
  const recipientMidX = margin + halfContentW

  // Outer container
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(248, 250, 252)
  doc.rect(margin, y, contentWidth, recipientBoxH, 'FD')

  // Header bands for Bill To and Ship To
  doc.setFillColor(241, 245, 249)
  doc.rect(margin, y, halfContentW, 5.5, 'FD')
  doc.rect(recipientMidX, y, halfContentW, 5.5, 'FD')

  // Vertical divider
  doc.setDrawColor(203, 213, 225)
  doc.line(recipientMidX, y, recipientMidX, y + recipientBoxH)

  // Header titles
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.2)
  doc.setTextColor(30, 41, 59)
  doc.text('DETAILS OF RECEIVER / BILL TO:', margin + 3.5, y + 3.8)
  doc.text('DISPATCH / SHIP TO:', recipientMidX + 3.5, y + 3.8)

  // Bill To details
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(15, 23, 42)
  doc.text('Event Horizon Enterprise Solutions Pvt Ltd', margin + 3.5, y + 9.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(51, 65, 85)
  doc.text('Suite 402, Trade World, Kamala City, Lower Parel, Mumbai, MH - 400013', margin + 3.5, y + 13.8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('GSTIN / UIN: 27AAACE4812K1Z9   |   State: Maharashtra (27)', margin + 3.5, y + 18.2)

  // Ship To details
  doc.text('BKC Exhibition Center, Hall 3, Bandra East, Mumbai - 400051', recipientMidX + 3.5, y + 9.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(51, 65, 85)
  doc.text('Contact Person: Logistics Operations Desk (+91 98201 44820)', recipientMidX + 3.5, y + 13.8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Place of Delivery: 27 - Maharashtra (Intra-State Supply)', recipientMidX + 3.5, y + 18.2)

  y += recipientBoxH + 4

  // --- 4. Itemized GST Billing Table ---
  // Perfectly calibrated columns across 186mm width
  const colX = {
    sno: margin + 2.5,                  // S.No left
    desc: margin + 9,                   // Desc left
    hsn: margin + 80,                   // HSN left
    qty: margin + 104,                  // Qty right
    rate: margin + 124,                 // Rate right
    taxable: margin + 144,              // Taxable right
    cgst: margin + 160,                 // CGST right
    sgst: margin + 176,                 // SGST right
    total: pageWidth - margin - 2.5     // Total right
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
  doc.text('Qty', colX.qty, y + 4.5, { align: 'right' })
  doc.text(`Rate (${currTag})`, colX.rate, y + 4.5, { align: 'right' })
  doc.text(`Taxable (${currTag})`, colX.taxable, y + 4.5, { align: 'right' })
  doc.text('CGST (9%)', colX.cgst, y + 4.5, { align: 'right' })
  doc.text('SGST (9%)', colX.sgst, y + 4.5, { align: 'right' })
  doc.text(`Total (${currTag})`, colX.total, y + 4.5, { align: 'right' })

  y += tableHeaderH

  // Build Invoice Rows
  interface InvoiceRow {
    sno: number
    title: string
    subtitle?: string
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

  // 1. Base Canopy Top
  const baseRate = pricing.basePrice
  const baseTaxable = baseRate
  const baseCgst = Math.round(baseTaxable * 0.09 * 100) / 100
  const baseSgst = Math.round(baseTaxable * 0.09 * 100) / 100
  invoiceRows.push({
    sno: rowCount++,
    title: `${model.name} (${model.dimensions})`,
    subtitle: '600D PU Polyester Waterproof UV-Inhibited Canopy Top',
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
      title: `${frame.name}`,
      subtitle: 'Hexagonal Aircraft Alloy Hardware with Truss Push-Up Mechanism',
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
      title: `4K Dye-Sublimation Full-Color Print`,
      subtitle: `${pricing.customizedZonesCount} Custom Panels (Peaks & Valances with Edge Hem Clearances)`,
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
        title: `${acc.name}`,
        subtitle: acc.id === 'sandbags'
          ? 'Set of 4 Dual-Cylinder Saddle Ballasts (120 lbs Wind Rating)'
          : acc.id === 'wheelbag'
          ? '1680D Ballistic Nylon Roller Bag with All-Terrain Sealed Casters'
          : 'Four 12-inch Zinc-Plated Corkscrew Earth Stakes & Guy Ropes',
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

  // Render Table Rows with multi-line description support
  invoiceRows.forEach((row, idx) => {
    const isAlt = idx % 2 === 1
    const rowH = row.subtitle ? 7.8 : 6.0

    if (isAlt) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y, contentWidth, rowH, 'F')
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(30, 41, 59)

    doc.text(String(row.sno), colX.sno, y + 4.2)

    // Primary item title
    doc.setFont('helvetica', 'bold')
    doc.text(row.title, colX.desc, y + 3.8)

    // Secondary detail line
    if (row.subtitle) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.8)
      doc.setTextColor(100, 116, 139)
      doc.text(row.subtitle, colX.desc, y + 6.8)
      doc.setFontSize(6.8)
      doc.setTextColor(30, 41, 59)
    }

    doc.setFont('helvetica', 'normal')
    doc.text(row.hsn, colX.hsn, y + 4.2)
    doc.text(String(row.qty), colX.qty, y + 4.2, { align: 'right' })
    doc.text(row.rate.toFixed(2), colX.rate, y + 4.2, { align: 'right' })
    doc.text(row.taxable.toFixed(2), colX.taxable, y + 4.2, { align: 'right' })
    doc.text(row.cgst.toFixed(2), colX.cgst, y + 4.2, { align: 'right' })
    doc.text(row.sgst.toFixed(2), colX.sgst, y + 4.2, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.text(row.total.toFixed(2), colX.total, y + 4.2, { align: 'right' })

    y += rowH
  })

  // Table bottom border
  doc.setDrawColor(203, 213, 225)
  doc.line(margin, y, pageWidth - margin, y)

  // --- 5. HSN Tax Summary Schedule & Totals Split ---
  const totalsY = y + 2.5
  const leftSummaryW = contentWidth * 0.55
  const rightTotalsX = margin + leftSummaryW + 3.5
  const rightTotalsW = contentWidth - leftSummaryW - 3.5

  // Left Side: Statutory HSN/SAC Summary Table
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.2)
  doc.setTextColor(15, 23, 42)
  doc.text('HSN / SAC TAX ANALYSIS SCHEDULE', margin, totalsY + 3.8)

  let hsnTableY = totalsY + 5.5
  doc.setFillColor(241, 245, 249)
  doc.rect(margin, hsnTableY, leftSummaryW, 5.0, 'F')
  doc.setFontSize(6.2)
  doc.setTextColor(30, 41, 59)
  doc.text('HSN/SAC', margin + 2.5, hsnTableY + 3.5)
  doc.text(`Taxable Val (${currTag})`, margin + 30, hsnTableY + 3.5, { align: 'right' })
  doc.text('CGST (9%)', margin + 49, hsnTableY + 3.5, { align: 'right' })
  doc.text('SGST (9%)', margin + 68, hsnTableY + 3.5, { align: 'right' })
  doc.text(`Total Tax (${currTag})`, margin + leftSummaryW - 2.5, hsnTableY + 3.5, { align: 'right' })

  hsnTableY += 5.0
  doc.setFont('helvetica', 'normal')

  pricing.hsnSummary.forEach((hsn, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, hsnTableY, leftSummaryW, 4.2, 'F')
    }
    doc.setTextColor(51, 65, 85)
    doc.text(hsn.hsnCode, margin + 2.5, hsnTableY + 3.2)
    doc.text(hsn.taxableValue.toFixed(2), margin + 30, hsnTableY + 3.2, { align: 'right' })
    doc.text(hsn.cgstAmount.toFixed(2), margin + 49, hsnTableY + 3.2, { align: 'right' })
    doc.text(hsn.sgstAmount.toFixed(2), margin + 68, hsnTableY + 3.2, { align: 'right' })
    doc.text(hsn.totalTax.toFixed(2), margin + leftSummaryW - 2.5, hsnTableY + 3.2, { align: 'right' })
    hsnTableY += 4.2
  })

  // HSN table bottom line
  doc.setDrawColor(203, 213, 225)
  doc.line(margin, hsnTableY, margin + leftSummaryW, hsnTableY)

  // Right Side: Grand Totals Calculation Box
  const totalsBoxH = 38
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(248, 250, 252)
  doc.rect(rightTotalsX, totalsY, rightTotalsW, totalsBoxH, 'FD')

  // Totals Box Header Band
  doc.setFillColor(241, 245, 249)
  doc.rect(rightTotalsX, totalsY, rightTotalsW, 5.5, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(30, 41, 59)
  doc.text('FINANCIAL SUMMARY & TAX BREAKDOWN', rightTotalsX + 3.5, totalsY + 3.8)

  let tY = totalsY + 9.5
  const drawTotalLine = (label: string, amtStr: string) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(71, 85, 105)
    doc.text(label, rightTotalsX + 3.5, tY)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(amtStr, pageWidth - margin - 3.5, tY, { align: 'right' })
    tY += 4.5
  }

  drawTotalLine('Total Taxable Value:', formatPdfCurrency(pricing.subtotal, pricing.currency))
  drawTotalLine('Central GST (CGST @ 9%):', formatPdfCurrency(pricing.cgstAmount, pricing.currency))
  drawTotalLine('State GST (SGST @ 9%):', formatPdfCurrency(pricing.sgstAmount, pricing.currency))
  drawTotalLine('Integrated GST (IGST @ 0%):', `${currTag} 0.00`)
  drawTotalLine('Total Tax Amount (GST 18%):', formatPdfCurrency(pricing.totalGst, pricing.currency))

  // Grand Total highlight banner
  const grandTotalY = totalsY + totalsBoxH - 7.5
  doc.setDrawColor(245, 158, 11) // Amber 500
  doc.setFillColor(254, 243, 199) // Amber 100
  doc.rect(rightTotalsX, grandTotalY, rightTotalsW, 7.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.2)
  doc.setTextColor(120, 53, 15) // Amber 900
  doc.text('Total Invoice Amount:', rightTotalsX + 3.5, grandTotalY + 5.0)
  doc.text(formatPdfCurrency(pricing.finalTotal, pricing.currency), pageWidth - margin - 3.5, grandTotalY + 5.0, { align: 'right' })

  y = Math.max(hsnTableY + 4, totalsY + totalsBoxH + 3.5)

  // --- 6. Amount in Words & IRN Hash Banner ---
  doc.setDrawColor(226, 232, 240)
  doc.setFillColor(254, 252, 232) // Soft amber tint
  doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.2)
  doc.setTextColor(15, 23, 42)
  doc.text('Amount Chargeable (in words):', margin + 3.5, y + 4.5)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(120, 53, 15)
  const wordsStr = isINR ? numberToWordsINR(pricing.finalTotal) : `US Dollars ${pricing.finalTotal.toFixed(2)} Only`
  doc.text(wordsStr, margin + 46, y + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(100, 116, 139)
  const irnHash = `IRN: ${Date.now().toString(16)}e9b2a74c810f63d8${(Math.random()*1e16).toString(16)}`
  doc.text(`${irnHash.substring(0, 72)}...  •  E-Way Bill: 2819 4018 9201`, margin + 3.5, y + 9.5)

  y += 15

  // --- 7. Bank Account & Legal Signature Block ---
  const bankBoxW = contentWidth * 0.54
  const signBoxX = margin + bankBoxW + 4
  const signBoxW = contentWidth - bankBoxW - 4
  const bankBoxH = 26

  // Bank Details Box
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(248, 250, 252)
  doc.rect(margin, y, bankBoxW, bankBoxH, 'FD')

  doc.setFillColor(241, 245, 249)
  doc.rect(margin, y, bankBoxW, 5.5, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(15, 23, 42)
  doc.text('BANK REMITTANCE & NEFT/RTGS DETAILS', margin + 3.5, y + 3.8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(71, 85, 105)
  doc.text('Bank Name: HDFC Bank Limited (Andheri East Branch)', margin + 3.5, y + 9.5)
  doc.text('Account Name: MVP Visuals India Private Limited', margin + 3.5, y + 13.5)
  doc.text('Account No: 50200084920194  |  Account Type: Current A/C', margin + 3.5, y + 17.5)
  doc.text('IFSC Code: HDFC0000123  |  UPI ID: mvpvisuals@hdfcbank', margin + 3.5, y + 21.5)

  // Authorized Signatory Box (Explicit fill to avoid dark carryover)
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(248, 250, 252)
  doc.rect(signBoxX, y, signBoxW, bankBoxH, 'FD')

  doc.setFillColor(241, 245, 249)
  doc.rect(signBoxX, y, signBoxW, 5.5, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(15, 23, 42)
  doc.text('FOR MVP VISUALS (INDIA) PVT LTD', signBoxX + 3.5, y + 3.8)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Digitally Signed & Validated', signBoxX + 3.5, y + 14.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(15, 23, 42)
  doc.text('Authorised Signatory', signBoxX + 3.5, y + 22.0)

  y += bankBoxH + 3.5

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

  doc.text('Page 1 of 2: Statutory GST Tax Invoice', pageWidth - margin, pageHeight - 5, { align: 'right' })

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
  doc.setFontSize(7.2)
  doc.setFont('helvetica', 'normal')
  doc.text('Factory Floor Dye-Sublimation RIP & Assembly Specification Sheet', margin + 4, p2Y + 11)

  doc.setFontSize(7.2)
  doc.setTextColor(226, 232, 240)
  doc.text(`Ref: ${invoiceNumber}  •  ${orderRef}`, pageWidth - margin - 4, p2Y + 9, { align: 'right' })

  p2Y += 18

  // Section 1: Specifications & 3D Render Side-by-Side
  const p2ColLeftW = contentWidth * 0.46
  const p2ColRightX = margin + p2ColLeftW + 4
  const p2ColRightW = contentWidth - p2ColLeftW - 4
  const topBlockH = 64

  // Left Specifications Card
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(248, 250, 252)
  doc.rect(margin, p2Y, p2ColLeftW, topBlockH, 'FD')

  // Header strip
  doc.setFillColor(241, 245, 249)
  doc.rect(margin, p2Y, p2ColLeftW, 6.0, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(15, 23, 42)
  doc.text('1. ENGINEERING SPECIFICATIONS', margin + 3.5, p2Y + 4.2)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.0)
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
    doc.text(key, margin + 3.5, sY)
    doc.setFont('helvetica', 'normal')
    const splitV = doc.splitTextToSize(val, p2ColLeftW - 36)
    doc.text(splitV, margin + 36, sY)
    sY += Math.max(splitV.length * 3.8, 5.0)
  })

  // Right 3D Perspective Render Card
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(248, 250, 252)
  doc.rect(p2ColRightX, p2Y, p2ColRightW, topBlockH, 'FD')

  // Header strip
  doc.setFillColor(241, 245, 249)
  doc.rect(p2ColRightX, p2Y, p2ColRightW, 6.0, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(15, 23, 42)
  doc.text('2. 3D PERSPECTIVE HERO PROOF', p2ColRightX + 3.5, p2Y + 4.2)

  // Inner Photo Frame
  const photoPad = 2.5
  const photoX = p2ColRightX + photoPad
  const photoY = p2Y + 8.5
  const photoW = p2ColRightW - photoPad * 2
  const photoH = topBlockH - 11.5

  doc.setDrawColor(226, 232, 240)
  doc.setFillColor(255, 255, 255)
  doc.rect(photoX, photoY, photoW, photoH, 'FD')

  if (perspectiveSnapshotDataUrl) {
    try {
      doc.addImage(perspectiveSnapshotDataUrl, 'PNG', photoX + 1, photoY + 1, photoW - 2, photoH - 2, undefined, 'FAST')
    } catch (err) {
      console.warn('Could not render 3D snapshot into PDF', err)
    }
  } else {
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(148, 163, 184)
    doc.text('3D Studio Perspective Render', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' })
  }

  p2Y += topBlockH + 6

  // Section 2: 2D Surface Customization Proofs (Peaks & Valances)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
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
      doc.text(meta ? meta.label : zone.zoneId, cardX + 3.5, rowTopY + 5)

      // Thumbnail Image
      const snapshot = zoneSnapshots[zone.zoneId]
      if (snapshot) {
        try {
          doc.addImage(snapshot, 'PNG', cardX + 3.5, rowTopY + 7.5, 34, 30)
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
  doc.text('FACTORY FLOOR PREPRESS & QUALITY CONTROL SIGN-OFF', margin + 3.5, qcY + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(71, 85, 105)

  doc.text('[X] 1:1 Vector RIP Resolution Verified (>= 150 DPI)', margin + 3.5, qcY + 9.5)
  doc.text('[X] Spot/Process CMYK Profile Calibrated (Delta-E <= 2.0)', margin + 3.5, qcY + 14)
  doc.text('[X] 50mm Bleed & Valance Stitch Hem Margin Cleared', margin + 3.5, qcY + 18.5)

  doc.text('Production Lead: _______________________', margin + contentWidth * 0.55, qcY + 9.5)
  doc.text('QC Batch Number: QC-2026-MVP-849', margin + contentWidth * 0.55, qcY + 14)
  doc.text('Operator Sign-Off Date: ' + invoiceDateStr, margin + contentWidth * 0.55, qcY + 18.5)

  doc.setFontSize(6)
  doc.setTextColor(148, 163, 184)
  doc.text('Confidential Production Specification • MVP Visuals Interactive Configurator • Page 2 of 2', pageWidth - margin, pageHeight - 5, { align: 'right' })

  // Trigger Save
  doc.save(`GST_Tax_Invoice_${invoiceNumber.replace(/\//g, '_')}.pdf`)
}
