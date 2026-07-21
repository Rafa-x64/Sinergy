# Escenarios y Casos de Uso del Sistema — Sinergy

**Organización:** Tubrica  
**Sistema:** Plataforma Digital de Control de Mantenimiento  
**Versión:** 1.0  
**Dirigido a:** Gerencia de Mantenimiento y Supervisión Operativa  

---

## Introducción

Este documento ilustra mediante ejemplos claros y paso a paso cómo los colaboradores de Tubrica (técnicos, supervisores y gerentes) utilizarán la plataforma Sinergy en su jornada laboral diaria para cumplir con los objetivos operativos.

---

## 1. Casos de Uso del Técnico de Mantenimiento

### CU-01: Inspección de Montacargas en Planta
- **Escenario:** El técnico llega a la planta los días Lunes, Miércoles o Viernes a realizar la revisión de rutina de la flota de montacargas.
- **Paso a Paso:**
  1. Abre Sinergy desde su tableta o teléfono móvil e inicia sesión.
  2. Selecciona el módulo **Montacargas**.
  3. Visualiza la lista de montacargas disponibles con su Código (ej. `1000MTC00009`), Denominación (`Montacarga Yale GLP090 M09`), Serial y Ubicación Técnica (`1000-DES-MT01`).
  4. Selecciona el montacargas específico que va a revisar.
  5. El formulario presenta los sistemas clave (Motor, Caja, Radiador, Frenos, Ruedas) con valores predeterminados en "Normal".
  6. El técnico ajusta únicamente las desviaciones encontradas (ej. marca Nivel de Aceite en "Bajo" o Fugas en "Existe").
  7. Escribe una nota explicativa si lo considera necesario y presiona **Guardar Inspección**.
  8. El sistema confirma la recepción del reporte y actualiza el estatus del montacargas.

---

### CU-02: Inspección de Variables Críticas en Zonas sin Internet (Offline)
- **Escenario:** El técnico debe tomar lecturas en una línea de producción ubicada en una zona de la planta donde no llega la señal de WiFi ni datos móviles.
- **Paso a Paso:**
  1. El técnico ingresa a la vista de **Variables Críticas** antes de adentrarse en la zona sin cobertura.
  2. Selecciona la Planta, la Línea de Producción (ej. Línea #02 de extrusión) y la Máquina a evaluar.
  3. Realiza la toma de mediciones en pantalla (temperaturas en °C, presiones numéricas, selecciones N/E/A/B/NE/N/A).
  4. Presiona **Guardar Inspección**.
  5. El sistema detecta la ausencia de señal, guarda de forma segura los datos en el dispositivo móvil y muestra un aviso: *"Inspección resguardada localmente (Pendiente de sincronizar)"*.
  6. Al retornar a una zona con cobertura WiFi, Sinergy transmite automáticamente los registros al servidor central sin requerir ninguna acción adicional del operador.

---

## 2. Casos de Uso del Supervisor de Mantenimiento

### CU-03: Revisión, Validación y Trazabilidad de Inspecciones
- **Escenario:** El supervisor revisa las inspecciones del día registradas por su equipo de trabajo.
- **Paso a Paso:**
  1. El supervisor accede al sistema desde su computadora.
  2. Consulta la lista de inspecciones ejecutadas durante el turno.
  3. Selecciona una inspección para ver el detalle de valores capturados, fecha, hora y el nombre del técnico que la elaboró.
  4. Verifica que los parámetros estén correctos y presiona el botón **Aprobar Inspección**.
  5. El sistema registra la firma digital del supervisor (`Revisado por` / `Aprobado por`), sellando la trazabilidad para auditorías ISO/Calidad.

---

### CU-04: Modificación de la Estructura de Planta (Alta de Maquinaria/Variables)
- **Escenario:** Tubrica instala una nueva máquina en la Línea #05 de la Planta de Extrusión o modifica una variable de control.
- **Paso a Paso:**
  1. El supervisor ingresa al menú de **Administración de Planta**.
  2. Selecciona la Línea #05 y presiona **Agregar Nuevo Equipo**.
  3. Ingresa el nombre del equipo y sus componentes principales.
  4. Define las variables críticas a evaluar y su tipo de respuesta (ej. Rango de temperatura o Selección Normal/Anormal).
  5. Guarda los cambios.
  6. **Resultado:** De forma inmediata, todos los técnicos verán la nueva máquina en sus pantallas móviles al realizar las inspecciones, sin haber requerido intervención del personal de sistemas.

---

## 3. Casos de Uso de la Gerencia de Mantenimiento y Dirección

### CU-05: Consulta del Tablero Directivo y Exportación de Reportes para Auditoría
- **Escenario:** Se requiere presentar el historial de mantenimiento a un auditor externo o revisar el cumplimiento semanal de planta.
- **Paso a Paso:**
  1. El gerente o director ingresa a Sinergy.
  2. En el **Dashboard Directivo**, observa los indicadores globales: total de inspecciones, porcentaje de cumplimiento por planta y alertas operativas.
  3. Navega al módulo de **Reportes**.
  4. Aplica los filtros deseados: Planta Extrusión, Rango de Fechas (último mes) y Estado (`Aprobadas`).
  5. Hace clic en **Exportar a Excel** o **Exportar a PDF**.
  6. El sistema genera de forma instantánea un archivo listo para entrega, con la cabecera completa auditada de acuerdo a las exigencias corporativas.

