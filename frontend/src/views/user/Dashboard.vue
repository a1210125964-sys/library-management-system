<template>
  <div class="user-dashboard" v-loading="loading">
    <div class="welcome-banner">
      <div class="welcome-text">
        <h2>欢迎回来，{{ auth.user?.realName || auth.user?.username }}</h2>
        <p>今天是 {{ today }}，祝你有美好的一天</p>
      </div>
      <el-icon :size="56" class="welcome-icon"><Avatar /></el-icon>
    </div>

    <el-row :gutter="24" class="kpi-row">
      <el-col :span="8">
        <div class="stat-card stat-card--blue">
          <div class="stat-card__header">
            <el-icon :size="28"><Reading /></el-icon>
          </div>
          <p class="stat-card__value">{{ data.activeBorrowCount ?? '-' }}</p>
          <p class="stat-card__label">当前借阅</p>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card" :class="data.overdueCount > 0 ? 'stat-card--red' : 'stat-card--green'">
          <div class="stat-card__header">
            <el-icon :size="28"><WarningFilled /></el-icon>
          </div>
          <p class="stat-card__value">{{ data.overdueCount ?? '-' }}</p>
          <p class="stat-card__label">逾期记录</p>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card stat-card--purple">
          <div class="stat-card__header">
            <el-icon :size="28"><Bell /></el-icon>
          </div>
          <p class="stat-card__value">{{ data.publishedNoticeCount ?? '-' }}</p>
          <p class="stat-card__label">公告数量</p>
        </div>
      </el-col>
    </el-row>

    <h3 class="section-title">快捷入口</h3>
    <el-row :gutter="16">
      <el-col :span="6">
        <div class="quick-card" @click="$router.push('/user/borrowings')">
          <el-icon :size="32"><Collection /></el-icon>
          <span>当前借阅</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="quick-card" @click="$router.push('/user/history')">
          <el-icon :size="32"><Document /></el-icon>
          <span>借阅历史</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="quick-card" @click="$router.push('/user/fines')">
          <el-icon :size="32"><Coin /></el-icon>
          <span>罚款记录</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="quick-card" @click="$router.push('/user/profile')">
          <el-icon :size="32"><UserFilled /></el-icon>
          <span>个人信息</span>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getDashboard } from '@/api/user'

const auth = useAuthStore()
const loading = ref(true)
const data = ref({})

const today = computed(() => {
  const d = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`
})

onMounted(async () => {
  try {
    const res = await getDashboard()
    data.value = res.data || {}
  } catch {
    data.value = {}
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.welcome-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  border-radius: 16px;
  padding: 32px 36px;
  margin-bottom: 28px;
  color: #fff;
}

.welcome-banner h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.welcome-banner p {
  margin: 0;
  opacity: 0.85;
  font-size: 14px;
}

.welcome-icon {
  opacity: 0.7;
}

.kpi-row {
  margin-bottom: 32px;
}

.stat-card {
  text-align: center;
  padding: 24px 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: default;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.stat-card__header {
  margin-bottom: 12px;
}

.stat-card--blue .stat-card__header { color: #409eff; }
.stat-card--green .stat-card__header { color: #67c23a; }
.stat-card--red .stat-card__header { color: #f56c6c; }
.stat-card--purple .stat-card__header { color: #a855f7; }

.stat-card--blue { border-top: 3px solid #409eff; }
.stat-card--green { border-top: 3px solid #67c23a; }
.stat-card--red { border-top: 3px solid #f56c6c; }
.stat-card--purple { border-top: 3px solid #a855f7; }

.stat-card__value {
  font-size: 36px;
  font-weight: 800;
  margin: 0;
  color: #303133;
}

.stat-card--red .stat-card__value { color: #f56c6c; }

.stat-card__label {
  margin: 8px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #303133;
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, color 0.2s;
  color: #606266;
  font-size: 14px;
}

.quick-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  color: #409eff;
}
</style>
