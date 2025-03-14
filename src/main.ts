import { createApp } from 'vue'
import App from './App.vue'
import axiosInstance from './plugins/axios'
import router from './router'

const app = createApp(App)

// Nếu muốn sử dụng như một plugin
app.config.globalProperties.$axios = axiosInstance
app.use(router)

app.mount('#app') 