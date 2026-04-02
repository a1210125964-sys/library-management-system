# 图书管理系统网站化升级设计（LMS Website Upgrade Design）

- 日期：2026-04-02
- 项目：library-management-system
- 目标：将当前“登录 + 后台”体验升级为完整网站形态，覆盖公开门户、用户中心、管理后台三层体验，并同步补齐必要后端能力。
- 设计结论：采用“分层重构”路径，按「公开门户 → 用户中心 → 管理后台」优先级推进，一步到位完成前后端改造。

## 1. 背景与目标

当前系统已有登录、注册与后台业务能力，但对外体验偏“单页面管理台”，缺少完整站点结构与公众访问入口。用户目标是“做得像网站”，并明确：

1. 页面范围包含公开门户、用户中心、管理后台三部分；
2. 视觉风格采用混合策略：公开门户偏科技感，后台偏简洁专业；
3. 实施边界为一步到位（前后端一起改）。

本设计聚焦：信息架构、UI 规范、接口扩展、数据流、错误处理、测试与里程碑。

## 2. 方案比较与选型

### 方案 A：一次性大爆改
- 特点：并行重写页面结构、样式、接口。
- 优点：视觉跃迁最快。
- 缺点：联调风险与回归风险最高。

### 方案 B：分层重构（推荐，已确认）
- 特点：先统一站点壳层，再按模块接入页面与接口。
- 优点：可控、可回滚、分阶段可验收。
- 缺点：总工期略长于暴力重写。

### 方案 C：前端先行、后端补齐
- 特点：先用 mock/兜底呈现完整前端，再替换真实接口。
- 优点：最快看到页面效果。
- 缺点：后续有二次改造成本。

**最终选型：方案 B（分层重构）**。

## 3. 信息架构与页面清单

### 3.1 公开门户（第一优先）
- `/home.html`：官网首页（Hero、亮点、公告摘要、统计概览、CTA）
- `/catalog.html`：馆藏检索（公开可浏览，登录后可借）
- `/news.html`：公告列表
- `/news-detail.html?id=xx`：公告详情
- `/about.html`：关于图书馆（开放时间、借阅规则、联系方式）

全局导航：首页 / 馆藏 / 公告 / 关于 / 登录 / 注册。

### 3.2 用户中心（第二优先）
- `/user/dashboard.html`：用户首页（在借、逾期、消息、快捷操作）
- `/user/borrowings.html`：借阅中
- `/user/history.html`：借阅历史
- `/user/profile.html`：资料维护与密码修改
- `/user/fines.html`：罚金与缴费状态（先展示，可扩展支付）

### 3.3 管理后台（第三优先）
- `/admin/index.html`：仪表盘（统计卡、趋势、待处理事项）
- `/admin/books.html`：图书管理（迁移并增强现有能力）
- `/admin/users.html`：用户管理
- `/admin/records.html`：借阅记录管理
- `/admin/notices.html`：公告管理（门户公告来源）

### 3.4 全站统一壳层
- 统一 Header / Footer / 主题切换 / 面包屑 / 空态与错误态
- 统一访问控制：未登录访问用户中心/后台自动跳转登录

## 4. 视觉与组件设计

## 4.1 视觉风格
- 公开门户：科技感（渐变背景 + 轻玻璃卡片 + 强视觉 Hero）
- 管理后台：简洁专业（高可读、低干扰、信息密度优先）

## 4.2 设计令牌（方向）
- 主色延续现有蓝色系（与 `--primary-500`、`--primary-600` 兼容）
- 分层定义：背景、表面、描边、文字、状态色（成功/警告/危险）
- 保持浅色/深色主题可切换一致性

## 4.3 组件体系（复用优先）
- 壳层：SiteHeader、SiteFooter、Breadcrumb、ThemeToggle
- 门户：HeroSection、FeatureGrid、StatCards、NoticeList、SearchBar
- 用户中心：SummaryCards、BorrowList、HistoryTable、ProfileForm
- 后台：DashboardCards、TrendPanel、QuickActions、DataTable、FilterBar
- 基础态：LoadingState、EmptyState、ErrorState、Toast

## 4.4 交互规范
- 按钮状态：hover / active / disabled / loading
- 列表状态：loading / empty / error
- 表单状态：focus / validation / submit loading
- 响应式断点建议：<=768、769~1024、>1024

## 4.5 前端目录调整（静态资源）
新增并逐步迁移：
- `/css/site.css`（门户 + 用户中心）
- `/css/admin.css`（后台）
- `/js/site-shell.js`（导航、主题、登录态）
- `/js/pages/*.js`（页面粒度脚本）

保留并兼容现有：`/js/app.js`、`/js/auth.js`、`/js/core/*`。

## 5. 后端接口与数据流设计

## 5.1 公共门户接口
- `GET /api/public/stats`
- `GET /api/public/notices?page=&size=`
- `GET /api/public/notices/{id}`
- `GET /api/public/books?keyword=&category=&page=&size=`

## 5.2 用户中心接口
- `GET /api/user/dashboard`
- `GET /api/user/borrowings`
- `GET /api/user/history`
- `GET /api/user/fines`
- `PUT /api/user/profile`

## 5.3 管理后台接口
- `GET /api/admin/dashboard`
- `POST /api/admin/notices`
- `PUT /api/admin/notices/{id}`
- `DELETE /api/admin/notices/{id}`
- 图书/用户/借阅延用现有管理接口并做能力补齐

## 5.4 数据模型补充
- `Notice`：标题、摘要、内容、状态、发布人、发布时间
- 可选扩展：`UserFineLedger`（罚金明细）

## 5.5 数据流原则
- 门户使用 public 接口（匿名可访问）
- 用户中心使用 user 接口（需 Token）
- 管理后台使用 admin 接口（RBAC）
- Dashboard 采用聚合接口优先，减少首屏并发请求

## 5.6 错误处理与权限边界
- 统一错误码与前端消息映射
- 无权限/未登录统一处理（重定向 + toast）
- 页面级错误态优先于裸异常

## 6. 测试策略

## 6.1 后端测试
- public/user/admin 三层接口测试
- 覆盖：权限边界、分页参数、公告 CRUD、聚合字段完整性

## 6.2 前端联调验收
- 门户：导航、检索、公告列表/详情
- 用户中心：登录态、借阅与资料维护
- 后台：仪表盘、公告管理、既有功能回归

## 6.3 回归基线
现有登录、注册、借阅、归还、图书管理能力不得退化。

## 7. 里程碑与验收标准

## 7.1 里程碑
- M1：门户上线（首页/馆藏/公告/关于）
- M2：用户中心上线（dashboard/借阅/历史/资料）
- M3：后台升级（仪表盘 + 公告管理 + 既有模块增强）
- M4：全链路收尾（主题一致性、移动端、回归）

## 7.2 Definition of Done
- 门户、用户中心、后台三端导航闭环
- 访问边界清晰（public/user/admin）
- 核心路径可演示且稳定
- 视觉与交互一致，阻断级问题为 0

## 8. 风险与约束
- 页面拆分期需注意旧入口兼容（`/login.html`、`/register.html`）
- 接口新增应避免影响现有 controller 路径
- 公告与统计数据来源需定义初始化策略（含空数据态）

## 9. 非目标（本轮不做）
- 复杂 CMS 编辑器能力
- 在线支付闭环（仅预留罚金展示结构）
- 多租户与跨机构权限体系

## 10. 结论
本设计满足“像网站”的产品目标，并在风险可控的前提下实现一步到位改造。后续将基于本设计进入实施计划阶段，按优先级分批落地并持续回归验证。
