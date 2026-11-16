import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/caveat';
import './style.css';

createApp(App).use(router).mount('#app');
