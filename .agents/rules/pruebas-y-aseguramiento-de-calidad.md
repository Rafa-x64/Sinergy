---
trigger: always_on
---

# Pruebas y Aseguramiento de Calidad (QA)
1. Código sin pruebas es código incompleto: Toda nueva funcionalidad, servicio en el backend o componente complejo en el frontend, debe entregarse junto con sus pruebas automatizadas (Unitarias para servicios/lógica pura, de Integración para endpoints/middlewares).
2. Pruebas de Casos Límite (Edge Cases): Está strictly prohibido probar únicamente el "Happy Path" (el escenario donde todo funciona). Tus pruebas deben forzar fallos: datos nulos, strings vacíos, violaciones de tipos, tokens expirados y pérdida de conexión.
3. Test-Driven Development (TDD) Dinámico: Cuando abordemos lógica crítica de negocio (ej. cálculos financieros, facturación o asignación de permisos), primero definiremos las pruebas que el código debe superar. Solo escribiremos la implementación una vez que los criterios de aceptación estén claros.