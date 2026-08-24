# Gestión Jerárquica y Plantillas de Variables Críticas

Este documento define la arquitectura, la experiencia de usuario (UX) y el plan de implementación por etapas para la gestión de variables críticas en componentes de planta. El modelo desacopla la definición de las variables respecto a los componentes individuales mediante la introducción de plantillas asociadas a tipos de equipo (`TipoEquipo`).

---

## Ventajas del Modelo

* **Definición Única:** Las variables se definen a nivel de `TipoEquipo` (ej. Chiller, Compresor, Montacargas) y no por cada componente individual.
* **Instanciación Automática:** Creación automática de variables al instanciar un componente mediante clonación de plantilla.
* **Sincronización Masiva:** Propagación centralizada de cambios (creación, edición o eliminación de variables) desde la plantilla hacia todas las instancias activas.

---

## Flujo de Navegación y UX

### Árbol Jerárquico (Panel Izquierdo)

El panel izquierdo despliega la estructura de la planta en una vista de árbol:

```text
Planta
└── Ubicación Técnica
    └── Línea
        └── Equipo (asociado a un TipoEquipo: Chiller, Compresor, etc.)
            └── Componente
                └── Variables (instancias generadas desde plantilla)
```

### Acciones Contextuales

#### Interacción en el Árbol
* **Clic Izquierdo en Componente:** Carga el listado de variables asociadas en el panel derecho.
* **Clic Derecho en Componente:** Despliega menú contextual con las siguientes opciones:
  * `Editar Variables (Plantilla)`: Abre el editor centralizado de la plantilla del `TipoEquipo`.
  * `Sincronizar con Plantilla`: Actualiza las variables del componente seleccionado acorde a la definición vigente de la plantilla.

#### Interacción en el Panel de Variables (Panel Derecho)
* **Clic Derecho en Variable (Instancia):** Despliega menú contextual para editar, eliminar o restablecer la instancia seleccionada.
* **Clic Derecho en Espacio Vacío:** Despliega opciones para:
  * `Agregar Variable`: Añade una variable exclusiva para el componente actual.
  * `Agregar a Plantilla`: Modifica la plantilla global afectando a todos los componentes del mismo `TipoEquipo`.

---

## Prompts de Implementación para Antigravity

A continuación se detalla la secuencia incremental de prompts para guiar el desarrollo.

### Etapa 1: Estructura del Tree View (Navegación)

> Quiero implementar un árbol jerárquico en Vue 3 + Vuetify para navegar por: Planta -> Ubicación Técnica -> Línea -> Equipo -> Componente. Los datos vienen de un store de Pinia que consulta una API REST (o directamente con Prisma). El árbol debe ser dinámico, cargando los hijos al expandir cada nodo. Usa v-treeview de Vuetify o un componente personalizado con v-for recursivo. Muestra íconos de carpeta para nodos con hijos y archivo para componentes (hojas). Al hacer click en un componente, emite un evento que carga sus variables en el panel derecho. Dame el código completo del componente TreeView, el store de Pinia con las acciones para obtener los datos jerárquicos (usando include anidado o llamadas por niveles), y la vista principal que contiene el árbol y el panel de detalles.

### Etapa 2: Menú Contextual en el Árbol

> Agrega un menú contextual (click derecho) a los nodos del árbol. Las opciones varían según el tipo de nodo:
- Planta: 'Agregar Ubicación Técnica'
- Ubicación Técnica: 'Agregar Línea'
- Línea: 'Agregar Equipo'
- Equipo: 'Agregar Componente', 'Editar Equipo', 'Eliminar Equipo'
- Componente: 'Agregar Variable (instancia)', 'Editar Componente', 'Eliminar Componente', 'Sincronizar con Plantilla'

> Usa v-menu posicionado con las coordenadas del evento. Cada acción abre un diálogo con un formulario para ingresar los datos necesarios (nombre, código, etc.). Implementa las funciones en el store para crear/editar/eliminar nodos, y refresca el árbol después de cada operación.

### Etapa 3: Panel de Variables y Menú Contextual en Instancias

> En el panel derecho, muestra la lista de variables del componente seleccionado. Cada variable debe mostrar: nombre, tipo, unidad, y un badge de 'activa'. Al hacer click derecho sobre una variable, muestra un menú contextual con: 'Editar Variable', 'Eliminar Variable', 'Duplicar Variable', 'Restablecer desde Plantilla' (solo si tiene plantillaId). En el panel derecho (espacio vacío), agrega un botón 'Agregar Variable' que abra un formulario para crear una nueva variable (instancia). Todas estas acciones deben llamar a métodos del store que actualicen la base de datos y refresquen la lista.

### Etapa 4: Gestión de Plantillas de Variables por TipoEquipo

> Implementa una vista/pestaña para administrar las plantillas de variables por TipoEquipo. Debe mostrar una tabla con las variables de la plantilla seleccionada (con opciones para agregar, editar y eliminar variables de la plantilla). Al hacer click en 'Sincronizar con Plantilla' desde el menú contextual de un componente, toma la plantilla del TipoEquipo del equipo al que pertenece el componente, y actualiza las variables instancia del componente: añade las que faltan, elimina las que ya no estén en la plantilla (o las desactiva), y actualiza los valores (nombre, unidad, etc.). Diseña el store para manejar esta sincronización. También agrega un botón 'Sincronizar Todos' para aplicar los cambios de la plantilla a todos los equipos de ese tipo.

### Etapa 5: Integración y Robustez

> Integra todos los componentes: el árbol con menús contextuales, el panel de variables con sus acciones, y la gestión de plantillas. Asegura que al seleccionar un componente en el árbol, el panel de variables se actualice automáticamente. Al modificar una plantilla, muestra un toast y sugiere sincronizar los componentes afectados. Implementa un filtro por TipoEquipo en el panel de plantillas. Prueba el flujo completo: crear un nuevo equipo de tipo 'Chiller', ver que sus variables se crean automáticamente desde la plantilla, y poder editarlas desde el panel. Añade indicadores de carga y manejo de errores.

---

## Modificaciones en el Esquema de Base de Datos

| Modelo | Tipo de Cambio | Descripción |
| :--- | :--- | :--- |
| `Variable` | Modificación | Agregar campo `plantillaId` (Foreign Key hacia `PlantillaVariable`, anulable). |
| `PlantillaVariable` | Modificación | Contiene `tipoEquipoId`, `nombreComponente` (opcional/segmentado), rangos, unidades y tipos de evaluación. Permite asignar variables específicamente a componentes individuales (ej. `MOTOR TRASLADO`, `TABLERO ELÉCTRICO`, `BOMBA DE LUBRICACIÓN`). |
| `PlantillaOpcionSeleccion` | Nuevo | Opciones predeterminadas para variables de tipo lista/selección en plantillas. |

### Estrategia de Migración y Segmentación por Componente

1. Columna `nombre_componente`: Al crear o sincronizar variables desde plantilla, el sistema evalúa `plantilla.nombreComponente` contra `componente.nombre`.
2. Las variables de temperatura se vinculan a los motores, las de voltaje a los tableros y las de presión al sistema neumático/hidráulico.
3. Si `nombre_componente` es nulo, la variable opera como global para todos los componentes de dicho `TipoEquipo`.
4. Al sincronizar un componente, las variables que ya no correspondan a su nombre son desactivadas de forma segura.
