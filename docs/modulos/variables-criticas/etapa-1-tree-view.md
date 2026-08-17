# Documentación Técnica - Etapa 1: Estructura del Tree View (Variables Críticas)

## 1. Descripción General
Implementación de la navegación jerárquica para el módulo de Variables Críticas. Permite a los usuarios navegar por la estructura operativa de la planta (`Planta` -> `Ubicación Técnica` -> `Línea` -> `Equipo` -> `Componente`) e inspeccionar de forma reactiva las variables asociadas a cualquier componente seleccionado.

---

## 2. Contrato de API (Backend)

### `GET /api/variables-criticas/jerarquia`
- **Autenticación:** Requiere Bearer JWT (`validarJWT`).
- **Respuesta:**
```json
{
  "status": "ok",
  "message": "Árbol jerárquico obtenido correctamente",
  "data": [
    {
      "id": 1,
      "codigo": "PL-01",
      "nombre": "Planta Principal",
      "ubicacionesTecnicas": [
        {
          "id": 1,
          "codigo": "UB-01",
          "nombre": "Área de Extrusión",
          "plantaId": 1,
          "lineas": [
            {
              "id": 1,
              "codigo": "LIN-01",
              "nombre": "Línea 1 PVC",
              "ubicacionTecnicaId": 1,
              "equipos": [
                {
                  "id": 1,
                  "codigo": "EQ-01",
                  "nombre": "Extrusora Principal",
                  "lineaId": 1,
                  "tipoEquipoId": 1,
                  "tipoEquipo": { "id": 1, "nombre": "Extrusor" },
                  "componentes": [
                    {
                      "id": 1,
                      "nombre": "Husillo Principal",
                      "descripcion": "Zona de compresión",
                      "equipoId": 1,
                      "activo": true,
                      "ordenPosicion": 1,
                      "_count": { "variables": 3 }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### `GET /api/variables-criticas/listar?componenteId=:id&activa=true`
- **Autenticación:** Requiere Bearer JWT (`validarJWT`).
- **Respuesta:** Lista de instancias `Variable` del componente especificado con sus opciones de selección ordenadas.

---

## 3. Arquitectura Frontend

### Componentes Creados
1. **[`variables.store.ts`](file:///c:/xampp/htdocs/Sinergy/apps/frontend/src/modules/variables/variables.store.ts):** Store de Pinia con el estado global de la jerarquía, componente activo y variables.
2. **[`JerarquiaTreeView.vue`](file:///c:/xampp/htdocs/Sinergy/apps/frontend/src/modules/variables/components/JerarquiaTreeView.vue):** Árbol dinámico con soporte de búsqueda, apertura/cierre de ramas y conteos reactivos.
3. **[`DetalleVariablesPanel.vue`](file:///c:/xampp/htdocs/Sinergy/apps/frontend/src/modules/variables/components/DetalleVariablesPanel.vue):** Panel derecho con renderizado de variables, chips por tipo de evaluación y estado vacío.
4. **[`VariablesCriticasView.vue`](file:///c:/xampp/htdocs/Sinergy/apps/frontend/src/modules/variables/views/VariablesCriticasView.vue):** Vista principal registrada en el router bajo la ruta `/variables`.

---

## 4. Guía de Pruebas
1. Iniciar sesión con un usuario con rol de Administrador o Supervisor.
2. Navegar a la sección **Variables** (`/variables`) desde el menú lateral o superior.
3. Verificar que el árbol cargue automáticamente las plantas y sus niveles.
4. Usar la barra de búsqueda en el árbol para filtrar por texto.
5. Desplegar un equipo y hacer clic en un componente.
6. Verificar que el panel derecho actualice el contexto jerárquico y muestre las variables críticas asociadas.
