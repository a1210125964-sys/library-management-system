<template>
  <el-container class="user-layout" direction="vertical">
    <el-header class="public-header">
      <div class="header-inner">
        <router-link to="/home" class="logo">
          <el-icon :size="24"><Reading /></el-icon>
          <span>图书管理系统</span>
        </router-link>
        <el-menu mode="horizontal" :ellipsis="false" :default-active="activeMenu" router>
          <el-menu-item index="/home">首页</el-menu-item>
          <el-menu-item index="/catalog">图书目录</el-menu-item>
          <el-menu-item index="/news">新闻公告</el-menu-item>
          <el-menu-item index="/about">关于我们</el-menu-item>
        </el-menu>
        <div class="header-auth">
          <el-dropdown trigger="click">
            <span class="user-greeting">
              <el-icon :size="18"><Avatar /></el-icon>
              <span>{{ auth.user?.realName || auth.user?.username }}</span>
              <el-icon class="dropdown-arrow"><ArrowDownBold /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="auth.user?.role === 'ADMIN'" @click="goAdmin">
                  <el-icon><Setting /></el-icon>管理后台
                </el-dropdown-item>
                <el-dropdown-item @click="handleLogout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <div class="user-subnav">
      <div class="subnav-inner">
        <el-menu mode="horizontal" :ellipsis="false" :default-active="route.path" router>
          <el-menu-item index="/user/dashboard">
            <el-icon><HomeFilled /></el-icon>
            <span>总览</span>
          </el-menu-item>
          <el-menu-item index="/user/borrowings">
            <el-icon><Collection /></el-icon>
            <span>当前借阅</span>
          </el-menu-item>
          <el-menu-item index="/user/history">
            <el-icon><Document /></el-icon>
            <span>借阅历史</span>
          </el-menu-item>
          <el-menu-item index="/user/fines">
            <el-icon><Coin /></el-icon>
            <span>罚款记录</span>
          </el-menu-item>
          <el-menu-item index="/user/profile">
            <el-icon><User /></el-icon>
            <span>个人信息</span>
          </el-menu-item>
        </el-menu>
      </div>
    </div>

    <el-main class="user-main">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>

    <el-footer class="public-footer">
      <p>&copy; {{ year }} 图书管理系统. All rights reserved.</p>
    </el-footer>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const year = computed(() => new Date().getFullYear())

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/home')) return '/home'
  if (path.startsWith('/catalog')) return '/catalog'
  if (path.startsWith('/news')) return '/news'
  if (path.startsWith('/about')) return '/about'
  return ''
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}

function goAdmin() {
  router.push('/admin/dashboard')
}
</script>

<style scoped>
.user-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
}

/* ── 顶部导航 ── */
.public-header {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0 40px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 60px;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
  text-decoration: none;
  white-space: nowrap;
}

.header-inner .el-menu--horizontal {
  flex: 1;
  border-bottom: none;
}

.header-auth {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.user-greeting {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 6px 14px;
  border-radius: 8px;
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
  font-size: 14px;
  transition: background 0.2s;
}

.user-greeting:hover {
  background: #d9ecff;
}

.dropdown-arrow {
  font-size: 12px;
  margin-left: 2px;
}

/* ── 子导航 ── */
.user-subnav {
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.subnav-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.subnav-inner .el-menu--horizontal {
  border-bottom: none;
}

.subnav-inner :deep(.el-menu-item) {
  gap: 6px;
}

.subnav-inner :deep(.el-menu-item .el-icon) {
  margin-right: 0;
}

/* ── 主体 ── */
.user-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 40px;
}

/* ── 页面切换动画 ── */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── 页脚 ── */
.public-footer {
  text-align: center;
  padding: 24px;
  color: #999;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.7);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
