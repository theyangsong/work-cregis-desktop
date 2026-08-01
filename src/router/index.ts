import { createRouter, createWebHistory } from 'vue-router';
import AppShellView from '@/views/AppShellView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: AppShellView,
    },
  ],
});
