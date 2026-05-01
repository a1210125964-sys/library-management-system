<template>
  <div class="admin-users">
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>用户管理</span>
          <div>
            <el-select v-model="roleFilter" placeholder="角色筛选" clearable style="width: 120px; margin-right: 8px;" @change="loadUsers">
              <el-option label="全部" value="" />
              <el-option label="管理员" value="ADMIN" />
              <el-option label="用户" value="USER" />
            </el-select>
            <el-button @click="loadUsers">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table :data="users" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="角色" width="80">
          <template #default="{ row }">
            <el-tag :type="row.role === 'ADMIN' ? 'danger' : 'primary'" size="small">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button size="small" type="warning" @click="handleResetPassword(row)">重置密码</el-button>
            <el-button size="small" :type="row.role === 'ADMIN' ? 'info' : 'success'" @click="handleToggleRole(row)">
              {{ row.role === 'ADMIN' ? '设为用户' : '设为管理员' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && users.length === 0" description="暂无用户" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { listUsers, resetPassword, updateUserRole } from '@/api/admin'

const loading = ref(false)
const users = ref([])
const roleFilter = ref('')
const currentPage = ref(1)
const pageSize = 10
const totalPages = ref(1)
const totalElements = ref(0)

async function loadUsers() {
  loading.value = true
  try {
    const res = await listUsers({
      page: currentPage.value - 1,
      size: pageSize,
      role: roleFilter.value,
    })
    users.value = Array.isArray(res.data) ? res.data : []
    totalPages.value = res.pagination?.totalPages || 1
    totalElements.value = res.pagination?.totalElements || 0
  } catch {
    users.value = []
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  currentPage.value = page
  loadUsers()
}

async function handleResetPassword(row) {
  try {
    const { value } = await ElMessageBox.prompt('请输入新密码', '重置密码', {
      inputValue: '123456',
      inputValidator: (v) => (v && v.length >= 6) || '密码至少6位',
    })
    await resetPassword(row.id, value)
    ElMessage.success('密码已重置')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '重置失败')
  }
}

async function handleToggleRole(row) {
  const newRole = row.role === 'ADMIN' ? 'USER' : 'ADMIN'
  const label = newRole === 'ADMIN' ? '管理员' : '普通用户'
  try {
    await ElMessageBox.confirm(
      `确认将用户 "${row.realName || row.username}" 的角色修改为【${label}】？`,
      '修改角色',
      { confirmButtonText: '确认修改', cancelButtonText: '取消', type: 'warning' },
    )
    await updateUserRole(row.id, newRole)
    ElMessage.success('角色修改成功')
    loadUsers()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '修改失败')
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
