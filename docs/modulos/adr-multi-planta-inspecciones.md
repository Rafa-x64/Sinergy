# ADR: Arquitectura Multi-Planta, Reaprobación de Inspecciones y Renderizado de Reportes Multipágina

## Estado
Aprobado e Implementado.

## Contexto y Necesidad
1. **Acceso Multi-Planta**: Ciertos usuarios con roles gerenciales o de supervisión general (ej. Elizabeth Ramírez) necesitaban administrar simultáneamente más de una planta industrial (por ejemplo, Planta Extrusión y Planta Mezcla) sin requerir cuentas duplicadas ni perder la trazabilidad de sus acciones.
2. **Integridad de Rutinas de Lubricación**: Al ejecutar la rutina de inspección de una línea / ubicación técnica, el sistema permitía omitir equipos sin validar que toda la maquinaria hubiera sido evaluada, lo que dejaba vacíos operativos.
3. **Reaprobación de Inspecciones Rechazadas**: Si una inspección era rechazada por un error corregible o discrepancia subsanada, el sistema no permitía cambiarla a estado `APROBADO`, obligando a rehacer inspecciones completas.
4. **Visibilidad en el Historial**: Inspecciones rechazadas (especialmente de lubricación) no figuraban en el historial para ciertos supervisores debido a una restricción rígida de planta a nivel de controlador PBAC.
5. **Reportes Cortados en PDF**: Al exportar inspecciones extensas a PDF, el documento se truncaba en una sola hoja A4 cortando más del 50% de las variables y las firmas de responsabilidad.
6. **Formato ISO de Inspección**: Existía una columna individual de observaciones por cada variable en la tabla que generaba ruido visual y duplicidad con las observaciones generales del técnico.

---

## Decisiones de Diseño

### 1. Modelo de Datos Multi-Planta (`UsuarioPlanta`)
- **Implementación**: Se creó la tabla `usuarios_plantas` (`UsuarioPlanta`) que establece una relación M:N entre `Usuario` y `Planta`.
- **Retrocompatibilidad**: Se mantuvo la columna `plantaId` escalar en el modelo `Usuario` como planta por defecto/preferida, evitando romper módulos heredados o consultas externas.
- **Tokens JWT**: Se integró el array `plantas: number[]` dentro del `TokenPayload` para que el frontend y los middlewares puedan determinar los accesos sin consultas adicionales a la base de datos.
- **Asignación inicial**: `elizabeth.ramirez` (ID: 1) fue asignada a Planta 1 (Extrusión) y Planta 3 (Mezcla).

### 2. Validación de Cobertura Completa en Matriz de Lubricación
- **Implementación**: En [MatrizLubricacionView.vue](file:///c:/xampp/htdocs/Sinergy/apps/frontend/src/modules/lubricacion/views/MatrizLubricacionView.vue), la función `finalizarWizardLinea` valida de forma estricta que la cantidad de equipos sin chequear sea igual a 0.
- **UX Progresiva**: Si faltan equipos por evaluar, el sistema emite una alerta, posiciona automáticamente el selector de pestañas en el primer equipo pendiente y el botón de acción principal refleja dinámicamente el progreso (`Chequear Todos (X/Y listos)`).

### 3. Máquina de Estados de Inspecciones (Reaprobación)
- **Implementación**: En [inspecciones.service.ts](file:///c:/xampp/htdocs/Sinergy/apps/backend/src/modules/inspecciones/inspecciones.service.ts), el método `evaluarInspeccion` acepta transiciones desde `PENDIENTE` y desde `RECHAZADO`.
- Al aprobar una inspección previamente rechazada:
  - Estado pasa a `APROBADO`.
  - `motivoRechazo` se establece en `null`.
  - Se actualizan `aprobadoPorId` y `fechaAprobacion`.

### 4. Algoritmo de Multipaginación Continua en jsPDF
- **Problema previo**: `jsPDF.addImage()` imprimía la imagen completa escalada a 210mm de ancho con origen `y = 0` en una sola hoja A4 (295mm de alto máximo), omitiendo todo contenido desbordante.
- **Solución implementada**: Un bucle iterativo que calcula `heightLeft` y añade páginas sucesivamente (`pdf.addPage()`) desplazando la posición vertical del viewport en múltiplos del alto de página (`position -= pageHeight`), asegurando que inspecciones de 2, 3 o más páginas se exporten con total fidelidad.
- **Aislamiento CSS Print**: Reglas `@media print` añadidas con `overflow: visible !important`, `position: static !important` y `break-inside: avoid !important` para compatibilidad de impresión nativa en navegadores.

### 5. Flexibilización de Consultas Históricas en PBAC
- **Implementación**: En [inspecciones.controller.ts](file:///c:/xampp/htdocs/Sinergy/apps/backend/src/modules/inspecciones/inspecciones.controller.ts), si el usuario tiene rol con permiso `ADMIN:SISTEMA` o posee múltiples plantas asignadas, no se sobreescribe el filtro de planta por defecto. Esto permite seleccionar "Todas las Plantas" o filtrar libremente por la planta de origen de la inspección.

---

## Cómo Probar las Nuevas Funcionalidades

1. **Multi-Planta**:
   - Iniciar sesión con `elizabeth.ramirez`.
   - Navegar al módulo de Usuarios: observar que Elizabeth posee chips para "Extrusión" y "Planta Mezcla".
   - Al crear o editar usuarios, el selector permite seleccionar múltiples plantas con chips individuales.
2. **Inspección de Lubricación por Línea**:
   - Ingresar a la Matriz de Lubricación y abrir el wizard de una línea.
   - Dejar al menos un equipo sin chequear y pulsar "Enviar Rutina".
   - Constatar que el sistema bloquea el envío, emite advertencia y lleva al técnico directamente al equipo no revisado.
3. **Reaprobación de Rechazadas**:
   - Abrir una inspección rechazada en el historial o bandeja.
   - Constatar el banner informativo con el motivo de rechazo previo.
   - Pulsar *"Reevaluar y Aprobar Inspección"*: la inspección cambiará su estado a `APROBADO` y se actualizará automáticamente en las listas.
4. **Exportación e Impresión**:
   - Abrir el modal de impresión en una inspección con muchos items.
   - Verificar que la tabla no incluye la columna de observaciones por fila, mostrando únicamente el bloque inferior de *Observaciones Generales*.
   - Pulsar *"Descargar PDF"*: el archivo generado contendrá todas las páginas completas con tablas y firmas.
