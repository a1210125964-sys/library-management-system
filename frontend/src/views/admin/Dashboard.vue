<template>
  <div class="admin-dashboard" v-loading="loading">
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>运营核心指标</span>
          <el-button size="small" @click="loadStats">刷新数据</el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6" v-for="stat in statsList" :key="stat.label">
          <el-card shadow="hover">
            <p class="stat-name">{{ stat.label }}</p>
            <p class="stat-value">{{ stat.value }}</p>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never" style="margin-top: 24px;">
      <template #header>
        <span>最新公告（预览）</span>
        <el-button size="small" style="float: right;" @click="$router.push('/admin/notices')">进入公告管理</el-button>
      </template>
      <el-table :data="notices" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column label="发布状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.published ? 'success' : 'info'" size="small">{{ row.published ? '已发布' : '草稿' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="160" />
      </el-table>
      <el-empty v-if="notices.length === 0" description="暂无公告" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getStats, listNotices } from '@/api/admin'

const loading = ref(true)
const stats = ref({})
const notices = ref([])

const statsList = computed(() => [
  { label: '系统用户总数', value: stats.value.userCount ?? '--' },
  { label: '馆藏图书总量', value: stats.value.bookCount ?? '--' },
  { label: '累计借阅记录', value: stats.value.borrowCount ?? '--' },
  { label: '当前在借图书', value: stats.value.activeBorrowCount ?? '--' },
  { label: '逾期记录数量', value: stats.value.overdueRecordCount ?? '--' },
])

async function loadStats() {
  try {
    const [statsRes, noticesRes] = await Promise.all([
      getStats(),
      listNotices({ page: 0, size: 5 }),
    ])
    stats.value = statsRes.data || {}
    notices.value = Array.isArray(noticesRes.data) ? noticesRes.data : []
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<style scoped>
.stat-name {
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
}
</style>
