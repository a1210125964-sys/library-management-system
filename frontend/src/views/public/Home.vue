<template>
  <div class="home-page">
    <!-- Hero 区域 -->
    <section class="hero">
      <div class="hero-bg-shapes">
        <span class="shape shape-1"></span>
        <span class="shape shape-2"></span>
        <span class="shape shape-3"></span>
      </div>
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="title-line">探索知识海洋</span>
          <span class="title-line accent">畅享阅读乐趣</span>
        </h1>
        <p class="hero-desc">高效便捷的在线图书管理平台，让每一本好书都能找到它的读者</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" round @click="$router.push('/catalog')">
            <el-icon><Collection /></el-icon>浏览图书目录
          </el-button>
          <el-button size="large" round @click="$router.push('/news')" class="btn-outline">
            <el-icon><Bell /></el-icon>查看新闻公告
          </el-button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat" v-for="stat in heroStats" :key="stat.label">
            <span class="hero-stat__num">{{ stat.value }}</span>
            <span class="hero-stat__label">{{ stat.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 特性区域 -->
    <section class="features">
      <div class="section-intro">
        <h2>为什么选择我们</h2>
        <p>一站式图书管理，让阅读管理更简单</p>
      </div>
      <el-row :gutter="24">
        <el-col :span="8">
          <div class="feature-card">
            <div class="feature-card__icon feature-card__icon--blue">
              <el-icon :size="32"><Notebook /></el-icon>
            </div>
            <h3>海量藏书</h3>
            <p>涵盖计算机科学、编程、数据库、人工智能等多个领域，持续更新馆藏资源。</p>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="feature-card">
            <div class="feature-card__icon feature-card__icon--green">
              <el-icon :size="32"><Clock /></el-icon>
            </div>
            <h3>便捷借阅</h3>
            <p>在线借阅、续借、归还一站式操作，实时查看借阅状态与历史记录。</p>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="feature-card">
            <div class="feature-card__icon feature-card__icon--purple">
              <el-icon :size="32"><DataLine /></el-icon>
            </div>
            <h3>智能管理</h3>
            <p>数据驱动运营决策，逾期自动扫描，系统配置灵活可调。</p>
          </div>
        </el-col>
      </el-row>
    </section>

    <!-- 使用流程 -->
    <section class="how-it-works">
      <div class="section-intro">
        <h2>使用流程</h2>
        <p>三步即可开始你的阅读之旅</p>
      </div>
      <div class="steps">
        <div class="step">
          <div class="step-badge">1</div>
          <el-icon :size="36"><UserFilled /></el-icon>
          <h4>注册账号</h4>
          <p>填写基本信息，完成身份认证</p>
        </div>
        <div class="step-connector"></div>
        <div class="step">
          <div class="step-badge">2</div>
          <el-icon :size="36"><Search /></el-icon>
          <h4>查找图书</h4>
          <p>搜索感兴趣的书，查看库存信息</p>
        </div>
        <div class="step-connector"></div>
        <div class="step">
          <div class="step-badge">3</div>
          <el-icon :size="36"><Reading /></el-icon>
          <h4>借阅阅读</h4>
          <p>一键借阅，到期归还或续借</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { listPublicBooks } from '@/api/public'
import { listPublicNotices } from '@/api/public'

const heroStats = ref([
  { label: '馆藏图书', value: '--' },
  { label: '累计借阅', value: '--' },
  { label: '活跃用户', value: '--' },
])

onMounted(async () => {
  try {
    const [bookRes, noticeRes] = await Promise.all([
      listPublicBooks({ page: 0, size: 0 }),
      listPublicNotices({ page: 0, size: 0 }),
    ])
    const bookTotal = bookRes.pagination?.totalElements ?? '--'
    const noticeTotal = noticeRes.pagination?.totalElements ?? '--'
    heroStats.value = [
      { label: '馆藏图书', value: bookTotal },
      { label: '公告资讯', value: noticeTotal },
      { label: '便捷高效', value: '24h' },
    ]
  } catch {
    // keep defaults
  }
})
</script>

<style scoped>
/* ═══════════════ Hero ═══════════════ */
.hero {
  position: relative;
  overflow: hidden;
  padding: 80px 40px;
  text-align: center;
  background: linear-gradient(135deg, #e8f4fd 0%, #d4e8ff 30%, #e0e7ff 70%, #ede9fe 100%);
  border-radius: 24px;
  margin-bottom: 60px;
}

.hero-bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  background: #409eff;
  top: -40px;
  right: -40px;
  animation-delay: 0s;
}

.shape-2 {
  width: 140px;
  height: 140px;
  background: #a855f7;
  bottom: -20px;
  left: -30px;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  background: #67c23a;
  top: 60px;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-16px) scale(1.06); }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 44px;
  font-weight: 800;
  margin: 0 0 20px;
  line-height: 1.3;
}

.title-line {
  display: block;
  color: #303133;
}

.title-line.accent {
  color: #409eff;
}

.hero-desc {
  font-size: 18px;
  color: #606266;
  max-width: 520px;
  margin: 0 auto 36px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 48px;
}

.btn-outline {
  border-color: #c0c4cc;
  color: #606266;
}

.btn-outline:hover {
  border-color: #409eff;
  color: #409eff;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 60px;
}

.hero-stat {
  text-align: center;
}

.hero-stat__num {
  display: block;
  font-size: 32px;
  font-weight: 800;
  color: #303133;
}

.hero-stat__label {
  display: block;
  margin-top: 4px;
  font-size: 14px;
  color: #909399;
}

/* ═══════════════ 通用区块头 ═══════════════ */
.section-intro {
  text-align: center;
  margin-bottom: 40px;
}

.section-intro h2 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.section-intro p {
  margin: 0;
  color: #909399;
  font-size: 15px;
}

/* ═══════════════ 特性卡片 ═══════════════ */
.features {
  margin-bottom: 60px;
}

.feature-card {
  text-align: center;
  padding: 36px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.25s, box-shadow 0.25s;
  cursor: default;
}

.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1);
}

.feature-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  margin-bottom: 20px;
}

.feature-card__icon--blue {
  background: linear-gradient(135deg, #e6f4ff, #b3d8ff);
  color: #409eff;
}

.feature-card__icon--green {
  background: linear-gradient(135deg, #f0fdf4, #bbf7d0);
  color: #22c55e;
}

.feature-card__icon--purple {
  background: linear-gradient(135deg, #f5f3ff, #ddd6fe);
  color: #a855f7;
}

.feature-card h3 {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.feature-card p {
  margin: 0;
  color: #606266;
  line-height: 1.7;
  font-size: 14px;
}

/* ═══════════════ 使用流程 ═══════════════ */
.how-it-works {
  margin-bottom: 60px;
}

.steps {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
}

.step {
  text-align: center;
  flex: 0 0 220px;
  position: relative;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  position: absolute;
  top: -8px;
  right: 40px;
}

.step .el-icon {
  color: #409eff;
  margin-bottom: 12px;
}

.step h4 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.step p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.step-connector {
  flex: 0 0 60px;
  height: 2px;
  background: linear-gradient(to right, #d9ecff, #409eff, #d9ecff);
  margin-top: 18px;
}
</style>
