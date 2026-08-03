# jsPDF + html2canvas

**Paquetes:** `jspdf@2.5.1` + `html2canvas@1.4.1`

Exportación de vistas y reportes formateados directamente a documentos PDF.

```typescript
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export function useExportPDF() {
  const exportarPDF = async (elementoRef: HTMLElement, nombreArchivo: string) => {
    const canvas = await html2canvas(elementoRef, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width)
    pdf.save(`${nombreArchivo}.pdf`)
  }
  return { exportarPDF }
}
```
