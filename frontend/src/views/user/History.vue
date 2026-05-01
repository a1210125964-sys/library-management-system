<template>
  <div class="history-page" v-loading="loading">
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <div class="section-header__left">
            <el-icon :size="20"><Document /></el-icon>
            <span>借阅历史</span>
          </div>
        </div>
      </template>

      <div class="filter-bar">
        <div class="filter-tabs">
          <el-radio-group v-model="statusFilter" size="default" @change="handleFilterChange">
            <el-radio-button label="">
              <span>全部</span>
            </el-radio-button>
            <el-radio-button label="RETURNED">
              <span>已归还</span>
            </el-radio-button>
            <el-radio-button label="OVERDUE">
              <span>逾期</span>
            </el-radio-button>
          </el-radio-group>
        </div>
        <span class="result-count" v-if="totalElements > 0">共 {{ totalElements }} 条记录</span>
      </div>

      <el-table v-if="records.length" :data="records" stripe class="clean-table">
        <el-table-column label="图书" prop="bookTitle" min-width="180">
          <template #default="{ row }">
            <span class="book-title-cell">{{ row.bookTitle }}</span>
          </template>
        </el-table-column>
        <el-table-column label="借阅时间" prop="borrowTime" width="175" />
        <el-table-column label="应还时间" prop="dueTime" width="175" />
        <el-table-column label="归还时间" prop="returnTime" width="175" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.overdueFee > 0 ? 'danger' : 'success'" effect="plain" size="small">
              {{ row.overdueFee > 0 ? '逾期归还' : '正常归还' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="逾期费" prop="overdueFee" width="90" align="center">
          <template #default="{ row }">
            <span :class="row.overdueFee > 0 ? 'fee-positive' : 'fee-zero'">
              {{ row.overdueFee }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <div v-else class="empty-state">
        <el-icon :size="48"><DocumentCopy /></el-icon>
        <p>暂无历史记录</p>
        <span>你借阅过的书在归还后会出现在这里</span>
      </div>

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
import { getHistory } from '@/api/user'

const loading = ref(true)
const records = ref([])
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = 10
const totalPages = ref(1)
const totalElements = ref(0)

async function loadHistory() {
  loading.value = true
  try {
    const filter = statusFilter.value || undefined
    const res = await getHistory({ page: currentPage.value - 1, size: pageSize, status: filter })
    records.value = Array.isArray(res.data) ? res.data : []
    totalPages.value = res.pagination?.totalPages || 1
    totalElements.value = res.pagination?.totalElements || 0
  } catch {
    records.value = []
  } finally {
    loading.value = false
  }
}

function handleFilterChange() {
  currentPage.value = 1
  loadHistory()
}

function handlePageChange(page) {
  currentPage.value = page
  loadHistory()
}

onMounted(loadHistory)
</script>

<style scoped>
.section-card {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.section-card :deep(.el-card__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 14px 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

.section-header__left .el-icon {
  color: #409eff;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.result-count {
  font-size: 13px;
  color: #a8abb2;
}

.book-title-cell {
  font-weight: 500;
}

.fee-positive {
  color: #f56c6c;
  font-weight: 600;
}

.fee-zero {
  color: #c0c4cc;
}

.clean-table {
  --el-table-row-hover-bg-color: #f5f7fa;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
  color: #c0c4cc;
}

.empty-state p {
  margin: 14px 0 6px;
  font-size: 15px;
  color: #909399;
}

.empty-state span {
  font-size: 13px;
  color: #c0c4cc;
}

.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
