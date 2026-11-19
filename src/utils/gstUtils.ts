import { CurrencyCode } from '../types/configurator'

/**
 * Formats numeric currency with official locale symbols and thousands separators
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Formats amount with decimals for invoices
 */
export function formatInvoiceAmount(amount: number, currency: CurrencyCode = 'INR'): string {
  if (currency === 'INR') {
    return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `$ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Formats amount for PDF exports using ASCII standard currency codes (prevents jsPDF font encoding bugs)
 */
export function formatPdfCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  if (currency === 'INR') {
    return `INR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `USD ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Converts Indian Rupee amounts into statutory words representation
 * Compliant with Rule 46 of CGST Rules, 2017
 */
export function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount)
  if (rounded === 0) return 'Rupees Zero Only'

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function numToWords(n: number): string {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + numToWords(n % 100) : '')
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '')
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '')
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '')
  }

  return `Rupees ${numToWords(rounded)} Only`
}
