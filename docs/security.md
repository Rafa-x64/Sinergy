# Políticas de Seguridad — Sinergy

Este documento describe las prácticas, configuraciones y reglas de seguridad implementadas en el sistema Sinergy. Todas las nuevas funcionalidades deben adherirse a estas pautas.

---

## 1. Autenticación y Autorización

### 1.1 JSON Web Tokens (JWT) — Implementación Actual

El sistema usa una estrategia de doble token:

| Token | Vida útil | Transporte | Almacenamiento |
|-------|-----------|------------|----------------|
| **Access Token** | 15 minutos | Header `Authorization: Bearer <token>` | Memoria del cliente (no localStorage) |
| **Refresh Token** | 7 días | HttpOnly Cookie (`refreshToken`) | Cookie del navegador |

**Archivos clave:**
- `apps/backend/src/infrastructure/security/jwt.ts` — firma y verificación
- `apps/backend/src/application/auth/IniciarSesionUseCase.ts` — emisión de tokens tras login exitoso
- `apps/backend/src/core/middlewares/autenticar.ts` — middleware `validarJWT`
- `apps/backend/src/core/middlewares/refreshToken.ts` — endpoint de renovación

**Variables de entorno requeridas:**
```
JWT_ACCESS_SECRET=<string aleatorio, mínimo 64 chars>
JWT_REFRESH_SECRET=<string aleatorio distinto, mínimo 64 chars>
```

Generar en producción con:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Seguridad de la HttpOnly Cookie:**
```
HttpOnly: true   → no accesible desde JavaScript (previene XSS)
Secure: true     → solo HTTPS (activado en NODE_ENV=production)
SameSite: Strict → previene CSRF
MaxAge: 7 días
```

**Por qué no localStorage para el Access Token:**
Guardar el access token en localStorage lo expone a cualquier XSS. Al mantenerlo solo en memoria de la aplicación, se anula ese vector de ataque. El costo es que se pierde al recargar la página, lo que se compensa con el refresh token en cookie.

### 1.2 Flujo de Autenticación

```
POST /api/auth/login
  → Valida schema Zod
  → IniciarSesionUseCase verifica credenciales
  → Consulta roles del usuario
  → Emite accessToken (body) + refreshToken (HttpOnly Cookie)

GET /api/auth/* (rutas protegidas)
  → Middleware validarJWT extrae Bearer token del header
  → Verifica firma y expiración
  → Adjunta TokenPayload a req.usuario

POST /api/auth/refresh
  → Lee cookie refreshToken
  → Verifica firma y expiración
  → Re-consulta usuario y roles (por si cambiaron)
  → Emite nuevo accessToken

POST /api/auth/logout
  → Limpia cookie refreshToken con clearCookie
```

### 1.3 Protección contra User Enumeration

El endpoint de login devuelve el mismo mensaje `"Credenciales inválidas"` tanto si el email no existe como si la contraseña es incorrecta. Esto impide que un atacante deduzca si un email está registrado.

### 1.4 Control Basado en Roles (RBAC) y Middlewares

- **Middlewares Backend:**
  - `apps/backend/src/core/middlewares/autorizarRol.ts`: Factory `autorizarRol(roles: string[])` que valida si el usuario autenticado posee al menos uno de los roles requeridos. Si no lo tiene, responde `HTTP 403 Forbidden` (`"Acceso denegado: rol no autorizado"`).
  - `apps/backend/src/core/middlewares/autorizarRoles.ts`: Middleware especializado para soporte multi-rol granular.
- **Roles principales en sistema**: `ADMINISTRADOR`, `SUPERVISOR`, `TECNICO`, `PLANIFICADOR`, `AUDITOR`.
- **Frontend Guards**:
  - `authStore.tieneRol(rol)` y `authStore.esAdmin` evalúan los roles desencriptados del Access Token para condicionalmente renderizar botones de acción (crear, editar, eliminar) y elementos del menú.
  - `router.beforeEach` en `router.ts` valida `meta.roles` en cada transición de ruta.

### 1.5 Control de Acceso por Planta (PBAC — Plant-Based Access Control)

- **Middleware `autorizarPlanta.ts`**:
  - Inyecta `req.plantaId` en cada petición autenticada basándose en `req.usuario.plantaId`.
  - **Bypass de Administrador**: Si el usuario cuenta con el rol `ADMINISTRADOR`, `req.plantaId` permanece `undefined` (o permite consultar libremente cualquier planta solicitada).
  - **Aislamiento Multi-Tenant de Planta**: Para roles operativos (`SUPERVISOR`, `TECNICO`), todos los servicios de negocio (`equipos`, `ubicaciones`, `plantas`, `inspecciones`, `variables-críticas`) fuerzan las cláusulas `where: { plantaId }` o `where: { equipo: { ubicacion: { plantaId } } }`.
  - Imposibilita la lectura o escritura cruzada entre plantas desde el frontend o clientes API externos.

---

## 2. Validación y Sanitización de Datos

Toda entrada al backend se trata como potencialmente maliciosa.

### 2.1 Validaciones Limpias y Nativas (sin librerías externas)

Las peticiones entrantes se validan directamente en la capa de controladores usando validaciones nativas de JavaScript/TypeScript:

- Comprobaciones explícitas de tipos (`typeof field === 'string'`)
- Verificación de campos requeridos y strings vacíos (`.trim()`)
- Normalización automática de correos (`.trim().toLowerCase()`)
- Validación de formato de correo electrónico vía expresión regular
- Validación de longitud mínima de contraseñas (mínimo 6 caracteres)

**Errores de validación retornan HTTP 400 Bad Request** con mensajes directos y amigables. No se exponen errores internos ni stack traces.

### 2.2 Protección contra Inyección SQL

Prisma parametriza todas las consultas automáticamente. **Regla:** nunca usar `$queryRawUnsafe` con datos del usuario.

---

## 3. Gestión de Errores

- **`AppError`** — errores operacionales conocidos (4xx). Incluyen `statusCode` e `isOperational: true`.
- **`errorHandler.ts`** — handler global en Express. Solo expone el `stack` en errores 5xx durante desarrollo.
- **Regla:** ningún `catch` puede quedar silencioso. Todo error capturado debe pasarse a `next(error)` o lanzarse como `AppError`.

---

## 4. Criptografía y Contraseñas

- Contraseñas encriptadas con **bcrypt**, `SALT_ROUNDS = 12`.
- **Verificación Híbrida y Auto-Migración Transparente**: Se detecta dinámicamente mediante regex (`/^\$2[ayb]\$.{56}$/`) si la contraseña almacenada posee el formato bcrypt. Si la contraseña fue insertada en texto plano (p. ej. scripts directos de prueba), se compara por texto plano y, tras un login exitoso, se re-encripta automáticamente con bcrypt actualizando el hash en la base de datos.
- El campo `passwordHash` nunca se retorna en las queries públicas (uso de `omit: { passwordHash: true }` en Prisma).
- **Regla prohibida:** transmitir contraseñas en logs o mantenerlas en texto plano de forma permanente.

---

## 5. Cabeceras HTTP y Política de CORS

- **`helmet`**: Configura cabeceras de seguridad (`crossOriginResourcePolicy: { policy: 'cross-origin' }`, HSTS, X-Content-Type-Options, X-Frame-Options) permitiendo recursos cruzados controlados.
- **`cors`** (`apps/backend/src/core/security/cors.ts`):
  - **Desarrollo (`NODE_ENV !== 'production'`):** Permite automáticamente `localhost`, `127.0.0.1` y redes privadas locales (LAN: `192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) en cualquier puerto para pruebas multi-dispositivo y móviles sin reconfiguraciones manuales.
  - **Producción:** Valida estrictamente contra la lista blanca definida en `process.env.ALLOWED_ORIGINS` (separada por comas) y solicitudes internas del mismo origen o proxy inverso.
  - Soporte de **`credentials: true`** para el intercambio seguro de la cookie HttpOnly de refresh token.
- **Socket.io WebSockets:** Comparte la misma función validadora de orígenes `esOrigenPermitido` para asegurar sincronía entre HTTP y WebSockets.
- **`cookieParser`**: Habilita lectura y parsing seguro de la cookie HttpOnly `refreshToken`.

---

## 6. Seguridad Pendiente (Backlog)

| Item | Prioridad | Estado | Descripción |
|------|-----------|--------|-------------|
| Middleware de roles | Alta | ✅ Implementado | Guards `autorizarRol(roles[])` y `autorizarPlanta` activos en rutas backend |
| Rate limiting | Alta | Pendiente | `express-rate-limit`: 5 intentos/15 min en `/api/auth/login` |
| Logs estructurados | Media | Pendiente | Winston/Pino para registrar eventos de seguridad |
| Rotación de refresh token | Media | Pendiente | Emitir nuevo refresh token en cada `/refresh` e invalidar el anterior |
| `GET /api/auth/me` | Baja | Pendiente | Endpoint para obtener perfil completo del usuario autenticado |
