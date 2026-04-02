# LMS 网站化升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前系统升级为完整网站体验，按“公开门户→用户中心→管理后台”顺序交付，并补齐必要后端接口与前端页面。

**Architecture:** 采用“分层重构”：先打通全站壳层与路由，再分阶段实现 public/user/admin 三类接口与页面。后端沿用现有 Spring Boot 单体结构（controller/service/repository/model），前端沿用 static 多页面结构并新增按页面拆分脚本。以聚合接口驱动 Dashboard，减少首屏请求。

**Tech Stack:** Spring Boot 3、Spring Security、Spring Data JPA、MySQL、原生 HTML/CSS/JS、JUnit5 + MockMvc。

---

## 文件结构与职责映射

### 后端新增文件
- Create: `src/main/java/com/lms/model/Notice.java`（公告实体）
- Create: `src/main/java/com/lms/repository/NoticeRepository.java`（公告持久化）
- Create: `src/main/java/com/lms/dto/NoticeRequest.java`（公告创建/编辑请求）
- Create: `src/main/java/com/lms/service/NoticeService.java`（公告业务）
- Create: `src/main/java/com/lms/controller/PublicController.java`（public 门户接口）
- Create: `src/main/java/com/lms/controller/UserPortalController.java`（用户中心聚合接口）

### 后端修改文件
- Modify: `src/main/java/com/lms/config/SecurityConfig.java`（放行 public 页面与 public API）
- Modify: `src/main/java/com/lms/controller/AdminController.java`（新增公告管理与 admin dashboard 聚合）
- Modify: `src/main/java/com/lms/service/StatisticsService.java`（补充 public/admin dashboard 数据聚合）
- Modify: `src/main/resources/schema.sql`（新增 notices 表）

### 前端新增文件
- Create: `src/main/resources/static/home.html`
- Create: `src/main/resources/static/catalog.html`
- Create: `src/main/resources/static/news.html`
- Create: `src/main/resources/static/news-detail.html`
- Create: `src/main/resources/static/about.html`
- Create: `src/main/resources/static/user/dashboard.html`
- Create: `src/main/resources/static/user/borrowings.html`
- Create: `src/main/resources/static/user/history.html`
- Create: `src/main/resources/static/user/profile.html`
- Create: `src/main/resources/static/user/fines.html`
- Create: `src/main/resources/static/admin/index.html`
- Create: `src/main/resources/static/admin/notices.html`
- Create: `src/main/resources/static/css/site.css`
- Create: `src/main/resources/static/css/admin.css`
- Create: `src/main/resources/static/js/site-shell.js`
- Create: `src/main/resources/static/js/pages/home.js`
- Create: `src/main/resources/static/js/pages/catalog.js`
- Create: `src/main/resources/static/js/pages/news.js`
- Create: `src/main/resources/static/js/pages/user-dashboard.js`
- Create: `src/main/resources/static/js/pages/admin-dashboard.js`
- Create: `src/main/resources/static/js/pages/admin-notices.js`

### 前端修改文件
- Modify: `src/main/resources/static/index.html`（保留旧后台入口并跳转至 `/admin/index.html`）
- Modify: `src/main/resources/static/js/app.js`（兼容新 admin 页面初始化）
- Modify: `src/main/resources/static/login.html`（增加返回门户入口）
- Modify: `src/main/resources/static/register.html`（增加返回门户入口）

### 测试文件
- Create: `src/test/java/com/lms/controller/PublicControllerTest.java`
- Create: `src/test/java/com/lms/controller/UserPortalControllerTest.java`
- Create: `src/test/java/com/lms/controller/AdminNoticeControllerTest.java`
- Modify: `src/test/java/com/lms/controller/BookControllerIT.java`（覆盖 public 检索兼容性）
- Create: `src/test/java/com/lms/service/NoticeServiceTest.java`

---

### Task 1: 安全与路由基线（public 入口可访问）

**Files:**
- Modify: `src/main/java/com/lms/config/SecurityConfig.java`
- Test: `src/test/java/com/lms/controller/PublicControllerTest.java`

- [ ] **Step 1: 写失败测试（未登录可访问 public 路由）**

```java
@Test
void public_api_should_be_accessible_without_token() throws Exception {
    mockMvc.perform(get("/api/public/stats"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code").value("SUCCESS"));
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `mvn -Dtest=PublicControllerTest test`
Expected: FAIL（404 或 401）

- [ ] **Step 3: 最小实现（放行路由）**

```java
.requestMatchers(
    "/", "/index.html", "/home.html", "/catalog.html", "/news.html", "/news-detail.html", "/about.html",
    "/login.html", "/register.html", "/css/**", "/js/**"
).permitAll()
.requestMatchers("/api/public/**").permitAll()
```

- [ ] **Step 4: 运行测试确认通过**

Run: `mvn -Dtest=PublicControllerTest test`
Expected: PASS（至少进入 controller 层，不再被拦截）

- [ ] **Step 5: 提交**

Run: `git add src/main/java/com/lms/config/SecurityConfig.java src/test/java/com/lms/controller/PublicControllerTest.java && git commit -m "feat: allow public routes and api namespace"`

---

### Task 2: 公告数据模型与持久化

**Files:**
- Create: `src/main/java/com/lms/model/Notice.java`
- Create: `src/main/java/com/lms/repository/NoticeRepository.java`
- Modify: `src/main/resources/schema.sql`
- Test: `src/test/java/com/lms/service/NoticeServiceTest.java`

- [ ] **Step 1: 写失败测试（保存公告并按时间倒序查询）**

```java
@Test
void list_published_should_return_desc_order() {
    NoticeRequest req = new NoticeRequest("开馆通知", "摘要", "正文", true);
    noticeService.create(req, adminUser);
    List<Notice> notices = noticeService.listPublished(0, 10).getContent();
    assertFalse(notices.isEmpty());
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `mvn -Dtest=NoticeServiceTest test`
Expected: FAIL（类/方法不存在）

- [ ] **Step 3: 最小实现（实体 + 仓储 + 建表）**

```java
@Entity
@Table(name = "notices")
public class Notice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String summary;
    @Column(columnDefinition = "TEXT")
    private String content;
    private Boolean published;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

```sql
CREATE TABLE IF NOT EXISTS notices (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  summary VARCHAR(500),
  content TEXT NOT NULL,
  published TINYINT(1) NOT NULL DEFAULT 0,
  published_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_notices_published_time (published, published_at)
);
```

- [ ] **Step 4: 运行测试确认通过**

Run: `mvn -Dtest=NoticeServiceTest test`
Expected: PASS

- [ ] **Step 5: 提交**

Run: `git add src/main/java/com/lms/model/Notice.java src/main/java/com/lms/repository/NoticeRepository.java src/main/resources/schema.sql src/test/java/com/lms/service/NoticeServiceTest.java && git commit -m "feat: add notice entity repository and schema"`

---

### Task 3: public 门户 API（stats/notices/books）

**Files:**
- Create: `src/main/java/com/lms/controller/PublicController.java`
- Create: `src/main/java/com/lms/service/NoticeService.java`
- Modify: `src/main/java/com/lms/service/StatisticsService.java`
- Test: `src/test/java/com/lms/controller/PublicControllerTest.java`

- [ ] **Step 1: 写失败测试（查询公告列表、详情、统计）**

```java
@Test
void public_notices_should_return_pagination() throws Exception {
    mockMvc.perform(get("/api/public/notices").queryParam("page", "0").queryParam("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code").value("SUCCESS"))
        .andExpect(jsonPath("$.pagination").exists());
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `mvn -Dtest=PublicControllerTest test`
Expected: FAIL（404）

- [ ] **Step 3: 最小实现（PublicController）**

```java
@RestController
@RequestMapping("/api/public")
public class PublicController {
    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> stats() {
        return ApiResponse.success("查询成功", statisticsService.publicOverview());
    }

    @GetMapping("/notices")
    public ApiResponse<List<Map<String, Object>>> notices(@RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "10") int size) {
        Page<Notice> result = noticeService.listPublished(page, size);
        return ApiResponse.success("查询成功", result.getContent().stream().map(this::noticeMap).toList(), pagination(result));
    }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `mvn -Dtest=PublicControllerTest test`
Expected: PASS

- [ ] **Step 5: 提交**

Run: `git add src/main/java/com/lms/controller/PublicController.java src/main/java/com/lms/service/NoticeService.java src/main/java/com/lms/service/StatisticsService.java src/test/java/com/lms/controller/PublicControllerTest.java && git commit -m "feat: add public portal apis"`

---

### Task 4: 用户中心聚合 API

**Files:**
- Create: `src/main/java/com/lms/controller/UserPortalController.java`
- Modify: `src/main/java/com/lms/service/BorrowService.java`
- Modify: `src/main/java/com/lms/service/UserService.java`
- Test: `src/test/java/com/lms/controller/UserPortalControllerTest.java`

- [ ] **Step 1: 写失败测试（/api/user/dashboard）**

```java
@Test
void dashboard_should_return_summary_fields() throws Exception {
    mockMvc.perform(get("/api/user/dashboard").header("X-Token", "token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.activeBorrowCount").exists())
        .andExpect(jsonPath("$.data.overdueCount").exists());
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `mvn -Dtest=UserPortalControllerTest test`
Expected: FAIL

- [ ] **Step 3: 最小实现（聚合响应）**

```java
@GetMapping("/dashboard")
public ApiResponse<Map<String, Object>> dashboard(@RequestHeader("X-Token") String token) {
    User user = authService.requireUser(token);
    Map<String, Object> data = new HashMap<>();
    data.put("activeBorrowCount", borrowService.countActiveByUser(user.getId()));
    data.put("overdueCount", borrowService.countOverdueByUser(user.getId()));
    data.put("unreadNoticeCount", noticeService.countPublished());
    return ApiResponse.success("查询成功", data);
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `mvn -Dtest=UserPortalControllerTest test`
Expected: PASS

- [ ] **Step 5: 提交**

Run: `git add src/main/java/com/lms/controller/UserPortalController.java src/main/java/com/lms/service/BorrowService.java src/main/java/com/lms/service/UserService.java src/test/java/com/lms/controller/UserPortalControllerTest.java && git commit -m "feat: add user portal dashboard api"`

---

### Task 5: 管理端公告管理 API

**Files:**
- Modify: `src/main/java/com/lms/controller/AdminController.java`
- Create: `src/main/java/com/lms/dto/NoticeRequest.java`
- Modify: `src/main/java/com/lms/service/NoticeService.java`
- Test: `src/test/java/com/lms/controller/AdminNoticeControllerTest.java`

- [ ] **Step 1: 写失败测试（管理员新增公告）**

```java
@Test
void admin_should_create_notice() throws Exception {
    mockMvc.perform(post("/api/admin/notices")
            .header("X-Token", "admin-token")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"系统维护\",\"summary\":\"摘要\",\"content\":\"正文\",\"published\":true}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code").value("SUCCESS"));
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `mvn -Dtest=AdminNoticeControllerTest test`
Expected: FAIL

- [ ] **Step 3: 最小实现（AdminController 增删改查 notices）**

```java
@PostMapping("/notices")
public ApiResponse<Map<String, Object>> createNotice(@RequestHeader("X-Token") String token,
                                                     @Valid @RequestBody NoticeRequest req) {
    User admin = authService.requireAdmin(token);
    Notice notice = noticeService.create(req, admin);
    return ApiResponse.success("创建成功", noticeMap(notice));
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `mvn -Dtest=AdminNoticeControllerTest test`
Expected: PASS

- [ ] **Step 5: 提交**

Run: `git add src/main/java/com/lms/controller/AdminController.java src/main/java/com/lms/dto/NoticeRequest.java src/main/java/com/lms/service/NoticeService.java src/test/java/com/lms/controller/AdminNoticeControllerTest.java && git commit -m "feat: add admin notice management apis"`

---

### Task 6: 门户页面壳层与视觉系统

**Files:**
- Create: `src/main/resources/static/css/site.css`
- Create: `src/main/resources/static/js/site-shell.js`
- Create: `src/main/resources/static/home.html`
- Modify: `src/main/resources/static/login.html`
- Modify: `src/main/resources/static/register.html`

- [ ] **Step 1: 写失败验收（手工检查项先定义）**

```text
验收点：
1) /home.html 可访问
2) 顶部导航包含：首页/馆藏/公告/关于/登录/注册
3) 登录页有“返回首页”入口
```

- [ ] **Step 2: 启动应用并确认当前不满足**

Run: `mvn spring-boot:run`
Expected: 访问 `/home.html` 404 或无目标 UI

- [ ] **Step 3: 最小实现（壳层与首页）**

```html
<header class="site-header">
  <a href="/home.html" class="logo">LMS</a>
  <nav>
    <a href="/home.html">首页</a><a href="/catalog.html">馆藏</a><a href="/news.html">公告</a><a href="/about.html">关于</a>
  </nav>
  <div><a href="/login.html">登录</a><a href="/register.html">注册</a></div>
</header>
```

```javascript
(function initSiteShell(){
  const theme = localStorage.getItem("theme") || "system";
  if (theme !== "system") document.documentElement.setAttribute("data-theme", theme);
})();
```

- [ ] **Step 4: 运行并验收通过**

Run: `mvn spring-boot:run`
Expected: `/home.html` 可访问，导航完整，登录/注册有返回门户入口

- [ ] **Step 5: 提交**

Run: `git add src/main/resources/static/css/site.css src/main/resources/static/js/site-shell.js src/main/resources/static/home.html src/main/resources/static/login.html src/main/resources/static/register.html && git commit -m "feat: add site shell and portal homepage"`

---

### Task 7: 门户页面业务化（馆藏、公告、关于）

**Files:**
- Create: `src/main/resources/static/catalog.html`
- Create: `src/main/resources/static/news.html`
- Create: `src/main/resources/static/news-detail.html`
- Create: `src/main/resources/static/about.html`
- Create: `src/main/resources/static/js/pages/catalog.js`
- Create: `src/main/resources/static/js/pages/news.js`
- Modify: `src/main/resources/static/js/core/http.js`

- [ ] **Step 1: 写失败验收（定义前端数据契约）**

```text
1) catalog 页面调用 /api/public/books
2) news 页面调用 /api/public/notices
3) news-detail 页面读取 id 并调用 /api/public/notices/{id}
```

- [ ] **Step 2: 运行并确认失败**

Run: `mvn spring-boot:run`
Expected: 页面不存在或请求未发起

- [ ] **Step 3: 最小实现（页面 + 脚本）**

```javascript
async function loadNews(page = 0){
  const res = await HttpClient.create()( `/api/public/notices?page=${page}&size=10` );
  renderNews(res.data || []);
}
```

- [ ] **Step 4: 运行并验收通过**

Run: `mvn spring-boot:run`
Expected: 门户三页可访问并展示真实数据

- [ ] **Step 5: 提交**

Run: `git add src/main/resources/static/catalog.html src/main/resources/static/news.html src/main/resources/static/news-detail.html src/main/resources/static/about.html src/main/resources/static/js/pages/catalog.js src/main/resources/static/js/pages/news.js src/main/resources/static/js/core/http.js && git commit -m "feat: add portal catalog and notices pages"`

---

### Task 8: 用户中心页面（dashboard/borrowings/history/profile/fines）

**Files:**
- Create: `src/main/resources/static/user/dashboard.html`
- Create: `src/main/resources/static/user/borrowings.html`
- Create: `src/main/resources/static/user/history.html`
- Create: `src/main/resources/static/user/profile.html`
- Create: `src/main/resources/static/user/fines.html`
- Create: `src/main/resources/static/js/pages/user-dashboard.js`

- [ ] **Step 1: 写失败验收（未登录重定向）**

```text
1) 未登录访问 /user/dashboard.html 会跳转 /login.html
2) 已登录可查看 dashboard 聚合数据
```

- [ ] **Step 2: 运行确认失败**

Run: `mvn spring-boot:run`
Expected: 缺少页面或未做登录态守卫

- [ ] **Step 3: 最小实现（页面+守卫）**

```javascript
const user = JSON.parse(localStorage.getItem("user") || "null");
const token = localStorage.getItem("token") || "";
if (!user || !token) window.location.href = "/login.html";
```

- [ ] **Step 4: 运行并验收通过**

Run: `mvn spring-boot:run`
Expected: 用户中心 5 页面可访问且登录态正确

- [ ] **Step 5: 提交**

Run: `git add src/main/resources/static/user src/main/resources/static/js/pages/user-dashboard.js && git commit -m "feat: add user portal pages"`

---

### Task 9: 管理后台新仪表盘与公告管理页面

**Files:**
- Create: `src/main/resources/static/admin/index.html`
- Create: `src/main/resources/static/admin/notices.html`
- Create: `src/main/resources/static/js/pages/admin-dashboard.js`
- Create: `src/main/resources/static/js/pages/admin-notices.js`
- Modify: `src/main/resources/static/index.html`
- Modify: `src/main/resources/static/js/app.js`

- [ ] **Step 1: 写失败验收（管理员入口闭环）**

```text
1) /admin/index.html 可加载统计卡
2) /admin/notices.html 可进行公告增删改
3) /index.html 保持兼容并引导到新后台入口
```

- [ ] **Step 2: 运行确认失败**

Run: `mvn spring-boot:run`
Expected: admin 新页面不存在

- [ ] **Step 3: 最小实现（页面与脚本）**

```javascript
async function loadAdminDashboard(){
  const req = HttpClient.create({ getToken: () => localStorage.getItem("token") || "" });
  const res = await req("/api/admin/stats");
  renderCards(res.data);
}
```

- [ ] **Step 4: 运行并验收通过**

Run: `mvn spring-boot:run`
Expected: 后台新页面联通，旧入口兼容

- [ ] **Step 5: 提交**

Run: `git add src/main/resources/static/admin src/main/resources/static/js/pages/admin-dashboard.js src/main/resources/static/js/pages/admin-notices.js src/main/resources/static/index.html src/main/resources/static/js/app.js && git commit -m "feat: add admin dashboard and notice pages"`

---

### Task 10: 端到端回归与文档更新

**Files:**
- Modify: `README.md`
- Modify: `开发文档.md`
- Test: `src/test/java/com/lms/controller/*.java`
- Test: `src/test/java/com/lms/service/*.java`

- [ ] **Step 1: 写失败测试（补齐关键接口断言）**

```java
@Test
void admin_notice_api_should_require_admin_role() throws Exception {
    mockMvc.perform(post("/api/admin/notices").header("X-Token", "user-token"))
        .andExpect(status().isForbidden());
}
```

- [ ] **Step 2: 运行全量测试确认现状**

Run: `mvn test`
Expected: 可能存在失败用例，先记录失败集合

- [ ] **Step 3: 最小修复（权限/空态/兼容）并更新文档**

```markdown
## 新页面入口
- 门户：/home.html
- 用户中心：/user/dashboard.html
- 管理后台：/admin/index.html
```

- [ ] **Step 4: 运行全量验证**

Run: `mvn clean test`
Expected: BUILD SUCCESS

- [ ] **Step 5: 提交**

Run: `git add README.md 开发文档.md src/test/java && git commit -m "test: finalize website upgrade regression and docs"`

---

## 计划执行顺序与检查点

1. Checkpoint A（Task 1-3）：public 接口可用
2. Checkpoint B（Task 4-7）：门户 + 用户中心可演示
3. Checkpoint C（Task 8-9）：后台升级完成
4. Checkpoint D（Task 10）：回归通过并文档齐备

## 风险控制

- 若 `schema.sql` 变更影响已有数据，优先采用 `CREATE TABLE IF NOT EXISTS` + 向后兼容字段策略。
- 若前端改动影响旧 `index.html`，保留旧入口并做渐进迁移。
- 所有接口先补测试再写实现，严格遵守 TDD。
