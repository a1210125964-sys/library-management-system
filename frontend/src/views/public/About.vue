<template>
  <div class="about-page">
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="section-header">
          <el-icon :size="20"><InfoFilled /></el-icon>
          <span>关于我们</span>
        </div>
      </template>

      <p class="intro-text">
        本图书管理系统致力于为图书馆提供高效、便捷的信息化管理解决方案。
        无论是公共用户浏览检索，还是注册用户在线借阅，我们都提供了流畅完整的体验。
      </p>
    </el-card>

    <el-row :gutter="24" style="margin-top: 24px;">
      <el-col :span="12">
        <el-card shadow="never" class="feature-block">
          <template #header>
            <div class="feature-block__title">
              <div class="feature-block__icon feature-block__icon--blue">
                <el-icon :size="22"><StarFilled /></el-icon>
              </div>
              <span>系统特性</span>
            </div>
          </template>
          <ul>
            <li>
              <el-icon><Collection /></el-icon>
              <div><strong>公共门户</strong><p>浏览图书目录、查看新闻公告，无需登录即可访问</p></div>
            </li>
            <li>
              <el-icon><User /></el-icon>
              <div><strong>用户中心</strong><p>注册登录后可进行借阅、续借、归还等操作</p></div>
            </li>
            <li>
              <el-icon><Setting /></el-icon>
              <div><strong>管理后台</strong><p>管理员可管理图书、用户、借阅记录及系统设置</p></div>
            </li>
          </ul>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="feature-block">
          <template #header>
            <div class="feature-block__title">
              <div class="feature-block__icon feature-block__icon--green">
                <el-icon :size="22"><Monitor /></el-icon>
              </div>
              <span>技术栈</span>
            </div>
          </template>
          <ul>
            <li>
              <el-icon><Connection /></el-icon>
              <div><strong>后端框架</strong><p>Spring Boot 3 + Spring Data JPA + Spring Security</p></div>
            </li>
            <li>
              <el-icon><DataLine /></el-icon>
              <div><strong>数据库</strong><p>H2 内嵌数据库，零配置即可运行</p></div>
            </li>
            <li>
              <el-icon><Platform /></el-icon>
              <div><strong>前端技术</strong><p>Vue 3 + Element Plus + Vite 构建工具</p></div>
            </li>
            <li>
              <el-icon><Key /></el-icon>
              <div><strong>认证方式</strong><p>JWT Token 无状态认证，安全高效</p></div>
            </li>
          </ul>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
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
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

.section-header .el-icon {
  color: #409eff;
}

.intro-text {
  font-size: 15px;
  line-height: 1.9;
  color: #606266;
  margin: 0;
}

/* ── 特性 / 技术栈区块 ── */
.feature-block {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
  height: 100%;
}

.feature-block :deep(.el-card__header) {
  padding: 14px 20px;
  background: #fafbfc;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.feature-block__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.feature-block__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.feature-block__icon--blue {
  background: #ecf5ff;
  color: #409eff;
}

.feature-block__icon--green {
  background: #f0fdf4;
  color: #22c55e;
}

.feature-block ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-block li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.feature-block li:last-child {
  border-bottom: none;
}

.feature-block li > .el-icon {
  color: #409eff;
  flex-shrink: 0;
  margin-top: 2px;
}

.feature-block li strong {
  display: block;
  font-size: 14px;
  color: #303133;
}

.feature-block li p {
  margin: 2px 0 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}
</style>
