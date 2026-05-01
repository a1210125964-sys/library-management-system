<template>
  <div class="borrowings-page" v-loading="loading">
    <!-- 当前借阅卡片 -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <div class="section-header__left">
            <el-icon :size="20"><Collection /></el-icon>
            <span>当前借阅</span>
            <el-tag v-if="!loading" :type="borrowings.length ? 'warning' : 'success'" size="small" effect="light" round>
              {{ borrowings.length }} 本
            </el-tag>
          </div>
          <span v-if="borrowings.length" class="section-header__hint">
            可续借或归还
          </span>
        </div>
      </template>

      <el-table v-if="borrowings.length" :data="borrowings" stripe class="clean-table">
        <el-table-column label="图书" prop="bookTitle" min-width="180" />
        <el-table-column label="借阅时间" prop="borrowTime" width="170" />
        <el-table-column label="应还时间" prop="dueTime" width="170" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'OVERDUE' ? 'danger' : ''" effect="plain" size="small">
              {{ row.status === 'BORROWED' ? '借阅中' : row.status === 'OVERDUE' ? '逾期' : row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" :icon="Refresh" link @click="handleRenew(row)">续借</el-button>
            <el-button size="small" type="success" :icon="Check" link @click="handleReturn(row)">归还</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-else class="empty-state">
        <el-icon :size="48"><Reading /></el-icon>
        <p>暂无借阅记录</p>
        <span>去下面挑一本感兴趣的书吧</span>
      </div>
    </el-card>

    <!-- 可借图书卡片 -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <div class="section-header__left">
            <el-icon :size="20"><Notebook /></el-icon>
            <span>可借图书</span>
          </div>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item>
          <el-input
            v-model="keyword"
            placeholder="搜索书名或作者"
            clearable
            :prefix-icon="Search"
            @keyup.enter="loadAvailableBooks"
            size="default"
            style="width: 280px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadAvailableBooks">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table v-if="availableBooks.length" :data="availableBooks" stripe class="clean-table">
        <el-table-column label="书名" prop="title" min-width="180" />
        <el-table-column label="作者" prop="author" width="140" />
        <el-table-column label="分类" prop="category" width="100" />
        <el-table-column label="可借数量" prop="availableStock" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.availableStock > 3 ? 'success' : row.availableStock > 0 ? 'warning' : 'danger'" effect="plain" size="small">
              {{ row.availableStock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              :disabled="row.availableStock <= 0"
              @click="handleBorrow(row)"
            >
              借阅
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-else class="empty-state">
        <el-icon :size="48"><Search /></el-icon>
        <p>没有找到匹配的图书</p>
        <span>试试换个关键词</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Check } from '@element-plus/icons-vue'
import { getMyBorrowings } from '@/api/borrow'
import { borrowBook, returnBook, renewBook } from '@/api/borrow'
import { listPublicBooks } from '@/api/public'

const loading = ref(true)
const borrowings = ref([])
const availableBooks = ref([])
const keyword = ref('')

async function loadBorrowings() {
  try {
    const res = await getMyBorrowings()
    borrowings.value = Array.isArray(res.data) ? res.data : []
  } catch {
    borrowings.value = []
  }
}

async function loadAvailableBooks() {
  try {
    const res = await listPublicBooks({ keyword: keyword.value, page: 0, size: 50 })
    availableBooks.value = Array.isArray(res.data) ? res.data : []
  } catch {
    availableBooks.value = []
  }
}

async function handleBorrow(book) {
  try {
    const { value: days } = await ElMessageBox.prompt('请输入借阅天数', '借阅', {
      inputValue: '30',
      inputValidator: (v) => {
        if (!/^\d+$/.test(v) || parseInt(v, 10) < 1) return '请输入有效的正整数天数'
        return true
      },
    })
    const dueTime = new Date()
    dueTime.setDate(dueTime.getDate() + parseInt(days, 10))
    const pad = (n) => String(n).padStart(2, '0')
    const formattedDueTime = `${dueTime.getFullYear()}-${pad(dueTime.getMonth() + 1)}-${pad(dueTime.getDate())}T${pad(dueTime.getHours())}:${pad(dueTime.getMinutes())}`
    await borrowBook(book.id, formattedDueTime)
    ElMessage.success('借阅成功')
    loadBorrowings()
    loadAvailableBooks()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '借阅失败')
  }
}

async function handleReturn(row) {
  try {
    await ElMessageBox.confirm('确认归还此书？', '提示')
    await returnBook(row.id)
    ElMessage.success('归还成功')
    loadBorrowings()
    loadAvailableBooks()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '归还失败')
  }
}

async function handleRenew(row) {
  try {
    const { value: days } = await ElMessageBox.prompt('请输入续借天数', '续借', {
      inputValue: '30',
      inputValidator: (v) => {
        if (!/^\d+$/.test(v) || parseInt(v, 10) < 1) return '请输入有效的正整数天数'
        return true
      },
    })
    const dueTime = new Date(row.dueTime)
    dueTime.setDate(dueTime.getDate() + parseInt(days, 10))
    const pad = (n) => String(n).padStart(2, '0')
    const formattedDueTime = `${dueTime.getFullYear()}-${pad(dueTime.getMonth() + 1)}-${pad(dueTime.getDate())}T${pad(dueTime.getHours())}:${pad(dueTime.getMinutes())}`
    await renewBook(row.id, formattedDueTime)
    ElMessage.success('续借成功')
    loadBorrowings()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '续借失败')
  }
}

onMounted(async () => {
  await Promise.all([loadBorrowings(), loadAvailableBooks()])
  loading.value = false
})
</script>

<style scoped>
.section-card {
  margin-bottom: 24px;
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

.section-header__hint {
  font-size: 12px;
  color: #a8abb2;
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

.search-form {
  margin-bottom: 0;
}
</style>
