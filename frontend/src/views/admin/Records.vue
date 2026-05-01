<template>
  <div class="admin-records">
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>借阅记录</span>
          <div style="display: flex; gap: 8px;">
            <el-select v-model="statusFilter" clearable placeholder="状态筛选" style="width: 120px;" @change="loadRecords">
              <el-option label="全部" value="" />
              <el-option label="借阅中" value="BORROWED" />
              <el-option label="已归还" value="RETURNED" />
              <el-option label="逾期" value="OVERDUE" />
            </el-select>
            <el-input v-model="keyword" placeholder="搜索用户/图书" clearable style="width: 180px;" @keyup.enter="search" />
            <el-button type="primary" @click="search">搜索</el-button>
            <el-button @click="loadRecords">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table :data="records" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户" width="100" />
        <el-table-column prop="bookTitle" label="图书" min-width="160" />
        <el-table-column prop="borrowTime" label="借阅时间" width="160" />
        <el-table-column prop="dueTime" label="应还时间" width="160" />
        <el-table-column prop="returnTime" label="归还时间" width="160" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'RETURNED' ? 'success' : row.status === 'OVERDUE' ? 'danger' : 'warning'" size="small">
              {{ row.status === 'BORROWED' ? '借阅中' : row.status === 'RETURNED' ? '已归还' : '逾期' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="renewCount" label="续借" width="60" />
        <el-table-column prop="overdueFee" label="逾期费" width="80" />
      </el-table>
      <el-empty v-if="!loading && records.length === 0" description="暂无记录" />
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
import { listRecords } from '@/api/admin'

const loading = ref(false)
const records = ref([])
const statusFilter = ref('')
const keyword = ref('')
const currentPage = ref(1)
const pageSize = 10
const totalPages = ref(1)
const totalElements = ref(0)

async function loadRecords() {
  loading.value = true
  try {
    const res = await listRecords({
      page: currentPage.value - 1,
      size: pageSize,
      status: statusFilter.value,
      keyword: keyword.value,
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

function search() {
  currentPage.value = 1
  loadRecords()
}

function handlePageChange(page) {
  currentPage.value = page
  loadRecords()
}

onMounted(loadRecords)
</script>

<style scoped>
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
