# Bloc de notas

Aqui van las anotaciones o palabras clave de lo que soliciten los usarios, al realizar preguntas anotar en un cuaderno u hoja

---

## Tabla de Contenidos

- [Recordatorios](#recordatorios)
- [Notas](#notas)
  - [Roles y Control de Acceso](#roles-y-control-de-acceso)
  - [Gestión de Planta y Activos](#gestión-de-planta-y-activos)
  - [Módulo de Inspección y Captura de Datos](#módulo-de-inspección-y-captura-de-datos)
  - [Sincronización y Datos Offline](#sincronización-y-datos-offline)
  - [Reportes, Búsqueda y Exportación](#reportes-búsqueda-y-exportación)
  - [Mantenimiento del Sistema](#mantenimiento-del-sistema)
- [Observaciones](#observaciones)

---

### Recordatorios:

> - [ ] Crear repositorio privado de github para Sinergy

> - [ ] Realizar levantamiento de informacion 17-07-2026 con _Elizabeth Ramirez_ y _Ali Ramos_

> - [ ] Obtener informacion acerca de el proceso de mantenimiento en las 3 plantas

> - [ ] Hablar con elizabeth acerca de los procesos de mantenimiento

> - [ ] Hablar con los tecnicos de Ali para identificar las carencias del sistema

> - [ ] Solicitar acceso a los sistemas **power-app** y **power-bi**

> - [ ] Continuar con los siguentes documentos:

- `visionAlcance.md`: Un resumen ejecutivo que describe el problema que resuelve la app, público objetivo, los objetivos principales y el alcance general del proyecto

- `requerimientos.md`: Se documenta todo lo que la app debe hacer y cómo debe comportarse.

- `Casos de Uso`: Describe las interacciones entre un "actor" y la aplicación para lograr un objetivo específico

- `acta de reuniones`: El registro de cada reunión que se tenga con los usuarios

- `PRD`: Este es el "mapa" definitivo del producto y el puente entre la estrategia y el código.

---

### Notas:

#### Roles y Control de Acceso
- Cada Usuario debe tener sus propios módulos e interfaz (usuarios logueados, mejor interfaz)
- **Técnicos**: módulo para llenar datos, registro de técnicos para cada módulo
- **Jefe - Supervisor**: Estadísticas, seguimiento de ejecución, tendencias estadísticas de variables

#### Gestión de Planta y Activos
- 3 plantas
- Jerarquía y gestión: Identificar cuántas ubicaciones técnicas hay, gestionar equipos, gestionar equipos por planta (primordial, usando el documento `Maestros.xlsx`) y gestión de unidades
- Manejo de flotas y unidades, fechas, horas y usuarios asociados
-conversion de unidades

#### Módulo de Inspección y Captura de Datos
- Captura de datos (Montacargas, generador, chiller, compresor, etc...) de manera semanal e interdiaria
- Diseño UX y responsividad (móvil/plantas)
- Visualización de detalles por inspección
- Mejor gestión de variables críticas:
  - Tipo tabla para registrar varios campos con mayor practicidad
  - Valores por default: normal (para agilizar el llenado)
  - Se realiza una sola observación al final de la inspección (no por cada variable)
- Indicaciones y ayuda en pantalla mediante tooltips
- Seleccion por checkboxes o iput de seleccio multiple o radio button

#### Sincronización y Datos Offline
- Almacenamiento localmente (caché o archivos temporales) hasta tener conexión a internet
- Realizar migraciones de datos (pasar de lo viejo al nuevo sistema)
- Recolectar más datos en campo de ser necesario

#### Reportes, Búsqueda y Exportación
- Orden y facilidad de búsqueda con filtros avanzados
- Reportes con filtros por: fechas, ubicación técnica, equipos asociados, componentes, código, y variables por componente
- Registros históricos y exportación a Excel, Word y PDF
- Solicitar acceso al sistema Power App, Power BI (para indicadores de mantenimiento)

#### Mantenimiento del Sistema
- Reparar Módulo de instrumentos de Medición
- Módulo de reportar condición (para que los usuarios reporten fallos de la app)

---

---

### Observaciones

> [!NOTE]
**Gestion de inventario no es necesario**, ellos ya manejan inventario con `idempiere`

> [!CAUTION]
> No realices la migración directa de la base de datos de producción sin haber hecho un respaldo previo del archivo `Maestros.xlsx`.

> [!WARNING]
> Si no configuras el almacenamiento local, los técnicos perderán sus datos al perder la conexión a internet en las plantas.

> [!IMPORTANT]
> Recuerda que los técnicos necesitan una interfaz limpia y simplificada para evitar errores de captura en planta.

> [!TIP]
> Si configuras índices en los campos de fecha de tu base de datos, las búsquedas de reportes serán mucho más rápidas.


