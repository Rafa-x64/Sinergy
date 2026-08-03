# SheetJS (xlsx)

**Paquete:** `xlsx@0.18.5`

Lectura y generación de archivos Excel (`.xlsx`) en el cliente.

```typescript
import * as XLSX from 'xlsx'

const exportarExcel = (datos: any[], nombreArchivo: string) => {
  const hoja = XLSX.utils.json_to_sheet(datos)
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Reporte')
  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`)
}
```
