import jsPDF from "jspdf"

interface HeaderColumn {
  title: string
  key: string
  width: number
}

export function exportarTablaPDF(config: {
  titulo: string
  subtitulo?: string
  columnas: HeaderColumn[]
  filas: Array<Record<string, any>>
  nombreArchivo: string
  resumen?: Array<{ label: string; valor: string | number }>
}) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 14
  let currentY = 16

  // Cabecera institucional
  doc.setFillColor(15, 23, 42) // Slate 900
  doc.rect(0, 0, pageWidth, 22, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text("TUBRICA — SISTEMA SINERGY", marginX, 10)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(148, 163, 184)
  doc.text(config.titulo.toUpperCase(), marginX, 17)

  doc.setFontSize(8)
  doc.text(`Fecha de Emisión: ${new Date().toLocaleString("es-ES")}`, pageWidth - marginX - 60, 14)

  currentY = 28

  // Subtítulo
  if (config.subtitulo) {
    doc.setFontSize(9)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(71, 85, 105)
    doc.text(config.subtitulo, marginX, currentY)
    currentY += 6
  }

  // Resumen en caja destacada si existe
  if (config.resumen && config.resumen.length > 0) {
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(marginX, currentY, pageWidth - (marginX * 2), 12, 2, 2, "F")

    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 41, 59)

    let resumenX = marginX + 4
    config.resumen.forEach((item) => {
      doc.text(`${item.label}: ${item.valor}`, resumenX, currentY + 7)
      resumenX += (pageWidth - (marginX * 2)) / config.resumen!.length
    })

    currentY += 16
  }

  // Dibujar tabla
  const headerHeight = 8
  const rowHeight = 7

  function dibujarHeaderTabla(y: number) {
    doc.setFillColor(30, 41, 59)
    doc.rect(marginX, y, pageWidth - (marginX * 2), headerHeight, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)

    let colX = marginX + 2
    config.columnas.forEach((col) => {
      doc.text(col.title, colX, y + 5.5)
      colX += col.width
    })
  }

  dibujarHeaderTabla(currentY)
  currentY += headerHeight

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)

  config.filas.forEach((fila, index) => {
    // Salto de página si se acerca al final
    if (currentY + rowHeight > pageHeight - 16) {
      doc.addPage()
      currentY = 16
      dibujarHeaderTabla(currentY)
      currentY += headerHeight
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(marginX, currentY, pageWidth - (marginX * 2), rowHeight, "F")
    }

    doc.setTextColor(51, 65, 85)
    let colX = marginX + 2
    config.columnas.forEach((col) => {
      const rawVal = fila[col.key]
      const textVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : "-"
      const truncated = doc.splitTextToSize(textVal, col.width - 3)[0] || ""
      doc.text(truncated, colX, currentY + 4.8)
      colX += col.width
    })

    // Línea separadora tenue
    doc.setDrawColor(226, 232, 240)
    doc.line(marginX, currentY + rowHeight, pageWidth - marginX, currentY + rowHeight)

    currentY += rowHeight
  })

  // Pie de página con numeración
  const totalPaginas = doc.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Página ${i} de ${totalPaginas} — Documento de uso interno confidencial`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    )
  }

  doc.save(`${config.nombreArchivo}.pdf`)
}
