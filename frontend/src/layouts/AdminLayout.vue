<template>
  <el-container class="admin-layout">
    <el-aside width="240px" class="admin-sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon"></div>
        <div>
          <h1>图书管理系统</h1>
          <p>Admin Console</p>
        </div>
      </div>
      <el-menu
        :default-active="route.path"
        router
        :collapse="false"
        class="sidebar-menu"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>后台仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/admin/books">
          <el-icon><Reading /></el-icon>
          <span>图书管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/records">
          <el-icon><List /></el-icon>
          <span>借阅记录</span>
        </el-menu-item>
        <el-menu-item index="/admin/logs">
          <el-icon><Document /></el-icon>
          <span>系统日志</span>
        </el-menu-item>
        <el-menu-item index="/admin/notices">
          <el-icon><Bell /></el-icon>
          <span>公告管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/overdue">
          <el-icon><WarningFilled /></el-icon>
          <span>逾期管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-foot">
        <span class="role-tag">管理员模式</span>
      </div>
    </el-aside>

    <el-container direction="vertical">
      <el-header class="admin-topbar">
        <div>
          <h2>{{ pageTitle }}</h2>
          <p class="breadcrumb">首页 &gt; {{ pageTitle }}</p>
        </div>
        <div class="topbar-actions">
          <el-tag type="info">{{ auth.user?.realName || auth.user?.username }} (ADMIN)</el-tag>
          <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>

      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const pageTitles = {
  '/admin/dashboard': '后台仪表盘',
  '/admin/books': '图书管理',
  '/admin/users': '用户管理',
  '/admin/records': '借阅记录',
  '/admin/logs': '系统日志',
  '/admin/notices': '公告管理',
  '/admin/overdue': '逾期管理',
  '/admin/settings': '系统设置',
}

const pageTitle = computed(() => pageTitles[route.path] || '管理后台')

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  background: #f0f2f5;
}

.admin-sidebar {
  background: #1d1e1f;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-brand {
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-icon {
  width: 10px;
  height: 10px;
  background: #409eff;
  border-radius: 50%;
}

.sidebar-brand h1 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #fff;
}

.sidebar-brand p {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin: 2px 0 0;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  background: transparent;
}

.sidebar-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.7);
}

.sidebar-menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.sidebar-menu .el-menu-item.is-active {
  color: #409eff;
  background: rgba(64, 158, 255, 0.12);
}

.sidebar-foot {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
}

.role-tag {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.06);
  padding: 4px 12px;
  border-radius: 4px;
}

.admin-topbar {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  border-bottom: 1px solid #e4e7ed;
}

.admin-topbar h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.breadcrumb {
  font-size: 12px;
  color: #999;
  margin: 2px 0 0;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-main {
  padding: 24px;
  overflow-y: auto;
}
</style>
