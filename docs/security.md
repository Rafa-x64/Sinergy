# Políticas de Seguridad — Sinergy

Este documento describe las prácticas, configuraciones y reglas de seguridad implementadas en el sistema Sinergy, cubriendo tanto el backend como el frontend. Todas las nuevas funcionalidades deben adherirse a estas pautas.

---

## 1. Autenticación y Autorización

### 1.1 JSON Web Tokens (JWT)
- Se utiliza JWT para mantener la sesión de los usuarios de forma stateless.
- **Vida útil corta (Access Token):** Los tokens de acceso deben expirar en un tiempo corto (ej. 15-30 minutos).
- **Refresh Tokens:** Para mantener la sesión del usuario en planta sin que tenga que loguearse constantemente, se debe implementar una estrategia de Refresh Tokens almacenados en cookies seguras (HttpOnly, Secure) o rotación de tokens.
- **Secreto Fuerte:** La firma de los tokens (`JWT_SECRET`) debe ser una cadena aleatoria criptográficamente segura, guardada exclusivamente en las variables de entorno (`.env`) del servidor.

### 1.2 Control Basado en Roles (RBAC)
- Existen tres roles en el sistema: `TECNICO`, `SUPERVISOR`, `ADMINISTRADOR` (asignado al Jefe de Mantenimiento / Gerencia).
- **Backend:** Toda ruta protegida debe verificar el JWT mediante el `authMiddleware`. Las rutas sensibles deben ser validadas adicionalmente por el `roleGuard`.
- **Frontend:** Vue Router utiliza Meta Fields (`meta.roles`) para redirigir a los usuarios que intenten acceder a vistas no permitidas. Sin embargo, la seguridad real **siempre debe validarse en el backend**.

---

## 2. Protección Contra Vulnerabilidades Comunes

### 2.1 Inyección SQL
- Al utilizar **Prisma ORM** en lugar de consultas SQL crudas, el sistema está inherentemente protegido contra la gran mayoría de ataques de Inyección SQL. Prisma parametriza todas las consultas automáticamente.
- **Regla:** Nunca utilizar `$queryRawUnsafe` con datos provenientes del usuario. Si se requiere usar raw SQL, siempre usar `$queryRaw` que soporta literales parametrizados de forma segura.

### 2.2 Cross-Site Scripting (XSS)
- **Frontend:** Vue.js escapa automáticamente el HTML en la interpolación de texto (`{{ }}`).
- **Regla:** Queda estrictamente prohibido usar la directiva `v-html` con contenido generado por el usuario, como observaciones o comentarios de inspecciones. Si es absolutamente necesario, el contenido debe ser procesado por una librería de sanitización robusta como `DOMPurify` antes de renderizarse.

### 2.3 Cross-Site Request Forgery (CSRF)
- Al utilizar JWT enviado a través del header `Authorization: Bearer <token>`, el sistema es naturalmente resistente a ataques CSRF que dependen del envío automático de cookies por parte del navegador.
- Si en el futuro se migran los tokens a cookies, se deberá implementar un token anti-CSRF (`csurf` en Express).

### 2.4 Ataques de Fuerza Bruta (Rate Limiting)
- Se debe implementar `express-rate-limit` en el backend para proteger endpoints sensibles, especialmente la ruta de login (`POST /api/auth/login`).
- **Configuración recomendada:** Máximo 5 intentos fallidos por IP en una ventana de 15 minutos.

---

## 3. Validación y Sanitización de Datos

**"Secure by Default"**: Toda entrada del usuario en el frontend se considera no confiable. Toda entrada al backend se considera maliciosa.

### 3.1 Backend
- **Esquemas de Validación:** Todos los payloads entrantes (body, params, query) deben ser validados mediante una librería como `Zod` o `Joi` en la capa de interfaces (Middlewares) antes de llegar al caso de uso.
- **Tipado estricto:** Aprovechar TypeScript para garantizar que los tipos de datos en tiempo de ejecución coincidan con lo esperado por el dominio.

### 3.2 Frontend
- **Validación en tiempo real:** Uso de `VeeValidate` junto con `Yup` para validar los formularios antes de su envío, brindando feedback inmediato al usuario y reduciendo la carga en el servidor.

---

## 4. Gestión de Errores y Logs

- **Sin Fugas de Información:** En entornos de producción (`NODE_ENV === 'production'`), los mensajes de error devueltos por el servidor **nunca** deben contener stack traces, rutas internas del servidor o fragmentos de consultas a la base de datos.
- **Manejador Global:** Todos los errores del backend deben ser canalizados a través de `errorHandler.ts`, el cual se encargará de estructurar una respuesta genérica segura (ej. "Error interno del servidor") si el error no es operativo.
- **Logs:** Los errores críticos deben registrarse internamente (usando herramientas como Winston o Pino) para auditoría y debug, sin exponerlos al cliente.

---

## 5. Criptografía y Contraseñas

- **Hashing:** Las contraseñas de los usuarios jamás deben guardarse en texto plano. Se utilizará `bcrypt` (con un factor de trabajo o salt rounds de al menos 10) o `argon2`.
- **Regla:** Está prohibido crear mecanismos de recuperación de contraseña que envíen contraseñas temporales en texto plano por correo. El flujo correcto es generar un token temporal seguro y enviar un enlace de reseteo.

---

## 6. Seguridad en Infraestructura y Dependencias

### 6.1 Auditoría de Paquetes
- Mantener actualizadas las dependencias.
- Ejecutar periódicamente `pnpm audit` para detectar vulnerabilidades en el árbol de dependencias de terceros.

### 6.2 Cabeceras HTTP de Seguridad
- Se debe implementar el middleware `helmet` en Express para configurar automáticamente cabeceras de seguridad fundamentales, como:
  - `Strict-Transport-Security` (HSTS)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`

### 6.3 CORS (Cross-Origin Resource Sharing)
- En producción, el middleware `cors()` en Express debe estar configurado estrictamente para permitir peticiones únicamente desde el dominio oficial del frontend.
- **Nunca** usar `*` como origen permitido en producción.
