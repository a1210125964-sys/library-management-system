<template>
  <div class="admin-notices">
    <el-card shadow="never" style="margin-bottom: 24px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>{{ isEditing ? '编辑公告' : '新建公告' }}</span>
          <div>
            <el-button type="primary" @click="submitForm">{{ isEditing ? '更新公告' : '保存公告' }}</el-button>
            <el-button v-if="isEditing" @click="resetForm">取消编辑</el-button>
          </div>
        </div>
      </template>
      <el-form :model="form" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标题" required>
              <el-input v-model="form.title" placeholder="请输入公告标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="摘要">
              <el-input v-model="form.summary" placeholder="摘要（可选）" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="内容" required>
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请输入公告正文" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.published">立即发布</el-checkbox>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>公告列表</span>
          <el-button @click="loadNotices">刷新列表</el-button>
        </div>
      </template>
      <el-table :data="notices" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.published ? 'success' : 'info'" size="small">{{ row.published ? '已发布' : '草稿' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publishedAt" label="发布时间" width="160" />
        <el-table-column prop="updatedAt" label="更新时间" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="startEdit(row)">编辑</el-button>
            <el-button v-if="!row.published" size="small" type="success" @click="handlePublish(row)">发布</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && notices.length === 0" description="暂无公告" />
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
import { listNotices, createNotice, updateNotice, deleteNotice, publishNotice } from '@/api/admin'

const isEditing = ref(false)
const editId = ref(null)
const notices = ref([])
const currentPage = ref(1)
const pageSize = 10
const totalPages = ref(1)
const totalElements = ref(0)
const loading = ref(false)

const form = reactive({
  title: '',
  summary: '',
  content: '',
  published: false,
})

function resetForm() {
  isEditing.value = false
  editId.value = null
  form.title = ''
  form.summary = ''
  form.content = ''
  form.published = false
}

function startEdit(row) {
  isEditing.value = true
  editId.value = row.id
  form.title = row.title || ''
  form.summary = row.summary || ''
  form.content = row.content || ''
  form.published = !!row.published
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function submitForm() {
  if (!form.title) { ElMessage.warning('请输入标题'); return }
  if (!form.content) { ElMessage.warning('请输入内容'); return }
  try {
    if (isEditing.value && editId.value) {
      await updateNotice(editId.value, form)
      ElMessage.success('更新成功')
    } else {
      await createNotice(form)
      ElMessage.success('创建成功')
    }
    resetForm()
    loadNotices()
  } catch {
    // handled by interceptor
  }
}

async function loadNotices() {
  loading.value = true
  try {
    const res = await listNotices({ page: currentPage.value - 1, size: pageSize })
    notices.value = Array.isArray(res.data) ? res.data : []
    totalPages.value = res.pagination?.totalPages || 1
    totalElements.value = res.pagination?.totalElements || 0
  } catch {
    notices.value = []
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  currentPage.value = page
  loadNotices()
}

async function handlePublish(row) {
  try {
    await ElMessageBox.confirm('确认发布此公告吗？发布后将对外公开。', '提示')
    await publishNotice(row.id)
    ElMessage.success('发布成功')
    if (editId.value === row.id) resetForm()
    loadNotices()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '发布失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除公告 #${row.id} 吗？`, '提示')
    await deleteNotice(row.id)
    ElMessage.success('删除成功')
    if (editId.value === row.id) resetForm()
    loadNotices()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '删除失败')
  }
}

onMounted(loadNotices)
</script>

<style scoped>
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
