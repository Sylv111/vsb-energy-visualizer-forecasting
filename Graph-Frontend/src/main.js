import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueApexCharts from 'vue3-apexcharts'

// Styles globaux
import './assets/styles/main.css'

const app = createApp(App)

app.use(store)
app.use(router)
app.use(VueApexCharts)

app.mount('#app') 