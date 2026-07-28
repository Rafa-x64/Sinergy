---
trigger: always_on
---

# Reglas de Backend (Arquitectura Modular Basada en Módulos / Features)
1. Estructura por Módulos: Cada módulo (`src/modules/<modulo>/`) debe ser autocontenido y agrupar sus piezas: `<modulo>.routes.ts`, `<modulo>.controller.ts`, `<modulo>.service.ts` y `<modulo>.schemas.ts` (Zod). Queda prohibida la arquitectura DDD-Lite o capas globales dispersas (`domain`, `application`, `interfaces`).
2. Capa Core Transversal: La carpeta `src/core/` aloja únicamente utilidades globales y transversales como la conexión a BD (`prisma.ts`), configuración del servidor HTTP (`server.ts`), middlewares globales (`autenticar.ts`, `validarSchema.ts`, `errorHandler.ts`) y tipos globales (`types/auth.types.ts`, `types/express.d.ts`).
3. Separación de Responsabilidades:
   - **Routes**: Define las rutas y aplica middlewares de seguridad y validación de schema Zod.
   - **Controller**: Recibe la petición HTTP (`req`), delega al servicio correspondiente, gestiona cookies/headers y envía la respuesta HTTP (`res`). Sin lógica de BD ni reglas de negocio extensas.
   - **Service**: Concentra las reglas de negocio y las consultas/modificaciones a la base de datos a través de Prisma.
   - **Schemas**: Define las validaciones de entrada con Zod y exporta los tipos DTO correspondientes.
4. Seguridad y Autenticación: Autenticación mediante estrategia de doble token JWT (Access Token en memoria de vida corta + Refresh Token en HttpOnly Cookie). Protege todas las rutas privadas con el middleware `validarJWT`.
5. Middlewares: Utilizar middlewares para la validación de peticiones, sanitización de entradas, verificación de roles y manejo de errores globales.
6. Rendimiento y Fiabilidad: Consultas a la base de datos optimizadas con Prisma. Manejo explícito de excepciones lanzando `AppError` sin exponer stack traces sensibles en producción.