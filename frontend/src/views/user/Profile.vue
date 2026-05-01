<template>
  <div class="profile-page" v-loading="loading">
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <div class="section-header__left">
            <el-icon :size="20"><UserFilled /></el-icon>
            <span>个人信息</span>
          </div>
        </div>
      </template>

      <el-row :gutter="48">
        <el-col :span="14">
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="profile-form">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="用户名">
                  <el-input v-model="form.username" disabled>
                    <template #prefix><el-icon><User /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="真实姓名" prop="realName">
                  <el-input v-model="form.realName" placeholder="请输入真实姓名">
                    <template #prefix><el-icon><EditPen /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="form.phone" maxlength="11" placeholder="请输入手机号">
                    <template #prefix><el-icon><Iphone /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="身份证号" prop="idCard">
                  <el-input v-model="form.idCard" placeholder="请输入身份证号">
                    <template #prefix><el-icon><Postcard /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item class="form-actions">
              <el-button type="primary" size="default" @click="handleSave">
                <el-icon><Select /></el-icon>保存修改
              </el-button>
              <el-button size="default" @click="handleReset">
                <el-icon><RefreshLeft /></el-icon>恢复原始
              </el-button>
            </el-form-item>
          </el-form>
        </el-col>

        <el-col :span="10">
          <div class="profile-sidebar">
            <div class="avatar-placeholder">
              <el-icon :size="56"><Avatar /></el-icon>
            </div>
            <p class="avatar-label">{{ form.realName || form.username }}</p>
            <p class="avatar-username">@{{ form.username }}</p>

            <el-divider />

            <div class="info-tips">
              <div class="info-tip">
                <el-icon><InfoFilled /></el-icon>
                <div>
                  <p class="info-tip__title">信息真实性</p>
                  <p class="info-tip__desc">请确保填写的个人信息真实有效</p>
                </div>
              </div>
              <div class="info-tip">
                <el-icon><Lock /></el-icon>
                <div>
                  <p class="info-tip__title">身份验证</p>
                  <p class="info-tip__desc">身份证号修改后需重新验证身份</p>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getProfile, updateProfile } from '@/api/user'
import { ElMessage } from 'element-plus'

const formRef = ref(null)
const loading = ref(true)

const form = reactive({
  username: '',
  realName: '',
  phone: '',
  idCard: '',
})

const rules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^\d{15}(\d{2}[0-9Xx])?$/, message: '身份证号格式不正确', trigger: 'blur' },
  ],
}

async function loadProfile() {
  try {
    const res = await getProfile()
    const data = res.data || {}
    form.username = data.username || ''
    form.realName = data.realName || ''
    form.phone = data.phone || ''
    form.idCard = data.idCard || ''
  } catch {
    // ignore
  }
}

function handleReset() {
  loadProfile()
  ElMessage.info('已恢复原始信息')
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    await updateProfile({
      realName: form.realName,
      phone: form.phone,
      idCard: form.idCard,
    })
    ElMessage.success('个人信息已更新')
  } catch {
    // handled by interceptor
  }
}

onMounted(async () => {
  await loadProfile()
  loading.value = false
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

/* ── 表单 ── */
.profile-form {
  padding-top: 4px;
}

.form-actions {
  margin-top: 8px;
}

.form-actions .el-button {
  gap: 6px;
}

/* ── 侧边栏 ── */
.profile-sidebar {
  text-align: center;
  padding: 20px 0;
}

.avatar-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e6f4ff 0%, #b3d8ff 100%);
  color: #409eff;
  margin-bottom: 14px;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
}

.avatar-label {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 4px 0;
}

.avatar-username {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* ── 提示信息 ── */
.info-tips {
  text-align: left;
}

.info-tip {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
  border-radius: 10px;
  background: #f8fafc;
  transition: background 0.2s;
}

.info-tip:hover {
  background: #f0f4ff;
}

.info-tip .el-icon {
  color: #e6a23c;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-tip__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.info-tip__desc {
  margin: 2px 0 0;
  font-size: 12px;
  color: #909399;
}
</style>
