<template>
  <div class="admin-books">
    <el-card shadow="never" style="margin-bottom: 24px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>{{ isEditing ? '编辑图书' : '新建图书' }}</span>
          <div>
            <el-button type="primary" @click="submitForm">{{ isEditing ? '更新图书' : '保存图书' }}</el-button>
            <el-button v-if="isEditing" @click="resetForm">取消编辑</el-button>
          </div>
        </div>
      </template>
      <el-form :model="form" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="书名" required>
              <el-input v-model="form.title" placeholder="请输入书名" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="作者" required>
              <el-input v-model="form.author" placeholder="请输入作者" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出版社">
              <el-input v-model="form.publisher" placeholder="请输入出版社" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="ISBN" required>
              <el-input v-model="form.isbn" placeholder="请输入ISBN" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分类" required>
              <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%;">
                <el-option v-for="c in categories" :key="c.name" :label="c.name" :value="c.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="库存" required>
              <el-input-number v-model="form.stock" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>图书列表</span>
          <div style="display: flex; gap: 8px;">
            <el-input v-model="keyword" placeholder="搜索书名/作者/ISBN/分类" clearable style="width: 200px;" @keyup.enter="search" />
            <el-button type="primary" @click="search">搜索</el-button>
            <el-button @click="loadBooks">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table :data="books" stripe v-loading="tableLoading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="书名" min-width="160" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="isbn" label="ISBN" width="140" />
        <el-table-column prop="category" label="分类" width="90" />
        <el-table-column prop="stock" label="库存" width="60" />
        <el-table-column prop="availableStock" label="可借" width="60" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.active !== false ? 'success' : 'info'" size="small">
              {{ row.active !== false ? '在架' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="startEdit(row)">编辑</el-button>
            <el-button size="small" :type="row.active !== false ? 'warning' : 'success'" @click="handleShelve(row)">
              {{ row.active !== false ? '下架' : '上架' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!tableLoading && books.length === 0" description="暂无图书" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { listBooks, createBook, updateBook, deleteBook, shelveBook } from '@/api/books'
import { listCategories } from '@/api/categories'

const isEditing = ref(false)
const editId = ref(null)
const categories = ref([])
const books = ref([])
const keyword = ref('')
const currentPage = ref(1)
const pageSize = 10
const totalPages = ref(1)
const totalElements = ref(0)
const tableLoading = ref(false)

const form = reactive({
  title: '',
  author: '',
  publisher: '',
  isbn: '',
  category: '',
  stock: 0,
})

function resetForm() {
  isEditing.value = false
  editId.value = null
  form.title = ''
  form.author = ''
  form.publisher = ''
  form.isbn = ''
  form.category = ''
  form.stock = 0
}

function startEdit(book) {
  isEditing.value = true
  editId.value = book.id
  form.title = book.title || ''
  form.author = book.author || ''
  form.publisher = book.publisher || ''
  form.isbn = book.isbn || ''
  form.category = book.category || ''
  form.stock = book.stock ?? 0
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function submitForm() {
  if (!form.title || !form.author || !form.isbn || !form.category) {
    ElMessage.warning('请填写必填项')
    return
  }
  try {
    if (isEditing.value && editId.value) {
      await updateBook(editId.value, form)
      ElMessage.success('更新成功')
    } else {
      await createBook(form)
      ElMessage.success('创建成功')
    }
    resetForm()
    loadBooks()
  } catch {
    // handled by interceptor
  }
}

async function loadBooks() {
  tableLoading.value = true
  try {
    const res = await listBooks({
      page: currentPage.value - 1,
      size: pageSize,
      keyword: keyword.value,
      all: true,
    })
    books.value = Array.isArray(res.data) ? res.data : []
    totalPages.value = res.pagination?.totalPages || 1
    totalElements.value = res.pagination?.totalElements || 0
  } catch {
    books.value = []
  } finally {
    tableLoading.value = false
  }
}

function search() {
  currentPage.value = 1
  loadBooks()
}

function handlePageChange(page) {
  currentPage.value = page
  loadBooks()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除图书 #${row.id} 吗？`, '提示')
    await deleteBook(row.id)
    ElMessage.success('删除成功')
    if (editId.value === row.id) resetForm()
    loadBooks()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '删除失败')
  }
}

async function handleShelve(row) {
  const isActive = row.active !== false
  const action = isActive ? '下架' : '上架'
  try {
    await ElMessageBox.confirm(`确认${action}此图书吗？`, '提示')
    await shelveBook(row.id, !isActive)
    ElMessage.success(`${action}成功`)
    if (editId.value === row.id) resetForm()
    loadBooks()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || `${action}失败`)
  }
}

onMounted(async () => {
  try {
    const res = await listCategories()
    categories.value = Array.isArray(res.data) ? res.data : []
  } catch {
    categories.value = []
  }
  loadBooks()
})
</script>

<style scoped>
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
