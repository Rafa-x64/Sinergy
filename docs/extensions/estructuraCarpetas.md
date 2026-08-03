# Estructura de Carpetas Recomendada

```text
apps/frontend/src/
├── assets/          # Imágenes, estilos globales
├── components/      # Componentes de UI reutilizables (BaseButton, BaseCard)
│   ├── layout/      # AppHeader.vue, AppDrawer.vue, AppFooter.vue
│   └── common/      # StatusChip.vue, ConfirmModal.vue
├── composables/     # Composables (useSync, useExportPDF)
├── plugins/         # Plugins de Vue (vuetify.ts, toast.ts)
├── router/          # Configuración del router (index.ts)
├── stores/          # Stores de Pinia (authStore.ts, appStore.ts)
├── utils/           # Instancia de Axios HTTP, formateadores
├── views/           # Vistas principales (HomeView, DashboardView, LoginView)
├── App.vue          # Cimiento visual con <v-app>
└── main.ts          # Punto de entrada y app.use()
```
