import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, DAYS_SHORT } from './dateUtils'

export function exportSchedulePDF({ employeeName, employeeId, weekDates, shifts, weekLabel }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header
  doc.setFillColor(13, 115, 119)
  doc.rect(0, 0, 297, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('JISCare', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Employee Schedule Portal', 14, 19)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(`Weekly Schedule — ${employeeName}`, 100, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Employee ID: ${employeeId}  |  Week: ${weekLabel}`, 100, 19)

  // Generated timestamp
  doc.setTextColor(200, 230, 230)
  doc.setFontSize(7)
  doc.text(`Generated: ${new Date().toLocaleString('en-PH')}`, 245, 25)

  // Table
  const headers = ['Day', 'Date', 'Shift Type', 'Start Time', 'End Time', 'Room', 'Notes']
  const rows = weekDates.map((d, i) => {
    const iso = d.toISOString().split('T')[0]
    const shift = shifts.find(s => s.Date === iso && s.Employee_ID === employeeId) || {}
    return [
      DAYS_SHORT[d.getDay()],
      formatDate(d),
      shift.Shift_Type || '—',
      shift.Start_Time || '—',
      shift.End_Time   || '—',
      shift.Room_ID    || '—',
      shift.Notes      || '',
    ]
  })

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 34,
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [13, 115, 119], textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [230, 247, 247] },
    columnStyles: { 0: { fontStyle: 'bold' } },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const shiftType = data.row.cells[2]?.text?.[0]?.toLowerCase()
        if (shiftType === 'off') {
          data.cell.styles.textColor = [106, 27, 154]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  // Footer
  const pageH = doc.internal.pageSize.height
  doc.setFillColor(240, 249, 249)
  doc.rect(0, pageH - 12, 297, 12, 'F')
  doc.setTextColor(100, 140, 140)
  doc.setFontSize(7)
  doc.text('Confidential — JISCare Employee Scheduler System', 14, pageH - 5)
  doc.text(`Page 1 of 1`, 270, pageH - 5)

  doc.save(`JISCare_Schedule_${employeeId}_${weekLabel.replace(/[^a-z0-9]/gi,'_')}.pdf`)
}
