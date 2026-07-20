---
trigger: always_on
---

# Reglas de Backend (Arquitectura DDD-Lite)
1. Separación de Capas: Mantén una separación estricta entre Dominio (lógica de negocio, entidades), Aplicación (casos de uso) e Infraestructura (controladores, repositorios, bases de datos).
2. Seguridad y Autenticación: Implementa autenticación robusta mediante Access Tokens (JWT). Protege todas las rutas privadas.
3. Middlewares: Utiliza middlewares para la validación de peticiones, sanitización de entradas, verificación de roles y manejo de errores globales. Los controladores deben permanecer limpios y solo orquestar el flujo.
4. Rendimiento: Las consultas a la base de datos deben estar optimizadas. Prevé cuellos de botella y explica cómo la arquitectura soporta el crecimiento exponencial del sistema.
5. Fiabilidad: El código debe ser funcional, estar probado lógicamente y manejar excepciones de manera controlada sin exponer información sensible en los mensajes de error (Stack traces).