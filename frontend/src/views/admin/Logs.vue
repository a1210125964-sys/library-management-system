<template>
  <div class="admin-logs">
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>系统日志</span>
          <el-button @click="loadLogs">刷新</el-button>
        </div>
      </template>
      <el-table :data="logs" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="adminName" label="管理员" width="100" />
        <el-table-column prop="operation" label="操作" width="120" />
        <el-table-column prop="detail" label="详情" min-width="200" />
        <el-table-column label="结果" width="80">
          <template #default="{ row }">
            <el-tag :type="row.result === 'SUCCESS' ? 'success' : 'danger'" size="small">{{ row.result }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="durationMs" label="耗时(ms)" width="80" />
        <el-table-column prop="createdAt" label="操作时间" width="160" />
      </el-table>
      <el-empty v-if="!loading && logs.length === 0" description="暂无日志" />
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
import { ref, onMounted } from 'vue'
import { listLogs } from '@/api/admin'

const loading = ref(false)
const logs = ref([])
const currentPage = ref(1)
const pageSize = 10
const totalPages = ref(1)
const totalElements = ref(0)

async function loadLogs() {
  loading.value = true
  try {
    const res = await listLogs({ page: currentPage.value - 1, size: pageSize })
    logs.value = Array.isArray(res.data) ? res.data : []
    totalPages.value = res.pagination?.totalPages || 1
    totalElements.value = res.pagination?.totalElements || 0
  } catch {
    logs.value = []
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  currentPage.value = page
  loadLogs()
}

onMounted(loadLogs)
</script>

<style scoped>
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
