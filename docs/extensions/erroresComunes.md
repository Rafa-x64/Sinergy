# Solución de Errores Comunes

**`ERR_PNPM_IGNORED_BUILDS`**
- **Causa:** pnpm bloquea scripts de instalación de paquetes que requieren compilación nativa por seguridad.
- **Solución:** Agrega los paquetes a `pnpm.ignoredBuiltDependencies` en el `package.json` raíz, o ejecuta `pnpm approve-builds`.

**`Command "dev" not found`**
- **Causa:** Estás ejecutando el comando en la carpeta de un workspace, no en la raíz.
- **Solución:** Ejecuta siempre desde `c:\xampp\htdocs\Sinergy\`.

**`Module ... has no exported member 'defineConfig'`**
- **Causa:** Configuración de `moduleResolution` incorrecta en `tsconfig.node.json`.
- **Solución:** Usa `"module": "ESNext"` y `"moduleResolution": "bundler"` en `tsconfig.node.json`.

**`UND_ERR_DESTROYED`**
- **Causa:** Problema de red temporal durante `pnpm install`.
- **Solución:** Ejecuta `pnpm install --network-concurrency 1`.

**`Vuetify components not rendering / layout breaking`**
- **Causa:** No se incluyó el componente raíz `<v-app>` rodeando la aplicación en `App.vue`, o no se importó `'vuetify/styles'` en el plugin.
- **Solución:** Asegúrate de envolver la app en `<v-app>` dentro de `App.vue` y que `app.use(vuetify)` se ejecute antes de `app.mount('#app')` en `main.ts`.
