# Visión y Alcance (Vision & Scope) — Sinergy

## 1. Visión del Proyecto
Para el año 2026 y más adelante, **Sinergy** será la plataforma estándar para la gestión de inspecciones y rutinas de mantenimiento preventivo, eliminando completamente el uso de papel y la dependencia de sistemas heredados ineficientes. Se caracterizará por una experiencia de usuario impecable, robustez técnica y capacidad de operar en cualquier condición de red en las plantas.

## 2. Objetivos del Negocio
- Reducir el tiempo administrativo de los técnicos en el registro de inspecciones en un 40%.
- Garantizar el 100% de trazabilidad en auditorías mediante firmas digitales y registros inmutables.
- Reducir a 0 la pérdida de información por fallos de red gracias a la arquitectura Offline-First.

## 3. Alcance (Fase 1: MVP - Mínimo Producto Viable)

**Dentro del Alcance (In Scope):**
- **Plataforma Web (SPA):** Accesible desde navegador móvil y escritorio.
- **Gestión de Usuarios y Roles:** TECNICO y SUPERVISOR.
- **Módulos de Inspección Core:**
  - Montacargas
  - Compresor
  - Generador
- **Soporte Offline-First:** Almacenamiento local temporal y sincronización.
- **Reporteo Básico:** Tablas de historial y exportación a Excel/PDF.
- **Gestión de Maestros:** Administración básica de Plantas, Equipos y Técnicos.

**Fuera del Alcance (Out of Scope - Futuras Fases):**
- Integración nativa con sistemas ERP externos (Ej. SAP).
- Aplicación nativa en iOS/Android (Play Store / App Store). Por ahora será PWA o SPA web.
- Módulos complejos del sistema antiguo que no sean inspecciones directas (Ej. Módulo de Instrumentos de Medición heredado, a menos que se priorice luego).
- Integración directa por API con Power BI (El inicio será por exportación de datos o vistas de BD).

## 4. Supuestos y Dependencias
- **Supuesto:** Los técnicos tendrán dispositivos (tablets/smartphones) con navegadores modernos (Chrome, Safari).
- **Dependencia:** Se requiere acceso al archivo maestro `Maestros.xlsx` depurado para la carga inicial de datos.
- **Dependencia:** La infraestructura del servidor debe soportar Node.js, una base de datos compatible con Prisma (PostgreSQL o MySQL) y un servidor web (Nginx) para producción.
