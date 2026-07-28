# Contratos de API (API Contracts)

Este documento define la estructura oficial de las peticiones, validaciones y respuestas para los endpoints de la API de Sinergy. Se utiliza como referencia estricta para la comunicación entre Frontend (Vue 3) y Backend (Express + TypeScript).

---

## Formato Estándar de Respuestas

Todas las respuestas de la API siguen una estructura JSON uniforme:

### Petición Exitosa (2xx)
```json
{
  "success": true,
  "message": "Mensaje descriptivo opcional",
  "data": { ... }
}
```

### Petición Fallida (4xx, 5xx)
```json
{
  "success": false,
  "error": {
    "message": "Descripción del error para el usuario o desarrollador",
    "stack": "Error: ... (únicamente en desarrollo para errores HTTP 500+)"
  }
}
```

> [!NOTE]
> En entorno de desarrollo (`NODE_ENV !== 'production'`), la propiedad `stack` solo se incluye en respuestas con código HTTP 500+. Los errores de cliente (4xx) omiten el rastreo de pila.

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
- **Request Body (Zod `loginSchema`):**
  ```json
  {
    "email": "alvarezrafaelat@gmail.com",
    "password": "rafa123"
  }
  ```
  *Validaciones:*
  - `email`: Cadena requerida, formato válido de correo electrónico. Se le aplica `.trim()` y `.toLowerCase()` automáticamente.
  - `password`: Cadena requerida.

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Sesión iniciada correctamente",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Set-Cookie (Header):**
  `refreshToken=<jwt>; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800` (7 días)

- **Respuestas de Error:**
  - `401 Unauthorized`: `"Credenciales inválidas"` (si el correo o la contraseña son incorrectos o el usuario está inactivo).
  - `422 Unprocessable Entity`: `"Datos de entrada inválidos: El formato del email no es válido"`.

---

### `POST /api/auth/refresh`
Renueva el Access Token utilizando la HttpOnly Cookie del Refresh Token.

- **Acceso:** Requiere Cookie `refreshToken`
- **Request Headers:** `Cookie: refreshToken=<token>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Respuestas de Error:**
  - `401 Unauthorized`: `"No se proporcionó refresh token"` o `"La sesión ha expirado, inicie sesión nuevamente"`.

---

### `POST /api/auth/logout`
Cierra la sesión del usuario eliminando la cookie HttpOnly de Refresh Token.

- **Acceso:** Público / Autenticado
- **Response (200 OK):**
  ```json
  {
    "success": true,
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
    "success": true,
    "data": [
      {
        "id": 4,
        "nombre": "Rafael",
        "apellido": "Alvarez",
        "email": "alvarezrafaelat@gmail.com",
        "activo": true,
        "ultimoAcceso": "2026-07-28T14:32:23.875Z",
        "creadoEn": "2026-07-28T13:39:50.698Z",
        "actualizadoEn": "2026-07-28T14:32:23.876Z"
      }
    ]
  }
  ```
- **Respuestas de Error:**
  - `401 Unauthorized`: `"No se proporcionó un token de autenticación"` o `"Token de sesión inválido"`.

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
  *Validaciones Nativas:*
  - `nombre` / `apellido`: Cadenas requeridas no vacías.
  - `email`: Formato válido de email (normalizado a minúsculas).
  - `password`: Mínimo 6 caracteres.
  - `activo`: Booleano opcional (por defecto `true`).
  - `rolIds`: Arreglo de IDs numéricos opcional.
  - `rolId`: Número entero positivo opcional (alternativa para asignar un solo rol).

- **Response (201 Created):**
  ```json
  {
    "success": true,
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
  - `409 Conflict`: `"Ya existe un usuario registrado con el correo carlos.mendoza@sinergy.com"`.
  - `422 Unprocessable Entity`: Error de validación Zod.

---

### `PATCH /api/auth/editar/:id`
Actualiza parcialmente los datos de un usuario existente.

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (Número entero de usuario)
- **Request Body (Zod `actualizarUsuarioSchema`):**
  ```json
  {
    "nombre": "Carlos Alberto",
    "activo": false
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Usuario actualizado correctamente",
    "data": {
      "id": 5,
      "nombre": "Carlos Alberto",
      "apellido": "Mendoza",
      "email": "carlos.mendoza@sinergy.com",
      "activo": false,
      "actualizadoEn": "2026-07-28T14:36:00.000Z"
    }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: `"El ID proporcionado no es válido"` o `"Debe proporcionar al menos un campo para actualizar"`.
  - `404 Not Found`: `"El usuario con el ID 999 no existe"`.

---

### `DELETE /api/auth/eliminar/:id`
Deshabilita lógicamente a un usuario en el sistema (`activo = false`).

- **Acceso:** Protegido (`Authorization: Bearer <accessToken>`)
- **URL Parameters:** `id` (Número entero de usuario)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Usuario deshabilitado correctamente",
    "data": {
      "id": 5,
      "nombre": "Carlos Alberto",
      "email": "carlos.mendoza@sinergy.com",
      "activo": false
    }
  }
  ```
- **Respuestas de Error:**
  - `400 Bad Request`: `"El ID proporcionado no es válido"`.
  - `409 Conflict`: `"El usuario con id 5 ya fue deshabilitado"`.
  - `404 Not Found`: `"Usuario con id 999 no encontrado"`.

---

## 3. Asignación de Roles a Usuarios (`/api/auth/roles`)

> [!IMPORTANT]
> Todos estos endpoints requieren `Authorization: Bearer <accessToken>`.
> Las respuestas siempre retornan el usuario con sus roles actualizados incluidos.

### `PATCH /api/auth/roles/:id`
Reemplaza **todos** los roles de un usuario con los IDs enviados. Enviar `rolIds: []` deja al usuario sin roles.

- **URL Parameters:** `id` (ID del usuario)
- **Request Body:**
  ```json
  { "rolIds": [1, 2] }
  ```
  *Validaciones:*
  - `rolIds`: Array requerido de números enteros positivos.
  - Si algún `rolId` no existe en la BD, retorna `400`.

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Roles actualizados correctamente",
    "data": {
      "id": 4,
      "nombre": "Rafael",
      "email": "alvarezrafaelat@gmail.com",
      "rolesUsuario": [
        { "rol": { "id": 1, "nombre": "Administrador" } },
        { "rol": { "id": 2, "nombre": "Supervisor" } }
      ]
    }
  }
  ```
- **Respuestas de Error:**
  - `400`: `"El campo rolIds debe ser un arreglo de IDs numéricos"` / `"Los siguientes IDs de rol no existen: 99"`.
  - `404`: `"El usuario con ID 999 no existe"`.

---

### `POST /api/auth/roles/:id/:rolId`
Agrega un **único** rol al usuario. Operación **idempotente**: si el rol ya estaba asignado no genera error.

- **URL Parameters:** `id` (ID usuario), `rolId` (ID del rol a agregar)
- **Body:** No requerido.
- **Response (200 OK):** Usuario con sus roles actualizados.
- **Respuestas de Error:**
  - `400`: `"El rol con ID 99 no existe"`.
  - `404`: `"El usuario con ID 999 no existe"`.

---

### `DELETE /api/auth/roles/:id/:rolId`
Quita un **único** rol del usuario.

- **URL Parameters:** `id` (ID usuario), `rolId` (ID del rol a quitar)
- **Response (200 OK):** Usuario con sus roles actualizados.
- **Respuestas de Error:**
  - `404`: `"El usuario 4 no tiene asignado el rol 99"`.

---

## 4. Módulo de Roles del Sistema (`/api/roles`)

Gestión CRUD del catálogo de roles disponibles en el sistema.

### `GET /api/roles/`
Lista todos los roles disponibles ordenados por nombre.

- **Acceso:** Público
- **Response (200 OK):**
  ```json
  {
    "success": true,
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

- **Acceso:** Protegido (`Bearer <accessToken>`)
- **Request Body:**
  ```json
  { "nombre": "Tecnico", "descripcion": "Responsable de inspecciones en campo" }
  ```
  *Validaciones:*
  - `nombre`: Requerido, máximo 50 caracteres. Se capitaliza automáticamente.
  - `descripcion`: Opcional, texto libre.

- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Rol creado correctamente",
    "data": { "id": 4, "nombre": "Tecnico", "descripcion": "Responsable de inspecciones en campo" }
  }
  ```
- **Respuestas de Error:**
  - `400`: `"El nombre del rol es requerido"` / `"El nombre del rol no puede superar 50 caracteres"`.
  - `409 Conflict`: `"Ya existe un rol con ese nombre"`.

---

### `PATCH /api/roles/editar/:id`
Actualiza nombre y/o descripción de un rol existente.

- **Acceso:** Protegido (`Bearer <accessToken>`)
- **URL Parameters:** `id` (ID del rol)
- **Request Body:** Cualquier combinación de `nombre` y `descripcion`.
  ```json
  { "nombre": "Jefe de Planta" }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Rol actualizado correctamente",
    "data": { "id": 2, "nombre": "Jefe De Planta", "descripcion": null }
  }
  ```
- **Respuestas de Error:**
  - `400`: Validación de campo.
  - `404`: `"El rol con ID 99 no existe"`.
  - `409`: `"Ya existe un rol con ese nombre"`.

---

### `DELETE /api/roles/eliminar/:id`
Elimina un rol del catálogo. Las asignaciones `UsuarioRol` se eliminan en cascada.

- **Acceso:** Protegido (`Bearer <accessToken>`)
- **URL Parameters:** `id` (ID del rol)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Rol \"Administrador\" eliminado correctamente"
  }
  ```
- **Respuestas de Error:**
  - `400`: `"El ID proporcionado no es válido"`.
  - `404`: `"El rol con ID 99 no existe"`.

