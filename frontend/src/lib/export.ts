import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

type ColumnDef = { header: string; key: string; render?: (val: any, row: any) => string }

export function exportToExcel(data: any[], columns: ColumnDef[], filename: string) {
  const rows = data.map(item => {
    const row: Record<string, any> = {}
    columns.forEach(col => {
      row[col.header] = col.render ? col.render(item[col.key], item) : item[col.key]
    })
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  const maxWidth = columns.reduce((sum, col) => sum + Math.max(col.header.length * 2, 12), 0)
  ws['!cols'] = columns.map(() => ({ wch: Math.max(15, maxWidth / columns.length) }))

  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportToPDF(title: string, data: any[], columns: ColumnDef[], filename: string) {
  const doc = new jsPDF('landscape', 'mm', 'a4')

  doc.setFontSize(18)
  doc.setTextColor(234, 179, 8)
  doc.text(title, 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`تاريخ التصدير: ${new Date().toLocaleDateString('ar-IQ')}`, 14, 28)

  const headers = columns.map(c => c.header)
  const bodyRows = data.map(item =>
    columns.map(col => (col.render ? col.render(item[col.key], item) : item[col.key]))
  )

  ;(doc as any).autoTable({
    head: [headers],
    body: bodyRows,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [234, 179, 8], textColor: [0, 0, 0], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    rtl: true,
  })

  doc.save(`${filename}.pdf`)
}
