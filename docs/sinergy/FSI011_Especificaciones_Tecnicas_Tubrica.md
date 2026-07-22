# FSI011 — Especificaciones Técnicas
**Requerimientos Específicos para TUBRICA**

| Campo | Información |
|---|---|
| **Aplicación / Módulo** | Sinergy — Plataforma Digital de Control de Mantenimiento e Inspección Industrial |
| **Fecha** | 22 de Julio de 2026 |
| **Organización** | TUBRICA |
| **Código Documento** | FSI011 |

---

## 1. Objetivo

El objetivo principal de la implementación del sistema **Sinergy** para **TUBRICA** es digitalizar, estandarizar y blindar el proceso de recolección de datos de mantenimiento preventivo e inspecciones operativas en sus tres (3) plantas industriales (Planta de Extrusión, Planta de Inyección y Planta de Mezcla). 

La plataforma está diseñada para erradicar en un 100% el uso de formularios en papel y plantillas aisladas en Excel, mitigando el riesgo de pérdida de información, errores de transcripción y cuellos de botella operativos. Asimismo, el sistema implementa una arquitectura *Offline-First* con almacenamiento seguro en dispositivos móviles (IndexedDB) para garantizar la continuidad operativa en zonas ciegas sin cobertura de internet, asegurando la sincronización transparente una vez restablecida la conectividad.

Adicionalmente, el sistema proporciona trazabilidad inalterable de cada registro para auditorías de calidad (ISO 9001) mediante sellado electrónico de fecha/hora y firmas de autoría (Elaborado por, Revisado por, Aprobado por), otorgando a la supervisión plena autonomía para gestionar la estructura físico-operativa de la maquinaria sin depender del departamento de sistemas.

---

## 2. Alcance del Proyecto

| Eficiencia | Cumplimiento Normativo | Reducción de errores | Optimización de Recursos |
|---|---|---|---|
| • Reducción del 40% en el tiempo de captura de inspecciones mediante formulaciones dinámicas, selecciones predeterminadas (`Normal`) y teclados numéricos adaptativos.<br>• Transición instantánea entre pantallas (<1s) y carga diferida (*lazy loading*) de componentes.<br>• Sincronización automática en segundo plano al recuperar señal de red sin interrumpir el flujo de trabajo del operador. | • Trazabilidad completa e inalterable bajo normas ISO de calidad: registro auditado de autoría (*Elaborado por*, *Revisado por*, *Aprobado por*).<br>• Registro cronológico con sellado ISO 8601 (fecha y hora exacta de captura y sincronización).<br>• Exportación inmediata de históricos e inspecciones en formatos PDF y Excel ejecutivos para auditores. | • Validación estricta en tiempo real según tipo de variable (Entero, Decimal, Temperatura °C/°F y Selección estandarizada `N/E/A/B/NE/N/A`).<br>• Eliminación de errores de lectura manual y tipeo mediante menús desplegables e interfaces táctiles.<br>• Alertas inmediatas al detectar datos fuera de rango o equipos inoperativos al momento de la carga. | • Eliminación total (100%) del gasto en papel, carpetas de archivo, suministros e impresiones operativas.<br>• Maximización de la disponibilidad operativa de la flota de montacargas y maquinaria crítica (Compresores, Generadores, Chillers).<br>• Autonomía técnica total: la supervisión puede añadir líneas o equipos sin requerir programación externa ni generar costos de IT. |

---

## 3. Descripción del Sistema

| Módulos Principales | Funcionalidad Principal | Características Específicas |
|---|---|---|
| **1. Módulo de Variables Críticas (Jerarquía Físico-Operativa)** | Permite la captura parametrizada de datos de proceso navegando fluidamente a través de la jerarquía orgánica: Ubicación Técnica → Planta → Línea de Producción (15 a 17 por planta) → Equipo → Componente → Variable. | • Renderizado dinámico (*Data-Driven UI*) mediante la vista polimórfica `MachineInspectionView`.<br>• Soporta 4 tipos de evaluación: Enteros, Decimales, Temperaturas (°C/°F) y Selecciones Estandarizadas (`N`=Normal, `E`=Existe, `A`=Anormal, `B`=Bajo, `NE`=No Existe, `N/A`=No Aplica).<br>• Valores pre-seleccionados en "Normal" (`N`) para acelerar la toma de datos. |
| **2. Módulo de Montacargas** | Administración del catálogo técnico de la flota de montacargas y ejecución del protocolo de inspección operacional enfocado en 5 sistemas clave (Motor, Caja, Radiador, Frenos, Ruedas) con frecuencia Lunes, Miércoles y Viernes. | • Ficha técnica detallada: Código de Activo (ej. `1000MTC00009`), Serial, Denominación (Marca `Yale`, Modelo, Tipo), Ubicación (`1000-DES-MT01`) y Estatus Operativo.<br>• Determinación de estado final (`Operativo` / `Inoperativo`).<br>• Historial de chequeos con filtros por fecha, serial y estatus. |
| **3. Módulo de Maquinaria Especializada (Compresores, Generadores y Chillers)** | Evaluación detallada de equipos de soporte crítico en planta mediante checklists seccionados por subsistemas (eléctrico, mecánico, presiones PSI, horómetros, amperajes y bancos de baterías). | • Checklists por secciones funcionales (Variables numéricas, lecturas de baterías 12V, niveles de diésel y refrigerante).<br>• Registro individualizado de horómetros de servicio y consumo energético (KWH). |
| **4. Módulo de Administración de Planta y Estructura** | Gestión completa del árbol físico de la empresa (Plantas, Ubicaciones Técnicas, Líneas, Maquinarias, Componentes y Variables) desde una interfaz gráfica para supervisores. | • ABM (Alta, Baja, Modificación) sin escribir código fuente.<br>• Actualización instantánea en dispositivos móviles sin requerir redepliegue de software ni reinicio de servicios. |
| **5. Módulo de Dashboard Directivo y Reportes Executivos** | Panel de control centralizado con indicadores de gestión en tiempo real (cumplimiento de inspecciones, porcentaje de anomalías y estado de la flota). | • Filtros avanzados por rango de fechas, planta, línea y tipo de equipo.<br>• Generación de reportes en PDF y Excel listos para impresión y auditoría ISO. |

---

## 4. Participantes y sus Roles

| Perfiles de Usuario | Accesos y Restricciones |
|---|---|
| **Operador / Técnico de Mantenimiento** | **Accesos:**<br>• Registro de inspecciones diarias/interdiarias en los módulos de Variables Críticas, Montacargas, Compresores, Generadores y Chillers.<br>• Almacenamiento local en dispositivo móvil en zonas sin conexión (Offline-First) y sincronización automática.<br>• Inclusión de notas y observaciones técnicas por variable o inspección general.<br><br>**Restricciones:**<br>• No puede modificar la estructura de plantas, líneas o equipos.<br>• No puede aprobar ni revisar inspecciones registradas por otros usuarios.<br>• Sin permisos para eliminar o alterar registros históricos sincronizados. |
| **Supervisor de Mantenimiento** | **Accesos:**<br>• Revisión, verificación y aprobación formal de inspecciones ejecutadas por el equipo técnico (`Revisado por` / `Aprobado por`).<br>• Acceso total al Módulo de Administración de Planta para agregar/editar líneas, equipos, componentes y variables.<br>• Visualización de alertas de equipos declarados `Inoperativo` o con variables desviadas.<br>• Generación y exportación de reportes operativos en PDF y Excel.<br><br>**Restricciones:**<br>• No puede administrar cuentas de usuario del sistema ni configuraciones de seguridad del servidor. |
| **Jefe de Mantenimiento / Gerencia de Planta / Dirección (Administrador del Sistema)** | **Accesos:**<br>• Acceso ejecutivo completo al Dashboard Directivo con visión consolidada de las 3 plantas de TUBRICA.<br>• Consulta de indicadores KPI de cumplimiento, disponibilidad de activos y tendencias de fallas.<br>• Descarga y exportación de reportes ejecutivos para auditorías de calidad ISO y comités directivos.<br>• **Administración del Sistema:** Gestión integral de usuarios, asignación de roles (`ADMINISTRADOR`, `SUPERVISOR`, `TECNICO`), gestión de credenciales e inactivación de cuentas.<br>• Monitoreo global del estado del sistema y logs de auditoría.<br>• Control y modificación de la estructura físico-operativa de plantas, líneas y equipos.<br><br>**Restricciones:**<br>• No debe alterar ni eliminar registros de inspecciones operativas ya sincronizadas para preservar la integridad de las auditorías de calidad. |

---

## 5. Notificaciones y Alertas

| ¿Qué eventos generan alertas? | ¿Cómo se notificará? |
|---|---|
| **1. Marcaje de Montacargas o Equipo Crítico como `Inoperativo`**<br>Se genera cuando un técnico finaliza un chequeo y el estado general del equipo queda marcado como no funcional. | • **En Pantalla:** Banner de advertencia rojo de alta prioridad en el Dashboard de Supervisión.<br>• **En Lista:** Resaltado en color rojo dentro del catálogo de activos e histórico de chequeos. |
| **2. Desviación de Variable Crítica o Lectura Fuera de Rango**<br>Se produce cuando una medición numérica/temperatura supera los límites de tolerancia o se registra un estado `Anormal` (`A`), `Bajo` (`B`) o la presencia de fugas (`E`). | • **En Formulario:** Indicador visual inmediato (badge o resaltado amarillo) en la vista de captura del técnico.<br>• **En Dashboard:** Contadores de anomalías actualizados en tiempo real en la ficha de control del supervisor. |
| **3. Operación en Zona Sin Conexión (Modo Offline)**<br>Se activa cuando el dispositivo móvil pierde conectividad a la red local WiFi de planta durante la captura. | • **En Dispositivo Móvil:** Notificación emergente e icono de estado: *"Inspección resguardada localmente en dispositivo (Pendiente de sincronizar)"*.<br>• **Al Recupear Red:** Mensaje de confirmación en verde: *"Sincronización completada exitosamente"*. |
| **4. Inspecciones Pendientes de Revisión o Aprobación (>24h)**<br>Se dispara cuando un registro permanece sin firma del supervisor transcurrido el tiempo reglamentario del turno. | • **En Dashboard de Supervisión:** Alerta de pendiente de aprobación en la bandeja de entrada del supervisor con contador de horas transcurridas. |
| **5. Fallo en el Proceso de Sincronización Automática**<br>Se produce por interrupción abrupta de red durante la transmisión de paquetes desde Dexie.js al backend. | • **En Dispositivo:** Reintento automático con notificación de estado en cola de espera y botón de *"Reintentar Sincronización Manual"*. |

---

*Documento Controlado — TUBRICA — Código FSI011*
