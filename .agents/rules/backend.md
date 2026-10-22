---
trigger: glob
---

# Backend
- Módulos autocontenidos en `src/modules/<modulo>/`: `.routes.ts`, `.controller.ts`, `.service.ts`, `.schemas.ts` (solo tipos/DTO).
- `src/core/`: solo utilidades transversales (prisma, server, middlewares, tipos globales).
- Routes: rutas + middlewares (`validarJWT`). Controller: valida entrada de forma nativa (typeof, longitud, `esEmailValido`), responde 400 claro, delega al service. Service: reglas de negocio y Prisma.
- Sin Zod/Joi ni DDD. Dependencias hacia abajo: controller -> service -> Prisma.
- Auth: access token JWT corto en memoria + refresh token en cookie HttpOnly.
- Errores: lanza `AppError`; el `errorHandler` global responde sin exponer stack en producción.
- Consultas Prisma: `select` solo de los campos necesarios; evita N+1.
