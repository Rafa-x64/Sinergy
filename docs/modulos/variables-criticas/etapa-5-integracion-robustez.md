# Documentación Técnica - Etapa 5: Integración y Robustez

## 1. Descripción
En esta etapa final se integran todos los subsistemas del módulo de Variables Críticas (Árbol jerárquico, Panel contextual de variables, Pestaña de plantillas por tipo de equipo y Motor de sincronización transaccional), habilitando la instanciación automática al dar de alta componentes y garantizando la robustez y consistencia de datos en todo el sistema.

---

## 2. Flujo Completo de Integración (End-to-End)

```text
1. Definición de Plantilla:
   TipoEquipo (ej. Chiller) -> Variables de Plantilla (Presión de Aceite, Temp. Evaporador)
      │
      ▼
2. Creación de Equipo y Componente:
   Equipo "Chiller 01" -> Componente "Compresor Tornillo"
      │ (Backend clona automáticamente las variables de la plantilla)
      ▼
3. Visualización y Gestión:
   Navegación en el Árbol -> Selección de Componente -> Variables activas visibles de inmediato
      │
      ▼
4. Evolución de Plantilla y Propagación:
   Modificación de Plantilla -> Sugerencia de Sincronización -> "Sincronizar Todos" -> Actualización masiva de instancias
```

---

## 3. Componentes y Servicios

1. **[`componente.service.ts`](file:///c:/xampp/htdocs/Sinergy/apps/backend/src/modules/componentes/componente.service.ts):**
   - Transacción atómica que clona las variables de la plantilla activa al registrar un nuevo componente.
2. **[`PlantillasVariablesPanel.vue`](file:///c:/xampp/htdocs/Sinergy/apps/frontend/src/modules/variables/components/PlantillasVariablesPanel.vue):**
   - Panel de administración con buscador en tiempo real, selector dinámico de `TipoEquipo` y diálogo de sugerencia de sincronización tras modificar definiciones.
3. **[`VariablesCriticasView.vue`](file:///c:/xampp/htdocs/Sinergy/apps/frontend/src/modules/variables/views/VariablesCriticasView.vue):**
   - Orquestación con `AppTabs` y comunicación bidireccional entre la jerarquía y el panel de detalle.

---

## 4. Guía de Pruebas Integrales
1. Ir a `/variables` -> Pestaña **"Plantillas por Tipo de Equipo"**.
2. Seleccionar un tipo de equipo (ej. *Chiller*) y agregar o editar una variable.
3. Al guardar, verificar que aparezca la sugerencia para sincronizar los equipos de ese tipo.
4. Volver a la pestaña **"Estructura y Variables por Componente"**.
5. Crear un nuevo equipo de tipo *Chiller* y agregarle un componente.
6. Seleccionar el componente y comprobar que las variables de la plantilla se hayan creado automáticamente.
7. Modificar cualquier variable individual desde el panel derecho y validar que conserve su estado.
