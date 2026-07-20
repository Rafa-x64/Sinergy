<div align="center">
  <h1>🏭 Sinergy</h1>
  <p><strong>Sistema Avanzado de Gestión de Mantenimiento Industrial</strong></p>
</div>

Sinergy es una aplicación web enfocada en la recolección de datos y control de activos para plantas industriales. Diseñado para funcionar en entornos con conectividad intermitente (offline-first), Sinergy permite a técnicos capturar métricas vitales y a supervisores visualizar tendencias y generar reportes.

---

## 🛠 Stack Tecnológico

Sinergy está estructurado como un **Monorepo** gestionado con `pnpm workspaces`. Se compone de dos proyectos independientes:

### Frontend (`@sinergy/frontend`)
- **Framework:** Vue 3 (Composition API) + TypeScript
- **UI & Estilos:** Bootstrap 5, bootstrap-vue-next
- **Estado Global:** Pinia
- **Almacenamiento Offline:** Dexie.js (IndexedDB)
- **Data Visualization:** ApexCharts, Chart.js, ECharts

### Backend (`@sinergy/backend`)
- **Entorno:** Node.js + Express + TypeScript
- **Base de Datos:** PostgreSQL
- **ORM:** Prisma
- **Arquitectura:** DDD-Lite (Domain-Driven Design simplificado)

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js >= 20.x
- pnpm >= 8.x
- PostgreSQL >= 14.x

### Instalación Básica

```powershell
# 1. Instalar todas las dependencias
pnpm install --ignore-scripts

# 2. Iniciar entorno de desarrollo (Front y Back en paralelo)
pnpm dev
```

> [!NOTE]  
> Para una guía de instalación paso a paso, configuración de variables de entorno (`.env`) y preparación de la base de datos, consulta obligatoriamente la **[Guía de Instalación (Setup)](file:///c:/xampp/htdocs/Sinergy/docs/setup.md)**.

---

## 📚 Centro de Documentación

Toda la inteligencia, reglas de negocio y directrices del proyecto se encuentran en la carpeta `docs/`. **Es imprescindible leer la documentación antes de modificar la arquitectura.**

### 🗺 Documentos Principales

| Documento | Descripción |
|---|---|
| 📐 **[Arquitectura](file:///c:/xampp/htdocs/Sinergy/docs/architecture.md)** | Visión general del monorepo, flujo HTTP, diseño DDD-Lite y diagramas de capas. |
| 🧑‍💻 **[Guía del Desarrollador](file:///c:/xampp/htdocs/Sinergy/docs/guia-desarrollador.md)** | Tutorial cronológico para crear features completos de principio a fin. |
| 📦 **[Librerías (Extensions)](file:///c:/xampp/htdocs/Sinergy/docs/extensions/extensions.md)** | Documentación y ejemplos de uso de cada librería instalada (Axios, Prisma, Pinia, etc.). |
| ⚙️ **[Configuración (Setup)](file:///c:/xampp/htdocs/Sinergy/docs/setup.md)** | Cómo instalar y arrancar el proyecto desde cero sin errores. |
| 🛡️ **[Seguridad](file:///c:/xampp/htdocs/Sinergy/docs/security.md)** | Políticas de JWT, protección XSS, Rate Limiting y contraseñas. |
| 🗺️ **[Roadmap y Tareas](file:///c:/xampp/htdocs/Sinergy/docs/todo.md)** | Lista maestra de tareas completadas, en progreso y planificadas (To-Do). |
| 📝 **[Historial (Changelog)](file:///c:/xampp/htdocs/Sinergy/docs/changelog.md)** | Registro formal de todos los cambios de código realizados. |

### 📁 Documentación de Negocio y Dominio

- **`docs/sinergy/`**: Contiene todo el levantamiento de requisitos.
  - [Vision y Alcance](file:///c:/xampp/htdocs/Sinergy/docs/sinergy/visionAlcance.md)
  - [Requerimientos de Software (SRS)](file:///c:/xampp/htdocs/Sinergy/docs/sinergy/requerimientos.md)
  - [Casos de Uso](file:///c:/xampp/htdocs/Sinergy/docs/sinergy/casosUso.md)
- **`docs/notas.md`**: Bloc de notas general de las entrevistas con los clientes y especialistas de planta.

---

## ⌨️ Scripts del Monorepo

| Comando | Acción |
|---|---|
| `pnpm dev` | Inicia el frontend (Vite) y el backend (Express) en paralelo. |
| `pnpm dev:frontend` | Inicia exclusivamente el frontend en `localhost:5173`. |
| `pnpm dev:backend` | Inicia exclusivamente el backend en `localhost:3000`. |
| `pnpm build` | Compila tanto el frontend como el backend para producción. |
