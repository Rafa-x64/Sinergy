# Especificación de Requisitos del Sistema — Sinergy

**Organización:** Tubrica  
**Sistema:** Plataforma Digital de Control de Mantenimiento  
**Versión:** 1.0  
**Dirigido a:** Gerencia de Operaciones, Jefatura de Mantenimiento, Supervisores  

---

## 1. Requisitos de Autenticación y Control de Acceso

| ID | Descripción del Requisito | Tipo de Usuario | Prioridad |
|---|---|---|---|
| **REQ-SEG-01** | Inicio de sesión seguro mediante credenciales individuales (correo y contraseña). | Todos | Alta |
| **REQ-SEG-02** | Perfil de Operador / Técnico: Permite registrar inspecciones de equipos en asignación y guardar datos locales en planta. | Técnico | Alta |
| **REQ-SEG-03** | Perfil de Supervisor: Permite revisar, aprobar, configurar la estructura de la planta y exportar reportes ejecutivos. | Supervisor | Alta |
| **REQ-SEG-04** | Perfil de Jefe de Mantenimiento / Administrador del Sistema: Gestión integral de usuarios, asignación de roles, credenciales, monitoreo del sistema y acceso completo al tablero directivo. | Administrador | Alta |
| **REQ-SEG-05** | Bloqueo automático por inactividad y resguardo seguro de la sesión de trabajo. | Todos | Media |

---

## 2. Requisitos Operativos de Captura e Inspección

| ID | Descripción del Requisito | Detalle / Criterio de Aprobación | Prioridad |
|---|---|---|---|
| **REQ-OP-01** | **Captura sin conexión a Internet (Offline-First):** El sistema debe permitir tomar lecturas en zonas sin señal WiFi o móvil sin perder datos ni bloquear la pantalla. | Los registros se guardan en la memoria segura del equipo móvil y se transmiten al servidor central automáticamente al recuperar conexión. | Alta |
| **REQ-OP-02** | **Trazabilidad de Cabecera de Inspección:** Toda inspección debe guardar automáticamente: Fecha y hora de captura, Usuario que elabora, Usuario que revisa (opcional) y Usuario que aprueba (opcional). | Cumplimiento de normas de auditoría de calidad ISO. | Alta |
| **REQ-OP-03** | **Optimización del Registro:** Los campos de verificación de rutina deben aparecer pre-seleccionados en estado "Normal" (`N`) para acelerar la toma de datos. | El operador modifica únicamente aquellos puntos con anomalías o desviaciones. | Alta |
| **REQ-OP-04** | **Soporte de Múltiples Tipos de Respuesta:** La interfaz debe mostrar automáticamente el campo adecuado según la variable (números enteros, decimales, temperaturas en °C/°F o listas de opciones estandarizadas N/E/A/B/NE/N/A). | Elimina errores de tipeo y estandariza las mediciones. | Alta |
| **REQ-OP-05** | **Registro de Observaciones Generales:** Permitir adjuntar notas explicativas por variable o una nota general al finalizar el formulario de la inspección. | Brinda contexto técnico sobre la causa de fallas. | Alta |

---

## 3. Requisitos del Módulo de Montacargas

| ID | Descripción del Requisito | Detalle / Criterio de Aprobación | Prioridad |
|---|---|---|---|
| **REQ-MT-01** | **Gestión de Catálogo de Montacargas:** Visualizar la lista de montacargas de la empresa indicando Código (ej. `1000MTC00009`), Serial, Denominación (Tipo, Marca, Modelo), Ubicación Técnica (ej. `1000-DES-MT01`), Denominación 2 y Estado Operativo. | Reemplaza el módulo inoperativo del sistema anterior. | Alta |
| **REQ-MT-02** | **Chequeo por Sistemas Principales:** Registro de condición de Motor (nivel aceite, temperatura, presión, fugas, alternador), Caja, Radiador, Frenos y Ruedas. | Permite calendarizar las inspecciones de Lunes, Miércoles y Viernes. | Alta |
| **REQ-MT-03** | **Registro de Estado Operativo:** Indicar si el montacargas queda marcado como `Operativo` o `Inoperativo` tras finalizar la revisión. | Alerta inmediata al supervisor sobre montacargas detenidos. | Alta |

---

## 4. Requisitos del Módulo de Variables Críticas (Jerarquía Físico-Operativa)

| ID | Descripción del Requisito | Detalle / Criterio de Aprobación | Prioridad |
|---|---|---|---|
| **REQ-VC-01** | **Navegación Jerárquica:** Selección fluida por niveles: Ubicación Técnica → Planta → Línea de Producción (15-17 por planta) → Equipo → Componente → Variable. | Estructura flexible aplicable a las 3 plantas de Tubrica. | Alta |
| **REQ-VC-02** | **Administración de Estructura por Planta (Sin Sistemas):** El supervisor puede agregar o editar líneas, máquinas, componentes y variables desde el menú administrativo sin requerir programación de software. | Cero dependencia de programadores para cambios en la planta. | Alta |
| **REQ-VC-03** | **Visualización Adaptativa:** La pantalla de inspección se genera dinámicamente según la máquina elegida sin recargar innecesariamente toda la base de datos. | Carga rápida en dispositivos móviles. | Alta |

---

## 5. Requisitos de Reportes y Análisis Gerencial

| ID | Descripción del Requisito | Detalle / Criterio de Aprobación | Prioridad |
|---|---|---|---|
| **REQ-REP-01** | **Tablero Directivo de Indicadores (Dashboard):** Visualización de cantidad de inspecciones del día, porcentaje de cumplimiento y lista de equipos en estado de alerta. | Acceso inmediato para jefes de planta y gerentes. | Alta |
| **REQ-REP-02** | **Exportación a Excel y PDF:** Generar reportes ejecutivos filtrados por rango de fechas, planta, tipo de equipo y línea de producción. | Formato listo para imprimir o enviar por correo en auditorías. | Alta |
| **REQ-REP-03** | **Histórico de Inspecciones:** Consulta de revisiones pasadas con detalle de valores registrados y observaciones realizadas. | Permite evaluar la evolución y desgaste de las máquinas. | Alta |

---

## 6. Requisitos de Calidad y Facilidad de Uso (No Funcionales)

1. **Velocidad de Respuesta:** Transición inmediata entre pantallas en menos de 1 segundo.
2. **Diseño Mobile-First:** Botones amplios y lectura clara pensados para pantallas táctiles de teléfonos y tabletas en entornos industriales.
3. **Resguardo de Datos:** Copias de seguridad automáticas y protección de la información contra accesos no autorizados.

