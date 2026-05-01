<template>
  <div class="news-page">
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <div class="section-header__left">
            <el-icon :size="20"><Bell /></el-icon>
            <span>新闻公告</span>
          </div>
          <span class="result-count" v-if="totalElements > 0">共 {{ totalElements }} 条</span>
        </div>
      </template>

      <div v-if="notices.length > 0" class="notice-list">
        <div
          v-for="(notice, idx) in notices"
          :key="notice.id"
          class="notice-card"
          @click="$router.push(`/news/${notice.id}`)"
          :style="{ animationDelay: `${idx * 0.05}s` }"
        >
          <div class="notice-card__date">
            <span class="date-day">{{ formatDay(notice.publishedAt || notice.updatedAt) }}</span>
            <span class="date-month">{{ formatMonth(notice.publishedAt || notice.updatedAt) }}</span>
          </div>
          <div class="notice-card__body">
            <h3>{{ notice.title }}</h3>
            <p v-if="notice.summary">{{ notice.summary }}</p>
          </div>
          <div class="notice-card__arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <el-icon :size="48"><Bell /></el-icon>
        <p>暂无公告</p>
        <span>有新消息时会第一时间在这里展示</span>
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
import { listPublicNotices } from '@/api/public'

const notices = ref([])
const currentPage = ref(1)
const pageSize = 10
const totalPages = ref(1)
const totalElements = ref(0)

function formatDay(dateStr) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  return String(d.getDate()).padStart(2, '0')
}

function formatMonth(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${d.getMonth() + 1}`
}

async function loadNotices() {
  try {
    const res = await listPublicNotices({ page: currentPage.value - 1, size: pageSize })
    notices.value = Array.isArray(res.data) ? res.data : []
    totalPages.value = res.pagination?.totalPages || 1
    totalElements.value = res.pagination?.totalElements || 0
  } catch {
    notices.value = []
  }
}

function handlePageChange(page) {
  currentPage.value = page
  loadNotices()
}

onMounted(loadNotices)
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

.result-count {
  font-size: 13px;
  color: #a8abb2;
}

/* ── 公告列表 ── */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notice-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  animation: cardIn 0.4s ease both;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.notice-card:hover {
  transform: translateX(4px);
  border-color: #d9ecff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.1);
}

.notice-card__date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 56px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 10px;
}

.date-day {
  font-size: 22px;
  font-weight: 800;
  color: #409eff;
  line-height: 1.2;
}

.date-month {
  font-size: 12px;
  color: #909399;
}

.notice-card__body {
  flex: 1;
  min-width: 0;
}

.notice-card__body h3 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-card__body p {
  margin: 0;
  font-size: 13px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-card__arrow {
  color: #c0c4cc;
  flex-shrink: 0;
}

.notice-card:hover .notice-card__arrow {
  color: #409eff;
}

/* ── 空状态 ── */
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
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
</style>
