#  Bloc de Notas - Proyecto Sinergy

Aquí se registran las anotaciones, palabras clave y requerimientos solicitados por los usuarios.

> [!NOTE]
> **Stack Tecnológico y Arquitectura:**
> El sistema se construirá como una **Single Page Application (SPA)** enfocada en la comodidad del usuario, con responsividad nativa.
> - **Frontend:** Vue, Bootstrap, TypeScript.
> - **Backend / Base de Datos:** PrismaORM.
> - **Arquitectura DDD-Lite:**

---

##  Tabla de Contenidos

- [Recordatorios](#recordatorios)
- [Notas Generales](#notas-generales)
- [Relevamiento de Requisitos del Sistema](#relevamiento-de-requisitos-del-sistema)
  - [Módulos de Inspección](#módulos-de-inspección)
- [Observaciones Importantes](#observaciones-importantes)

---

##  Recordatorios

- [ ] **Modificar shchema de prisma:** Modificar las relaciones de la base de datos.

  - Modificar la relacion de linea.plantaIs (deberia estar relacionada con una ubicacion tecnica)

  - Agregar campo activo (boolean) a la ubicacion tecnica para evitar hacer una eliminacion fisica

  > Una planta tiene varias ubicaciones tecnicas las ubicaciones tecnicas tienen varias lineas. pero una linea no puede pertenecer a mas de una ubicacion tecnicay una ubicacion tecnica no debe estar relacionada a mas de una planta a la vez

- [ ] **Modificar Services y Controllers**

  - Modificar los cruds de ``controller`` y ``service`` para que una vez agregado el campo ``activo`` laboren en funcion de este nuevo campo y hacer que la funcion **eliminar** en vez de hacer ``delete`` haga ``update`` (eliminacion logica)

  - Editar los cruds del ``controller`` y ``service`` de ``linea`` una vez modificada la bd para que laboren en funcion de una ``ubicacion tecnica``

- [ ] **Testear los endpoints para validar que todo funcione**: Realizar solicitudes crud a los endpoints

- [ ] **Actualizar la BD**
  - `pnpm prisma migrate dev`
  - `pnpm prisma generate`

---

##  Notas Generales

### Roles y Control de Acceso
- **Interfaces Personalizadas:** Cada usuario tendrá módulos e interfaces específicas tras iniciar sesión, priorizando una buena UX.
- **Técnicos (`TECNICO`):** Módulo para capturar inspecciones y datos operativos en planta.
- **Supervisores (`SUPERVISOR`):** Panel de revisión, aprobación de inspecciones y gestión de la estructura de planta.
- **Jefe de Mantenimiento / Dirección (`ADMINISTRADOR`):** Administración integral del sistema (usuarios, credenciales, asignación de roles), monitoreo y acceso al Dashboard Directivo.

### Gestión de Planta y Activos
- **Alcance:** 3 plantas.
- **Jerarquía y Gestión:** Identificar ubicaciones técnicas, gestión de equipos por planta (usando `Maestros.xlsx`) y gestión de unidades.
- **Seguimiento:** Manejo de flotas, fechas, horas y usuarios asociados.
- **Conversiones:** Implementar conversión de unidades de medida.

### Módulo de Inspección y Captura de Datos
- **Frecuencia:** Captura de datos (Montacargas, generador, chiller, compresor, etc.) semanal e interdiaria.
- **UX y Responsividad:** Diseño adaptativo (móvil y plantas) con indicaciones y tooltips.
- **Mejoras en la Captura:**
  - Uso de tablas o grids para registros masivos prácticos.
  - Valores por defecto ("Normal") para agilizar el llenado.
  - Uso de checkboxes, radio buttons o inputs de selección múltiple.
  - Una sola observación al final de la inspección (no por variable).

### Sincronización y Datos Offline
- **Offline-First:** Almacenamiento local (caché/archivos temporales) en caso de pérdida de conexión en plantas.
- **Migración:** Trasladar datos del sistema viejo al nuevo.
- **Escalabilidad:** Capacidad para recolectar nuevos datos en campo si es necesario.

### Reportes, Búsqueda y Exportación
- **Búsqueda Avanzada:** Filtros por fechas, ubicación técnica, equipos, componentes, código y variables.
- **Exportación:** Generación de históricos en Excel, Word y PDF.
- **Integraciones:** (Pendiente) Acceso a Power App / Power BI para indicadores de mantenimiento.

### Mantenimiento del Sistema
- **Mejoras:** Reparar Módulo de instrumentos de Medición.
- **Feedback:** Crear un "Módulo de Reportar Condición" para que los usuarios informen fallos de la app.

---

## ️ Relevamiento de Requisitos del Sistema
**Fecha:** 27/07/2026

### Sistema Actual
**Flujo operativo actual:**
1. Inicio de sesión (actualmente sin usuario/contraseña).
2. Selección de planta: Extrusión, Inyección, Planta de mezcla.
3. Selección de técnico (muestra a todos los técnicos sin filtro de planta). Existe opción de "solo lectura" con aviso.
4. Historial: Visualización de chequeos anteriores en la pantalla principal.
5. Detalle: Al hacer clic en un registro, se ven los datos fijos (solo lectura).

> ** Oportunidad de Mejora:** Implementar un inicio de sesión seguro y amigable. Redirigir a un *Dashboard* con estadísticas en tiempo real. La interfaz debe permitir realizar múltiples tareas cómodamente, mantener la sesión iniciada y contar con un menú lateral o desplegable.

---

### Módulos de Inspección

#### 1. Montacargas
*Días de inspección: Lunes, miércoles y viernes.*
*Estado actual:* No funcional en sistema heredado (no registra ni lista chequeos de estado, tampoco lista los montacargas).

**Estructura y Atributos de Datos del Montacargas (Catálogo / Maestro):**
- **Código de Equipo (Ej. `1000MTC00009`):**
  - `1000`: Empresa / Planta (Tubrica).
  - `MTC00009`: Identificación correlativa.
- **Denominación (Ej. `Montacarga Yale GLP090 M09`):**
  - Tipo: `Montacarga`
  - Marca: `Yale`
  - Modelo: `GLP090`
  - Identificación abreviada: `M09`
- **Serial:** Número de serie del equipo.
- **Ubicación Técnica (Ej. `1000-DES-MT01`):**
  - `1000`: Tubrica.
  - `DES`: Ubicación / Área física.
  - `MT01`: Identificador de montacargas en área.
- **Denominación 2:** Descripción detallada de la ubicación técnica.
- **Estado Operativo (`¿Operativo?`):** Estado del equipo (Operativo / Inoperativo).
- **Descripción:** Texto explicativo del equipo.

**Datos de Inspección Requeridos:**
- **Motor:** Nivel aceite (N/A), Temperatura (°C), Presión (PSI), Fugas (E/NE), Alternador (N/A).
- **Caja:** Nivel aceite (N/B), Fugas (E/NE).
- **Radiador:** Refrigerante (N/B), Mangueras (N/A), Fugas (E/NE).
- **Frenos:** Liga (N/B), Fuga bomba (E/NE), Freno de mano (N/A), Freno der/izq (N/A).
- **Ruedas:** Condición de los 4 cauchos (N/A).
- **Extras:** Observación general, Elaborado por, Revisado por.
*(Leyenda: N=Normal, E=Existe, A=Anormal, B=Bajo, NE=No existe, N/A=No aplica).*

> **Desarrollo Requerido:** Gestión CRUD de montacargas (listado de equipos con Serial, Código, Ubicación Técnica, Denominación y Estado Operativo). Formulario de captura funcional. Listado e historial de chequeos realizados. Permitir adjuntar imágenes por componente. Agregar filtros y barra de búsqueda en historiales. Control de roles (supervisores asignan privilegios mediante checks).

#### 2. Compresor
*Estado actual:* Funcional (muestra registros en solo lectura).

**Datos requeridos:**
- **Generales:** Circuito eléctrico, accesorios, acople, filtros, revisión general, ruidos, set point, nivel/fugas aceite.
- **Motor (°C):** Lado acople, estator, lado libre.
- **Compresor (°C):** Lado impulsor, lado acople.
- **Métricas Numéricas:** Amperaje (con carga/vacío), Presión (PSI), Horómetro.
- **Observaciones:** Texto libre.

#### 3. Generador
*Estructura:* Formulario dividido en **secciones**, con cabecera de registro (autor, fecha, código, ubicación).

**Sección: Check** (Niveles, estados, limpieza, fugas)
- Aceite, refrigerante, alumbrado.
- Mangueras (agua, aceite, diésel, radiador).
- Correas, limpieza general.
- Fugas (refrigerante, aceite, diésel, tuberías, ácido de baterías).

**Sección: Variables** (Valores numéricos/porcentuales)
- Diésel en tanque local (%).
- Horómetros (último cambio aceite, digital, analógico).
- Horas de uso del aceite, KWH.

**Sección: Baterías**
- Voltaje cargador, celda sincronismo, baterías 1 y 2.
- Registro individual de 12 baterías (campos de texto).

**Sección: Observaciones**
- Área de texto para detalles adicionales.

---

## Módulo: Variables Críticas (Tubrica)

> [!IMPORTANT]
> Este módulo reemplaza el registro manual en Excel. El sistema debe ser agnóstico a la cantidad de plantas, líneas y equipos. Ningún cambio físico en la planta debe requerir modificación de código fuente.

### Jerarquía Física (Relaciones 1:N)

```
Ubicación Técnica → Planta → Línea (6-17 por planta) → Equipo → Componente → Variable
```

- La **Ubicación Técnica** puede ser nula para una planta (soporte explícito en DB).
- Densidad esperada: 15 a 17 líneas por planta.

### Metadatos Obligatorios por Inspección (Cabecera)

Todo registro de inspección debe capturar:
- Elaborado por (operador autenticado, extraído del JWT).
- Revisado por (nullable).
- Aprobado por (nullable).
- Fecha de registro (ISO 8601).
- Planta, Ubicación Técnica, Línea de Producción, Equipo.

### Tipos de Evaluación de Variables

| Código interno | Descripción | UI a renderizar |
|---|---|---|
| `numerico_entero` | Valor entero (ej. RPM, PSI) | `<input type="number" step="1">` |
| `numerico_decimal` | Valor decimal (ej. voltaje, amperaje) | `<input type="number" step="0.01">` |
| `temperatura` | Grados C o F (con unidad definida en DB) | `<input type="number">` + badge unidad |
| `seleccion` | Conjunto predefinido de opciones | `<select>` con opciones de la DB |

**Leyenda oficial del sistema (tipo `seleccion`):**

| Clave | Significado |
|---|---|
| `N` | Normal |
| `E` | Existe |
| `A` | Anormal |
| `B` | Bajo |
| `NE` | No Existe |
| `N/A` | No Aplica |

> Las opciones del tipo `seleccion` deben estar almacenadas en la base de datos, no hardcodeadas en el frontend. Esto permite agregar nuevas opciones sin tocar el código.

### Arquitectura de la Solución (Data-Driven UI)

- **Una sola vista genérica**: `MachineInspectionView`. No se crean vistas por línea ni por equipo.
- **Carga Lazy (perezosa)**: Al seleccionar Planta + Línea → fetch de Equipos. Al seleccionar Equipo → fetch de Componentes y Variables. Nunca se carga el árbol completo.
- **Componente polimórfico**: `VariableInput.vue` recibe un prop `VariableEvaluacion` y decide qué nodo del DOM renderizar según `tipo_evaluacion`.
- **Limpieza de memoria**: Toda suscripción asíncrona se destruye en `onUnmounted()`.

### Separación de Tablas en Base de Datos

- **Tablas Maestras** (CRUD administrativo): `ubicaciones_tecnicas`, `plantas`, `lineas`, `equipos`, `componentes`, `variables`.
- **Tablas Transaccionales** (registro operacional diario): `inspecciones`, `inspeccion_detalles`.

### Campos de `inspeccion_detalles`

Por cada variable evaluada se persiste:
- `valor_numerico` (NUMERIC, nullable) — para tipos numérico/temperatura.
- `observaciones` (TEXT, nullable) — texto libre por variable.
- `estado_componente` (BOOLEAN, default TRUE) — Activo / Inactivo.
- `valor_seleccion` (VARCHAR, nullable) — para tipo `seleccion` (ej. `N`, `NE`, `B`).

---

##  Observaciones Importantes

> [!NOTE]
> **Inventario:** La gestión de inventario no es necesaria, ya que utilizan `idempiere`.

> [!CAUTION]
> **Base de Datos:** No realices la migración directa de la base de datos de producción sin haber hecho un respaldo previo del archivo `Maestros.xlsx`.

> [!WARNING]
> **Sincronización:** Si no configuras el almacenamiento local, los técnicos perderán sus datos al perder la conexión a internet en las plantas.

> [!IMPORTANT]
> **Usabilidad:** Los técnicos necesitan una interfaz limpia y simplificada para evitar errores de captura en planta.

> [!TIP]
> **Rendimiento:** Configurar índices en los campos de fecha de la base de datos hará que las búsquedas de reportes sean mucho más rápidas.
