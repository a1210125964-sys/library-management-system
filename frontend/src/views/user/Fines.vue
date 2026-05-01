<template>
  <div class="fines-page" v-loading="loading">
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <div class="section-header__left">
            <el-icon :size="20"><Coin /></el-icon>
            <span>罚款记录</span>
          </div>
        </div>
      </template>

      <div class="total-banner" :class="{ 'has-debt': totalFine > 0 }">
        <div class="total-icon-wrap">
          <el-icon :size="36">
            <Money v-if="totalFine > 0" />
            <CircleCheckFilled v-else />
          </el-icon>
        </div>
        <div class="total-info">
          <p class="total-label">当前未缴罚款总计</p>
          <p class="total-value">
            <span v-if="totalFine > 0">{{ totalFine }} <small>元</small></span>
            <span v-else class="total-clear">无欠款</span>
          </p>
        </div>
        <div class="total-decoration" v-if="totalFine > 0">
          <el-icon :size="20"><WarningFilled /></el-icon>
          <span>请尽快缴纳</span>
        </div>
        <div class="total-decoration total-decoration--ok" v-else>
          <span>账户干净</span>
        </div>
      </div>

      <el-table v-if="records.length" :data="records" stripe class="clean-table" style="margin-top: 24px;">
        <el-table-column label="图书" prop="bookTitle" min-width="180">
          <template #default="{ row }">
            <span class="book-title-cell">{{ row.bookTitle }}</span>
          </template>
        </el-table-column>
        <el-table-column label="逾期天数" prop="overdueDays" width="100" align="center">
          <template #default="{ row }">
            <span class="overdue-days">{{ row.overdueDays }} 天</span>
          </template>
        </el-table-column>
        <el-table-column label="罚款金额" prop="overdueFee" width="120" align="center">
          <template #default="{ row }">
            <span class="fee-amount">{{ row.overdueFee }}</span>
          </template>
        </el-table-column>
        <el-table-column label="记录时间" prop="createdAt" width="180" />
      </el-table>

      <div v-else class="empty-state">
        <el-icon :size="48"><CircleCheckFilled /></el-icon>
        <p>暂无罚款记录</p>
        <span>保持良好的借阅习惯，不会有罚款</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getFines } from '@/api/user'

const loading = ref(true)
const records = ref([])
const totalFine = ref(0)

onMounted(async () => {
  try {
    const res = await getFines()
    const data = res.data || {}
    totalFine.value = data.totalFine || 0
    records.value = Array.isArray(data.records) ? data.records : []
  } catch {
    records.value = []
  } finally {
    loading.value = false
  }
})
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

/* ── 总额横幅 ── */
.total-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 32px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  transition: all 0.3s ease;
}

.total-banner.has-debt {
  background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%);
  border-color: #fecaca;
}

.total-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #dcfce7;
  color: #22c55e;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.has-debt .total-icon-wrap {
  background: #fef2f2;
  color: #f56c6c;
}

.total-info {
  flex: 1;
}

.total-label {
  margin: 0 0 4px 0;
  color: #909399;
  font-size: 14px;
}

.total-value {
  margin: 0;
  font-size: 36px;
  font-weight: 800;
  color: #22c55e;
  transition: color 0.3s;
}

.has-debt .total-value {
  color: #f56c6c;
}

.total-value small {
  font-size: 16px;
  font-weight: 500;
}

.total-clear {
  font-size: 30px;
  font-weight: 700;
}

.total-decoration {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
  font-size: 13px;
  font-weight: 500;
}

.total-decoration--ok {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

/* ── 表格 ── */
.book-title-cell {
  font-weight: 500;
}

.overdue-days {
  color: #e6a23c;
  font-weight: 600;
}

.fee-amount {
  color: #f56c6c;
  font-weight: 600;
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
</style>
