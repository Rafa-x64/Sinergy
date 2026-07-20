# Product Requirements Document (PRD) — Sinergy

## 1. Información General
- **Nombre del Producto:** Sinergy
- **Descripción Corta:** Plataforma web (SPA) offline-first para la gestión, registro y auditoría de inspecciones de mantenimiento industrial.
- **Arquitectura Base:** Frontend (Vue 3, Bootstrap) / Backend (Express, Prisma) separada bajo filosofía DDD-Lite.

## 2. Propósito y Problema a Resolver
Actualmente, el sistema heredado presenta problemas de lentitud, interfaz poco amigable, acoplamiento alto, código espagueti y falta de un estándar para el manejo de la información (Ej. formularios engorrosos por equipo). Además, la falta de conectividad en algunas áreas de las plantas detiene la captura de datos.

**Sinergy busca:**
- Modernizar la interfaz (UI/UX) mejorando la velocidad de captura.
- Permitir la captura de inspecciones en zonas sin cobertura WiFi/Datos (Offline-First).
- Proveer una arquitectura escalable que soporte la adición de nuevos módulos sin afectar los existentes.
- Proveer reportes rápidos y limpios para auditorías ISO/Calidad.

## 3. Público Objetivo
- **Técnicos de Mantenimiento:** Usuarios en campo usando tablets o celulares. Requieren un sistema de carga rápida, botones grandes (Mobile First) y soporte offline.
- **Supervisores / Gerentes:** Usuarios en oficina. Requieren vistas amplias de reportes, tableros de control (Dashboards) y exportaciones rápidas.

## 4. Requerimientos Funcionales (Core)
1. **Autenticación Basada en Roles:** Acceso seguro (JWT) discriminando entre Tecnico y Supervisor.
2. **Capacidad Offline:** Uso de IndexedDB (Dexie) en el frontend para guardar inspecciones sin internet y sincronizarlas automáticamente (o manualmente) al reconectar.
3. **Módulos de Inspección Personalizados:** Carga de variables específicas para: Montacargas, Compresores, Generadores y Chillers.
4. **Exportación de Datos:** Capacidad de generar reportes en Excel, PDF o Word para auditoría.

## 5. Requerimientos No Funcionales
1. **Rendimiento:** Tiempos de carga iniciales rápidos (Chunking de Vite) y transiciones entre vistas de menos de 100ms.
2. **Seguridad:** Cifrado de contraseñas (bcrypt), protección contra XSS e Inyecciones SQL (mitigado por Prisma ORM).
3. **Mantenibilidad:** El código debe seguir principios SOLID, DRY y arquitectura de capas (DDD-Lite) para el backend.
4. **Diseño Responsivo:** Bootstrap 5+ usado rigurosamente para garantizar funcionamiento perfecto en pantallas de 320px hasta 4K.
