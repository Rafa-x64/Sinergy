# Visión y Alcance (Vision & Scope) — Sinergy

## 1. Resumen Ejecutivo
Sinergy nace como la respuesta a la necesidad imperante de modernizar, centralizar y asegurar la trazabilidad del proceso de mantenimiento industrial preventivo. Ante las limitaciones de sistemas heredados e ineficiencias causadas por procesos manuales o desconectados, Sinergy propone una arquitectura unificada que elimina la fricción en el registro de inspecciones, garantizando la continuidad operativa incluso en entornos industriales con baja conectividad.

## 2. Visión del Producto
Para el año 2026 y en adelante, Sinergy se consolidará como la plataforma estándar y definitiva para la gestión de inspecciones y rutinas de mantenimiento preventivo de la empresa. Al reemplazar completamente los flujos de trabajo basados en papel y los aplicativos obsoletos, Sinergy brindará una experiencia de usuario (UX) ágil e intuitiva, una robustez arquitectónica de nivel empresarial y la flexibilidad necesaria para adaptarse a futuras integraciones tecnológicas y de inteligencia de negocios.

## 3. Objetivos del Negocio y Métricas de Éxito
- **Eficiencia Operativa:** Reducir en un 40% el tiempo administrativo invertido por los técnicos en el registro y transcripción de inspecciones.
- **Trazabilidad y Cumplimiento:** Alcanzar el 100% de trazabilidad de acciones, logrando un control de auditoría inmaculado mediante registros inmutables, firmas digitales y logs de sistema.
- **Alta Disponibilidad:** Disminuir a cero la pérdida de datos o interrupciones de carga causadas por fallas de conectividad en planta, empleando una arquitectura Offline-First.
- **Adopción Tecnológica:** Lograr una curva de aprendizaje mínima, asegurando una adopción del 100% por parte del personal técnico en los primeros 30 días de implementación.

## 4. Perfiles de Usuario
- **Técnico de Mantenimiento:** Usuario operativo principal. Requiere interfaces limpias, enfocadas en la rápida entrada de datos, uso en dispositivos móviles (tabletas/teléfonos) y capacidad de trabajar sin conexión a internet de manera transparente.
- **Supervisor / Coordinador:** Usuario de gestión. Encargado de revisar las inspecciones completadas, analizar tendencias, exportar reportes y administrar la base de datos de maestros (equipos, plantas, técnicos).

## 5. Alcance del Proyecto

### 5.1. Dentro del Alcance (Fase 1: MVP - Producto Mínimo Viable)
- **Plataforma Web (PWA/SPA):** Aplicación web accesible, responsiva y adaptable a dispositivos móviles y estaciones de trabajo de escritorio.
- **Gestión de Identidad y Accesos:** Autenticación de usuarios basada en JWT, con soporte para perfiles diferenciados (Técnico y Supervisor).
- **Módulos de Inspección Core:** 
  - Levantamiento y digitalización de formatos de inspección para: Montacargas, Compresores y Generadores.
- **Sincronización y Offline-First:** Implementación de bases de datos locales (IndexedDB/Dexie) para almacenamiento temporal y mecanismos de sincronización en segundo plano con el servidor central al detectar conexión.
- **Módulo de Reportes Básicos:** Visualización de historiales de inspecciones en tablas dinámicas, con capacidades de filtro, búsqueda y exportación de datos a formatos estándar (Excel y PDF).
- **Gestión de Maestros:** Paneles de administración para la lectura y actualización de catálogos base (Plantas Industriales, Equipos/Activos y Personal Técnico).

### 5.2. Fuera del Alcance (Out of Scope - Fases Posteriores)
- **Integraciones Nativas con ERP:** La integración automatizada bidireccional con sistemas como SAP o Idempiere no se abordará en la Fase 1.
- **Desarrollo Nativo Móvil:** La creación de aplicaciones distribuidas mediante tiendas oficiales (Google Play Store, Apple App Store) queda relegada; la Fase 1 se apoya exclusivamente en tecnologías PWA.
- **Migración de Módulos Secundarios:** Componentes complejos del sistema heredado que no estén estrictamente ligados a las inspecciones directas (Ej. Módulo de Instrumentos de Medición, Calibraciones Avanzadas).
- **Business Intelligence en Tiempo Real:** Integraciones vía API o Webhooks con plataformas de BI (como Power BI); el análisis de datos iniciará apoyado en la exportación estructurada de vistas de base de datos.

## 6. Restricciones, Supuestos y Dependencias

### 6.1. Supuestos
- El personal técnico contará con dispositivos de hardware adecuados (tabletas, smartphones industriales o convencionales) actualizados con navegadores web modernos (Chrome, Safari, Edge).
- Los responsables de los procesos de mantenimiento definirán y aprobarán los formatos estandarizados de inspección antes de iniciar el ciclo de desarrollo correspondiente.

### 6.2. Dependencias
- **Data Limpia:** Es imperativo contar con los archivos de origen depurados (Ej. `Maestros.xlsx`) para ejecutar la carga inicial de datos (Seeders) en la base de datos sin acarrear errores de integridad.
- **Infraestructura de Despliegue:** Se requiere el aprovisionamiento de un entorno de servidores Linux (On-Premise o Cloud) capaz de hospedar contenedores/servicios Node.js, un motor relacional sólido (PostgreSQL o MySQL) y un servidor web o proxy inverso (Nginx).

### 6.3. Restricciones
- La aplicación debe ceñirse al uso de tecnologías de código abierto o licencias libres que no generen costos adicionales recurrentes por asientos de usuario.
- El diseño y la estructura del backend deben adherirse estrictamente a los principios de Domain-Driven Design (DDD-Lite) estipulados en la arquitectura oficial del proyecto.

## 7. Riesgos y Estrategias de Mitigación
- **Riesgo:** Resistencia al cambio por parte de técnicos acostumbrados al formato en papel o al sistema heredado.
  - **Mitigación:** Diseñar flujos de UX/UI extremadamente intuitivos e involucrar a usuarios clave en las fases tempranas de pruebas (UAT) para integrar su retroalimentación.
- **Riesgo:** Inconsistencias de datos durante la sincronización offline.
  - **Mitigación:** Implementar en el backend un manejo de conflictos robusto basado en timestamps y UUIDs de transacciones, informando claramente al usuario el estado de la sincronización.
