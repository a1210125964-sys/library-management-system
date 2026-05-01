<template>
  <div class="admin-settings">
    <el-card shadow="never">
      <template #header><span>系统参数配置</span></template>
      <el-form :model="form" label-width="140px" :rules="rules" ref="formRef" v-loading="loading">
        <el-form-item label="默认借阅天数" prop="borrowDays">
          <el-input-number v-model="form.borrowDays" :min="1" :max="90" />
          <span class="form-tip">新借阅时的默认归还天数</span>
        </el-form-item>
        <el-form-item label="最大借阅数量" prop="maxBorrowCount">
          <el-input-number v-model="form.maxBorrowCount" :min="1" :max="20" />
          <span class="form-tip">每位用户同时可借阅的最大图书数量</span>
        </el-form-item>
        <el-form-item label="每日逾期费用(元)" prop="overdueDailyFee">
          <el-input-number v-model="form.overdueDailyFee" :min="0" :precision="2" :step="0.5" />
          <span class="form-tip">逾期图书每天的罚款金额</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">保存配置</el-button>
          <el-button @click="loadConfigs">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px;">
      <template #header><span>逾期统计概览</span></template>
      <el-row :gutter="20" v-loading="statsLoading">
        <el-col :span="6">
          <el-statistic title="当前逾期记录" :value="stats.currentOverdueCount || 0" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="逾期记录总数" :value="stats.overdueRecordCount || 0" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="活跃借阅数" :value="stats.activeBorrowCount || 0" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="用户总数" :value="stats.userCount || 0" />
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getConfigs, updateConfigs, getOverdueStats } from '@/api/admin'

const loading = ref(false)
const saving = ref(false)
const statsLoading = ref(false)
const formRef = ref(null)

const form = reactive({
  borrowDays: 30,
  maxBorrowCount: 5,
  overdueDailyFee: 1.0,
})

const stats = reactive({
  currentOverdueCount: 0,
  overdueRecordCount: 0,
  activeBorrowCount: 0,
  userCount: 0,
})

const rules = {
  borrowDays: [{ required: true, message: '请输入借阅天数', trigger: 'blur' }],
  maxBorrowCount: [{ required: true, message: '请输入最大借阅数量', trigger: 'blur' }],
  overdueDailyFee: [{ required: true, message: '请输入逾期费用', trigger: 'blur' }],
}

async function loadConfigs() {
  loading.value = true
  try {
    const res = await getConfigs()
    const data = res.data || {}
    form.borrowDays = Number(data.borrow_days) || 30
    form.maxBorrowCount = Number(data.max_borrow_count) || 5
    form.overdueDailyFee = Number(data.overdue_daily_fee) || 1.0
  } catch {
    ElMessage.error('加载配置失败')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  statsLoading.value = true
  try {
    const res = await getOverdueStats()
    Object.assign(stats, res.data || {})
  } catch {
    // ignore stats errors
  } finally {
    statsLoading.value = false
  }
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    await updateConfigs({
      borrowDays: form.borrowDays,
      maxBorrowCount: form.maxBorrowCount,
      overdueDailyFee: form.overdueDailyFee,
    })
    ElMessage.success('配置已保存')
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfigs()
  loadStats()
})
</script>

<style scoped>
.form-tip {
  margin-left: 12px;
  font-size: 13px;
  color: #909399;
}
</style>
