<template>
  <div class="auth-page">
    <div class="auth-wrapper">
      <div class="auth-left">
        <el-icon :size="48"><Reading /></el-icon>
        <h2>图书管理系统</h2>
        <p>登录你的账号，开启阅读之旅</p>
      </div>

      <el-card shadow="never" class="auth-card">
        <h3>账号登录</h3>
        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="请输入密码"
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
              登录
            </el-button>
          </el-form-item>
        </el-form>
        <p class="auth-link">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </p>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const user = await auth.login(form)
    ElMessage.success('登录成功')
    if (user.role === 'ADMIN') {
      router.push('/admin/dashboard')
    } else {
      router.push('/user/dashboard')
    }
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
  max-width: 240px;
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
  width: 400px;
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
