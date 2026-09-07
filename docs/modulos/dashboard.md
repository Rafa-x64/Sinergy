# Módulo: Dashboard Integral & Centro de Reportes

## 1. Visión General

El módulo de **Dashboard** proporciona visualización en tiempo real del estado de la maquinaria, métricas de confiabilidad industrial, historial de inspecciones y generación de reportes normativos imprimibles y exportables a hojas de cálculo Excel (`.xlsx`) y documentos PDF (`.pdf`).

---

## 2. Métricas y Gráficos (Chart.js)

Todos los gráficos fueron desarrollados con **Chart.js** y `vue-chartjs` con diseño adaptable y responsivo:

### A. Distribución Global y por Planta (KPI A)
- **Gráficos**: Donut Chart (distribución general) + Stacked Bar Chart horizontal (desglose por planta).
- **Métrica**: % de equipos `OPERATIVO`, `INOPERATIVO` y `EN_MANTENIMIENTO`.

### B. Top 10 Equipos con más Fallas (KPI C)
- **Gráfico**: Horizontal Bar Chart con esquinas redondeadas y colores dinámicos según severidad de desvío.
- **Métrica**: % histórico de variables fuera de límites normativos.

### C. Evolución de Disponibilidad (KPI G)
- **Gráfico**: Line / Area Chart con área degradada y curva suave sobre los últimos 6 meses.

### D. Carga de Trabajo por Técnico (KPI D)
- **Gráfico**: Vertical Bar Chart de inspecciones elaboradas en el mes.

---

## 3. Catálogo de Reportes Operativos y Gerenciales

| Código | Reporte | Destinatario | Exportación | Descripción |
|---|---|---|---|---|
| **R1** | Reporte de Estado de Flota | Supervisor | Excel + PDF | Inventario total con estado operativo, serial y última inspección. |
| **R2** | Reporte de Inspecciones del Período | Supervisor | Excel + PDF | Historial acumulado con tasa de aprobación y desglose por equipo. |
| **R3** | Reporte de No-Conformidades | Supervisor | Excel + PDF | Registro de variables críticas fuera de rango para mantenimiento preventivo. |
| **R4** | Reporte Ejecutivo Mensual (1 Pág.) | Gerente | Excel + PDF | 5 KPIs consolidados de planta, horas estimadas de inoperatividad y top fallas. |
| **R5** | Matriz de Criticidad por Equipo | Mantenimiento | Excel + PDF | Clasificación ABC interactiva (Críticos, Medios, Bajos) según fallas y rechazos. |
| **R6** | Tarjeta de Ronda de Inspección | Técnico | Impresión + PDF | Formato F-MANT-04 para toma física de lecturas en campo con firmas. |

### 3.1 Integración y Carga de Catálogos Auxiliares en `PanelReportes.vue`
Para los filtros reactivos de R1 (Flota) y R6 (Tarjeta de Ronda), el componente consume de forma asíncrona y tolerante a fallos:
- **Plantas Industriales**: Consulta a `/api/plantas/listar` (o alias `/api/plantas`), alimentando el selector reactivo `listaPlantas`.
- **Tipos de Maquinaria**: Consulta a `/api/equipos/tipo/listar` (o alias `/api/equipos/tipos`), alimentando el selector reactivo `listaTiposEquipo`.
- **Inventario de Maquinarias**: Consulta a `/api/equipos/listar` (o alias `/api/equipos`), alimentando el catálogo para la selección de tarjeta de ronda física.

La carga se realiza mediante `Promise.allSettled`, asegurando que la indisponibilidad de un catálogo no bloquee la carga ni el filtrado de los demás.

---

## 4. Endpoints del Backend (`/api/dashboard`)

| Método | Endpoint | Parámetros Query | Descripción |
|---|---|---|---|
| `GET` | `/api/dashboard/disponibilidad` | `plantaId?` | Distribución global y por planta de estados operativos. |
| `GET` | `/api/dashboard/top-fallas` | `plantaId?`, `limite?` | Ranking de equipos con mayor % de fallas. |
| `GET` | `/api/dashboard/evolucion-disponibilidad` | `plantaId?` | Serie temporal de disponibilidad últimos 6 meses. |
| `GET` | `/api/dashboard/carga-tecnico` | `plantaId?`, `mes?` | Productividad mensual por técnico. |
| `GET` | `/api/dashboard/reporte-flota` | `plantaId?`, `tipoEquipoId?`, `estadoOperativo?` | Reporte R1 de inventario de flota. |
| `GET` | `/api/dashboard/reporte-ejecutivo` | `plantaId?`, `mes?` | Reporte R4 ejecutivo gerencial de 1 página. |
| `GET` | `/api/dashboard/matriz-criticidad` | `plantaId?` | Reporte R5 con clasificación ABC y puntajes de criticidad. |
| `GET` | `/api/dashboard/no-conformidades` | `plantaId?`, `fechaInicio?`, `fechaFin?` | Reporte R3 de variables críticas fuera de rango. |
| `GET` | `/api/dashboard/inspecciones-periodo` | `plantaId?`, `estado?`, `fechaInicio?`, `fechaFin?` | Reporte R2 de inspecciones del período. |
| `GET` | `/api/dashboard/tarjeta-ronda/:equipoId` | N/A | Reporte R6 con estructura para formato impreso F-MANT-04. |
