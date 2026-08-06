import { createRouter, createWebHistory } from 'vue-router';
import AppShellView from '@/views/AppShellView.vue';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: AppShellView,
    },
  ],
});
