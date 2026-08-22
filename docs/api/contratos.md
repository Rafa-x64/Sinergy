# Contratos de API (API Contracts)

Este documento define la estructura oficial de las peticiones, validaciones y respuestas para los endpoints de la API de Sinergy. Se utiliza como referencia estricta para la comunicación entre Frontend (Vue 3) y Backend (Express + TypeScript).

---

## Índice de Navegación

- [Formato Estándar de Respuestas (`ResponseDTO`)](#formato-estándar-de-respuestas-responsedto)
- [0. Diagnóstico y Salud del Servidor](#0-diagnóstico-y-salud-del-servidor)
- [1. Módulo de Autenticación (`/api/auth`)](#1-módulo-de-autenticación-apiauth)
- [2. Gestión de Usuarios (`/api/auth`)](#2-gestión-de-usuarios-apiauth)
- [3. Asignación de Roles a Usuarios (`/api/auth/roles`)](#3-asignación-de-roles-a-usuarios-apiauthroles)
- [4. Módulo de Roles del Sistema (`/api/roles`)](#4-módulo-de-roles-del-sistema-apiroles)
- [5. Módulo de Plantas (`/api/plantas`)](#5-módulo-de-plantas-apiplantas)
- [6. Módulo de Ubicaciones Técnicas (`/api/ubicaciones`)](#6-módulo-de-ubicaciones-técnicas-apiubicaciones)
- [7. Módulo de Líneas Operativas (`/api/lineas`)](#7-módulo-de-líneas-operativas-apilineas)
- [8. Módulo de Equipos y Tipos de Equipo (`/api/equipos`)](#8-módulo-de-equipos-y-tipos-de-equipo-apiequipos)
- [9. Módulo de Componentes de Equipos (`/api/componentes`)](#9-módulo-de-componentes-de-equipos-apicomponentes)
- [10. Módulo de Variables Críticas (`/api/variables-criticas`)](#10-módulo-de-variables-críticas-apivariables-criticas)
- [11. Módulo de Inspecciones (`/api/inspecciones`)](#11-módulo-de-inspecciones-apiinspecciones)

---

## Formato Estándar de Respuestas (`ResponseDTO`)

Todas las respuestas de la API de Sinergy (tanto para el módulo de Autenticación/Usuarios como para el resto de módulos de negocio) siguen de manera uniforme la estructura `ResponseDTO`:

### Petición Exitosa (2xx)
```json
{
  "status": "ok",
  "message": "Mensaje descriptivo opcional",
  "data": { ... }
}
```

### Petición Fallida (4xx, 5xx)
```json
{
  "status": "error",
  "message": "Descripción amigable del error para el usuario o desarrollador"
}
```

> [!NOTE]
> La envoltura `ResponseDTO` `{ status: 'ok' | 'error', message, data }` es el único estándar oficial de comunicación entre el Backend Express y el Frontend Vue 3. Facilita la captura en los stores de Pinia y la activación automática de notificaciones con `useToast()`.

---

## 0. Diagnóstico y Salud del Servidor

### `GET /`
Retorna metadatos del estado general de la API.
- **Acceso:** Público
- **Response (200 OK):**
  ```json
  {
    "name": "Sinergy API Backend",
    "version": "1.0",
    "status": "online",
    "healthCheck": "/api/health"
  }
  ```

### `GET /api/health`
Verifica la conectividad activa con la base de datos PostgreSQL mediante Prisma.
- **Acceso:** Público
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Sinergy Backend running",
    "db": "connected"
  }
  ```

---

## 1. Módulo de Autenticación (`/api/auth`)

### `POST /api/auth/login`
Autentica al usuario contra la base de datos (hashing bcrypt) y emite un Access Token en el body más un Refresh Token cifrado en una HttpOnly Cookie.

- **Acceso:** Público
- **Request Headers:** `Content-Type: application/json`
- **Request Body (`LoginDTO`):**
  ```json
  {
    "email": "alvarezrafaelat@gmail.com",
    "password": "rafa123"
  }
  ```

- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Sesión iniciada correctamente",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Set-Cookie (Header):**
  `refreshToken=<jwt>; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800` (7 días)

- **Respuestas de Error:**
  - `400 Bad Request`: `"El correo electrónico es requerido"` / `"El formato del correo electrónico no es válido"`.
  - `401 Unauthorized`: `"Credenciales inválidas"`.

---

### `POST /api/auth/refresh`
Renueva el Access Token utilizando la HttpOnly Cookie del Refresh Token.

- **Acceso:** Requiere Cookie `refreshToken`
- **Request Headers:** `Cookie: refreshToken=<token>`
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Respuestas de Error:**
  - `401 Unauthorized`: `"La sesión ha expirado, inicie sesión nuevamente"`.

---

### `POST /api/auth/logout`
Cierra la sesión del usuario eliminando la cookie HttpOnly de Refresh Token.

- **Acceso:** Público / Autenticado
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Sesión cerrada correctamente"
  }
  ```
- **Set-Cookie (Header):** Limpia la cookie `refreshToken`.

---

## 2. Gestión de Usuarios (`/api/auth`)

### `GET /api/auth/`
Obtiene la lista completa de todos los usuarios registrados en el sistema, ordenados por nombre de forma ascendente.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Request Headers:** `Authorization: Bearer <accessToken>`
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "data": [
      {
        "id": 4,
        "nombre": "Rafael",
        "apellido": "Alvarez",
        "email": "alvarezrafaelat@gmail.com",
        "activo": true,
        "ultimoAcceso": "2026-07-28T14:32:23.875Z",
        "creadoEn": "2026-07-28T13:39:50.698Z"
      }
    ]
  }
  ```

---

### `GET /api/auth/listar`
Obtiene la lista exclusiva de usuarios **activos** (habilitados) en el sistema.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Request Headers:** `Authorization: Bearer <accessToken>`
- **Response (200 OK):** Mismo formato que `GET /api/auth/`, filtrando únicamente `activo: true`.

---

### `POST /api/auth/crear`
Registra un nuevo usuario en la base de datos con contraseña encriptada mediante bcrypt y asignación opcional de roles.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Request Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: application/json`
- **Request Body (`CrearUsuarioDTO`):**
  ```json
  {
    "nombre": "Carlos",
    "apellido": "Mendoza",
    "email": "carlos.mendoza@sinergy.com",
    "password": "Password123!",
    "activo": true,
    "rolIds": [1]
  }
  ```

- **Response (201 Created):**
  ```json
  {
    "status": "ok",
    "message": "Usuario creado correctamente",
    "data": {
      "id": 5,
      "nombre": "Carlos",
      "apellido": "Mendoza",
      "email": "carlos.mendoza@sinergy.com",
      "activo": true,
      "rolesUsuario": [
        { "id": 10, "rolId": 1, "usuarioId": 5, "rol": { "id": 1, "nombre": "Tecnico" } }
      ],
      "creadoEn": "2026-07-28T14:35:00.000Z"
    }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: Error de validación de campos.
  - `409 Conflict`: `"Ya existe un usuario registrado con el correo carlos.mendoza@sinergy.com"`.

---

### `PATCH /api/auth/editar/:id`
Actualiza parcialmente los datos de un usuario existente.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (Número entero de usuario)
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Usuario actualizado correctamente",
    "data": {
      "id": 5,
      "nombre": "Carlos Alberto",
      "apellido": "Mendoza",
      "email": "carlos.mendoza@sinergy.com",
      "activo": false
    }
  }
  ```

---

### `DELETE /api/auth/eliminar/:id`
Deshabilita lógicamente a un usuario en el sistema (`activo = false`).

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Usuario deshabilitado correctamente",
    "data": {
      "id": 5,
      "nombre": "Carlos Alberto",
      "email": "carlos.mendoza@sinergy.com",
      "activo": false
    }
  }
  ```

---

## 3. Asignación de Roles a Usuarios (`/api/auth/roles`)

### `PATCH /api/auth/roles/:id`
Reemplaza **todos** los roles de un usuario con los IDs enviados.

- **Request Body:** `{ "rolIds": [1, 2] }`
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Roles actualizados correctamente",
    "data": {
      "id": 4,
      "nombre": "Rafael",
      "rolesUsuario": [
        { "rol": { "id": 1, "nombre": "Administrador" } },
        { "rol": { "id": 2, "nombre": "Supervisor" } }
      ]
    }
  }
  ```

---

### `POST /api/auth/roles/:id/:rolId`
Agrega un **único** rol al usuario (idempotente).

- **Response (200 OK):** Usuario con sus roles actualizados (`status: "ok"`).

---

### `DELETE /api/auth/roles/:id/:rolId`
Quita un **único** rol del usuario.

- **Response (200 OK):** Usuario con sus roles actualizados (`status: "ok"`).

---

## 4. Módulo de Roles del Sistema (`/api/roles`)

### `GET /api/roles/`
Lista todos los roles disponibles.

- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "data": [
      { "id": 1, "nombre": "Administrador", "descripcion": "Acceso total al sistema" },
      { "id": 2, "nombre": "Supervisor",    "descripcion": null },
      { "id": 3, "nombre": "Tecnico",       "descripcion": null }
    ]
  }
  ```

---

### `POST /api/roles/crear`
Crea un nuevo rol en el catálogo.

- **Response (201 Created):**
  ```json
  {
    "status": "ok",
    "message": "Rol creado correctamente",
    "data": { "id": 4, "nombre": "Tecnico", "descripcion": "Responsable de inspecciones en campo" }
  }
  ```

---

### `PATCH /api/roles/editar/:id`
Actualiza nombre y/o descripción de un rol existente.

- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Rol actualizado correctamente",
    "data": { "id": 2, "nombre": "Jefe De Planta", "descripcion": null }
  }
  ```

---

### `DELETE /api/roles/eliminar/:id`
Elimina un rol del catálogo.

- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Rol \"Administrador\" eliminado correctamente"
  }
  ```
- **Respuestas de Error:**
  - `400`: `"El ID proporcionado no es válido"`.
  - `404`: `"El rol con ID 99 no existe"`.

---

## 5. Módulo de Plantas (`/api/plantas`)

Gestión CRUD de plantas industriales.

### `GET /api/plantas/listar`
Obtiene la lista completa de plantas registradas.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "listado de plantas",
    "data": [
      {
        "id": 1,
        "codigo": "1000",
        "nombre": "Planta San Félix",
        "activa": true,
        "creadoEn": "2026-07-28T14:00:00.000Z",
        "actualizadoEn": "2026-07-28T14:00:00.000Z"
      }
    ]
  }
  ```
- **Respuestas de Error:**
  - `404 Not Found`: `"no hay plantas registradas"`.

---

### `POST /api/plantas/crear`
Registra una nueva planta industrial.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Request Body (`RegistrarPlantaDTO`):**
  ```json
  {
    "codigo": "1000",
    "nombre": "Planta San Félix",
    "activa": true
  }
  ```
  *Validaciones:*
  - `codigo`: Requerido, máximo 50 caracteres, formato validado por `FORMATO_CODIGO_PLANTA` (letras, números y guiones). Normalizado a mayúsculas.
  - `nombre`: Requerido, máximo 255 caracteres. Capitalizado automáticamente.
  - `activa`: Booleano opcional (por defecto `true`).

- **Response (201 Created):**
  ```json
  {
    "status": "ok",
    "message": "Planta registrada correctamente",
    "data": { "id": 1, "codigo": "1000", "nombre": "Planta San Félix", "activa": true }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: `"El código de la planta es inválido..."` / `"El nombre no puede superar los 255 caracteres"`.
  - `409 Conflict`: `"Ya existe una planta con ese código"` o `"nombre"`.

---

### `PATCH /api/plantas/editar/:id`
Actualiza parcialmente los datos de una planta existente.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (Número entero de planta)
- **Request Body (`EditarPlantaDTO`):**
  ```json
  {
    "nombre": "Planta San Félix Modificada",
    "activa": false
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Planta actualizada correctamente",
    "data": { "id": 1, "codigo": "1000", "nombre": "Planta San Félix Modificada", "activa": false }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: `"El ID proporcionado debe ser un número válido"` / `"Debe proporcionar al menos un campo para actualizar"`.
  - `404 Not Found`: `"La planta con ID 99 no existe"`.
  - `409 Conflict`: `"Ya existe otra planta registrada con ese código o nombre"`.

---

### `DELETE /api/plantas/eliminar/:id`
Elimina una planta industrial por su ID.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (Número entero de planta)
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Planta eliminada correctamente",
    "data": { "id": 1, "codigo": "1000", "nombre": "Planta San Félix" }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: `"El ID proporcionado debe ser un número válido"`.
  - `404 Not Found`: `"La planta con ID 99 no existe"`.
  - `409 Conflict`: `"No se puede eliminar la planta porque tiene líneas o ubicaciones técnicas asociadas..."`.

---

## 6. Módulo de Ubicaciones Técnicas (`/api/ubicaciones`)

Gestión de ubicaciones técnicas asociadas a plantas industriales.

### `GET /api/ubicaciones/listar`
Obtiene la lista de ubicaciones técnicas. Admite filtrado opcional por planta.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Query Parameters:** `plantaId` (Opcional, número entero)
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Lista de ubicaciones técnicas obtenida correctamente",
    "data": [
      {
        "id": 1,
        "codigo": "1000-EXT",
        "nombre": "Área De Extrusión",
        "descripcion": "Zona principal de extrusión",
        "plantaId": 1,
        "planta": { "id": 1, "nombre": "Planta San Félix" }
      }
    ]
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: `"El parámetro de filtrado plantaId debe ser un número válido"`.
  - `404 Not Found`: `"No se encontraron ubicaciones técnicas para la planta con ID 99"` / `"No hay ubicaciones técnicas registradas"`.

---

### `POST /api/ubicaciones/crear`
Registra una nueva ubicación técnica asociada a una planta.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Request Body (`RegistrarUbicacionDTO`):**
  ```json
  {
    "codigo": "1000-EXT",
    "nombre": "Área de Extrusión",
    "descripcion": "Zona principal de extrusión",
    "plantaId": 1
  }
  ```
  *Validaciones:*
  - `codigo`: Requerido, formato de patrón `REGEX_CODIGO_UBICACION` (`[PLANTA]-[UBICACION]`).
  - `nombre`: Requerido, máximo 255 caracteres.
  - `descripcion`: Texto opcional.
  - `plantaId`: Número entero requerido (debe existir en la base de datos).

- **Response (201 Created):**
  ```json
  {
    "status": "ok",
    "message": "Ubicación técnica registrada correctamente",
    "data": { "id": 1, "codigo": "1000-EXT", "nombre": "Área De Extrusión", "plantaId": 1 }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: Error de formato de código o campos requeridos.
  - `404 Not Found`: `"La planta con ID 99 no existe"`.
  - `409 Conflict`: `"Ya existe una ubicación registrada con ese código o nombre"`.

---

### `PATCH /api/ubicaciones/editar/:id`
Actualiza una ubicación técnica existente.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (ID numérico de la ubicación)
- **Request Body (`EditarUbicacionDTO`):** `codigo`, `nombre`, `descripcion`, `plantaId`.
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Ubicación actualizada correctamente",
    "data": { "id": 1, "nombre": "Extrusión Modificada" }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: Parámetros o cuerpo inválidos.
  - `404 Not Found`: `"La ubicación técnica con ID 99 no existe"`.
  - `409 Conflict`: `"Ya existe otra ubicación registrada con ese código o nombre"`.

---

### `DELETE /api/ubicaciones/eliminar/:id`
Elimina una ubicación técnica.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (ID de la ubicación)
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Ubicación técnica eliminada correctamente",
    "data": { "id": 1, "codigo": "1000-EXT" }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: `"El ID proporcionado debe ser un número válido"`.
  - `404 Not Found`: `"La ubicación técnica con ID 99 no existe"`.
  - `409 Conflict`: `"No se puede eliminar esta ubicación técnica porque tiene registros o equipos dependientes asociados."`.

---

## 7. Módulo de Líneas Operativas (`/api/lineas`)

Gestión de líneas de producción vinculadas a ubicaciones técnicas.

### `GET /api/lineas/listar`
Obtiene las líneas operativas. Soporta filtros opcionales por ubicación técnica y estado activo.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Query Parameters:**
  - `ubicacionTecnicaId`: ID numérico opcional.
  - `activa`: `"true"` | `"false"` opcional.
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Lista de líneas operativas obtenida correctamente",
    "data": [
      {
        "id": 1,
        "codigo": "1000-EXT-SAUE-CP01",
        "nombre": "Línea CP01",
        "activa": true,
        "ubicacionTecnicaId": 1
      }
    ]
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: `"El parámetro Id de ubicacion tecnica debe ser un número válido"` / `"El parámetro activa debe ser \"true\" o \"false\""`.
  - `404 Not Found`: `"No se encontraron líneas operativas que coincidan con los criterios"`.

---

### `POST /api/lineas/crear`
Registra una nueva línea operativa.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Request Body (`RegistrarLineaDTO`):**
  ```json
  {
    "codigo": "1000-EXT-SAUE-CP01",
    "nombre": "Línea CP01",
    "ubicacionTecnicaId": 1
  }
  ```
  *Validaciones:*
  - `codigo`: Formato estricto `[PLANTA]-[UBICACION]-[LINEA]` (ej: `1000-EXT-SAUE-CP01`).
  - `nombre`: Requerido, máximo 255 caracteres.
  - `ubicacionTecnicaId`: Requerido, ID numérico existente.

- **Response (201 Created):**
  ```json
  {
    "status": "ok",
    "message": "Línea registrada correctamente",
    "data": { "id": 1, "codigo": "1000-EXT-SAUE-CP01", "nombre": "Línea CP01", "ubicacionTecnicaId": 1 }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: Formato de código o datos inválidos.
  - `404 Not Found`: `"La ubicación técnica con ID 99 no existe"`.
  - `409 Conflict`: `"Ya existe una línea registrada con ese código en la ubicación técnica seleccionada"`.

---

### `PATCH /api/lineas/editar/:id`
Actualiza los datos de una línea operativa.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (ID de la línea)
- **Request Body (`EditarLineaDTO`):** `codigo`, `nombre`, `ubicacionTecnicaId`, `activa`.
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Línea actualizada correctamente",
    "data": { "id": 1, "nombre": "Línea CP01 Modificada" }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request` / `404 Not Found` / `409 Conflict`.

---

### `DELETE /api/lineas/eliminar/:id`
Desactiva lógicamente una línea operativa.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (ID de la línea)
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Línea operativa desactivada correctamente",
    "data": { "id": 1, "activa": false }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: `"El ID de la línea debe ser un número válido"`.
  - `404 Not Found`: `"La línea con ID 99 no existe"`.

---

## 8. Módulo de Equipos y Tipos de Equipo (`/api/equipos`)

Gestión de catálogo de tipos de equipo y registro centralizado de equipos industriales.

### `GET /api/equipos/listar`
Lista los equipos registrados con soporte a múltiples filtros dinámicos.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Query Parameters:**
  - `lineaId`: ID numérico opcional.
  - `tipoEquipoId`: ID numérico opcional.
  - `estadoOperativo`: Enum (`OPERATIVO`, `MANTENIMIENTO`, `FUERA_DE_SERVICIO`).
  - `activo`: `"true"` | `"false"`.
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Lista de equipos obtenida correctamente",
    "data": [
      {
        "id": 1,
        "codigo": "EQ-001",
        "nombre": "Motor Principal",
        "serial": "SN-98765",
        "marca": "Siemens",
        "modelo": "1LA7096",
        "estadoOperativo": "OPERATIVO",
        "tipoEquipo": { "id": 1, "nombre": "Motor Eléctrico" },
        "linea": { "id": 1, "nombre": "Línea CP01" }
      }
    ]
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: Parámetros de query inválidos.
  - `404 Not Found`: `"No se encontraron equipos que coincidan con los criterios de búsqueda"`.

---

### `POST /api/equipos/crear`
Registra un nuevo equipo industrial.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Request Body (`RegistrarEquipoDTO`):**
  ```json
  {
    "codigo": "EQ-001",
    "nombre": "Motor Principal",
    "tipoEquipoId": 1,
    "lineaId": 1,
    "serial": "SN-98765",
    "marca": "Siemens",
    "modelo": "1LA7096",
    "estadoOperativo": "OPERATIVO",
    "observacion": "Equipo principal de impulsión"
  }
  ```
  *Validaciones:*
  - `codigo`: Requerido, máximo 100 caracteres.
  - `nombre`: Requerido, máximo 255 caracteres.
  - `tipoEquipoId`: Requerido, ID de tipo de equipo existente.
  - `lineaId`: ID opcional de línea existente.
  - `estadoOperativo`: Enum opcional (`OPERATIVO`, `MANTENIMIENTO`, `FUERA_DE_SERVICIO`). Por defecto `OPERATIVO`.

- **Response (201 Created):**
  ```json
  {
    "status": "ok",
    "message": "Equipo registrado correctamente",
    "data": { "id": 1, "codigo": "EQ-001", "nombre": "Motor Principal" }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: Error en campos requeridos o enumerados.
  - `404 Not Found`: Tipo de equipo o línea no encontrada.
  - `409 Conflict`: `"Ya existe un equipo registrado con ese código"`.

---

### `PATCH /api/equipos/editar/:id`
Actualiza parcialmente los datos de un equipo.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (ID del equipo)
- **Request Body (`EditarEquipoDTO`):** Campos opcionales a modificar.
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Equipo actualizado correctamente",
    "data": { "id": 1, "nombre": "Motor Principal Modificado" }
  }
  ```

---

### `DELETE /api/equipos/eliminar/:id`
Desactiva o elimina un equipo.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (ID del equipo)
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Equipo deshabilitado correctamente",
    "data": { "id": 1, "activo": false }
  }
  ```

---

### `GET /api/equipos/tipo/listar`
Obtiene el catálogo de tipos de equipo.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Lista de tipos de equipos obtenida correctamente",
    "data": [
      { "id": 1, "nombre": "Motor Eléctrico", "descripcion": "Motores trifásicos" }
    ]
  }
  ```

---

### `POST /api/equipos/tipo/crear`
Registra un tipo de equipo en el catálogo.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Request Body (`RegistrarTipoDTO`):**
  ```json
  {
    "nombre": "Motor Eléctrico",
    "descripcion": "Motores trifásicos"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "ok",
    "message": "Tipo de equipo registrado correctamente",
    "data": { "id": 1, "nombre": "Motor Eléctrico", "descripcion": "Motores trifásicos" }
  }
  ```

---

### `PATCH /api/equipos/tipo/editar/:id`
Edita un tipo de equipo existente.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (ID del tipo)

---

### `DELETE /api/equipos/tipo/eliminar/:id`
Elimina un tipo de equipo.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (ID del tipo)
- **Respuestas de Error:**
  - `409 Conflict`: Si existen equipos asociados a este tipo.

---

## 9. Módulo de Componentes de Equipos (`/api/componentes`)

Gestión de componentes y partes appartenecientes a equipos industriales.

### `GET /api/componentes/listar`
Obtiene los componentes registrados con filtros dinámicos.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Query Parameters:**
  - `equipoId`: ID numérico del equipo padre.
  - `activo`: `"true"` | `"false"`.
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Lista de componentes obtenida correctamente",
    "data": [
      {
        "id": 1,
        "equipoId": 1,
        "nombre": "Rodamiento Frontal",
        "descripcion": "SKF 6205",
        "ordenPosicion": 1,
        "activo": true
      }
    ]
  }
  ```

---

### `POST /api/componentes/crear`
Registra un nuevo componente asociado a un equipo.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **Request Body (`RegistrarComponenteDTO`):**
  ```json
  {
    "equipoId": 1,
    "nombre": "Rodamiento Frontal",
    "descripcion": "SKF 6205",
    "ordenPosicion": 1
  }
  ```
  *Validaciones:*
  - `equipoId`: Requerido, ID numérico.
  - `nombre`: Requerido, máximo 255 caracteres.
  - `ordenPosicion`: Número entero opcional (por defecto `0`).

- **Response (201 Created):**
  ```json
  {
    "status": "ok",
    "message": "Componente registrado correctamente",
    "data": { "id": 1, "equipoId": 1, "nombre": "Rodamiento Frontal", "ordenPosicion": 1 }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: Validación de tipos.
  - `404 Not Found`: `"El equipo especificado no existe"`.

---

### `PATCH /api/componentes/editar/:id`
Actualiza parcialmente un componente.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (ID del componente)
- **Request Body (`EditarComponenteDTO`):** `equipoId`, `nombre`, `descripcion`, `ordenPosicion`, `activo`.

---

### `DELETE /api/componentes/eliminar/:id`
Desactiva lógicamente un componente.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (ID del componente)
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Componente desactivado correctamente",
    "data": { "id": 1, "activo": false }
  }
  ```

---

## 10. Módulo de Variables Críticas (`/api/variables-criticas`)

Gestiona el catálogo de variables evaluables (`Variable`) vinculadas a un componente. Soporta cuatro tipos de evaluación: `NUMERICO_ENTERO`, `NUMERICO_DECIMAL`, `TEMPERATURA`, `SELECCION`. El borrado es lógico (`activa = false`).

### `POST /api/variables-criticas/crear`
Registra una nueva variable crítica asociada a un componente.

- **Acceso:** Protegido
- **Request Body (`RegistrarVariableDTO`):**
  ```json
  {
    "componenteId": 1,
    "nombre": "Temperatura de operación",
    "tipoEvaluacion": "TEMPERATURA",
    "unidad": "°C",
    "valorMinimo": 15,
    "valorMaximo": 80,
    "ordenPosicion": 1
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "ok",
    "message": "Variable crítica registrada correctamente",
    "data": { "id": 1, "nombre": "Temperatura De Operación", "tipoEvaluacion": "TEMPERATURA" }
  }
  ```
- **Errores posibles:** `400` campo inválido, `404` componente no existe, `401` no autenticado.

---

### `GET /api/variables-criticas/listar`
Retorna variables críticas filtradas. Por defecto devuelve solo las activas.

- **Acceso:** Protegido
- **Query Parameters:** `componenteId` (number), `tipoEvaluacion` (enum), `activo` (`"true"` | `"false"`)
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Lista de variables críticas obtenida correctamente",
    "data": [ { "id": 1, "nombre": "...", "componente": { "id": 1, "nombre": "..." }, "opcionesSeleccion": [] } ]
  }
  ```
- **Errores posibles:** `400` parámetro inválido, `404` sin resultados.

---

### `PATCH /api/variables-criticas/editar/:id`
Actualiza campos parciales de una variable crítica.

- **Acceso:** Protegido
- **URL Parameters:** `id` (ID de la variable)
- **Request Body (`EditarVariableDTO`):** `nombre`, `tipoEvaluacion`, `unidad`, `valorMinimo`, `valorMaximo`, `ordenPosicion`, `activa`.
- **Errores posibles:** `400` campo inválido, `404` variable no existe.

---

### `DELETE /api/variables-criticas/eliminar/:id`
Desactiva lógicamente una variable crítica.

- **Acceso:** Protegido
- **URL Parameters:** `id` (ID de la variable)
- **Response (200 OK):**
  ```json
  { "status": "ok", "message": "Variable crítica eliminada correctamente", "data": { "id": 1, "activa": false } }
  ```
- **Errores posibles:** `400` ID inválido, `404` variable no existe o ya inactiva.

---

## 11. Módulo de Inspecciones (`/api/inspecciones`)

Registra y gestiona inspecciones técnicas por línea de producción o equipo individual. Los `id` de `Inspeccion` e `InspeccionDetalle` son `BigInt` y se serializan como **strings** en todas las respuestas JSON para compatibilidad con JavaScript.

> [!IMPORTANT]
> Los IDs de inspección (`id`) son strings en el JSON de respuesta aunque en la base de datos sean `BigInt`. El frontend debe tratar estos campos como strings.

### `GET /api/inspecciones/arbol-linea/:lineaId`
Obtiene la jerarquía completa de equipos, componentes y variables activas asociadas a una línea para renderizar el formulario dinámico de captura.

- **Acceso:** Protegido (`validarJWT`)
- **URL Parameters:** `lineaId` (número entero)
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Árbol de inspección obtenido correctamente",
    "data": {
      "id": 5,
      "codigo": "LIN-EXT-01",
      "nombre": "Línea de Extrusión 01",
      "ubicacionTecnica": { "id": 2, "codigo": "1000-EXT", "nombre": "Área de Extrusión" },
      "equipos": [
        {
          "id": 12,
          "codigo": "1000EXT00012",
          "nombre": "Extrusora Principal",
          "componentes": [
            {
              "id": 34,
              "nombre": "Calefacción",
              "variables": [
                {
                  "id": 101,
                  "nombre": "Temperatura Zona 1",
                  "tipoEvaluacion": "TEMPERATURA",
                  "unidad": "°C",
                  "valorMinimo": "160.00",
                  "valorMaximo": "190.00",
                  "opcionesSeleccion": []
                }
              ]
            }
          ]
        }
      ]
    }
  }
  ```
- **Errores posibles:** `400` ID inválido, `404` línea no encontrada.

---

### `POST /api/inspecciones/crear`
Registra una inspección completa (por línea o por equipo) con todos sus detalles de variables en una sola transacción atómica.

- **Acceso:** Protegido (`validarJWT`)
- **Nota:** `elaboradoPorId` se inyecta automáticamente desde el token JWT (`req.usuario.id`).
- **Request Body (`RegistrarInspeccionDTO`):**
  ```json
  {
    "codigoInspeccion": "INSP-2026-001",
    "tipoInspeccion": "VARIABLES_CRITICAS",
    "lineaId": 5,
    "equipoId": null,
    "estadoInspeccion": "PENDIENTE",
    "origenDatos": "ONLINE",
    "observacionesGenerales": "Inspección rutinaria diaria",
    "detalles": [
      {
        "variableId": 101,
        "valorNumerico": 172.5,
        "valorSeleccion": null,
        "observaciones": null,
        "estadoComponente": true
      }
    ]
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "ok",
    "message": "Inspección registrada correctamente",
    "data": { "id": "1", "codigoInspeccion": "INSP-2026-001", "detalles": [ { "id": "1", "variableId": 101, "valorNumerico": "172.5" } ] }
  }
  ```
- **Errores posibles:** `400` campo inválido o detalles vacíos, `401` no autenticado, `404` línea, equipo o variable no existe, `409` código duplicado.

---

### `GET /api/inspecciones/equipos-elegibles`
Obtiene la jerarquía Data-Driven de equipos en estado **OPERATIVO** con sus componentes y variables activas para la captura guiada en el Form Wizard.

- **Acceso:** Protegido (`validarJWT`)
- **Query Parameters:** `plantaId` (number, obligatorio), `alcance` (`POR_LINEA` | `POR_TIPO_EQUIPO` | `POR_EQUIPO`), `referenciaId` (number, opcional)
- **Response (200 OK):** Array de equipos operativos filtrados con sus componentes y variables.

---

### `POST /api/inspecciones`
Registra una inspección técnica elaborada por el técnico en estado `PENDIENTE` y emite notificaciones a los supervisores.

- **Acceso:** Protegido (`validarJWT`)
- **Request Body (`CrearInspeccionDTO`):**
  ```json
  {
    "plantaId": 1,
    "alcance": "POR_LINEA",
    "ubicacionTecnicaId": 2,
    "observacionesGenerales": "Sin novedad durante recorrido",
    "detalles": [
      {
        "variableId": 10,
        "valorNumerico": 45.5,
        "observaciones": null,
        "estadoComponente": true
      }
    ]
  }
  ```
- **Response (201 Created):** `{ "status": "ok", "message": "Inspección INSP-PL1-20260822-0001 registrada correctamente", "data": { ... } }`

---

### `GET /api/inspecciones/pendientes`
Retorna la bandeja de inspecciones en estado `PENDIENTE` para revisión de supervisores.

- **Acceso:** Protegido (`validarJWT`)
- **Query Parameters:** `plantaId` (opcional)

---

### `PATCH /api/inspecciones/:id/evaluar`
Permite a un supervisor **Aprobar** o **Rechazar** una inspección pendiente. En caso de rechazo, exige `motivoRechazo`.

- **Acceso:** Protegido (`validarJWT` con rol Supervisor)
- **Request Body (`EvaluarInspeccionDTO`):**
  ```json
  {
    "estado": "RECHAZADO",
    "motivoRechazo": "Temperatura de rodamiento excesivamente alta sin observación explicativa."
  }
  ```
- **Response (200 OK):** Inspección evaluada con notificación enviada al técnico elaborador.

---

### `GET /api/inspecciones/listar`
Retorna inspecciones filtradas, ordenadas por `fechaRegistro DESC`.

- **Acceso:** Protegido (`validarJWT`)
- **Query Parameters:** `lineaId`, `equipoId`, `tipoInspeccion`, `estadoInspeccion`, `elaboradoPorId`, `fechaDesde`, `fechaHasta`.
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Lista de inspecciones obtenida correctamente",
    "data": [ { "id": "1", "codigoInspeccion": "INSP-2026-001", "estadoInspeccion": "PENDIENTE" } ]
  }
  ```

---

### `GET /api/inspecciones/buscar/:id`
Busca una inspección específica por su BigInt ID (pasado como string en la URL).

- **Acceso:** Protegido (`validarJWT`)
- **URL Parameters:** `id` (string numérico que representa el BigInt)
- **Response (200 OK):** Objeto completo de inspección con todos sus detalles.
- **Errores posibles:** `400` ID no numérico, `404` no existe.

---

### `PATCH /api/inspecciones/editar-estado/:id`
Actualiza el estado de flujo de una inspección (`BORRADOR` → `PENDIENTE` → `APROBADO` | `RECHAZADO`).

- **Acceso:** Protegido (`validarJWT`)
- **URL Parameters:** `id` (BigInt como string)
- **Request Body (`EditarEstadoInspeccionDTO`):**
  ```json
  {
    "estadoInspeccion": "APROBADO",
    "revisadoPorId": 2,
    "aprobadoPorId": 1,
    "observacionesGenerales": "Aprobado sin novedades"
  }
  ```
- **Errores posibles:** `400` estado inválido, `404` inspección no existe.

---

### `DELETE /api/inspecciones/eliminar/:id`
Elimina físicamente una inspección (solo recomendado para inspecciones en estado `BORRADOR`).

- **Acceso:** Protegido (`validarJWT`)
- **URL Parameters:** `id` (BigInt como string)
- **Response (200 OK):** Objeto de la inspección eliminada.
- **Errores posibles:** `404` inspección no existe.

---

### `GET /api/equipos/tipo/buscar/:id`
Busca un tipo de equipo específico por su ID.

- **Acceso:** Protegido
- **URL Parameters:** `id` (ID del tipo de equipo)
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Tipo de equipo encontrado",
    "data": { "id": 1, "nombre": "Montacargas", "descripcion": null }
  }
  ```
- **Errores posibles:** `400` ID inválido, `404` tipo no existe.
