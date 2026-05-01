<template>
  <div class="catalog-page">
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <div class="section-header__left">
            <el-icon :size="20"><Collection /></el-icon>
            <span>图书目录</span>
          </div>
          <span class="result-count" v-if="totalElements > 0">共 {{ totalElements }} 本</span>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索书名、作者或 ISBN"
          clearable
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          size="large"
          class="search-input"
        />
        <el-button type="primary" size="large" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button size="large" @click="handleReset">重置</el-button>
      </div>

      <el-row :gutter="20" v-if="books.length > 0">
        <el-col :span="6" v-for="book in books" :key="book.id" style="margin-bottom: 20px;">
          <div class="book-card">
            <div class="book-card__cover">
              <el-icon :size="36"><Notebook /></el-icon>
            </div>
            <div class="book-card__body">
              <h3 class="book-card__title" :title="book.title">{{ book.title }}</h3>
              <p class="book-card__author">{{ book.author }}</p>
              <div class="book-card__meta">
                <el-tag size="small" effect="plain">{{ book.category }}</el-tag>
                <span class="stock-badge" :class="stockClass(book.availableStock)">
                  {{ book.availableStock > 0 ? `可借 ${book.availableStock}` : '已借完' }}
                </span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <div v-else class="empty-state">
        <el-icon :size="48"><FolderOpened /></el-icon>
        <p>暂无图书数据</p>
        <span>换个关键词试试</span>
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
import { Search } from '@element-plus/icons-vue'
import { listPublicBooks } from '@/api/public'

const keyword = ref('')
const books = ref([])
const currentPage = ref(1)
const pageSize = 12
const totalPages = ref(1)
const totalElements = ref(0)

function stockClass(stock) {
  if (stock > 3) return 'stock--high'
  if (stock > 0) return 'stock--low'
  return 'stock--zero'
}

async function loadBooks() {
  try {
    const res = await listPublicBooks({
      page: currentPage.value - 1,
      size: pageSize,
      keyword: keyword.value,
    })
    books.value = Array.isArray(res.data) ? res.data : []
    totalPages.value = res.pagination?.totalPages || 1
    totalElements.value = res.pagination?.totalElements || 0
  } catch {
    books.value = []
  }
}

function handleSearch() {
  currentPage.value = 1
  loadBooks()
}

function handleReset() {
  keyword.value = ''
  currentPage.value = 1
  loadBooks()
}

function handlePageChange(page) {
  currentPage.value = page
  loadBooks()
}

onMounted(loadBooks)
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

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-input {
  max-width: 360px;
}

/* ── 图书卡片 ── */
.book-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: default;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
}

.book-card__cover {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f5ff, #e8f0fe);
  color: #a0c4ff;
}

.book-card__body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.book-card__title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-card__author {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.book-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 12px;
}

.stock-badge {
  font-size: 12px;
  font-weight: 500;
}

.stock--high { color: #67c23a; }
.stock--low { color: #e6a23c; }
.stock--zero { color: #f56c6c; }

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
