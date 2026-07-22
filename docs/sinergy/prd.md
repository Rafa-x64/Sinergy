# Documento de Requisitos del Producto (PRD) — Sinergy

**Nombre del Sistema:** Sinergy (Plataforma de Mantenimiento e Inspección)  
**Organización:** Tubrica  
**Versión:** 1.0  
**Dirigido a:** Gerencia de Mantenimiento, Dirección de Operaciones y Supervisores de Planta  

---

## 1. Resumen Ejecutivo

Sinergy es una solución tecnológica integral diseñada para optimizar y estandarizar las inspecciones de mantenimiento industrial en las 3 plantas de Tubrica. Sustituye la toma manual de datos en papel y hojas de Excel por un sistema web inteligente y resiliente a fallas de internet.

La plataforma asegura que el 100% de la información capturada en planta sea confiable, auditable y accesible en tiempo real para la toma de decisiones directivas.

---

## 2. Indicadores Clave de Éxito (KPIs de Negocio)

- **Cero Pérdida de Inspecciones:** 100% de registros guardados y resguardados incluso durante caídas de conectividad en planta.
- **Reducción de Tiempos de Registro:** 40% de ahorro de tiempo por inspección gracias a campos pre-completados y menús táctiles ágiles.
- **Trazabilidad de Calidad:** 100% de los reportes con autoría verificada (Elaborado por, Revisado por, Aprobado por).
- **Autonomía Operativa:** 0 horas de espera por desarrolladores para modificar la estructura de líneas o variables de máquina.

---

## 3. Módulos Operativos del Producto

### A. Módulo de Variables Críticas (Dinámico e Inteligente)
- **Propósito:** Registrar parámetros operacionales críticos (temperaturas, presiones, amplitudes, estados) de los componentes de cada máquina.
- **Estructura Orgánica:** Permite navegar fluidamente desde la Ubicación Técnica y Planta, pasando por las Líneas de Producción (15 a 17 por planta), hasta llegar a la Máquina, Componente y Variable específica.
- **Flexibilidad:** Adaptación automática a 4 tipos de respuestas:
  1. Valores Numéricos Enteros (ej. Horómetro, RPM).
  2. Valores Numéricos Decimales (ej. Amperaje, Voltaje).
  3. Mediciones de Temperatura (con escala en °C o °F).
  4. Opciones Estandarizadas de Inspección: Normal (`N`), Existe (`E`), Anormal (`A`), Bajo (`B`), No Existe (`NE`), No Aplica (`N/A`).

### B. Módulo de Montacargas
- **Propósito:** Garantizar la disponibilidad y operatividad de la flota de montacargas de Tubrica.
- **Gestión de Catálogo:** Registro detallado de cada equipo incluyendo Código de Activo (ej. `1000MTC00009`), Serial, Denominación (Tipo, Marca `Yale`, Modelo), Ubicación Técnica (ej. `1000-DES-MT01`), Descripción y Estatus (`Operativo` / `Inoperativo`).
- **Puntos de Chequeo:** Verificación focalizada en sistemas críticos: Motor, Caja, Radiador, Frenos y Ruedas.

### C. Módulos de Maquinaria Especializada (Compresores, Generadores y Chillers)
- **Propósito:** Monitoreo periódico de equipos de servicio continuo en planta.
- **Inspección Seccionada:** Evaluaciones organizadas por grupos funcionales (Métricas operacionales, niveles de fluido, estado de baterías y revisión general).

### D. Panel de Control e Histórico Ejecutivo (Dashboard)
- **Propósito:** Ofrecer visualización gerencial de inspecciones realizadas, tendencias de variables fuera de rango y resumen de equipos en condición anormal.
- **Exportación Directa:** Descarga instantánea de reportes estructurados en Excel y PDF para revisiones de calidad.

---

## 4. Garantías Operativas y Calidad del Servicio

1. **Funcionamiento sin Internet (Modo Offline-First):**
   - El personal puede trabajar normalmente en los sótanos o áreas con blindaje estructural.
   - Los datos se guardan en el dispositivo móvil y se envían de forma transparente a la base de datos central en cuanto se detecta conexión WiFi o de red.
2. **Seguridad y Control de Acceso:**
   - Acceso restringido por usuario y contraseña.
   - Distinción clara de 3 roles en RBAC: Técnicos (captura de datos), Supervisores (verificación, aprobación y estructura de planta) y Jefe de Mantenimiento / Dirección (Administrador del Sistema, gestión de usuarios y tablero directivo).
3. **Facilidad de Uso (Mobile First):**
   - Diseñado para su uso intuitivo en teléfonos inteligentes y tabletas de trabajo pesado.

---

## 5. Criterios de Aprobación del Proyecto

El proyecto se considerará listo para operaciones tras cumplir con las siguientes validaciones:

- [ ] Carga completa del catálogo inicial de plantas, líneas y montacargas.
- [ ] Prueba exitosa de captura de datos en una zona sin cobertura de internet y su posterior sincronización.
- [ ] Emisión de reporte de prueba en formato PDF y Excel con la cabecera completa de trazabilidad (Elaborado, Revisado, Aprobado).
- [ ] Capacitación al personal técnico y de supervisión de Mantenimiento.

