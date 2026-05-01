<template>
  <div class="auth-page">
    <div class="auth-wrapper">
      <div class="auth-left">
        <el-icon :size="48"><Reading /></el-icon>
        <h2>图书管理系统</h2>
        <p>创建账号，畅享借阅服务</p>
      </div>

      <el-card shadow="never" class="auth-card">
        <h3>账号注册</h3>
        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleRegister">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名（3-50个字符）"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>
          <el-form-item prop="realName">
            <el-input
              v-model="form.realName"
              placeholder="请输入真实姓名"
              size="large"
              :prefix-icon="EditPen"
            />
          </el-form-item>
          <el-form-item prop="phone">
            <el-input
              v-model="form.phone"
              placeholder="11位手机号"
              maxlength="11"
              size="large"
              :prefix-icon="Iphone"
            />
          </el-form-item>
          <el-form-item prop="idCard">
            <el-input
              v-model="form.idCard"
              placeholder="15或18位身份证号"
              size="large"
              :prefix-icon="Postcard"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="密码（6-30个字符）"
              size="large"
              :prefix-icon="Lock"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              native-type="submit"
              :loading="loading"
              size="large"
              style="width: 100%;"
              round
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>
        <p class="auth-link">
          已有账号？<router-link to="/login">立即登录</router-link>
        </p>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { User, EditPen, Iphone, Postcard, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  realName: '',
  phone: '',
  idCard: '',
  password: '',
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度应为3-50个字符', trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^\d{15}(\d{2}[0-9Xx])?$/, message: '身份证号格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 30, message: '密码长度应为6-30个字符', trigger: 'blur' },
  ],
}

async function handleRegister() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await register(form)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch {
    // Error already handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 65vh;
}

.auth-wrapper {
  display: flex;
  align-items: center;
  gap: 60px;
}

.auth-left {
  text-align: center;
  color: #409eff;
  max-width: 200px;
}

.auth-left h2 {
  margin: 16px 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.auth-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.auth-card {
  width: 420px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.auth-card :deep(.el-card__body) {
  padding: 32px;
}

.auth-card h3 {
  margin: 0 0 24px;
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.auth-link {
  text-align: center;
  color: #909399;
  font-size: 13px;
  margin: 0;
}

.auth-link a {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}
</style>
