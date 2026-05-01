<template>
  <div class="news-detail-page" v-loading="loading">
    <el-button text class="back-btn" @click="$router.push('/news')">
      <el-icon><ArrowLeft /></el-icon>返回公告列表
    </el-button>

    <el-card v-if="notice" shadow="never" class="detail-card">
      <h2>{{ notice.title }}</h2>
      <div class="detail-meta">
        <span class="meta-date">
          <el-icon><Clock /></el-icon>
          {{ notice.publishedAt || notice.updatedAt || '' }}
        </span>
      </div>
      <div class="detail-summary" v-if="notice.summary">
        <el-icon><Document /></el-icon>
        {{ notice.summary }}
      </div>
      <el-divider />
      <div class="detail-content">{{ notice.content }}</div>
    </el-card>

    <div v-else-if="!loading" class="empty-state">
      <el-icon :size="48"><Warning /></el-icon>
      <p>公告不存在或已被删除</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPublicNoticeDetail } from '@/api/public'

const route = useRoute()
const notice = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getPublicNoticeDetail(route.params.id)
    notice.value = res.data
  } catch {
    notice.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.news-detail-page {
  max-width: 800px;
  margin: 0 auto;
}

.back-btn {
  margin-bottom: 20px;
  font-size: 14px;
  color: #606266;
}

.detail-card {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.detail-card h2 {
  font-size: 26px;
  margin: 0 0 12px;
  color: #303133;
  line-height: 1.4;
}

.detail-meta {
  margin-bottom: 20px;
}

.meta-date {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #a8abb2;
}

.detail-summary {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc, #f0f4f8);
  border-radius: 10px;
  color: #606266;
  font-size: 15px;
  line-height: 1.7;
}

.detail-summary .el-icon {
  color: #409eff;
  flex-shrink: 0;
  margin-top: 2px;
}

.detail-content {
  font-size: 15px;
  line-height: 2;
  color: #303133;
  white-space: pre-wrap;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
  color: #c0c4cc;
}

.empty-state p {
  margin: 14px 0 0;
  font-size: 15px;
  color: #909399;
}
</style>
