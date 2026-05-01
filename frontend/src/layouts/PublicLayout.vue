<template>
  <el-container class="public-layout" direction="vertical">
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
          <template v-if="auth.isAuthenticated">
            <el-dropdown trigger="click">
              <span class="user-greeting">
                <el-icon :size="16"><Avatar /></el-icon>
                <span>{{ auth.user?.realName || auth.user?.username }}</span>
                <el-icon class="dropdown-arrow"><ArrowDownBold /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="auth.user?.role === 'ADMIN'" @click="goAdmin">
                    <el-icon><Setting /></el-icon>管理后台
                  </el-dropdown-item>
                  <el-dropdown-item @click="goUserCenter">
                    <el-icon><HomeFilled /></el-icon>用户中心
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleLogout" divided>
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <router-link to="/login" class="btn-auth">登录</router-link>
            <router-link to="/register" class="btn-auth btn-register">注册</router-link>
          </template>
        </div>
      </div>
    </el-header>

    <el-main class="public-main">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>

    <el-footer class="public-footer">
      <div class="footer-inner">
        <p>&copy; {{ year }} 图书管理系统. All rights reserved.</p>
      </div>
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

function goUserCenter() {
  router.push('/user/dashboard')
}
</script>

<style scoped>
.public-layout {
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
}

.btn-auth {
  text-decoration: none;
  color: #409eff;
  font-size: 14px;
  padding: 7px 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-auth:hover {
  background: rgba(64, 158, 255, 0.08);
}

.btn-register {
  background: #409eff;
  color: #fff;
}

.btn-register:hover {
  background: #66b1ff;
  color: #fff;
}

/* ── 主体 ── */
.public-main {
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
  padding: 20px 40px;
  text-align: center;
  color: #999;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.6);
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}
</style>
