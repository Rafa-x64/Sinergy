---
trigger: always_on
---

# Mejores Prácticas de Ingeniería (Estándar Senior)
1. Manejo Explícito de Errores: Queda prohibido capturar excepciones y silenciarlas (ej. un bloque `catch` vacío o que solo haga un `console.log`). Todo error capturado debe transformarse en una respuesta HTTP estructurada, registrarse en el sistema de logs del backend, o mostrarse en el frontend mediante el sistema de notificaciones global, limpiando siempre el estado.
2. Principios SOLID y DRY: Aplica los principios SOLID en el backend (especialmente la Inversión de Dependencias entre tu capa de Dominio y la Infraestructura). En el frontend, respeta el principio DRY (Don't Repeat Yourself); si detectas que estamos copiando y pegando lógica de validación o estilos, detén el proceso y extrae esa lógica a un `composable` (en Vue) o a una clase utilitaria.
3. Seguridad por Defecto (Secure by Default): Toda entrada del usuario en el frontend se considera no confiable. Toda entrada al backend se considera maliciosa. Aplica sanitización estricta, validación de tipos y previene vulnerabilidades de inyección y XSS en cada nivel.
4. Disciplina de Commits Semánticos: Al generar resúmenes de lo trabajado o estructurar los cambios, utiliza convenciones de commits semánticos (ej. `feat:`, `fix:`, `refactor:`, `docs:`). Esto facilita el rastreo de cambios y la automatización del versionado.