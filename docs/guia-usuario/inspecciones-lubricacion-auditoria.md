# Guía de Usuario — Inspecciones, Lubricación y Auditoría
**Sistema Sinergy · Versión 1.0**

---

## Tabla de Contenidos

- [Conceptos clave de este documento](#conceptos-clave-de-este-documento)
- [Módulo 8 — Inspecciones Técnicas](#módulo-8--inspecciones-técnicas)
  - [Quién hace qué en este módulo](#quién-hace-qué-en-este-módulo)
  - [Sección: Nueva Inspección (Técnico)](#sección-nueva-inspección-técnico)
    - [Paso 1 — Configurar el alcance de la inspección](#paso-1--configurar-el-alcance-de-la-inspección)
    - [Paso 2 — Registrar las mediciones equipo por equipo](#paso-2--registrar-las-mediciones-equipo-por-equipo)
    - [Paso 3 — Guardar borrador durante la ronda](#paso-3--guardar-borrador-durante-la-ronda)
    - [Paso 4 — Revisar el resumen antes de enviar](#paso-4--revisar-el-resumen-antes-de-enviar)
    - [Paso 5 — Confirmar y enviar la inspección](#paso-5--confirmar-y-enviar-la-inspección)
  - [Sección: Bandeja de Aprobaciones (Supervisor)](#sección-bandeja-de-aprobaciones-supervisor)
    - [Revisar una inspección en detalle](#revisar-una-inspección-en-detalle)
    - [Aprobar una inspección](#aprobar-una-inspección)
    - [Rechazar una inspección](#rechazar-una-inspección)
  - [Sección: Historial de Inspecciones](#sección-historial-de-inspecciones)
- [Módulo 9 — Rutinas de Lubricación](#módulo-9--rutinas-de-lubricación)
  - [Qué es la Matriz de Lubricación](#qué-es-la-matriz-de-lubricación)
  - [Entender el semáforo de vida útil](#entender-el-semáforo-de-vida-útil)
  - [Sección: Gestión de Partes a Lubricar (Administrador / Supervisor)](#sección-gestión-de-partes-a-lubricar-administrador--supervisor)
    - [Ver las partes configuradas de un equipo](#ver-las-partes-configuradas-de-un-equipo)
    - [Agregar una nueva parte a lubricar](#agregar-una-nueva-parte-a-lubricar)
    - [Editar una parte existente](#editar-una-parte-existente)
    - [Eliminar una parte](#eliminar-una-parte)
  - [Sección: Registro de Rutina de Inspección (Técnico)](#sección-registro-de-rutina-de-inspección-técnico)
    - [Seleccionar el equipo a inspeccionar](#seleccionar-el-equipo-a-inspeccionar)
    - [Completar el formulario de lubricación](#completar-el-formulario-de-lubricación)
    - [Registrar el horómetro](#registrar-el-horómetro)
    - [Confirmar y guardar la rutina](#confirmar-y-guardar-la-rutina)
- [Módulo 10 — Panel de Auditoría y Notificaciones Globales](#módulo-10--panel-de-auditoría-y-notificaciones-globales)
  - [Para qué sirve este módulo](#para-qué-sirve-este-módulo)
  - [Entender las categorías de eventos](#entender-las-categorías-de-eventos)
  - [Consultar y filtrar el historial de actividades](#consultar-y-filtrar-el-historial-de-actividades)
  - [El indicador de conexión en tiempo real](#el-indicador-de-conexión-en-tiempo-real)
- [Resolución de problemas frecuentes](#resolución-de-problemas-frecuentes)

---

## Conceptos clave de este documento

| Término | Qué significa |
|---|---|
| **Ronda de inspección** | El recorrido que realiza un técnico por la planta evaluando las variables críticas de cada equipo. En Sinergy se registra digitalmente como una "Inspección". |
| **Alcance** | El conjunto de equipos que cubre una inspección. Puede ser toda la planta, una línea/área específica, todos los equipos de un tipo, o un solo equipo. |
| **Borrador** | Una inspección que se ha comenzado a llenar pero aún no se ha enviado al supervisor. Se guarda automáticamente en el dispositivo. |
| **Estado de la inspección** | Indica en qué fase del proceso está una ronda: **Pendiente** (enviada, esperando revisión), **Aprobada** (validada por el supervisor) o **Rechazada** (devuelta al técnico para corrección). |
| **Horómetro** | Contador de horas de operación de un equipo. Se usa en lubricación para calcular cuántas horas lleva el lubricante en uso y cuándo debe cambiarse. |
| **Parte a lubricar** | Un punto de lubricación específico dentro de un equipo (ej. "Rodamiento delantero del motor", "Engranaje de transmisión"). Cada parte tiene su propio lubricante y límite de horas. |
| **Semáforo de vida útil** | Indicador visual de color que muestra qué tan cerca está un lubricante de necesitar cambio: Verde = Normal, Naranja = Preventivo (atención próxima), Rojo = Crítico (cambio inmediato). |
| **Auditoría** | Registro automático de todas las actividades importantes del sistema (inspecciones enviadas, aprobadas, rechazadas). Accesible para supervisores y administradores. |

---

## Módulo 8 — Inspecciones Técnicas

**Para qué sirve:** Digitalizar las rondas de inspección técnica de la planta. El técnico registra las mediciones de cada variable crítica directamente en la pantalla, equipo por equipo y componente por componente. El supervisor recibe la ronda automáticamente para revisarla y aprobarla o devolverla si detecta inconsistencias.

**Dónde está:** Menú lateral → **Inspecciones**

---

### Quién hace qué en este módulo

El módulo de Inspecciones tiene tres secciones, y cada rol accede a secciones diferentes:

| Sección | Quién la usa | Para qué |
|---|---|---|
| **Nueva Inspección** | Técnico | Registrar las mediciones de la ronda actual. |
| **Bandeja de Aprobaciones** | Supervisor / Administrador | Revisar, aprobar o rechazar las rondas enviadas por los técnicos. |
| **Historial de Inspecciones** | Todos | Consultar el registro completo de rondas pasadas. |

> [!NOTE]
> Las secciones que ves al entrar al módulo dependen del rol de tu cuenta. Un técnico sin permisos de supervisión no verá la **Bandeja de Aprobaciones**.

---

### Sección: Nueva Inspección (Técnico)

El proceso de captura de una inspección se divide en 5 pasos claros. Síguelos en orden.

---

#### Paso 1 — Configurar el alcance de la inspección

**Objetivo:** Decirle al sistema qué equipos vas a inspeccionar en esta ronda.

**Resultado esperado:** El sistema carga la lista de equipos operativos que corresponden al alcance seleccionado, y habilita el formulario de captura.

1. En la pestaña **Nueva Inspección**, verás el panel de configuración del alcance.
2. Selecciona la **Planta Industrial** donde realizarás la ronda.

> [!NOTE]
> Si tu cuenta tiene una planta asignada en el perfil, el campo de planta aparecerá bloqueado y pre-seleccionado con tu sede. Los administradores pueden cambiar la planta libremente.

3. Selecciona el **Alcance de Evaluación** según qué equipos incluirá esta ronda:

| Opción de alcance | Qué incluye |
|---|---|
| **Por Línea / Ubicación Técnica** | Todos los equipos operativos de un área o línea específica. Si no seleccionas ninguna área, se incluyen todos los equipos operativos de la planta. |
| **Por Tipo de Maquinaria** | Todos los equipos operativos de una categoría específica (ej. "Todos los Compresores" de la planta). |
| **Por Maquinaria Específica** | Un solo equipo individual. Busca por código o nombre. |

4. Dependiendo del alcance elegido, aparecerá un tercer campo para refinar la selección (área, tipo de equipo o equipo específico). Complétalo según corresponda.
5. Verás un cuadro informativo azul que resume la cobertura que tendrá la inspección (ej. *"Se evaluarán todas las maquinarias operativas de la planta seleccionada"*).
6. Haz clic en **Iniciar Inspección**.

> [!IMPORTANT]
> El sistema solo carga equipos en estado **Operativo**. Los equipos marcados como "En Mantenimiento" o "Inoperativo" no aparecerán en la lista de la inspección, ya que no deben ser evaluados.

> Si el sistema muestra el mensaje *"No hay equipos operativos disponibles en este alcance"*, revisa que los equipos del área seleccionada estén marcados como Operativos en el módulo de Equipos.

---

#### Paso 2 — Registrar las mediciones equipo por equipo

**Objetivo:** Introducir los valores medidos en planta para cada variable crítica de cada componente.

**Resultado esperado:** Todos los campos del equipo actual tienen un valor registrado y la barra de progreso avanza.

Una vez iniciada la inspección, la pantalla cambia al formulario de captura. Encontrarás:

**Barra de progreso superior:**
- Indica en qué equipo vas (ej. "Equipo 3 de 12") y su código y nombre.
- Muestra el porcentaje de avance del equipo actual (variables respondidas vs. variables totales).
- Una etiqueta morada **Plantilla** indica que el equipo usa variables estándar de plantilla. Una etiqueta gris **Directas** indica que las variables fueron configuradas individualmente.

**Para cada componente del equipo:**
- Verás un bloque con el nombre del componente y, debajo, la lista de variables a evaluar.
- Junto al nombre de cada variable verás su **rango normativo** (ej. `40 a 80 °C`).

**Cómo ingresar cada medición:**

| Tipo de variable | Cómo registrar el valor |
|---|---|
| **Temperatura / Numérico** | Escribe el valor medido en el campo de texto. El campo acepta decimales. |
| **Selección / Estado** | Haz clic en uno de los botones de opciones que aparecen (ej. "Normal", "Bajo", "Alto"). El botón seleccionado se resalta. |
| **Observación** | Campo de texto libre disponible junto a cada variable para agregar notas sobre esa medición específica. |

> [!WARNING]
> **Alerta de fuera de rango:** Si ingresas un valor numérico que está por encima o por debajo del rango normativo, aparecerá una etiqueta roja **Fuera de Rango** junto al campo. El sistema no te impide continuar, pero este valor quedará registrado como desviación y el supervisor lo verá destacado en la revisión.

**Para avanzar al siguiente equipo:**
- Cuando hayas terminado con todas las variables del equipo actual, haz clic en el botón **Siguiente** (parte inferior de la pantalla).
- Para regresar al equipo anterior, haz clic en **Anterior**.

---

#### Paso 3 — Guardar borrador durante la ronda

**Objetivo:** Preservar el trabajo realizado hasta el momento en caso de que la sesión se interrumpa (pérdida de señal, cierre accidental de la pantalla, etc.).

**Resultado esperado:** Las mediciones registradas hasta ese momento se guardan en el dispositivo. Si cierras y vuelves a abrir el módulo, el borrador se restaura automáticamente.

1. En cualquier momento durante la ronda, haz clic en el botón **Borrador** (esquina superior derecha de la barra de progreso).
2. Aparecerá el mensaje de confirmación: *"Borrador guardado localmente"*.
3. El borrador se guarda en el dispositivo actual. Si cambias de dispositivo, el borrador no estará disponible.

> [!TIP]
> Guarda el borrador frecuentemente durante rondas largas. Es especialmente útil en plantas con mala cobertura de red, donde la sesión puede cerrarse inesperadamente.

---

#### Paso 4 — Revisar el resumen antes de enviar

**Objetivo:** Verificar el estado de la ronda completa antes de enviarla al supervisor.

**Resultado esperado:** Ver el porcentaje de avance global y la cantidad de variables respondidas para asegurarte de no olvidar ninguna.

1. Cuando estés en el **último equipo** de la lista, el botón **Siguiente** cambia a **Finalizar**.
2. Haz clic en **Finalizar**.
3. Se abrirá una ventana de resumen con:
   - **Porcentaje de completitud:** Qué tanto de la inspección está respondido (ej. "87% Completado").
   - **Variables respondidas vs. total:** Cuántas de las variables del wizard fueron completadas.
   - **Campo de Observaciones Generales:** Espacio para añadir cualquier novedad relevante detectada durante el recorrido que no corresponda a una variable específica (ruidos inusuales, condiciones ambientales, novedades de planta, etc.).

> [!NOTE]
> Puedes enviar una inspección sin haber respondido el 100% de las variables. El supervisor verá qué variables quedaron sin responder. Sin embargo, lo ideal es completar todas antes de enviar.

---

#### Paso 5 — Confirmar y enviar la inspección

**Objetivo:** Enviar la ronda de inspección al supervisor para su revisión.

**Resultado esperado:** La inspección queda registrada en estado **Pendiente**, el supervisor recibe una notificación automática y el sistema te lleva a la bandeja de aprobaciones (o al historial si no tienes ese acceso).

1. En la ventana de resumen, opcionalmente escribe las observaciones generales.
2. Haz clic en **Confirmar y Enviar**.
3. Aparece el mensaje de confirmación y la inspección desaparece del formulario.
4. El supervisor de planta recibirá una notificación automática para revisar la ronda.

> [!IMPORTANT]
> Una vez enviada, **no puedes modificar** la inspección desde el módulo de técnico. Si necesitas hacer correcciones, el supervisor debe rechazarla y devolvértela para que la corrijas desde el historial.

---

### Sección: Bandeja de Aprobaciones (Supervisor)

**Para qué sirve:** Revisar, validar y aprobar o rechazar las rondas de inspección enviadas por los técnicos.

**Quién la usa:** Usuarios con rol Supervisor o Administrador.

---

#### Revisar una inspección en detalle

**Objetivo:** Ver el contenido completo de una ronda enviada por un técnico antes de tomar una decisión.

**Resultado esperado:** Una ventana muestra todas las mediciones registradas, con las desviaciones de rango resaltadas visualmente.

1. En la pestaña **Bandeja de Aprobaciones**, verás la lista de inspecciones con estado **Pendiente**.
2. La tabla muestra por cada ronda:

| Columna | Qué muestra |
|---|---|
| **Código Inspección** | Identificador único de la ronda (ej. `INSP-2026-09-0042`) |
| **Técnico Elaborador** | Nombre del técnico que realizó la ronda |
| **Planta / Cobertura** | Sede e identificación del alcance cubierto |
| **Fecha Registro** | Fecha y hora exacta en que fue enviada |
| **Variables Evaluadas** | Cantidad de mediciones registradas en esa ronda |
| **Estado** | Etiqueta amarilla **PENDIENTE** |
| **Acción** | Botón **Revisar** |

3. Haz clic en **Revisar** en la fila de la inspección que deseas evaluar.
4. Se abrirá una ventana de detalle con toda la información:
   - Datos generales: técnico, planta, fecha, equipo.
   - Lista de componentes y variables con el **valor medido** por el técnico.
   - Las variables cuyo valor estuvo **fuera del rango normativo** aparecen resaltadas con una etiqueta de alerta.
   - Las observaciones del técnico, si las ingresó.

---

#### Aprobar una inspección

**Objetivo:** Validar que la ronda fue realizada correctamente y que los valores registrados son verídicos.

**Resultado esperado:** La inspección cambia a estado **Aprobada** y el técnico recibe una notificación automática.

1. Dentro de la ventana de detalle, revisa las mediciones con atención, especialmente las marcadas como fuera de rango.
2. Si los datos son coherentes y la ronda está correcta, haz clic en **Aprobar**.
3. Confirma la acción si el sistema lo solicita.
4. La inspección desaparece de la bandeja y queda registrada como **Aprobada** en el historial.

---

#### Rechazar una inspección

**Objetivo:** Devolver una ronda al técnico cuando los datos son inconsistentes, incompletos o sospechosos.

**Resultado esperado:** La inspección cambia a estado **Rechazada**, el técnico recibe una notificación y puede ver el motivo del rechazo.

1. Dentro de la ventana de detalle, si detectas problemas en los datos, haz clic en **Rechazar**.
2. El sistema te pedirá que escribas el **motivo del rechazo**. Sé específico para que el técnico sepa exactamente qué corregir (ej. "El valor de temperatura del motor principal parece incorrecto. El rango normal es 40-80°C y se registraron 12°C en condición de operación normal").
3. Haz clic en **Confirmar Rechazo**.
4. El técnico recibirá la notificación con el motivo y podrá corregir la información.

> [!TIP]
> **Para actualizar la bandeja** en caso de que hayan llegado nuevas inspecciones mientras la tienes abierta, haz clic en el botón **Refrescar Bandeja** en la parte superior derecha del panel.

---

### Sección: Historial de Inspecciones

**Para qué sirve:** Consultar el registro completo de todas las rondas realizadas, sin importar su estado actual.

**Disponible para:** Todos los usuarios con acceso al módulo de Inspecciones.

1. Haz clic en la pestaña **Historial de Inspecciones**.
2. Usa los filtros para acotar los resultados:

| Filtro | Cómo funciona |
|---|---|
| **Estado de Inspección** | Selecciona entre Todas, Aprobadas, Pendientes o Rechazadas. La tabla se actualiza automáticamente al cambiar. |
| **Desde** | Fecha de inicio del período a consultar. |
| **Hasta** | Fecha de cierre del período. |

3. Encima de la tabla verás un resumen con: Total, Aprobadas, Rechazadas y Tasa de Aprobación del período.
4. Haz clic en **Actualizar** para refrescar los datos sin cambiar los filtros.

---

## Módulo 9 — Rutinas de Lubricación

### Qué es la Matriz de Lubricación

La **Matriz de Lubricación** es un registro maestro que organiza todos los puntos de lubricación de los equipos de la planta. Para cada punto se define:
- Qué lubricante se usa.
- Cada cuántas horas de operación debe cambiarse.
- La capacidad recomendada de lubricante.

El módulo permite dos tipos de trabajo:
1. **Gestión de Partes** (Administrador/Supervisor): Configurar qué puntos tiene cada equipo.
2. **Registro de Rutina** (Técnico): Durante la inspección física, registrar el nivel actual del lubricante, si hubo reposición, si se realizó un cambio total y si se detectó alguna fuga.

**Dónde está:** Menú lateral → **Lubricación**

**Estructura de la pantalla:**

```
┌──────────────────────────────────────────────────────┐
│  Encabezado: Matriz de Lubricación                   │
├─────────────────────┬────────────────────────────────┤
│  Pestaña:           │  Pestaña:                      │
│  Partes a Lubricar  │  Registrar Inspección          │
│  (Gestión)          │  (Rutina del Técnico)           │
└─────────────────────┴────────────────────────────────┘
```

> [!NOTE]
> Los **Técnicos** entran directamente a la pestaña de **Registrar Inspección**. Los **Supervisores y Administradores** entran a **Partes a Lubricar** para configurar la matriz.

---

### Entender el semáforo de vida útil

Cada parte a lubricar tiene un indicador de color que muestra el estado de vida del lubricante en función de las horas de uso acumuladas desde el último cambio:

| Color del semáforo | Estado | Qué significa |
|---|---|---|
| 🟢 **Verde** | Normal | El lubricante está dentro de su vida útil. No requiere atención inmediata. |
| 🟠 **Naranja** | Preventivo | El lubricante ha alcanzado entre el 80% y el 100% de su vida útil. Planifica el cambio próximamente. |
| 🔴 **Rojo** | Crítico | El lubricante ha superado su límite de horas. Requiere cambio inmediato. |

El porcentaje de vida útil se calcula automáticamente comparando las horas del horómetro actual con el horómetro del último cambio y el límite establecido:

```
Horas de uso = Horómetro actual - Horómetro del último cambio
% Vida útil  = (Horas de uso ÷ Límite de horas) × 100
```

---

### Sección: Gestión de Partes a Lubricar (Administrador / Supervisor)

#### Ver las partes configuradas de un equipo

**Objetivo:** Consultar qué puntos de lubricación tiene configurados un equipo específico.

**Resultado esperado:** La pantalla muestra la lista de partes con su lubricante asignado, límite de horas y semáforo de estado.

1. En la pestaña **Partes a Lubricar**, usa el filtro de **Planta** para ver solo los equipos de esa sede (opcional).
2. En la lista de equipos del lado izquierdo (o en la tabla principal), haz clic sobre el equipo que deseas revisar.
3. Verás la tabla con todas las partes configuradas para ese equipo, incluyendo:

| Columna | Qué muestra |
|---|---|
| **Nombre del Punto** | Nombre descriptivo de la parte a lubricar (ej. "Rodamiento trasero del motor") |
| **Componente** | El componente del equipo al que pertenece este punto |
| **Lubricante** | Tipo de lubricante especificado para este punto |
| **Horómetro Último Cambio** | Las horas del reloj en el momento del último cambio de lubricante |
| **Límite de Horas** | Cada cuántas horas debe cambiarse el lubricante |
| **Horas de Uso** | Horas transcurridas desde el último cambio (calculado automáticamente) |
| **% Vida Útil** | Porcentaje de vida consumido |
| **Semáforo** | Indicador Verde / Naranja / Rojo |
| **Acciones** | Botones **Editar** y **Eliminar** |

---

#### Agregar una nueva parte a lubricar

**Objetivo:** Registrar un nuevo punto de lubricación para un equipo que aún no lo tiene configurado, o agregar un punto adicional.

**Resultado esperado:** La nueva parte aparece en la tabla de ese equipo con su semáforo calculado.

1. Selecciona el equipo al que deseas agregar la parte.
2. Haz clic en el botón **Agregar Parte** o en el ícono `+` correspondiente.
3. Se abrirá una ventana emergente con el formulario. Complétalo:

| Campo | Obligatorio | Descripción |
|---|---|---|
| **Nombre del Punto** | Sí | Descripción del punto de lubricación (ej. "Rodamiento delantero del eje de transmisión"). |
| **Componente** | No | Si este punto pertenece a un componente específico del equipo, selecciónalo del menú. |
| **Lubricante** | Sí | Selecciona o escribe el tipo de lubricante requerido (ej. "Aceite 15W-40", "Grasa NLGI 2"). |
| **Límite de Horas para Cambio** | Sí | Cada cuántas horas de operación debe reemplazarse el lubricante. |
| **Horómetro del Último Cambio** | Sí | Las horas del reloj en el momento en que se realizó el cambio más reciente. Ingresa el valor actual si es la primera vez. |
| **Capacidad Recomendada** | No | Cantidad de lubricante que se usa en cada reposición o cambio total (en litros u otra unidad). |

4. Haz clic en **Guardar**.
5. La nueva parte aparece en la tabla y el semáforo se calcula automáticamente.

---

#### Editar una parte existente

**Objetivo:** Actualizar la información de un punto de lubricación (cambiar el lubricante, ajustar el límite de horas, actualizar el horómetro del último cambio, etc.).

**Resultado esperado:** Los datos del punto quedan actualizados y el semáforo se recalcula.

1. En la tabla de partes del equipo seleccionado, haz clic en **Editar** en la fila de la parte que deseas modificar.
2. La ventana emergente se abre con los datos actuales.
3. Modifica los campos necesarios.
4. Haz clic en **Guardar**.

> [!TIP]
> **Caso frecuente — actualizar el horómetro después de un cambio de lubricante:** Cuando el técnico realiza un cambio total de lubricante, el horómetro del último cambio debe actualizarse con las horas actuales del equipo. Usa la función de **Editar** para registrar este cambio manualmente, o el sistema lo actualizará automáticamente cuando el técnico lo registre durante una rutina de inspección.

---

#### Eliminar una parte

**Objetivo:** Quitar un punto de lubricación que ya no aplica para ese equipo.

> [!CAUTION]
> Eliminar una parte no borra el historial de rutinas en las que ese punto fue inspeccionado. Los registros anteriores se conservan.

1. Haz clic en **Eliminar** en la fila de la parte.
2. Confirma la acción en la ventana emergente.

---

### Sección: Registro de Rutina de Inspección (Técnico)

Esta sección es donde el técnico registra el resultado físico de la revisión de lubricación de un equipo durante una visita a planta.

---

#### Seleccionar el equipo a inspeccionar

**Objetivo:** Cargar el formulario de lubricación del equipo que se va a revisar en este momento.

**Resultado esperado:** El formulario muestra todos los puntos de lubricación configurados para ese equipo, con el semáforo de estado actual y la capacidad recomendada de cada punto.

1. En la pestaña **Registrar Inspección**, selecciona el **Alcance** de la rutina:

| Opción de alcance | Qué incluye |
|---|---|
| **Por Equipo** | Selecciona un equipo individual. Recomendado para la mayoría de las rutinas. |
| **Por Planta** | Muestra todos los equipos de la planta con puntos de lubricación. |
| **Por Línea** | Muestra los equipos de una ubicación técnica específica. |

2. Si seleccionas **Por Equipo**, aparece un campo de búsqueda. Escribe el código o nombre del equipo y selecciónalo.
3. Si seleccionas **Por Planta** o **Por Línea**, primero elige la planta y luego la línea (si aplica). El equipo específico se selecciona en el siguiente campo.
4. Al seleccionar el equipo, el formulario de inspección se carga automáticamente con todos sus puntos de lubricación.

---

#### Completar el formulario de lubricación

**Objetivo:** Registrar el estado actual de cada punto de lubricación del equipo.

**Resultado esperado:** Cada punto tiene sus datos de inspección completados antes de guardar.

Para cada punto de lubricación en el formulario, debes completar los siguientes datos:

| Campo | Obligatorio | Opciones / Descripción |
|---|---|---|
| **Nivel del Lubricante** | Sí | Selecciona el estado actual del nivel: **Normal (OK)**, **Bajo**, **Crítico**, **Sobrellenado** o **No Aplica**. |
| **¿Se realizó reposición?** | — | Activa esta casilla si agregaste lubricante sin hacer un cambio total. |
| **Cantidad repuesta** | Solo si hubo reposición | Ingresa cuántos litros (u otra unidad) se repusieron. Debe ser un número mayor a cero. |
| **¿Se realizó cambio total?** | — | Activa si se vacció y llenó completamente el lubricante. Esto reinicia el contador de horas de uso a cero. |
| **¿Presenta fuga?** | — | Activa si detectas alguna fuga activa en este punto. |
| **Descripción de la fuga** | Solo si hay fuga | Describe dónde está la fuga y su aparente gravedad. |
| **Observaciones generales** | No | Cualquier nota adicional sobre este punto específico. |

> [!WARNING]
> **Si el campo "Cantidad repuesta" queda en cero cuando activaste "Se realizó reposición":** El sistema no te dejará guardar la rutina. Debes ingresar una cantidad mayor a cero o desmarcar la opción de reposición.

---

#### Registrar el horómetro

**Objetivo:** Actualizar el contador de horas del equipo al momento de la inspección, para que el semáforo de vida útil se calcule correctamente.

**Resultado esperado:** El sistema registra el nuevo valor de horas y calcula automáticamente el porcentaje de vida útil de cada punto.

1. En la parte superior del formulario, verás el campo **Horómetro de Inspección** con el valor actual del contador.
2. Ingresa las horas actuales que marca el reloj del equipo en este momento.

> [!CAUTION]
> **Si el horómetro nuevo es menor al registrado anteriormente:** Esto puede indicar que el reloj del equipo fue reemplazado o reiniciado. El sistema mostrará una ventana de aviso solicitando que justifiques el **Reemplazo de Reloj**. Escribe la justificación (ej. "El horometro fue reemplazado por daño. Reiniciado desde cero el 22/09/2026") y confirma. Este evento queda auditado automáticamente.

---

#### Confirmar y guardar la rutina

**Objetivo:** Registrar oficialmente la inspección de lubricación en el sistema.

**Resultado esperado:** La rutina queda guardada, el horómetro del equipo se actualiza, los semáforos se recalculan y la matriz refleja el nuevo estado.

1. Antes de guardar, verás un **Resumen de la Inspección** con:
   - Total de partes inspeccionadas.
   - Cantidad de puntos en estado Crítico / Preventivo / Normal.
   - Cantidad de fugas detectadas.
   - Cantidad de reposiciones realizadas.

2. Opcionalmente, escribe una observación general en el campo **Observaciones de la Rutina** (novedades que apliquen a todos los puntos del equipo en general).
3. Haz clic en **Guardar Inspección de Lubricación** (o el botón equivalente de la pantalla).
4. Aparece el mensaje de confirmación y el formulario se limpia para que puedas seleccionar el siguiente equipo si es necesario.

---

## Módulo 10 — Panel de Auditoría y Notificaciones Globales

### Para qué sirve este módulo

El Panel de Auditoría es el **registro oficial de todas las actividades importantes** que ocurren en Sinergy. Cada vez que se envía una inspección, se aprueba, se rechaza o sucede un evento relevante del sistema, queda registrado automáticamente aquí con fecha, hora y detalle del evento.

**Dónde está:** Menú lateral → **Auditoría** (o **Notificaciones Globales**, según la configuración de tu menú)

**Quién puede usarlo:** Principalmente Supervisores y Administradores. Puede ser consultado por cualquier usuario con acceso al módulo.

**Característica especial:** Este panel se actualiza **en tiempo real**. Cuando ocurre un evento nuevo en el sistema (ej. un técnico envía una inspección mientras tú tienes la pantalla abierta), el evento aparece automáticamente sin necesidad de recargar la página.

---

### Entender las categorías de eventos

Cada entrada del historial pertenece a una categoría con un color e ícono diferente:

| Categoría | Color | Qué registra |
|---|---|---|
| **Inspección Pendiente** | Amarillo | Una nueva ronda fue enviada por un técnico y está esperando revisión del supervisor. |
| **Inspección Aprobada** | Verde | Una ronda fue revisada y aprobada por el supervisor. |
| **Inspección Rechazada** | Rojo | Una ronda fue devuelta al técnico por el supervisor con observaciones. |
| **Auditoría Sistema** | Azul | Eventos internos del sistema como cambios de configuración, reemplazos de horómetro, acciones administrativas, etc. |

---

### Consultar y filtrar el historial de actividades

**Objetivo:** Encontrar eventos específicos dentro del historial de actividades del sistema.

**Resultado esperado:** La lista muestra únicamente los eventos que coinciden con los criterios seleccionados.

1. Haz clic en **Auditoría** en el menú lateral.
2. Verás el panel con dos herramientas de filtrado:

**Campo de búsqueda:**
- Escribe cualquier palabra del título del evento, del mensaje descriptivo o del nombre de la entidad afectada.
- La lista se filtra en tiempo real mientras escribes.

**Filtros de categoría (botones de selección):**
- Haz clic en uno de los botones para ver solo eventos de esa categoría:

| Botón | Eventos que muestra |
|---|---|
| **Todas** | Todos los eventos sin filtro. |
| **Pendientes** | Solo inspecciones que están esperando revisión. |
| **Aprobadas** | Solo inspecciones aprobadas. |
| **Rechazadas** | Solo inspecciones rechazadas. |
| **Auditoría Sistema** | Solo eventos internos del sistema. |

3. Para cada evento en la lista verás:
   - **Ícono y color** de la categoría.
   - **Título** del evento en negrita.
   - **Etiqueta** de categoría.
   - **Entidad afectada** (ej. "Inspección #INSP-2026-09-0042").
   - **Mensaje descriptivo** con el detalle de lo que ocurrió.
   - **Fecha y hora** exactas del evento (esquina derecha).

4. Para actualizar el historial manualmente, haz clic en el botón **Actualizar** (esquina superior derecha).

---

### El indicador de conexión en tiempo real

En la parte superior del historial verás un indicador de estado de la conexión:

| Estado | Color | Qué significa |
|---|---|---|
| **Conectado (En vivo)** | Verde | El sistema está recibiendo eventos en tiempo real automáticamente. |
| **Desconectado** | Gris | La conexión en tiempo real se interrumpió. Los eventos no llegarán automáticamente. |

> [!WARNING]
> **Si el indicador muestra "Desconectado":** Los nuevos eventos no aparecerán automáticamente en la pantalla. Usa el botón **Actualizar** para cargar los eventos más recientes manualmente. Recarga la página si el problema persiste.

---

## Resolución de problemas frecuentes

| Problema | Causa probable | Qué hacer |
|---|---|---|
| **No veo la pestaña "Nueva Inspección"** | Tu cuenta no tiene permiso para registrar inspecciones. | Contacta al administrador para que revise el rol de tu cuenta. |
| **No veo la pestaña "Bandeja de Aprobaciones"** | Tu cuenta no tiene rol de Supervisor ni Administrador. | Esta función solo está disponible para supervisores y administradores. Contacta al administrador si crees que debería estar disponible para ti. |
| **Al iniciar inspección, el sistema dice que no hay equipos operativos** | Los equipos del alcance seleccionado están marcados como "En Mantenimiento" o "Inoperativo", o no tienen variables críticas configuradas. | Verifica el estado de los equipos en el módulo de **Equipos**. También verifica que los componentes de esos equipos tengan variables críticas asignadas en el módulo de **Variables Críticas**. |
| **Escribí un valor y aparece la etiqueta "Fuera de Rango"** | El valor ingresado está por encima o por debajo del rango normativo configurado para esa variable. | La etiqueta es informativa, no bloquea el avance. Verifica que el valor sea correcto. Si la medición es real pero el rango está mal configurado, el supervisor debe ajustarlo en Variables Críticas. |
| **Cerré la pantalla sin enviar la inspección. ¿Perdí los datos?** | Si guardaste borrador, los datos se conservaron. Si no, pueden haberse perdido. | Al volver a abrir el módulo de Inspecciones, el sistema intentará restaurar el último borrador automáticamente. Si no aparece, los datos no pudieron recuperarse. |
| **El botón "Finalizar" no aparece; solo veo "Siguiente"** | Aún no has llegado al último equipo de la ronda. | Sigue avanzando con "Siguiente" hasta llegar al último equipo. Solo en ese punto aparece "Finalizar". |
| **La Bandeja de Aprobaciones está vacía** | No hay inspecciones pendientes en este momento. | Todos los registros enviados por los técnicos ya fueron procesados. Si esperas una inspección específica, solicítale al técnico que la envíe. |
| **En Lubricación, el equipo que busco no aparece en la lista** | El equipo no tiene partes a lubricar configuradas en la Matriz de Lubricación, o no hay equipos asignados a esa ubicación. | Un Administrador o Supervisor debe ir a la sección **Partes a Lubricar** y agregar los puntos de lubricación para ese equipo. |
| **El horómetro nuevo es menor al anterior y no sé qué escribir en la justificación** | El contador de horas fue reiniciado o el reloj fue reemplazado físicamente en el equipo. | Documenta el motivo exacto: fecha aproximada del reemplazo, causa (daño, desgaste, mantenimiento del reloj). Esta información queda auditada en el sistema. |
| **El Panel de Auditoría muestra "Desconectado" y no se actualiza solo** | La conexión en tiempo real se cayó por un problema de red o servidor. | Haz clic en **Actualizar** para cargar los datos manualmente. Recarga la página si el problema persiste por más de 2 minutos. |
| **Enviaron una inspección pero no aparece en la Bandeja de Aprobaciones** | La bandeja puede no haberse actualizado automáticamente. | Haz clic en **Refrescar Bandeja** en la parte superior del panel de supervisión. |

---

> **Canal de soporte:** Para cualquier situación no cubierta en esta guía, contacta al administrador del sistema o al equipo de soporte técnico de tu organización.

---

*Documento generado para uso interno · Sistema Sinergy — Gestión de Mantenimiento Industrial*
