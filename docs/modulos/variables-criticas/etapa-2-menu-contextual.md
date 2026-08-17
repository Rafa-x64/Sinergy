# Documentación Técnica - Etapa 2: Menú Contextual en el Árbol

## 1. Descripción
En esta etapa se añade la capacidad interactiva de gestión jerárquica mediante menús contextuales por clic derecho (`@contextmenu.prevent`) directamente sobre los elementos del árbol, permitiendo a los administradores y supervisores crear, editar y eliminar nodos en tiempo real sin salir de la vista de Variables Críticas.

---

## 2. Opciones del Menú Contextual por Tipo de Nodo

```text
Planta
  └── [Click Derecho] -> 'Agregar Ubicación Técnica'
      └── Ubicación Técnica
          └── [Click Derecho] -> 'Agregar Línea'
              └── Línea
                  └── [Click Derecho] -> 'Agregar Equipo'
                      └── Equipo
                          └── [Click Derecho] -> 'Agregar Componente' | 'Editar Equipo' | 'Eliminar Equipo'
                              └── Componente
                                  └── [Click Derecho] -> 'Agregar Variable (instancia)' | 'Editar Componente' | 'Eliminar Componente' | 'Sincronizar con Plantilla'
```

---

## 3. Componentes Involucrados

1. **[`JerarquiaTreeView.vue`](file:///c:/xampp/htdocs/Sinergy/apps/frontend/src/modules/variables/components/JerarquiaTreeView.vue):**
   - Captura el evento de clic derecho y calcula las coordenadas de pantalla `[clientX, clientY]`.
   - Muestra el `v-menu` posicionado dinámicamente.
   - Emite los eventos de acción hacia los diálogos modales.
2. **[`DialogosJerarquia.vue`](file:///c:/xampp/htdocs/Sinergy/apps/frontend/src/modules/variables/components/DialogosJerarquia.vue):**
   - Agrupa los formularios de creación/edición para Ubicaciones, Líneas, Equipos, Componentes y Variables.
   - Diálogo de confirmación para borrado seguro de Equipos y Componentes.
3. **[`variables.store.ts`](file:///c:/xampp/htdocs/Sinergy/apps/frontend/src/modules/variables/variables.store.ts):**
   - Métodos asíncronos para comunicar con la API REST y ejecutar la actualización del árbol (`cargarArbolJerarquico`).

---

## 4. Guía de Pruebas
1. Acceder a `/variables`.
2. Hacer clic derecho sobre una **Planta** y seleccionar *Agregar Ubicación Técnica*. Completar el formulario y verificar que aparezca de inmediato bajo la planta.
3. Hacer clic derecho sobre una **Ubicación Técnica** y agregar una *Línea*.
4. Hacer clic derecho sobre una **Línea** y agregar un *Equipo*.
5. Hacer clic derecho sobre un **Equipo** y probar *Agregar Componente*, *Editar Equipo* y *Eliminar Equipo*.
6. Hacer clic derecho sobre un **Componente** y agregar una *Variable crítica*. Verificar que la variable se liste en el panel de detalles y el badge del árbol aumente.
