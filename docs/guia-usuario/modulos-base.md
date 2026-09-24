# Guía de Usuario — Módulos Base
**Sistema Sinergy · Versión 1.0**

---

## Tabla de Contenidos

- [Conceptos clave antes de empezar](#conceptos-clave-antes-de-empezar)
- [Cómo funciona la pantalla principal de cada módulo](#cómo-funciona-la-pantalla-principal-de-cada-módulo)
- [Módulo 1 — Usuarios](#módulo-1--usuarios)
- [Módulo 2 — Plantas](#módulo-2--plantas)
- [Módulo 3 — Ubicaciones Técnicas](#módulo-3--ubicaciones-técnicas)
- [Módulo 4 — Equipos y Tipos de Equipo](#módulo-4--equipos-y-tipos-de-equipo)
- [Resolución de problemas frecuentes](#resolución-de-problemas-frecuentes)

---

## Conceptos clave antes de empezar

Antes de usar cualquier módulo, es importante conocer los siguientes términos tal como los usa el sistema:

| Término en el sistema | Qué significa para ti |
|---|---|
| **Planta** | Una sede, instalación o centro de trabajo físico de tu empresa. |
| **Ubicación técnica** | Un área, zona o sector específico dentro de una planta (ej. "Sala de calderas", "Línea de ensamble 2"). |
| **Equipo** | Una máquina, herramienta o activo físico que pertenece a una ubicación técnica. |
| **Tipo de equipo** | La categoría a la que pertenece un equipo (ej. "Compresor", "Bomba centrífuga", "Acampanadora"). |
| **Rol** | El nivel de acceso y responsabilidad que tiene un usuario dentro del sistema (ej. Técnico, Supervisor, Administrador). |
| **Estado Activo / Inactivo** | Un registro activo está en uso. Uno inactivo fue desactivado y ya no aparece en los procesos del sistema, pero su historial se conserva. |
| **Pestañas** | Las secciones dentro de un módulo. Por ejemplo, dentro de Usuarios verás las pestañas "Lista de Usuarios" y "Añadir Usuario". |

> [!IMPORTANT]
> **Nota sobre permisos:** Algunas acciones, como registrar, editar o desactivar registros, solo están disponibles para usuarios con el rol de Administrador o Supervisor. Si no ves los botones de acción descritos en esta guía, tu cuenta no tiene el permiso necesario. Comunícate con tu administrador del sistema.

---

## Cómo funciona la pantalla principal de cada módulo

Todos los módulos de gestión en Sinergy comparten el mismo patrón de pantalla. Familiarizarte con él te permitirá moverte con rapidez en cualquier sección.

```
┌─────────────────────────────────────────────────┐
│  Encabezado del módulo (título e ícono)          │
├────────────────┬────────────────┬────────────────┤
│  Pestaña:      │  Pestaña:      │  Pestaña:      │
│  Lista         │  Añadir        │  Editar (*)    │
└────────────────┴────────────────┴────────────────┘
│  Sección de filtros (campos de búsqueda)         │
├─────────────────────────────────────────────────┤
│  Tabla de datos con columnas y filas             │
│  (cada fila tiene botones: Editar / Desactivar)  │
└─────────────────────────────────────────────────┘

(*) La pestaña "Editar" solo aparece cuando seleccionas
    un registro para modificarlo desde la lista.
```

**Regla general:** Para hacer cualquier cosa en un módulo, primero identifica en qué pestaña debes estar y luego sigue los pasos de la tarea correspondiente en esta guía.

---

## Módulo 1 — Usuarios

**Para qué sirve:** Gestionar las cuentas de las personas que acceden a Sinergy. Desde aquí puedes crear nuevas cuentas, modificar los datos de un colaborador, asignarle una planta y un rol, o desactivar el acceso de alguien que ya no trabaja en la organización.

**Dónde está:** Menú lateral → **Usuarios**

**Quién puede usarlo en su totalidad:** Solo usuarios con rol **Administrador**.

---

### Ver la lista de usuarios

**Objetivo:** Ver todos los usuarios registrados en el sistema en una tabla con sus datos principales.

**Resultado esperado:** La pantalla muestra la tabla con todos los usuarios registrados, ordenados por defecto por ID.

1. Haz clic en **Usuarios** en el menú lateral.
2. La pantalla carga automáticamente en la pestaña **Lista de Usuarios**.
3. Verás una tabla con las siguientes columnas:

| Columna | Qué muestra |
|---|---|
| **Id** | Número interno del registro |
| **Nombre** | Nombre de pila del usuario |
| **Apellido** | Apellido del usuario |
| **Correo** | Dirección de correo electrónico |
| **Nombre de Usuario** | El identificador con el que ingresa al sistema |
| **Rol** | El nivel de acceso asignado |
| **Planta** | La planta donde opera (o "Todas (Global)" si tiene acceso a todas las sedes) |
| **Supervisor** | El responsable directo asignado, si aplica |
| **Estado** | Etiqueta verde **Activo** o roja **Inactivo** |
| **Último Acceso** | Fecha y hora del último ingreso al sistema |
| **Fecha Creación** | Cuándo fue registrado |
| **Última Actualización** | Cuándo se modificaron sus datos por última vez |
| **Acciones** | Botones para **Editar** o **Desactivar** |

> [!NOTE]
> La tabla es interactiva. Puedes hacer clic en los encabezados de columna para ordenar los resultados de mayor a menor, o de A a Z.

---

### Buscar y filtrar usuarios

**Objetivo:** Reducir la lista de usuarios hasta encontrar exactamente el registro que necesitas.

**Resultado esperado:** La tabla muestra únicamente los usuarios que coinciden con los criterios ingresados.

1. Asegúrate de estar en la pestaña **Lista de Usuarios**.
2. Encima de la tabla verás un panel de filtros con varios campos. Puedes usar uno o varios al mismo tiempo:

| Campo de filtro | Cómo funciona |
|---|---|
| **Búsqueda Global** | Escribe cualquier parte del nombre, correo o nombre de usuario. La tabla se actualiza en tiempo real mientras escribes. |
| **Nombre** | Filtra únicamente por nombre o apellido. |
| **Correo** | Filtra por dirección de correo electrónico. |
| **Nombre de Usuario** | Filtra por el identificador de ingreso al sistema. |
| **Estado** | Despliega las opciones: **Activos** o **Inactivos**. |
| **Rol** | Muestra una lista de roles disponibles para filtrar por nivel de acceso. |
| **Planta** | Muestra una lista de plantas para ver solo los usuarios de esa sede. |

3. La tabla se actualiza automáticamente. No necesitas presionar ningún botón de buscar.
4. Para limpiar un filtro, borra el texto del campo o selecciona la opción en blanco en los menús desplegables.

---

### Registrar un nuevo usuario

**Objetivo:** Crear una cuenta de acceso al sistema para un nuevo colaborador.

**Resultado esperado:** La nueva cuenta queda creada y visible en la lista. El usuario ya puede ingresar al sistema con las credenciales registradas.

> [!IMPORTANT]
> **Requisito previo:** Debes tener al menos una **Planta** y un **Rol** registrados en el sistema antes de crear usuarios.

1. Haz clic en la pestaña **Añadir Usuario**.
2. Completa el formulario con los datos del nuevo colaborador:

| Campo | Obligatorio | Descripción |
|---|---|---|
| **Nombre** | Sí | Nombre de pila de la persona. |
| **Apellido** | Sí | Apellido de la persona. |
| **Correo Electrónico** | Sí | Dirección de correo. Debe ser única; no puede estar en uso por otra cuenta. |
| **Nombre de Usuario** | Sí | Identificador para ingresar. Sin espacios ni caracteres especiales. |
| **Contraseña** | Sí | Clave de acceso inicial. El usuario puede cambiarla después. |
| **Rol Asignado** | Sí | Selecciona el nivel de acceso en el menú desplegable. |
| **Planta Asignada** | Depende del rol | Si el rol es **Administrador**, puedes dejarlo vacío para dar acceso a todas las plantas. Para cualquier otro rol, selecciona la planta correspondiente. |
| **Supervisor Asignado** | Depende del rol | Solo aparece si el rol seleccionado requiere un supervisor. Selecciona al responsable directo de la lista desplegable. |
| **Usuario Activo** | — | Interruptor activado por defecto. Si lo desactivas antes de guardar, la cuenta quedará bloqueada desde su creación. |

3. Si algún campo tiene un error, verás un mensaje en rojo debajo del campo indicándote qué corregir. Corrígelo y el mensaje desaparecerá.
4. Haz clic en **Guardar Usuario**.
5. Aparecerá un mensaje de confirmación en la esquina de la pantalla y el sistema te llevará de vuelta a **Lista de Usuarios**, donde podrás ver el nuevo registro.

> [!WARNING]
> **Error frecuente — "El correo o nombre de usuario ya existe":** Esto significa que otro registro usa exactamente esos mismos datos. Verifica en la lista si la cuenta ya fue creada anteriormente, o usa un correo y nombre de usuario diferentes.

---

### Editar un usuario existente

**Objetivo:** Actualizar los datos de un colaborador ya registrado (nombre, planta, rol, estado, etc.).

**Resultado esperado:** Los datos del usuario quedan actualizados y el cambio es efectivo de inmediato.

1. Ve a la pestaña **Lista de Usuarios**.
2. Localiza al usuario que deseas modificar (usa los filtros si la lista es extensa).
3. En la columna **Acciones**, haz clic en el botón **Editar** (ícono de lápiz sobre documento).
4. El sistema abre automáticamente la pestaña **Editar Usuario** con todos los datos actuales ya cargados en el formulario.
5. Modifica únicamente los campos que necesites cambiar.

> [!NOTE]
> **Sobre la contraseña en modo edición:** El campo de contraseña aparece vacío. Si no escribes nada en él, la contraseña actual del usuario **no cambia**. Solo escribe una nueva contraseña si deseas reemplazarla.

6. Haz clic en **Actualizar Usuario**.
7. Aparecerá el mensaje de confirmación y el sistema te devolverá a la lista.

> **Para cancelar sin guardar cambios:** Haz clic en el botón **Cancelar** o haz clic directamente en la pestaña **Lista de Usuarios**.

---

### Desactivar un usuario

**Objetivo:** Bloquear el acceso de una persona al sistema sin eliminar su historial de actividad.

**Resultado esperado:** La cuenta queda bloqueada. El usuario no podrá ingresar, pero todos los registros que generó (inspecciones, órdenes, etc.) se conservan íntegramente.

> [!CAUTION]
> Esta acción **no elimina la cuenta** de forma permanente. Los registros históricos asociados a ese usuario permanecen en el sistema y siguen siendo consultables.

1. Ve a la pestaña **Lista de Usuarios**.
2. Localiza al usuario que deseas desactivar.
3. En la columna **Acciones**, haz clic en el botón **Eliminar** (ícono de círculo con signo menos).

> [!NOTE]
> Si el botón aparece en gris y no responde al clic, significa que el usuario ya está inactivo.

4. Aparecerá una ventana emergente con el mensaje: *"¿Está seguro de que desea desactivar este elemento?"*
5. Haz clic en el botón rojo **Eliminar** para confirmar, o en **Cancelar** para cerrar la ventana sin cambios.
6. Si la acción es exitosa, el usuario aparecerá con etiqueta roja **Inactivo** en la tabla.

---

## Módulo 2 — Plantas

**Para qué sirve:** Registrar y administrar las sedes físicas o instalaciones de la empresa. Las plantas son la base estructural del sistema: los usuarios, las ubicaciones técnicas y los equipos dependen de ellas para organizarse correctamente.

**Dónde está:** Menú lateral → **Plantas**

**Quién puede editar:** Solo usuarios con rol **Administrador**. Los demás roles solo pueden consultar la lista.

---

### Ver la lista de plantas

**Objetivo:** Consultar todas las sedes registradas y su estado actual.

**Resultado esperado:** La pantalla muestra la tabla con todas las plantas del sistema.

1. Haz clic en **Plantas** en el menú lateral.
2. La pantalla carga en la pestaña **Lista de Plantas** con una tabla que contiene:

| Columna | Qué muestra |
|---|---|
| **Código** | Identificador corto y único de la planta (ej. `PLT-01`) |
| **Nombre** | Nombre completo de la sede |
| **Estado** | Etiqueta verde **Activa** o roja **Inactiva** |
| **Fecha Creación** | Cuándo fue registrada en el sistema |
| **Última Actualización** | Cuándo fue modificada por última vez |
| **Acciones** | Botones **Editar** y **Desactivar** (solo para administradores) |

---

### Buscar y filtrar plantas

**Objetivo:** Encontrar una planta específica dentro de la lista.

**Resultado esperado:** La tabla muestra solo las plantas que coinciden con los criterios ingresados.

1. Asegúrate de estar en la pestaña **Lista de Plantas**.
2. Usa los campos del panel de filtros:

| Campo | Cómo funciona |
|---|---|
| **Búsqueda Global** | Escribe parte del código o del nombre. La tabla filtra en tiempo real. |
| **Código** | Filtra exclusivamente por el código de la planta. |
| **Nombre** | Filtra exclusivamente por el nombre. |
| **Estado** | Selecciona **Activas** o **Inactivas** para ver solo plantas de ese estado. |

3. La tabla se actualiza sola. No hay ningún botón de búsqueda que presionar.

---

### Registrar una nueva planta

**Objetivo:** Agregar una nueva sede al sistema.

**Resultado esperado:** La planta queda registrada y disponible para asignarle ubicaciones técnicas y usuarios.

1. Haz clic en la pestaña **Añadir Planta**.
2. Completa el formulario:

| Campo | Obligatorio | Descripción |
|---|---|---|
| **Código** | Sí | Identificador único y corto (ej. `PLT-CAR`, `SEDE-01`). No puede repetirse en el sistema. |
| **Nombre** | Sí | Nombre completo y descriptivo de la sede (ej. "Planta Caracas Norte"). |
| **Activa** | — | Interruptor activado por defecto. Indica que la planta está en funcionamiento. |

3. Haz clic en **Guardar Planta**.
4. Si la operación es exitosa, verás un mensaje de confirmación y regresarás automáticamente a la lista.

> [!WARNING]
> **Error frecuente — código duplicado:** Si el sistema rechaza el registro, es muy probable que el **Código** ya exista en otra planta. Consulta la lista y usa un código diferente.

---

### Editar una planta existente

**Objetivo:** Corregir o actualizar el nombre, código o estado de una sede ya registrada.

**Resultado esperado:** Los datos de la planta quedan actualizados de inmediato.

1. Ve a la pestaña **Lista de Plantas**.
2. Localiza la planta que deseas modificar.
3. En **Acciones**, haz clic en **Editar**.
4. La pestaña **Editar Planta** se abre con los datos actuales precargados.
5. Realiza los cambios necesarios en los campos correspondientes.
6. Haz clic en **Actualizar Planta**.
7. Aparece el mensaje de confirmación y regresas automáticamente a la lista.

---

### Desactivar una planta

**Objetivo:** Marcar una sede como inactiva cuando deja de operar.

**Resultado esperado:** La planta queda en estado **Inactiva** y no aparecerá disponible para nuevas asignaciones, pero su historial se conserva.

> [!CAUTION]
> Desactivar una planta puede afectar a los usuarios y ubicaciones que la tienen asignada. Verifica estas dependencias antes de proceder y comunícalo al equipo afectado.

1. Ve a la pestaña **Lista de Plantas**.
2. Localiza la planta que deseas desactivar.
3. En **Acciones**, haz clic en **Eliminar**.

> Si el botón está en gris, la planta ya está inactiva.

4. En la ventana emergente de confirmación, haz clic en **Eliminar** para proceder, o en **Cancelar** para abortar la acción.
5. Al confirmar, la etiqueta de estado de la planta cambiará a **Inactiva** (roja).

---

## Módulo 3 — Ubicaciones Técnicas

**Para qué sirve:** Gestionar las áreas o zonas específicas dentro de cada planta. Una ubicación técnica es el punto físico exacto donde se instalan y operan los equipos. Ejemplos típicos: "Sala de Compresores", "Línea A — Ensamble", "Torre de Enfriamiento 3".

**Dónde está:** Menú lateral → **Ubicaciones**

**Quién puede editar:** Solo usuarios con rol **Administrador**. Los demás roles solo pueden consultar.

> [!IMPORTANT]
> **Requisito previo:** Debes tener al menos una **Planta activa** registrada en el sistema antes de poder crear ubicaciones técnicas.

---

### Ver la lista de ubicaciones

**Objetivo:** Consultar todas las ubicaciones técnicas registradas con su planta de pertenencia y estado.

**Resultado esperado:** La pantalla muestra la tabla completa de ubicaciones.

1. Haz clic en **Ubicaciones** en el menú lateral.
2. La pantalla carga en **Lista de Ubicaciones** con una tabla que muestra:

| Columna | Qué muestra |
|---|---|
| **Código** | Identificador único de la ubicación (ej. `UB-01-CAL`) |
| **Nombre** | Nombre descriptivo del área o zona |
| **Planta** | A qué sede pertenece esta ubicación |
| **Estado** | Etiqueta verde **Activa** o roja **Inactiva** |
| **Descripción** | Texto adicional que describe el área (opcional) |
| **Fecha Creación** | Cuándo fue registrada |
| **Última Actualización** | Cuándo fue modificada por última vez |
| **Acciones** | Botones **Editar** y **Desactivar** (solo administradores) |

---

### Buscar y filtrar ubicaciones

**Objetivo:** Encontrar una ubicación específica dentro de una lista potencialmente extensa.

**Resultado esperado:** La tabla muestra solo las ubicaciones que coinciden con los criterios ingresados.

1. Asegúrate de estar en la pestaña **Lista de Ubicaciones**.
2. Usa los campos del panel de filtros:

| Campo | Cómo funciona |
|---|---|
| **Búsqueda Global** | Escribe parte del código o del nombre. Filtra en tiempo real. |
| **Código** | Filtra exclusivamente por el código de la ubicación. |
| **Nombre** | Filtra exclusivamente por nombre. |
| **Descripción** | Filtra por palabras contenidas en el texto de descripción. |
| **Estado** | Selecciona **Activas** o **Inactivas**. |
| **Planta** | Selecciona una sede para ver solo las ubicaciones que le pertenecen. |

---

### Registrar una nueva ubicación

**Objetivo:** Agregar un área o zona al inventario del sistema.

**Resultado esperado:** La nueva ubicación queda registrada y disponible para que los equipos sean asignados a ella.

1. Haz clic en la pestaña **Añadir Ubicación**.
2. Completa el formulario:

| Campo | Obligatorio | Descripción |
|---|---|---|
| **Código** | Sí | Identificador único y corto (ej. `UB-CAL-01`). No puede repetirse en el sistema. |
| **Nombre** | Sí | Nombre descriptivo del área (ej. "Sala de Calderas — Nivel 2"). |
| **Planta** | Sí | Selecciona la sede a la que pertenece esta área en el menú desplegable. |
| **Descripción** | No | Texto libre para dar contexto adicional sobre el área o zona. |
| **Activa** | — | Interruptor activado por defecto. |

3. Haz clic en **Guardar Ubicación**.
4. El mensaje de confirmación aparece y regresas automáticamente a la lista.

---

### Editar una ubicación existente

**Objetivo:** Corregir o actualizar los datos de una ubicación técnica ya registrada.

**Resultado esperado:** Los datos de la ubicación quedan actualizados de inmediato.

1. Ve a **Lista de Ubicaciones**.
2. Localiza la ubicación que deseas modificar (usa los filtros si la lista es extensa).
3. Haz clic en **Editar** en la columna Acciones.
4. La pestaña **Editar Ubicación** se abre con los datos actuales precargados.
5. Modifica los campos que necesites.
6. Haz clic en **Actualizar Ubicación**.
7. Aparece el mensaje de confirmación y regresas a la lista.

---

### Desactivar una ubicación

**Objetivo:** Marcar un área como inactiva cuando deja de usarse.

**Resultado esperado:** La ubicación queda en estado **Inactiva** y no estará disponible para nuevas asignaciones, pero su historial se conserva.

> [!CAUTION]
> Verifica si hay equipos activos asignados a esta ubicación antes de desactivarla. Los equipos asociados quedarán en una ubicación inactiva, lo que puede generar inconsistencias en los reportes.

1. Ve a **Lista de Ubicaciones**.
2. Localiza la ubicación a desactivar.
3. Haz clic en **Eliminar** en la columna Acciones.

> Si el botón está en gris, la ubicación ya está inactiva.

4. En la ventana emergente de confirmación, haz clic en **Eliminar** para confirmar la acción.

---

## Módulo 4 — Equipos y Tipos de Equipo

**Para qué sirve:** Gestionar el inventario completo de activos físicos de la empresa (máquinas, herramientas e instrumentos) y las categorías que los clasifican.

**Dónde está:** Menú lateral → **Equipos**

**Quién puede editar:** Solo usuarios con permisos de **gestión de máquinas** (generalmente rol Administrador o Supervisor de mantenimiento).

> [!IMPORTANT]
> **Requisitos previos para crear equipos:**
> - Debes tener **Ubicaciones Técnicas activas** registradas.
> - Debes tener al menos un **Tipo de Equipo** registrado.
>
> Si aún no tienes estos registros, ve primero a crear los Tipos de Equipo (dentro de este mismo módulo) y luego las Ubicaciones Técnicas.

---

### Entender la pantalla de Equipos

La pantalla de Equipos tiene **dos niveles de pestañas**. Es importante entender esta estructura antes de empezar:

**Nivel 1 — Pestañas principales** (seleccionan qué sección gestionar):

| Pestaña principal | Qué gestiona |
|---|---|
| **Equipos** | El inventario de activos físicos (máquinas). |
| **Tipos de Equipo** | Las categorías que clasifican los equipos. |

**Nivel 2 — Sub-pestañas** (aparecen dentro de cada sección principal):

| Dentro de "Equipos" | Dentro de "Tipos de Equipo" |
|---|---|
| Lista de Equipos | Lista de Tipos |
| Añadir Equipo | Añadir Tipo |
| Editar Equipo (*) | Editar Tipo (*) |

> (*) Estas sub-pestañas solo aparecen cuando seleccionas un registro para modificarlo.

---

### Ver la lista de equipos

**Objetivo:** Consultar todos los activos registrados con su estado operativo actual.

**Resultado esperado:** La tabla muestra el inventario completo de equipos con su información técnica y estado.

1. Haz clic en **Equipos** en el menú lateral.
2. Asegúrate de estar en la pestaña principal **Equipos** (no en Tipos de Equipo).
3. Estarás en la sub-pestaña **Lista de Equipos** por defecto. La tabla muestra:

| Columna | Qué muestra |
|---|---|
| **Código** | Identificador único del equipo (ej. `1000ACA00002`) |
| **Nombre** | Nombre descriptivo del equipo (ej. "Acampanadora SICA") |
| **Tipo** | Categoría a la que pertenece el equipo |
| **Ubicación Técnica** | El área donde está instalado físicamente |
| **Marca / Modelo** | Fabricante y referencia del modelo |
| **Serial** | Número de serie del fabricante |
| **Estado** | Etiqueta de color según la condición operativa actual |
| **Acciones** | Botones **Editar** y **Marcar como Inoperativo** |

**Estados operativos posibles y su significado:**

| Etiqueta | Color de la etiqueta | Significado |
|---|---|---|
| **Operativo** | Verde | El equipo funciona con normalidad. |
| **En Mantenimiento** | Amarillo/Naranja | Fuera de servicio temporalmente por mantenimiento. |
| **Inoperativo** | Rojo | Fuera de servicio de forma indefinida. |

---

### Buscar y filtrar equipos

**Objetivo:** Encontrar uno o varios equipos específicos dentro del inventario.

**Resultado esperado:** La tabla muestra únicamente los equipos que coinciden con los criterios de búsqueda.

1. En la sub-pestaña **Lista de Equipos**, usa el panel de filtros:

| Campo | Cómo funciona |
|---|---|
| **Búsqueda Global** | Escribe parte del código, nombre o serial. La tabla filtra en tiempo real. |
| **Código** | Filtra por código de equipo. |
| **Nombre** | Filtra por nombre del equipo. |
| **Marca** | Filtra por fabricante. |
| **Modelo** | Filtra por referencia de modelo. |
| **Serial** | Filtra por número de serie. |
| **Estado Operativo** | Despliega las opciones: Operativo, En Mantenimiento o Inoperativo. |
| **Tipo de Equipo** | Selecciona una categoría para ver solo equipos de ese tipo. |
| **Ubicación Técnica** | Selecciona un área para ver solo los equipos instalados en ella. |

---

### Registrar un nuevo equipo

**Objetivo:** Agregar un activo físico al inventario del sistema.

**Resultado esperado:** El equipo queda registrado, asignado a una ubicación y tipo, y disponible para ser incluido en planes de mantenimiento.

1. Ve a la pestaña principal **Equipos**.
2. Haz clic en la sub-pestaña **Añadir Equipo**.
3. Completa el formulario:

| Campo | Obligatorio | Descripción |
|---|---|---|
| **Código del Equipo** | Sí | Identificador único. Sigue el formato de codificación de tu empresa (ej. `1000ACA00002`). No puede repetirse. |
| **Nombre del Equipo** | Sí | Nombre descriptivo y reconocible del activo (ej. "Acampanadora SICA — Línea A"). |
| **Tipo de Equipo** | Sí | Selecciona la categoría correspondiente en el menú desplegable. |
| **Ubicación Técnica** | Sí | Escribe parte del código o nombre del área y selecciónala de la lista que aparece. |
| **Serial** | No | Número de serie del fabricante grabado en la placa del equipo. |
| **Marca** | No | Nombre del fabricante (ej. "Siemens", "ABB", "SICA"). |
| **Modelo** | No | Referencia específica del modelo. |
| **Estado Operativo** | — | Por defecto viene en **Operativo**. Cámbialo si el equipo se registra en otro estado. |
| **Observación** | No | Notas adicionales sobre el equipo, su condición de llegada o su instalación. |

4. Haz clic en **Guardar Equipo**.
5. Aparece el mensaje de confirmación y regresas a la lista de equipos.

> [!TIP]
> **Sobre el campo Ubicación Técnica:** Este campo tiene un buscador inteligente. Escribe las primeras letras del código o del nombre y el sistema mostrará las coincidencias disponibles. Selecciona la correcta haciendo clic sobre ella.

---

### Editar un equipo existente

**Objetivo:** Actualizar los datos técnicos o el estado operativo de un equipo ya registrado.

**Resultado esperado:** Los datos del equipo quedan actualizados de inmediato.

1. Ve a **Lista de Equipos**.
2. Localiza el equipo que deseas modificar (usa los filtros si el inventario es extenso).
3. Haz clic en **Editar** en la columna Acciones.
4. La sub-pestaña **Editar Equipo** se abre con todos los datos actuales precargados.
5. Modifica los campos que necesites.
6. Haz clic en **Actualizar Equipo**.
7. El mensaje de confirmación aparece y regresas a la lista.

> [!TIP]
> **Caso frecuente — cambiar el estado operativo:** Para actualizar un equipo de "Operativo" a "En Mantenimiento" (o cualquier otra transición), usa esta misma pantalla de edición. Cambia únicamente el campo **Estado Operativo** y guarda.

---

### Marcar un equipo como inoperativo

**Objetivo:** Registrar que un equipo ha salido permanentemente de servicio.

**Resultado esperado:** El equipo cambia su estado a **Inoperativo** (etiqueta roja). Su historial de mantenimiento se conserva íntegro.

> [!CAUTION]
> Esta acción **no elimina el equipo** del sistema. Los reportes e historial asociados a ese activo permanecen accesibles. La acción es reversible editando el equipo y cambiando su estado operativo.

1. Ve a **Lista de Equipos**.
2. Localiza el equipo que deseas marcar como inoperativo.
3. Haz clic en **Eliminar** en la columna Acciones.
4. En la ventana emergente, haz clic en **Eliminar** para confirmar la acción.
5. El equipo cambiará su etiqueta de estado a **Inoperativo** (roja).

---

### Gestionar tipos de equipo

Los tipos de equipo son las **categorías** que clasifican el inventario de activos. Definirlos correctamente facilita los filtros, los reportes y los planes de mantenimiento.

---

#### Ver la lista de tipos de equipo

**Resultado esperado:** La pantalla muestra todos los tipos de equipo registrados.

1. Haz clic en la pestaña principal **Tipos de Equipo**.
2. Estarás en la sub-pestaña **Lista de Tipos**. La tabla muestra:

| Columna | Qué muestra |
|---|---|
| **ID** | Número interno del registro |
| **Nombre** | Nombre de la categoría (ej. "Compresor", "Bomba centrífuga") |
| **Descripción** | Texto explicativo adicional (si fue registrado) |
| **Acciones** | Botones **Editar** y **Eliminar** |

---

#### Registrar un nuevo tipo de equipo

**Objetivo:** Crear una nueva categoría para clasificar equipos del inventario.

**Resultado esperado:** El nuevo tipo queda disponible para ser asignado al crear o editar equipos.

1. Haz clic en la pestaña principal **Tipos de Equipo**.
2. Haz clic en la sub-pestaña **Añadir Tipo**.
3. Completa el formulario:

| Campo | Obligatorio | Descripción |
|---|---|---|
| **Nombre del Tipo** | Sí | Nombre claro y conciso de la categoría (ej. "Motor eléctrico", "Válvula de control"). |
| **Descripción** | No | Texto adicional para aclarar qué clase de activos pertenecen a esta categoría. |

4. Haz clic en el botón **Guardar Tipo de Equipo**.
5. Aparece el mensaje de confirmación y regresas a la lista de tipos.

---

#### Editar un tipo de equipo

**Objetivo:** Corregir el nombre o descripción de una categoría ya existente.

**Resultado esperado:** El cambio de nombre se refleja automáticamente en todos los equipos que tienen asignado ese tipo.

1. En la sub-pestaña **Lista de Tipos**, haz clic en **Editar** en la fila del tipo que deseas modificar.
2. Se abre la sub-pestaña **Editar Tipo** con los datos actuales.
3. Realiza los cambios necesarios.
4. Haz clic en el botón de guardar.

---

#### Eliminar un tipo de equipo

**Objetivo:** Remover una categoría que ya no corresponde a ningún activo del inventario.

> [!CAUTION]
> Solo puedes eliminar un tipo de equipo si **ningún equipo activo** lo tiene asignado. Si hay equipos usando ese tipo, primero deberás reasignarlos a otra categoría desde la pantalla de edición de cada equipo.

1. En **Lista de Tipos**, haz clic en **Eliminar** en la fila del tipo a eliminar.
2. Confirma la acción en la ventana emergente haciendo clic en **Eliminar**.

---

## Resolución de problemas frecuentes

| Problema | Causa probable | Qué hacer |
|---|---|---|
| **No veo las pestañas "Añadir" ni los botones de "Editar" o "Eliminar"** | Tu cuenta no tiene permisos de edición en este módulo. | Contacta al administrador del sistema para que revise el rol de tu cuenta. |
| **El formulario no me deja guardar aunque llené todos los campos** | Uno o más campos tienen un valor inválido (correo sin `@`, campo obligatorio vacío, texto demasiado corto, etc.). | Lee los mensajes en rojo debajo de cada campo. Corrígelos uno por uno y vuelve a intentar guardar. |
| **El sistema dice que el código o el correo ya existe** | Ya hay otro registro activo o inactivo con ese mismo valor. | Busca en la lista si el elemento ya fue registrado anteriormente. Si es diferente, usa un código o correo distinto. |
| **El botón "Eliminar" o "Desactivar" aparece en gris** | El registro ya está inactivo, o no se puede desactivar mientras tenga dependencias activas. | Verifica si el estado actual ya es "Inactivo". Si el botón sigue sin funcionar, consulta al administrador. |
| **La tabla aparece completamente vacía** | Hay filtros aplicados que no tienen coincidencias, o el módulo aún no tiene registros cargados. | Limpia todos los filtros borrando el contenido de los campos. Si la tabla sigue vacía, el módulo aún no tiene datos registrados. |
| **Aparece el mensaje "Error de conexión"** | El sistema no pudo comunicarse con el servidor en ese momento. | Espera unos segundos y vuelve a intentarlo. Si el error persiste más de 2 minutos, notifícalo al soporte técnico. |
| **Guardé los cambios pero no los veo en la lista** | La tabla se actualiza automáticamente, pero en ocasiones puede tardar un instante. | Recarga la página presionando `F5`. Si el cambio sigue sin aparecer, contacta al soporte. |
| **Al crear un usuario, el campo "Supervisor" no aparece** | El rol seleccionado no requiere supervisor. Este campo solo aparece para roles que tienen habilitada esa dependencia. | Verifica que el rol asignado sea el correcto. Si el rol necesita supervisor y el campo no aparece, contacta al administrador. |
| **Al crear un equipo, no encuentro la ubicación en la lista** | La ubicación no existe aún o está marcada como inactiva. | Ve al módulo de **Ubicaciones** y verifica que el área exista y esté activa. Si no existe, créala primero. |

---

> **Canal de soporte:** Para cualquier situación no cubierta en esta guía, contacta al administrador del sistema o al equipo de soporte técnico de tu organización.

---

*Documento generado para uso interno · Sistema Sinergy — Gestión de Mantenimiento Industrial*
