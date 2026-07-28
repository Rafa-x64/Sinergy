---
trigger: always_on
---

# Reglas de Backend (Arquitectura Modular Basada en Módulos / Features)
1. Estructura por Módulos: Cada módulo (`src/modules/<modulo>/`) debe ser autocontenido y agrupar sus piezas: `<modulo>.routes.ts`, `<modulo>.controller.ts`, `<modulo>.service.ts` y `<modulo>.schemas.ts` (Interfaces/DTOs de TypeScript). Queda prohibida la arquitectura DDD-Lite o librerías de validación complejas (Zod, Joi).
2. Capa Core Transversal: La carpeta `src/core/` aloja únicamente utilidades globales y transversales como la conexión a BD (`prisma.ts`), configuración del servidor HTTP (`server.ts`), middlewares globales (`autenticar.ts`, `errorHandler.ts`) y tipos globales (`types/auth.types.ts`, `types/express.d.ts`).
3. Separación de Responsabilidades:
   - **Routes**: Define las rutas y aplica middlewares de seguridad (`validarJWT`).
   - **Controller**: Recibe la petición HTTP (`req`), valida de forma limpia y nativa las entradas (tipos, campos requeridos, formatos de email/strings), delega al servicio correspondiente, gestiona cookies/headers y envía la respuesta HTTP (`res`).
   - **Service**: Concentra las reglas de negocio y las consultas/modificaciones a la base de datos a través de Prisma.
   - **Schemas**: Exporta las interfaces/tipos DTO de TypeScript puros.
4. Seguridad y Autenticación: Autenticación mediante estrategia de doble token JWT (Access Token en memoria de vida corta + Refresh Token en HttpOnly Cookie). Protege todas las rutas privadas con el middleware `validarJWT`.
5. Validaciones Limpias y Nativas: Las validaciones de entrada se realizan directamente en los controladores usando TypeScript y funciones utilitarias simples (`esEmailValido`, `typeof`, comprobaciones de longitud), retornando respuestas HTTP 400 claras.
6. Rendimiento y Fiabilidad: Consultas a la base de datos optimizadas con Prisma. Manejo explícito de excepciones lanzando `AppError` sin exponer stack traces sensibles en producción.