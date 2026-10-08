// Cells that start with these characters can be run as formulas by Excel or Sheets
const FORMULA_START = /^[=+\-@\t\r]/

export function csvCell(value: string | null | undefined) {
  let v = value ?? ''
  if (FORMULA_START.test(v)) v = `'${v}`
  if (/[",\r\n]/.test(v)) v = `"${v.replace(/"/g, '""')}"`
  return v
}

// The leading BOM makes Excel read the file as UTF-8 (needed for ৳ and Bangla text)
export function toCsv(header: string[], rows: (string | null)[][]) {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(','))
  return '\uFEFF' + lines.join('\r\n') + '\r\n'
}