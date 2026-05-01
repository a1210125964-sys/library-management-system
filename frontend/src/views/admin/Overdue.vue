<template>
  <div class="admin-overdue">
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>逾期记录</span>
          <div>
            <el-tag type="danger" style="margin-right: 12px;">
              当前逾期: {{ stats.currentOverdueCount || 0 }} 条
            </el-tag>
            <el-button @click="loadStats">刷新统计</el-button>
            <el-button @click="loadRecords">刷新列表</el-button>
          </div>
        </div>
      </template>
      <el-table :data="records" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" width="100" />
        <el-table-column prop="realName" label="真实姓名" width="100" />
        <el-table-column prop="bookTitle" label="图书名称" min-width="160" />
        <el-table-column prop="overdueDays" label="逾期天数" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.overdueDays }} 天</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="overdueFee" label="逾期费用(元)" width="120" align="right">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600;">{{ row.overdueFee }}</span>
          </template>
        </el-table-column>
        <el-table-column label="借阅时间" width="160">
          <template #default="{ row }">{{ formatTime(row.borrowTime) }}</template>
        </el-table-column>
        <el-table-column label="应还时间" width="160">
          <template #default="{ row }">{{ formatTime(row.dueTime) }}</template>
        </el-table-column>
        <el-table-column label="归还时间" width="160">
          <template #default="{ row }">{{ formatTime(row.returnTime) }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="生成时间" width="160" />
      </el-table>
      <el-empty v-if="!loading && records.length === 0" description="暂无逾期记录" />
      <div class="pagination-wrap" v-if="totalPages > 1">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalElements"
          layout="prev, pager, next"
          @current-change="handlePageChange"
          background
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { listOverdueRecords, getOverdueStats } from '@/api/admin'

const loading = ref(false)
const records = ref([])
const currentPage = ref(1)
const pageSize = 10
const totalPages = ref(1)
const totalElements = ref(0)

const stats = reactive({
  currentOverdueCount: 0,
  overdueRecordCount: 0,
})

function formatTime(str) {
  if (!str) return '-'
  return str
}

async function loadRecords() {
  loading.value = true
  try {
    const res = await listOverdueRecords({
      page: currentPage.value - 1,
      size: pageSize,
    })
    records.value = Array.isArray(res.data) ? res.data : []
    totalPages.value = res.pagination?.totalPages || 1
    totalElements.value = res.pagination?.totalElements || 0
  } catch {
    records.value = []
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res = await getOverdueStats()
    Object.assign(stats, res.data || {})
  } catch {
    // ignore
  }
}

function handlePageChange(page) {
  currentPage.value = page
  loadRecords()
}

onMounted(() => {
  loadRecords()
  loadStats()
})
</script>

<style scoped>
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
