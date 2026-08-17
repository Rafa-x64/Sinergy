# Documentación Técnica - Etapa 3: Panel de Variables y Menú Contextual en Instancias

## 1. Descripción
En esta etapa se implementa la interacción completa sobre el panel derecho de variables críticas asociadas al componente seleccionado, incluyendo un menú contextual flotante por clic derecho en cada variable, la capacidad de duplicar variables, editarlas y eliminarlas, así como la incorporación del botón de creación rápida y la unificación de chips/badges en todos los niveles del árbol de navegación.

---

## 2. Acciones del Menú Contextual de Variables

```text
Fila de Variable (Panel Derecho)
  └── [Click Derecho]
        ├── 'Editar Variable' (Abre modal de edición)
        ├── 'Duplicar Variable' (Copia la configuración y crea una nueva instancia)
        ├── 'Restablecer desde Plantilla' (Visible/habilitada si plantillaId != null)
        └── 'Eliminar Variable' (Diálogo de confirmación y borrado lógico)
```

---

## 3. Badges del Árbol Jerárquico (TreeView)

| Nivel | Etiqueta del Chip | Color Vuetify |
| :--- | :--- | :--- |
| **Planta** | `Planta` | `primary` |
| **Ubicación Técnica** | `Ubicación` | `amber-darken-3` |
| **Línea** | `Línea` | `teal` |
| **Equipo** | `TipoEquipo` o `Equipo` | `deep-orange` |
| **Componente** | `Componente` | `indigo` (+ Badge con conteo) |

---

## 4. Guía de Pruebas
1. Acceder a `/variables`.
2. Verificar que cada nodo del árbol (Planta, Ubicación, Línea, Equipo y Componente) exhiba su respectivo chip de nivel.
3. Hacer clic en un componente para cargar sus variables en el panel derecho.
4. Presionar el botón **"Agregar Variable"** (en la cabecera o en el estado vacío), llenar el formulario y verificar la creación.
5. Hacer clic derecho sobre una variable:
   - Seleccionar **"Editar Variable"**, modificar datos y verificar la actualización.
   - Seleccionar **"Duplicar Variable"** y confirmar que se agregue una copia con el sufijo `(Copia)`.
   - Seleccionar **"Eliminar Variable"**, confirmar y verificar que desaparezca de la lista activa.
