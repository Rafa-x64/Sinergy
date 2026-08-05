import { createApp } from 'vue'        // ✅
import { createPinia } from 'pinia'    // ✅
import App from './App.vue'            // ✅
import router from './core/router'          // ✅

// Bootstrap
import { createBootstrap } from 'bootstrap-vue-next'
import 'bootstrap/dist/css/bootstrap.min.css'           // ✅
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css' //  ¡Correcto!// ApexCharts
import VueApexCharts from 'vue3-apexcharts'
// Toastification
import 'vue-toastification/dist/index.css' // ✅
import { Toast, toastOptions } from './plugins/toast'

// FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faUser, faCog, faHome, faChartBar } from '@fortawesome/free-solid-svg-icons'
library.add(faUser, faCog, faHome, faChartBar)
import '@mdi/font/css/materialdesignicons.css'

// Vuetify 3
import vuetify from './plugins/vuetify'

// Crear app
const app = createApp(App)
const pinia = createPinia()

// Plugins
app.use(pinia)
app.use(router)
app.use(vuetify)
app.use(createBootstrap())
app.use(VueApexCharts)
app.use(Toast, toastOptions)

app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
