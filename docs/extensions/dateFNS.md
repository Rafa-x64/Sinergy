# date-fns

**Paquete:** `date-fns@3.6.0`

Manipulación y formateo de fechas de manera modular y ligera.

```typescript
import { format, parseISO, isToday, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

// Formatear una fecha para mostrar al técnico
const fechaLegible = format(new Date(), "dd 'de' MMMM yyyy", { locale: es })
// → "03 de agosto 2026"

// Parsear fecha del backend (ISO string)
const fecha = parseISO('2026-08-03T14:00:00Z')

// Verificar si la inspección es de hoy
if (isToday(fecha)) console.log('Inspección del día')
```
