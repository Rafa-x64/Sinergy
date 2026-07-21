# Documento de Visión y Alcance — Proyecto Sinergy

**Cliente / Organización:** Tubrica  
**Sistema:** Plataforma Digital de Control de Mantenimiento e Inspección Industrial  
**Versión:** 1.0  
**Fecha:** 21 de Julio de 2026  
**Destinatarios:** Gerencia General, Jefatura de Mantenimiento, Supervisión de Planta  

---

## 1. Declaración del Problema

Actualmente, el registro y control de inspecciones de equipos y variables críticas en las 3 plantas de Tubrica se realiza mediante formatos impresos y plantillas de Excel distribuidas. Esta modalidad presenta los siguientes inconvenientes operativos y financieros:

1. **Falta de Trazabilidad y Riesgo de Auditoría:** No existe un registro centralizado e inalterable que certifique quién ejecutó la inspección, quién la revisó y quién la aprobó.
2. **Pérdida de Información por Fallas de Conectividad:** Las áreas operativas de planta presentan zonas ciegas sin cobertura de internet, impidiendo el registro digital directo.
3. **Alto Tiempo de Respuesta ante Fallas:** El traspaso manual de datos desde papel o Excel retrasa la detección de desviaciones críticas en maquinarias.
4. **Vulnerabilidad Tecnológica:** Modificar la estructura de una línea o equipo en el sistema antiguo requería intervención técnica de sistemas, generando cuellos de botella operativos.

---

## 2. Visión del Producto

**Sinergy** es la plataforma digital unificada de Tubrica diseñada para modernizar, estandarizar y blindar la captura de datos de inspección operativa en planta. 

Permite a los técnicos registrar variables operativas y chequeos desde dispositivos móviles en tiempo real —incluso en zonas sin señal de internet— y ofrece a la gerencia un tablero de control centralizado con indicadores de gestión, alertas de desviaciones y trazabilidad total para auditorías de calidad.

---

## 3. Objetivos de Negocio

1. **Eliminar el 100% del Uso de Papel en Inspecciones:** Digitalizar los procesos de captura diaria e interdiaria en las 3 plantas.
2. **Garantizar Continuidad Operativa (Cero Pérdida de Datos):** Permitir la recolección de datos offline y la sincronización automática al recuperar cobertura.
3. **Disminuir el Tiempo de Captura en un 40%:** Interfaz adaptada a dispositivos móviles con opciones predeterminadas y validación instantánea.
4. **Autonomía Operativa de la Planta:** Permitir que la supervisión agregue o modifique líneas, equipos y variables sin depender del departamento de sistemas.
5. **Cumplimiento de Estándares de Auditoría:** Registrar la firma digital y trazabilidad completa (Elaborado por, Revisado por, Aprobado por, Fecha e Hora) en cada reporte.

---

## 4. Usuarios Principales y Beneficios

### A. Operadores y Técnicos de Mantenimiento
- **Entorno:** Dispositivos móviles / Tablets en planta.
- **Beneficio:** Formulario ágil, selección de valores habituales de forma rápida, sin reprocesos por pérdida de conexión.

### B. Supervisores de Mantenimiento
- **Entorno:** Computadoras de escritorio y tablets.
- **Beneficio:** Verificación y aprobación de inspecciones, control de equipos inoperativos, alertas de desviación de variables críticas.

### C. Gerencia General y de Planta
- **Entorno:** Panel directivo (Dashboard).
- **Beneficio:** Indicadores clave en tiempo real, histórico centralizado y exportación inmediata de reportes para auditorías ISO/Calidad.

---

## 5. Alcance de la Versión 1.0 (Incluido)

El proyecto abarca la digitalización de los siguientes módulos operativos en las 3 plantas de Tubrica:

1. **Módulo de Variables Críticas (Basado en Datos):**
   - Estructura jerárquica: Ubicación Técnica → Planta → Línea de Producción → Equipo → Componente → Variable.
   - Registro de variables numéricas, temperaturas y selecciones estandarizadas (Normal, Existe, Anormal, Bajo, No Existe, No Aplica).
2. **Módulo de Montacargas:**
   - Catálogo de equipos con Código (ej. `1000MTC00009`), Serial, Denominación desglosada (Tipo, Marca, Modelo), Ubicación Técnica y Estado Operativo.
   - Formulario de chequeo operacional (Motor, Caja, Radiador, Frenos, Ruedas).
3. **Módulos Especializados:**
   - Inspección operacional de Compresores, Generadores y Chillers.
4. **Mapeo Físico Completo:**
   - Cobertura de 6 a 17 líneas de producción por planta.
5. **Operatividad Offline:**
   - Guardado local automático en dispositivo móvil y sincronización en segundo plano al detectar red.
6. **Reportes e Historiales:**
   - Exportación de históricos a formatos ejecutivos (Excel y PDF).

---

## 6. Fuera del Alcance (Excluido en V1.0)

Para garantizar una entrega rápida y enfocada, las siguientes funciones no forman parte de la primera fase:

- **Control de Inventario de Repuestos:** El inventario físico seguirá gestionándose a través del sistema corporativo `iDempiere`.
- **Generación Automática de Órdenes de Compra:** Las compras de repuestos se canalizan por los flujos existentes de la empresa.
- **Integración Directa con Maquinaria por Sensores IoT:** La versión 1.0 se enfoca en la toma de datos por inspección humana cualificada.
