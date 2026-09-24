# Guía de Usuario — Dashboard, Componentes y Variables Críticas
**Sistema Sinergy · Versión 1.0**

---

## Tabla de Contenidos

- [Conceptos clave de este documento](#conceptos-clave-de-este-documento)
- [Módulo 5 — Dashboard](#módulo-5--dashboard)
  - [Sección: Estadísticas](#sección-estadísticas)
  - [Sección: Historial de Inspecciones](#sección-historial-de-inspecciones)
  - [Sección: Centro de Reportes](#sección-centro-de-reportes)
  - [Sección: Estado de Flota](#sección-estado-de-flota)
- [Módulo 6 — Componentes](#módulo-6--componentes)
  - [Qué es un componente y para qué sirve](#qué-es-un-componente-y-para-qué-sirve)
  - [Ver la lista de componentes](#ver-la-lista-de-componentes)
  - [Buscar y filtrar componentes](#buscar-y-filtrar-componentes)
  - [Registrar un nuevo componente](#registrar-un-nuevo-componente)
  - [Editar un componente existente](#editar-un-componente-existente)
  - [Desactivar un componente](#desactivar-un-componente)
- [Módulo 7 — Variables Críticas](#módulo-7--variables-críticas)
  - [Qué es una variable crítica y para qué sirve](#qué-es-una-variable-crítica-y-para-qué-sirve)
  - [Entender la pantalla de Variables Críticas](#entender-la-pantalla-de-variables-críticas)
  - [Navegar el árbol jerárquico](#navegar-el-árbol-jerárquico)
  - [Consultar las variables de un componente](#consultar-las-variables-de-un-componente)
  - [Registrar una nueva variable](#registrar-una-nueva-variable)
  - [Editar una variable existente](#editar-una-variable-existente)
  - [Duplicar una variable](#duplicar-una-variable)
  - [Eliminar una variable](#eliminar-una-variable)
  - [Sincronizar un componente con su plantilla](#sincronizar-un-componente-con-su-plantilla)
  - [Gestionar plantillas por tipo de equipo](#gestionar-plantillas-por-tipo-de-equipo)
- [Resolución de problemas frecuentes](#resolución-de-problemas-frecuentes)

---

## Conceptos clave de este documento

Estos términos aparecen constantemente en los tres módulos de esta guía:

| Término | Qué significa |
|---|---|
| **Componente** | Una parte o subconjunto de un equipo que se inspecciona de forma independiente. Ejemplo: el compresor de una máquina tiene componentes como "Motor principal", "Válvula de admisión" y "Enfriador". |
| **Variable crítica** | Un parámetro medible de un componente que el técnico evalúa durante cada ronda de inspección. Ejemplo: "Temperatura de operación", "Presión de aceite", "Nivel de vibración". |
| **Rango normativo** | Los límites mínimo y máximo dentro de los cuales el valor de una variable es aceptable. Si el técnico registra un valor fuera de ese rango, el sistema lo marca como desviación. |
| **Plantilla** | Un conjunto predefinido de variables críticas asociadas a un tipo de equipo. Sirve para que todos los equipos del mismo tipo comiencen con las mismas variables de inspección sin tener que crearlas una a una. |
| **Árbol jerárquico** | Una vista visual que organiza la información en niveles anidados: Planta → Ubicación Técnica → Equipo → Componente. |
| **KPI** | Indicador numérico que mide el desempeño operativo (ej. "porcentaje de disponibilidad de la flota"). |
| **Desviación / No conformidad** | Un valor de variable que el técnico registró fuera del rango normativo durante una inspección. Es una señal de alerta que requiere atención. |

---

## Módulo 5 — Dashboard

**Para qué sirve:** El tablero principal de Sinergy. Concentra en una sola pantalla los indicadores clave de operación de la planta, el historial completo de inspecciones y el acceso a todos los reportes exportables del sistema.

**Dónde está:** Menú lateral → **Dashboard**

**Quién puede usarlo:** Todos los usuarios con acceso al sistema. Los datos que cada usuario ve pueden variar según la planta a la que pertenece su cuenta.

El Dashboard tiene cuatro secciones, cada una accesible desde sus propias pestañas:

| Pestaña | Qué contiene |
|---|---|
| **Estadísticas** | Gráficas de disponibilidad de flota, top de fallas, evolución mensual y carga de trabajo por técnico. |
| **Historial de Inspecciones** | Tabla filtrable con el registro completo de todas las rondas ejecutadas. |
| **Centro de Reportes** | Generador de reportes descargables en formato hoja de cálculo (Excel) y PDF. |
| **Estado de Flota** | Resumen rápido de cuántos equipos están operativos, en mantenimiento o inoperativos. |

---

### Sección: Estadísticas

**Objetivo:** Obtener una visión rápida y gráfica del estado operativo actual de la planta.

**Resultado esperado:** La pantalla muestra cuatro bloques de información con gráficas actualizadas.

1. Haz clic en **Dashboard** en el menú lateral.
2. Estarás en la pestaña **Estadísticas** por defecto.
3. Verás cuatro bloques de información:

---

#### Bloque A — Distribución Global de Flota

Muestra una **gráfica circular** con la proporción entre equipos Operativos, En Mantenimiento e Inoperativos de toda la empresa.

- En el **centro de la gráfica** verás el porcentaje de operatividad global (ej. "87%").
- Los colores son: **Verde** = Operativo, **Amarillo/Naranja** = En Mantenimiento, **Rojo** = Inoperativo.
- Al pasar el cursor sobre cada segmento aparece el detalle: cantidad exacta de equipos y su porcentaje del total.

**A la derecha** del círculo verás una **gráfica de barras horizontales** que desglosa esa misma información planta por planta, permitiéndote comparar de un vistazo cuáles sedes tienen mejor desempeño.

---

#### Bloque B — Top de Fallas

Muestra los equipos o componentes que **más desviaciones** han generado en un período determinado. Este gráfico ayuda a identificar qué activos requieren atención prioritaria de mantenimiento.

---

#### Bloque C — Evolución de los Últimos 6 Meses

Muestra la **tendencia mensual** de inspecciones realizadas, aprobadas y rechazadas. Sirve para identificar si la operación está mejorando o deteriorando con el tiempo.

---

#### Bloque D — Carga de Trabajo por Técnico

Muestra cuántas inspecciones ha ejecutado cada técnico en el período. Permite identificar si la carga de trabajo está distribuida de forma equitativa entre el equipo.

---

#### Bloque E — Control Operativo y Confiabilidad

Un panel de resumen con tres indicadores de gestión:
- **Tiempo de Respuesta a Rechazos:** Meta de menos de 24 horas para corregir rondas con observaciones.
- **Inoperatividad Acumulada:** Seguimiento de horas fuera de línea por mantenimiento correctivo.
- **Matriz de Criticidad ABC:** Clasificación automática para el plan trimestral de mantenimiento preventivo.

> [!TIP]
> **Para actualizar todos los datos al instante:** Haz clic en el botón **Actualizar Datos** ubicado en la esquina superior derecha de la sección de Estadísticas. Úsalo si sospechas que los datos mostrados no reflejan el estado más reciente.

---

### Sección: Historial de Inspecciones

**Objetivo:** Consultar el registro completo de todas las rondas de inspección técnica realizadas, con la posibilidad de filtrar por período y estado.

**Resultado esperado:** La tabla muestra las inspecciones que coinciden con los criterios seleccionados, con un resumen de totales en la parte superior.

1. Haz clic en la pestaña **Historial de Inspecciones**.
2. Usa los filtros disponibles para acotar los resultados:

| Filtro | Cómo funciona |
|---|---|
| **Estado de Inspección** | Selecciona entre: Todos los estados, Aprobadas, Pendientes o Rechazadas. La tabla se actualiza al instante al seleccionar. |
| **Desde** | Introduce una fecha de inicio para ver solo inspecciones realizadas a partir de ese día. |
| **Hasta** | Introduce una fecha de cierre del período. |

3. Encima de la tabla verás un resumen rápido con etiquetas de colores que indica:
   - **Total:** cantidad total de inspecciones en el rango.
   - **Aprobadas** (verde): rondas completadas sin desviaciones.
   - **Rechazadas** (rojo): rondas con una o más variables fuera de rango.
   - **Tasa de Aprobación:** porcentaje de rondas aprobadas sobre el total.

4. La tabla de resultados contiene las columnas:

| Columna | Qué muestra |
|---|---|
| **Código** | Identificador único de la ronda de inspección |
| **Fecha** | Fecha y hora exacta de ejecución |
| **Planta** | Sede donde se realizó |
| **Equipo** | Código y nombre del activo inspeccionado |
| **Técnico** | Nombre del técnico que ejecutó la ronda |
| **Estado** | Etiqueta verde (Aprobado), roja (Rechazado) o amarilla (Pendiente) |
| **Variables** | Cantidad de variables evaluadas en esa ronda |

5. Para actualizar el historial sin cambiar los filtros, haz clic en el botón **Actualizar** (esquina superior derecha del panel).

---

### Sección: Centro de Reportes

**Objetivo:** Generar y descargar reportes formales del sistema en formato hoja de cálculo (Excel) o PDF para análisis, auditorías y presentaciones gerenciales.

**Resultado esperado:** El archivo descargado se guarda automáticamente en la carpeta de descargas de tu computador con nombre descriptivo y fecha.

1. Haz clic en la pestaña **Centro de Reportes**.
2. Verás un selector de reportes. Elige el reporte que necesitas de la lista:

| Código | Nombre del Reporte | Qué contiene | Formatos |
|---|---|---|---|
| **R1** | Estado de Flota | Inventario completo de equipos con estado operativo, marca, modelo, serial y última inspección. | Excel y PDF |
| **R2** | Inspecciones del Período | Listado de todas las rondas ejecutadas en un rango de fechas, con técnico responsable, equipo y estado. | Excel y PDF |
| **R3** | Equipos con Desviaciones | Variables críticas cuyos valores registrados estuvieron fuera del rango normativo. Sirve para justificar órdenes de mantenimiento preventivo. | Excel y PDF |
| **R4** | Reporte Ejecutivo Mensual | Resumen gerencial del mes seleccionado: disponibilidad global, inspecciones realizadas, desvíos críticos y horas estimadas de inoperatividad. | PDF |
| **R5** | Matriz de Criticidad ABC | Clasificación automática de equipos según su impacto en la operación y su frecuencia de fallas. | Excel y PDF |
| **R6** | Tarjeta de Ronda por Equipo | Hoja de ronda preconfigurada para un equipo específico, con todas sus variables críticas y rangos normativos. Útil para llevar en físico durante la inspección. | PDF |
| **RLUB** | Reporte de Lubricación | Datos de fugas detectadas, consumo de lubricante y historial de rutinas de lubricación. | Excel |

3. Selecciona el reporte que deseas del menú o de los botones de selección.
4. Según el reporte, aparecerán **filtros de configuración** (rango de fechas, planta, tipo de equipo, estado, etc.). Completa los que necesitas.
5. Haz clic en el botón **Cargar** o **Consultar** para obtener la vista previa de los datos en pantalla.
6. Una vez cargados los datos, verifica que sean correctos.
7. Haz clic en **Descargar Excel** o **Descargar PDF** según el formato que necesites.
8. El archivo se descargará automáticamente con un nombre que incluye el código del reporte y la fecha actual (ej. `R1_Estado_Flota_2026-09-22.xlsx`).

> [!NOTE]
> Si el botón de descarga aparece inactivo (en gris), significa que aún no has cargado datos para ese reporte. Haz clic primero en el botón de consulta y espera a que la tabla se llene antes de intentar descargar.

> [!TIP]
> **Para el Reporte R4 (Ejecutivo Mensual):** Selecciona el mes que deseas analizar usando el campo de fecha que aparece en formato año-mes (ej. `2026-09`). El sistema calculará todos los indicadores de ese período automáticamente.

> [!TIP]
> **Para el Reporte R6 (Tarjeta de Ronda):** Selecciona el equipo específico en el campo de búsqueda. El sistema cargará automáticamente todas las variables críticas configuradas para ese activo, listas para imprimir.

---

### Sección: Estado de Flota

**Objetivo:** Ver de un vistazo cuántos equipos están operativos, en mantenimiento o inoperativos en este momento.

**Resultado esperado:** Tres tarjetas grandes con la cantidad y porcentaje de equipos en cada estado.

1. Haz clic en la pestaña **Estado de Flota**.
2. Verás tres tarjetas, una por cada estado operativo:

| Tarjeta | Color | Qué muestra |
|---|---|---|
| **Operativo** | Verde | Equipos funcionando con normalidad. |
| **En Mantenimiento** | Amarillo/Naranja | Equipos temporalmente fuera de servicio. |
| **Inoperativo** | Rojo | Equipos fuera de servicio indefinidamente. |

3. Cada tarjeta muestra el **número total** de equipos en ese estado y el **porcentaje** que representa sobre la flota completa.
4. Para ir directamente al inventario detallado, haz clic en el botón **Ir al Catálogo de Equipos**.

---

## Módulo 6 — Componentes

### Qué es un componente y para qué sirve

Un **componente** es una parte interna de un equipo que se inspecciona de forma separada. Cada equipo puede tener uno o varios componentes, y cada componente puede tener uno o varias variables críticas que el técnico mide durante las rondas.

**Ejemplo de jerarquía real:**

```
Equipo: Compresor ATLAS COPCO GA37 (código: 1000COM00001)
│
├── Componente: Motor Principal
│   ├── Variable: Temperatura de rodamientos (°C)  → Rango: 40 a 80
│   └── Variable: Vibración del eje (mm/s)         → Rango: 0 a 4.5
│
├── Componente: Sistema de Lubricación
│   └── Variable: Presión de aceite (bar)          → Rango: 3.5 a 7.0
│
└── Componente: Válvula de Descarga
    └── Variable: Estado de apertura               → Selección: Abierto / Cerrado / Parcial
```

**Para qué sirve gestionar componentes:** Sin componentes registrados, no es posible asignar variables críticas, y sin variables críticas, el técnico no tiene qué medir durante la inspección. Los componentes son el puente entre el equipo físico y los datos que el sistema recopila.

**Dónde está:** Menú lateral → **Componentes**

**Quién puede editar:** Solo usuarios con permisos de **gestión de máquinas** (Administrador o Supervisor de mantenimiento). Los demás roles solo pueden consultar la lista.

> [!IMPORTANT]
> **Requisito previo:** Debes tener equipos registrados en el sistema antes de poder crear componentes. Si el módulo de equipos está vacío, ve primero a registrar los equipos.

---

### Ver la lista de componentes

**Objetivo:** Consultar todos los componentes registrados con su equipo de pertenencia y estado.

**Resultado esperado:** La tabla muestra todos los componentes activos e inactivos del sistema.

1. Haz clic en **Componentes** en el menú lateral.
2. La pantalla carga en la pestaña **Lista de Componentes** con una tabla que muestra:

| Columna | Qué muestra |
|---|---|
| **Equipo** | El nombre del equipo al que pertenece este componente |
| **Nombre** | Nombre descriptivo del componente |
| **Descripción** | Texto explicativo adicional (si fue registrado) |
| **Activo** | Etiqueta verde **Activo** o roja **Inactivo** |
| **Orden de Posición** | Número que define el orden en que aparece este componente en la ronda de inspección (0 = primero) |
| **Fecha de Creación** | Cuándo fue registrado |
| **Última Modificación** | Cuándo fue editado por última vez |
| **Acciones** | Botones **Editar**, **Desactivar** y **Agregar Variable Crítica** |

---

### Buscar y filtrar componentes

**Objetivo:** Encontrar componentes específicos, especialmente cuando la lista es extensa.

**Resultado esperado:** La tabla muestra solo los componentes que coinciden con los criterios ingresados.

> [!NOTE]
> El filtrado de componentes funciona de forma distinta a los demás módulos: al cambiar un filtro, el sistema consulta los datos directamente en lugar de filtrar la lista que ya está en pantalla. Esto garantiza que siempre veas resultados precisos aunque el inventario sea muy grande.

1. En la pestaña **Lista de Componentes**, usa el panel de filtros:

| Campo | Cómo funciona |
|---|---|
| **Búsqueda Global** | Escribe parte del nombre o descripción del componente. |
| **Nombre** | Filtra exclusivamente por el nombre del componente. |
| **Descripción** | Filtra por palabras dentro del texto de descripción. |
| **Estado** | Selecciona **Activos** o **Inactivos**. |
| **Equipo** | Selecciona un equipo específico para ver solo sus componentes. |

2. Cada vez que modifiques un filtro, el sistema actualiza automáticamente la tabla.

---

### Registrar un nuevo componente

**Objetivo:** Agregar una parte inspeccionable de un equipo al sistema.

**Resultado esperado:** El componente queda registrado y asociado a su equipo, listo para recibir variables críticas.

1. Haz clic en la pestaña **Registrar Componente**.
2. Completa el formulario:

| Campo | Obligatorio | Descripción |
|---|---|---|
| **Equipo** | Sí | Busca y selecciona el equipo al que pertenece este componente. Usa el buscador escribiendo el código o nombre del equipo. |
| **Nombre de Componente** | Sí | Nombre descriptivo y reconocible de la parte (ej. "Motor Principal", "Válvula de Admisión", "Sistema de Enfriamiento"). |
| **Descripción del Componente** | No | Texto libre para aclarar qué es o qué función cumple esta parte del equipo. |
| **Estado del componente (Activo)** | — | Interruptor activado por defecto. Desactívalo solo si el componente está temporalmente fuera de uso. |
| **Orden de posición** | — | Número entero que define el orden en que este componente aparece en la lista de inspección. Usa 0 para el primero, 1 para el segundo, y así sucesivamente. Si todos tienen 0, aparecen en el orden en que fueron creados. |

3. Haz clic en **Guardar**.
4. Aparece el mensaje de confirmación y regresas a la lista.

> [!TIP]
> **Después de crear el componente**, el siguiente paso es ir al módulo de **Variables Críticas** para asignarle las variables de medición. También puedes hacerlo directamente desde la lista de componentes usando el botón **Agregar Variable Crítica** de la fila correspondiente.

---

### Editar un componente existente

**Objetivo:** Corregir el nombre, descripción, equipo asignado, estado u orden de un componente.

**Resultado esperado:** Los datos del componente quedan actualizados de inmediato.

1. Ve a la pestaña **Lista de Componentes**.
2. Localiza el componente que deseas modificar (usa los filtros si la lista es extensa).
3. Haz clic en **Editar** en la columna Acciones.
4. La pestaña **Editar Componente** se abre con los datos actuales precargados.
5. Modifica los campos que necesites.
6. Haz clic en **Actualizar**.
7. El mensaje de confirmación aparece y regresas a la lista.

---

### Desactivar un componente

**Objetivo:** Marcar un componente como inactivo cuando la parte del equipo deja de inspeccionarse.

**Resultado esperado:** El componente queda inactivo y no aparecerá en las futuras rondas de inspección. Su historial de mediciones se conserva.

> [!CAUTION]
> Desactivar un componente significa que el técnico **ya no verá ni medirá** ese componente en las próximas inspecciones. Sus variables históricas se conservan para consulta, pero no se recopilarán nuevos datos.

1. Ve a **Lista de Componentes**.
2. Localiza el componente a desactivar.
3. Haz clic en **Eliminar** en la columna Acciones.

> Si el botón está en gris, el componente ya está inactivo.

4. En la ventana emergente, haz clic en **Eliminar** para confirmar.

---

## Módulo 7 — Variables Críticas

### Qué es una variable crítica y para qué sirve

Una **variable crítica** es el parámetro específico que el técnico mide o evalúa en cada componente durante una inspección. El sistema la usa para determinar si la medición está dentro o fuera del rango aceptable.

**Tipos de variable que el sistema maneja:**

| Tipo | Qué es | Ejemplo |
|---|---|---|
| **Temperatura** | Medición de temperatura con rango mínimo y máximo. | Temperatura de rodamientos: entre 40°C y 80°C |
| **Numérico Entero** | Un número sin decimales con rango mínimo y/o máximo. | Presión de aceite: entre 3 y 7 bar |
| **Numérico Decimal** | Un número con decimales con rango mínimo y/o máximo. | Vibración: entre 0.0 y 4.5 mm/s |
| **Selección / Estado** | El técnico elige entre opciones predefinidas (sin rango numérico). | Estado de válvula: Abierto / Cerrado / Parcial |

**Dónde está:** Menú lateral → **Variables Críticas**

**Quién puede editar:** Solo usuarios con permisos de **gestión de máquinas**. Los demás roles solo pueden consultar.

---

### Entender la pantalla de Variables Críticas

Esta es la pantalla más compleja del sistema. Antes de usarla, es importante entender su estructura:

```
┌─────────────────────────────────────────────────────────────────┐
│  Pestañas principales:                                           │
│  [ Estructura y Variables por Componente ]  [ Plantillas (*) ]  │
└─────────────────────────────────────────────────────────────────┘

Dentro de "Estructura y Variables por Componente":
┌─────────────────────────┬───────────────────────────────────────┐
│  PANEL IZQUIERDO        │  PANEL DERECHO                        │
│  (árbol jerárquico)     │  (variables del componente)           │
│                         │                                       │
│  ▶ Planta Norte         │  [Selecciona un componente del árbol] │
│    ▶ Ubicación A        │                                       │
│      ▶ Equipo X         │                                       │
│        ● Componente 1   │                                       │
│        ● Componente 2   │                                       │
└─────────────────────────┴───────────────────────────────────────┘

(*) La pestaña "Plantillas" solo aparece para usuarios con 
    permisos de gestión de máquinas.
```

**Cómo funciona:** Haces clic en un componente en el panel izquierdo (árbol) y el panel derecho muestra automáticamente todas las variables críticas de ese componente. Desde el panel derecho puedes crear, editar, duplicar o eliminar variables.

---

### Navegar el árbol jerárquico

**Objetivo:** Encontrar un componente específico dentro de la estructura de la planta para gestionar sus variables.

**Resultado esperado:** El panel derecho muestra las variables del componente seleccionado.

1. Haz clic en **Variables Críticas** en el menú lateral.
2. Estarás en la pestaña **Estructura y Variables por Componente**.
3. En el **panel izquierdo** verás el árbol con todos los niveles de la organización:
   - El **primer nivel** son las **Plantas** (sedes).
   - Haz clic en el nombre de una planta o en su flecha para expandirla y ver sus **Ubicaciones Técnicas**.
   - Expande una ubicación para ver los **Equipos** instalados en ella.
   - Expande un equipo para ver sus **Componentes**.
4. Haz clic en el nombre de un **Componente** (el nivel más profundo del árbol).
5. El **panel derecho** se carga con la información de ese componente y sus variables críticas.

> [!TIP]
> **Botón de actualizar el árbol:** En la parte superior del panel izquierdo hay un botón de actualización (ícono de flecha circular). Úsalo si acabas de crear un nuevo componente o equipo y no aparece en el árbol.

**Acciones contextuales desde el árbol (solo para administradores):**

Al hacer clic derecho sobre un elemento del árbol o al usar el menú de opciones que aparece junto a cada elemento, puedes ejecutar acciones rápidas sin salir de la pantalla:

| Elemento del árbol | Acciones disponibles |
|---|---|
| Planta | Crear nueva ubicación técnica |
| Ubicación Técnica | Crear nuevo equipo |
| Equipo | Editar equipo, Eliminar equipo, Crear componente |
| Componente | Editar componente, Eliminar componente, Crear variable, Sincronizar con plantilla |

---

### Consultar las variables de un componente

**Objetivo:** Ver todas las variables críticas configuradas para un componente específico.

**Resultado esperado:** El panel derecho muestra la lista de variables con sus rangos, tipos y opciones de gestión.

1. Navega en el árbol hasta el componente que te interesa.
2. Haz clic sobre el nombre del componente.
3. En el **panel derecho** verás:
   - Un encabezado con la ubicación completa del componente (ruta: Planta → Ubicación → Equipo → Componente).
   - El nombre del equipo al que pertenece y el tipo de equipo.
   - La lista de variables configuradas, donde cada variable muestra:

| Dato de la variable | Qué indica |
|---|---|
| **Nombre** | Qué se mide (ej. "Temperatura de rodamiento trasero") |
| **Tipo** | Cómo se evalúa (Temperatura, Numérico, Selección) |
| **Rango normativo** | Los límites aceptables (ej. "40 a 80 °C") |
| **Unidad** | La unidad de medida (°C, bar, mm/s, etc.) |
| **Opciones** | Si es tipo Selección, las opciones disponibles (ej. "Normal / Bajo / Alto") |

---

### Registrar una nueva variable

**Objetivo:** Agregar un nuevo parámetro de medición a un componente.

**Resultado esperado:** La variable queda registrada y el técnico la verá en la próxima ronda de inspección de ese componente.

1. En el panel izquierdo, haz clic sobre el componente al que deseas agregar la variable.
2. En el **panel derecho**, haz clic en el botón **Añadir Variable** (o desde el menú contextual del árbol: clic derecho sobre el componente → **Crear variable**).
3. Se abrirá una ventana emergente con el formulario. Complétalo:

| Campo | Obligatorio | Descripción |
|---|---|---|
| **Nombre de la Variable** | Sí | Nombre descriptivo de lo que se mide (ej. "Temperatura de rodamiento delantero"). Sé específico. |
| **Tipo de Evaluación** | Sí | Selecciona entre: Temperatura, Numérico Entero, Numérico Decimal o Selección / Estado. |
| **Unidad de Medida** | Depende del tipo | Solo aplica para tipos numéricos y temperatura (ej. `°C`, `bar`, `RPM`, `mm/s`). |
| **Valor Mínimo** | Depende del tipo | El límite inferior del rango aceptable. Deja vacío si no aplica. |
| **Valor Máximo** | Depende del tipo | El límite superior del rango aceptable. Deja vacío si no aplica. |
| **Opciones de Selección** | Solo si el tipo es "Selección" | Escribe las opciones disponibles separadas. Ejemplo: "Normal", "Bajo", "Alto". |

4. Haz clic en **Guardar**.
5. La nueva variable aparece en el panel derecho de inmediato.

> [!NOTE]
> **Sobre el tipo "Selección / Estado":** Este tipo no tiene rango numérico. En cambio, debes definir cuáles opciones son aceptables y cuáles representan una desviación. Consulta con tu supervisor qué criterio de evaluación aplica.

---

### Editar una variable existente

**Objetivo:** Corregir el nombre, rango, unidad u opciones de una variable ya registrada.

**Resultado esperado:** Los cambios se aplican de inmediato y las próximas inspecciones usarán el rango actualizado.

> [!WARNING]
> Cambiar el rango normativo de una variable afecta las **próximas inspecciones** pero no modifica el histórico de mediciones ya registradas.

1. En el panel derecho, localiza la variable que deseas modificar.
2. Haz clic derecho sobre ella para abrir el menú contextual, o usa el ícono de opciones (tres puntos) que aparece al pasar el cursor.
3. Selecciona **Editar**.
4. Modifica los campos que necesites en la ventana emergente.
5. Haz clic en **Guardar**.

---

### Duplicar una variable

**Objetivo:** Crear una copia de una variable existente para agilizar la configuración cuando dos variables son muy similares.

**Resultado esperado:** Una nueva variable aparece en la lista con los mismos datos de la original, lista para ser renombrada o ajustada.

1. En el panel derecho, localiza la variable que deseas copiar.
2. Haz clic derecho → **Duplicar**, o usa el ícono de opciones → **Duplicar**.
3. La variable duplicada aparece en la lista con el mismo nombre y configuración.
4. Edítala de inmediato para diferenciarla de la original (cambia el nombre y ajusta el rango si es necesario).

---

### Eliminar una variable

**Objetivo:** Quitar una variable que ya no debe medirse en ese componente.

**Resultado esperado:** La variable desaparece de la lista y no aparecerá en futuras rondas de inspección.

> [!CAUTION]
> Eliminar una variable no borra los valores históricos ya registrados durante inspecciones anteriores. Esos registros se conservan para consulta en los reportes.

1. En el panel derecho, localiza la variable a eliminar.
2. Haz clic derecho → **Eliminar**, o usa el ícono de opciones → **Eliminar**.
3. Confirma la acción en la ventana emergente.

---

### Sincronizar un componente con su plantilla

**Objetivo:** Restablecer o actualizar las variables de un componente para que coincidan con la plantilla estándar del tipo de equipo al que pertenece.

**Resultado esperado:** El componente recibe todas las variables definidas en la plantilla de su tipo de equipo. Las variables que ya existan y coincidan con la plantilla se actualizan; las que no existan se crean.

> [!NOTE]
> **Cuándo usar esto:** Úsalo cuando el tipo de equipo tiene una plantilla actualizada y quieres que un componente específico adopte esa nueva configuración. También es útil si alguien eliminó variables por error y quieres restaurarlas.

1. En el árbol jerárquico, localiza el componente que deseas sincronizar.
2. Haz clic derecho sobre el componente → **Sincronizar con Plantilla**.
3. El sistema mostrará un mensaje de progreso mientras ejecuta la sincronización.
4. Al finalizar, aparecerá el mensaje de confirmación y el panel derecho mostrará las variables actualizadas.

También puedes hacer esto desde el panel derecho de variables, usando el botón **Restablecer** que aparece junto a cada variable individual.

---

### Gestionar plantillas por tipo de equipo

Las **plantillas** son el punto de partida para configurar variables en equipos del mismo tipo. En lugar de crear las variables uno a uno para cada compresor, bomba o motor, defines la plantilla una sola vez y la aplicas a todos.

**Dónde está:** Pestaña principal **Plantillas por Tipo de Equipo** (solo visible para administradores y supervisores con permiso de gestión de máquinas).

---

#### Ver las plantillas disponibles

1. Haz clic en la pestaña **Plantillas por Tipo de Equipo**.
2. Verás una lista de los tipos de equipo registrados en el sistema.
3. Haz clic sobre un tipo de equipo para expandir y ver las variables definidas en su plantilla.

---

#### Añadir una variable a una plantilla

**Objetivo:** Agregar un nuevo parámetro estándar a la plantilla de un tipo de equipo.

**Resultado esperado:** La nueva variable queda disponible en la plantilla. Los componentes existentes de ese tipo de equipo NO la reciben automáticamente; debes sincronizarlos manualmente.

1. En la vista de Plantillas, localiza el tipo de equipo correspondiente.
2. Haz clic en **Añadir Variable a Plantilla** o en el botón correspondiente dentro de ese tipo.
3. Completa el formulario de la variable (igual que al crear una variable individual).
4. Haz clic en **Guardar**.

---

#### Editar o eliminar variables de una plantilla

1. Localiza la variable dentro de la plantilla del tipo de equipo.
2. Usa los botones de **Editar** o **Eliminar** de esa fila.
3. Confirma los cambios.

> [!IMPORTANT]
> Editar o eliminar variables de una **plantilla** no afecta automáticamente a los componentes que ya tienen esas variables instanciadas. Para propagar los cambios, debes ir a cada componente y usar la opción **Sincronizar con Plantilla**.

---

## Resolución de problemas frecuentes

| Problema | Causa probable | Qué hacer |
|---|---|---|
| **El Dashboard no muestra gráficas o aparecen vacías** | No hay datos suficientes en el sistema (sin equipos o sin inspecciones registradas), o la conexión con el servidor está lenta. | Haz clic en **Actualizar Datos**. Si las gráficas siguen vacías, verifica que haya equipos e inspecciones registradas en el sistema. |
| **El botón de descarga de un reporte está en gris** | No has cargado los datos del reporte todavía. | Haz clic primero en el botón de consulta/cargar. Espera a que aparezcan los datos en pantalla y luego descarga. |
| **El reporte descargado está vacío** | Los filtros aplicados no tienen datos que coincidan. | Amplía el rango de fechas o elimina algunos filtros para obtener más resultados. |
| **No aparece la pestaña "Plantillas" en Variables Críticas** | Tu cuenta no tiene permisos de gestión de máquinas. | Contacta al administrador del sistema. |
| **El panel derecho de variables dice "Selecciona un componente del árbol"** | Aún no has hecho clic sobre ningún componente en el árbol izquierdo. | Expande el árbol hasta llegar al nivel de Componente y haz clic sobre su nombre. |
| **El árbol jerárquico no muestra un equipo o componente que acabo de crear** | El árbol no se actualizó automáticamente. | Haz clic en el botón de actualizar (ícono de flecha circular) en la parte superior del panel izquierdo. |
| **Al sincronizar con plantilla, el sistema dice que no hay plantilla disponible** | El tipo de equipo al que pertenece el componente no tiene ninguna variable configurada en su plantilla. | Ve a la sección de Plantillas y agrega las variables al tipo de equipo correspondiente. Luego regresa a sincronizar. |
| **En la lista de Componentes, el botón "Agregar Variable Crítica" está en gris** | El componente está inactivo. | Reactiva el componente editándolo y activando el interruptor de estado. |
| **No encuentro el equipo al crear un componente** | El equipo no existe aún o está marcado como inoperativo. | Ve al módulo de **Equipos** y verifica que el activo esté registrado y operativo. |
| **El historial de inspecciones del Dashboard no carga** | Problema de conexión temporal con el servidor. | Espera unos segundos y haz clic en el botón **Actualizar** dentro del historial. |

---

> **Canal de soporte:** Para cualquier situación no cubierta en esta guía, contacta al administrador del sistema o al equipo de soporte técnico de tu organización.

---

*Documento generado para uso interno · Sistema Sinergy — Gestión de Mantenimiento Industrial*
