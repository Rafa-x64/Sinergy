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

### 1.4 Control Basado en Roles (RBAC)

- Roles definidos en tabla `Rol` del schema Prisma.
- El JWT contiene el array `roles` del usuario en el momento del login.
- Los roles se refrescan automáticamente al rotar el access token.
- **Regla:** La autorización por rol **siempre** se valida en el backend. El frontend solo usa los roles para ocultar/mostrar UI.

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

## 5. Cabeceras HTTP

- **`helmet`** configura cabeceras de seguridad (HSTS, X-Content-Type-Options, X-Frame-Options).
- **`cors`** con `credentials: true` y lista blanca de orígenes. Nunca usar `*` en producción.
- **`cookieParser`** habilita lectura de la cookie HttpOnly de refresh token.

---

## 6. Seguridad Pendiente (Backlog)

| Item | Prioridad | Descripción |
|------|-----------|-------------|
| Rate limiting | Alta | `express-rate-limit`: 5 intentos/15 min en `/api/auth/login` |
| Middleware de roles | Alta | Guard `requerirRol(roles[])` para endpoints admin |
| Logs estructurados | Media | Winston/Pino para registrar eventos de seguridad |
| Rotación de refresh token | Media | Emitir nuevo refresh token en cada `/refresh` e invalidar el anterior |
| `GET /api/auth/me` | Baja | Endpoint para obtener perfil completo del usuario autenticado |
