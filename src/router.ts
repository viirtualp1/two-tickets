import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import DaysView from './views/DaysView.vue';
import DayView from './views/DayView.vue';
import TaxiView from './views/TaxiView.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/days', name: 'days', component: DaysView },
    { path: '/day/:number', name: 'day', component: DayView },
    { path: '/taxi/:target', name: 'taxi', component: TaxiView },
    { path: '/sync', name: 'sync', component: () => import('./views/SyncView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior (to, from, saved) {
    if (saved) {
      return saved;
    }

    if (to.path === from.path) {
      return false;
    }

    return { top: 0 };
  }
});
