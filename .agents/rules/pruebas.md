---
trigger: model_decision
---

# Pruebas
- Lógica de negocio, servicios, endpoints y composables críticos: incluye tests (unitarios para lógica pura, integración para endpoints).
- Cubre casos límite relevantes: null/vacío, tipos inválidos, token expirado, permisos, fallo de red. No pruebes solo el caso feliz.
- Lógica crítica (permisos, cálculos): define primero los casos de aceptación y luego implementa.
- No generes tests para componentes de presentación simples ni código trivial.
