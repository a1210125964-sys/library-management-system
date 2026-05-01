import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

import PublicLayout from '@/layouts/PublicLayout.vue'
import UserLayout from '@/layouts/UserLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

const routes = [
  // Public routes - wrapped in PublicLayout
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', redirect: '/home' },
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/public/Home.vue'),
      },
      {
        path: 'catalog',
        name: 'Catalog',
        component: () => import('@/views/public/Catalog.vue'),
      },
      {
        path: 'news',
        name: 'News',
        component: () => import('@/views/public/News.vue'),
      },
      {
        path: 'news/:id',
        name: 'NewsDetail',
        component: () => import('@/views/public/NewsDetail.vue'),
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/public/About.vue'),
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/public/Login.vue'),
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/public/Register.vue'),
      },
    ],
  },

  // User routes - wrapped in UserLayout (requires USER role)
  {
    path: '/user',
    component: UserLayout,
    meta: { requiresAuth: true, roles: ['USER'] },
    children: [
      { path: '', redirect: { name: 'UserDashboard' } },
      { path: 'dashboard', name: 'UserDashboard', component: () => import('@/views/user/Dashboard.vue') },
      { path: 'borrowings', name: 'UserBorrowings', component: () => import('@/views/user/Borrowings.vue') },
      { path: 'history', name: 'UserHistory', component: () => import('@/views/user/History.vue') },
      { path: 'fines', name: 'UserFines', component: () => import('@/views/user/Fines.vue') },
      { path: 'profile', name: 'UserProfile', component: () => import('@/views/user/Profile.vue') },
    ],
  },

  // Admin routes - wrapped in AdminLayout (requires ADMIN role)
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['ADMIN'] },
    children: [
      { path: '', redirect: { name: 'AdminDashboard' } },
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('@/views/admin/Dashboard.vue') },
      { path: 'books', name: 'AdminBooks', component: () => import('@/views/admin/Books.vue') },
      { path: 'users', name: 'AdminUsers', component: () => import('@/views/admin/Users.vue') },
      { path: 'records', name: 'AdminRecords', component: () => import('@/views/admin/Records.vue') },
      { path: 'logs', name: 'AdminLogs', component: () => import('@/views/admin/Logs.vue') },
      { path: 'notices', name: 'AdminNotices', component: () => import('@/views/admin/Notices.vue') },
      { path: 'overdue', name: 'AdminOverdue', component: () => import('@/views/admin/Overdue.vue') },
      { path: 'settings', name: 'AdminSettings', component: () => import('@/views/admin/Settings.vue') },
    ],
  },

  // Catch-all
  { path: '/:pathMatch(.*)*', redirect: '/home' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  auth.initFromStorage()

  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated) {
      ElMessage.warning('请先登录')
      return next('/login')
    }
    const roles = to.meta.roles
    if (roles && roles.length > 0 && !roles.includes(auth.user?.role)) {
      ElMessage.error('权限不足')
      return next('/home')
    }
  }

  next()
})

export default router
