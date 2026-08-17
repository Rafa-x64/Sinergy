# Documentación Técnica - Etapa 4: Gestión de Plantillas de Variables por TipoEquipo

## 1. Descripción
En esta etapa se implementa el desacoplamiento y centralización de las variables críticas a través de plantillas asociadas a cada `TipoEquipo` (ej. Chiller, Compresor, Extrusor). Esto permite definir variables estándar una única vez y sincronizarlas de manera automática o masiva hacia las instancias de los componentes.

---

## 2. Endpoints de la API

### Plantillas
- `GET /api/variables-criticas/plantillas/listar?tipoEquipoId=:id`: Lista variables de plantilla con sus opciones y conteo de instancias asociadas.
- `POST /api/variables-criticas/plantillas/crear`: Crea una nueva variable en la plantilla del tipo de equipo.
- `PATCH /api/variables-criticas/plantillas/editar/:id`: Edita una variable de plantilla existente.
- `DELETE /api/variables-criticas/plantillas/eliminar/:id`: Desactiva lógicamente la variable de plantilla.

### Sincronización
- `POST /api/variables-criticas/sincronizar/componente/:componenteId`: Sincroniza un componente con la plantilla de su tipo de equipo.
- `POST /api/variables-criticas/sincronizar/tipo-equipo/:tipoEquipoId`: Sincroniza todos los componentes de todos los equipos del tipo especificado.

---

## 3. Algoritmo de Sincronización
1. Recuperar todas las plantillas activas del `tipoEquipoId`.
2. Para cada plantilla:
   - Si el componente ya tiene una variable con ese `plantillaId` o con el mismo nombre (case-insensitive), actualiza sus datos (`nombre`, `tipoEvaluacion`, `unidad`, `valorMinimo`, `valorMaximo`, `ordenPosicion`, `activa = true`) y recrea las opciones si es de tipo `SELECCION`.
   - Si no existe, crea una nueva `Variable` con `plantillaId = plantilla.id`.
3. Para variables existentes en el componente con `plantillaId` que ya no existan en la lista activa de plantillas, las desactiva (`activa = false`).

---

## 4. Guía de Pruebas
1. Navegar a `/variables` y pulsar sobre la pestaña **"Plantillas por Tipo de Equipo"**.
2. Seleccionar un tipo de equipo (ej. *Chiller* o *Compresor*).
3. Presionar **"Nueva Variable de Plantilla"**, registrar variables (ej. *Presión de Descarga*, *Temperatura de Aceite*) y verificar que aparezcan en la tabla.
4. Volver a la pestaña **"Estructura y Variables por Componente"**, hacer clic derecho sobre un componente de ese tipo de equipo y seleccionar **"Sincronizar con Plantilla"**.
5. Verificar que las variables de la plantilla se creen automáticamente en el componente.
6. En la pestaña de plantillas, presionar **"Sincronizar Todos"** para aplicar masivamente a todos los equipos del mismo tipo.
