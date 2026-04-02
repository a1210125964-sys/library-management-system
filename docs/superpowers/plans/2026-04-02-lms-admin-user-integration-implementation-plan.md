# LMS 管理后台整合与用户中心增强 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按“三期发布”完成组件统一、后台四模块迁移到 `/admin/*`、以及用户中心业务闭环与体验增强。

**Architecture:** 采用“组件先行 + 双线并行”策略。先抽离 `core/ui/api` 通用层，再迁移 admin 页面并增强 user 页面。后端仅做最小增量改造（用户历史分页筛选），其余能力复用现有 API，避免不必要重构。

**Tech Stack:** Spring Boot 3, Java 17, JUnit5 + MockMvc, 原生 HTML/CSS/JS。

---

## 文件结构与职责映射

### 后端新增文件
- Create: `src/test/java/com/lms/controller/UserPortalHistoryPagingTest.java`（用户历史分页筛选接口测试）

### 后端修改文件
- Modify: `src/main/java/com/lms/controller/UserPortalController.java`（`/api/user/history` 支持分页/筛选）
- Modify: `src/main/java/com/lms/service/BorrowService.java`（新增分页历史查询方法）
- Modify: `src/main/java/com/lms/repository/BorrowRecordRepository.java`（新增按用户历史分页检索）

### 前端新增文件
- Create: `src/main/resources/static/admin/books.html`
- Create: `src/main/resources/static/admin/users.html`
- Create: `src/main/resources/static/admin/records.html`
- Create: `src/main/resources/static/admin/logs.html`
- Create: `src/main/resources/static/js/core/guards.js`
- Create: `src/main/resources/static/js/core/pagination.js`
- Create: `src/main/resources/static/js/ui/states.js`
- Create: `src/main/resources/static/js/ui/table.js`
- Create: `src/main/resources/static/js/ui/filters.js`
- Create: `src/main/resources/static/js/api/admin-api.js`
- Create: `src/main/resources/static/js/api/user-api.js`
- Create: `src/main/resources/static/js/pages/admin-records.js`
- Create: `src/main/resources/static/js/pages/admin-logs.js`

### 前端修改文件
- Modify: `src/main/resources/static/admin/index.html`（导航补齐 books/users/records/logs）
- Modify: `src/main/resources/static/admin/notices.html`（导航一致化）
- Modify: `src/main/resources/static/js/pages/admin-dashboard.js`（改用 `admin-api.js`）
- Modify: `src/main/resources/static/js/pages/admin-notices.js`（改用 `admin-api.js`）
- Modify: `src/main/resources/static/js/pages/admin-books.js`（迁移旧逻辑并模块化）
- Modify: `src/main/resources/static/js/pages/admin-users.js`（迁移旧逻辑并模块化）
- Modify: `src/main/resources/static/js/pages/user-dashboard.js`（改用 `user-api.js`，补续借/归还/分页筛选）
- Modify: `src/main/resources/static/user/borrowings.html`（操作列、状态/反馈区）
- Modify: `src/main/resources/static/user/history.html`（筛选 + 分页）
- Modify: `src/main/resources/static/user/fines.html`（总额卡 + 明细排序）
- Modify: `src/main/resources/static/user/profile.html`（校验与提交反馈）
- Modify: `src/main/resources/static/user/dashboard.html`（快捷操作入口）
- Modify: `src/main/resources/static/index.html`（降级为兼容跳转，不再承载主业务）

### 文档修改
- Modify: `README.md`（后台入口与迁移说明）

---

### Task 1: 用户历史接口分页化（后端增量，先测后改）

**Files:**
- Create: `src/test/java/com/lms/controller/UserPortalHistoryPagingTest.java`
- Modify: `src/main/java/com/lms/controller/UserPortalController.java`
- Modify: `src/main/java/com/lms/service/BorrowService.java`
- Modify: `src/main/java/com/lms/repository/BorrowRecordRepository.java`

- [ ] **Step 1: 写失败测试（`/api/user/history` 返回 `pagination`）**

```java
@Test
void history_should_support_pagination() throws Exception {
    mockMvc.perform(get("/api/user/history")
            .header("X-Token", "token")
            .queryParam("page", "0")
            .queryParam("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code").value("SUCCESS"))
        .andExpect(jsonPath("$.pagination").exists());
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `mvn -Dtest=UserPortalHistoryPagingTest test`
Expected: FAIL（缺少 `pagination` 字段或方法签名不匹配）

- [ ] **Step 3: 最小实现（Controller + Service + Repository）**

```java
@GetMapping("/history")
public ApiResponse<List<Map<String, Object>>> history(@RequestHeader("X-Token") String token,
                                                      @RequestParam(required = false) Integer page,
                                                      @RequestParam(required = false) Integer size) {
    User user = authService.requireUser(token);
    if (page != null && size != null) {
        Page<BorrowRecord> result = borrowService.myHistoryPaged(user, page, size);
        List<Map<String, Object>> data = result.getContent().stream().map(this::recordMap).toList();
        return ApiResponse.success("查询成功", data, pagination(result));
    }
    List<Map<String, Object>> data = borrowService.myHistory(user).stream().map(this::recordMap).toList();
    return ApiResponse.success("查询成功", data);
}
```

```java
public Page<BorrowRecord> myHistoryPaged(User user, int page, int size) {
    return borrowRecordRepository.findByUserAndStatusInOrderByBorrowTimeDesc(
        user,
        List.of(BorrowStatus.RETURNED, BorrowStatus.OVERDUE),
        PageRequest.of(page, size)
    );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `mvn -Dtest=UserPortalHistoryPagingTest test`
Expected: PASS

- [ ] **Step 5: 提交**

Run: `git add src/test/java/com/lms/controller/UserPortalHistoryPagingTest.java src/main/java/com/lms/controller/UserPortalController.java src/main/java/com/lms/service/BorrowService.java src/main/java/com/lms/repository/BorrowRecordRepository.java && git commit -m "feat: add paged history api for user portal"`

---

### Task 2: 建立前端统一基础模块（guards/pagination/states）

**Files:**
- Create: `src/main/resources/static/js/core/guards.js`
- Create: `src/main/resources/static/js/core/pagination.js`
- Create: `src/main/resources/static/js/ui/states.js`

- [ ] **Step 1: 写失败用例（页面引用后能访问全局模块）**

在浏览器控制台预期检查（初始应失败）：

```javascript
console.assert(typeof window.PageGuards === "object");
console.assert(typeof window.Pager === "object");
console.assert(typeof window.StateView === "object");
```

- [ ] **Step 2: 运行页面自检确认失败**

Run: `mvn spring-boot:run`
Expected: 打开 `/admin/index.html` 控制台断言失败（模块未定义）

- [ ] **Step 3: 最小实现三个模块**

```javascript
// guards.js
window.PageGuards = {
  clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },
  requireRole(role, loginUrl) {
    const token = localStorage.getItem("token") || "";
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || !user || user.role !== role) {
      this.clearSession();
      window.location.href = loginUrl;
      return null;
    }
    return user;
  }
};
```

```javascript
// pagination.js
window.Pager = {
  normalize(pagination) {
    return {
      page: Number(pagination?.page ?? 0),
      size: Number(pagination?.size ?? 10),
      totalPages: Math.max(1, Number(pagination?.totalPages ?? 1)),
      totalElements: Number(pagination?.totalElements ?? 0)
    };
  }
};
```

```javascript
// states.js
window.StateView = {
  tableMessage(tbodyEl, colspan, text, type) {
    tbodyEl.innerHTML = `<tr class="status-row status-${type}"><td colspan="${colspan}">${text}</td></tr>`;
  }
};
```

- [ ] **Step 4: 运行页面自检确认通过**

Run: `mvn spring-boot:run`
Expected: 控制台断言通过，页面不报模块未定义错误

- [ ] **Step 5: 提交**

Run: `git add src/main/resources/static/js/core/guards.js src/main/resources/static/js/core/pagination.js src/main/resources/static/js/ui/states.js && git commit -m "feat: add shared frontend guard pagination and state modules"`

---

### Task 3: 新版后台页面与导航补齐（books/users/records/logs）

**Files:**
- Create: `src/main/resources/static/admin/books.html`
- Create: `src/main/resources/static/admin/users.html`
- Create: `src/main/resources/static/admin/records.html`
- Create: `src/main/resources/static/admin/logs.html`
- Modify: `src/main/resources/static/admin/index.html`
- Modify: `src/main/resources/static/admin/notices.html`

- [ ] **Step 1: 写失败检查（导航链接可达）**

手工检查清单（初始应失败）：`/admin/index.html` 中不存在 `books.html/users.html/records.html/logs.html` 导航项。

- [ ] **Step 2: 运行检查确认失败**

Run: `mvn spring-boot:run`
Expected: 导航无法直达四个页面

- [ ] **Step 3: 最小实现（页面骨架 + 统一导航）**

```html
<nav class="nav-menu" aria-label="管理后台导航">
  <a class="nav-item" href="index.html">后台仪表盘</a>
  <a class="nav-item" href="books.html">图书管理</a>
  <a class="nav-item" href="users.html">用户管理</a>
  <a class="nav-item" href="records.html">借阅记录</a>
  <a class="nav-item" href="logs.html">系统日志</a>
  <a class="nav-item" href="notices.html">公告管理</a>
</nav>
```

- [ ] **Step 4: 运行检查确认通过**

Run: `mvn spring-boot:run`
Expected: 四个页面均可打开且导航一致

- [ ] **Step 5: 提交**

Run: `git add src/main/resources/static/admin/index.html src/main/resources/static/admin/notices.html src/main/resources/static/admin/books.html src/main/resources/static/admin/users.html src/main/resources/static/admin/records.html src/main/resources/static/admin/logs.html && git commit -m "feat: add admin module pages and unified navigation"`

---

### Task 4: Admin API 适配层与页面接入

**Files:**
- Create: `src/main/resources/static/js/api/admin-api.js`
- Modify: `src/main/resources/static/js/pages/admin-dashboard.js`
- Modify: `src/main/resources/static/js/pages/admin-notices.js`
- Modify: `src/main/resources/static/js/pages/admin-books.js`
- Modify: `src/main/resources/static/js/pages/admin-users.js`
- Create: `src/main/resources/static/js/pages/admin-records.js`
- Create: `src/main/resources/static/js/pages/admin-logs.js`

- [ ] **Step 1: 写失败检查（直接访问 `window.AdminApi`）**

```javascript
console.assert(typeof window.AdminApi?.listLogs === "function");
console.assert(typeof window.AdminApi?.listUsers === "function");
```

- [ ] **Step 2: 运行检查确认失败**

Run: `mvn spring-boot:run`
Expected: 控制台断言失败（`AdminApi` 未定义）

- [ ] **Step 3: 最小实现 AdminApi 并替换页面直接请求**

```javascript
window.AdminApi = {
  create(req, buildAppUrl) {
    return {
      getStats: () => req(buildAppUrl("/api/admin/stats")),
      listUsers: (params) => req(buildAppUrl(`/api/admin/users?page=${params.page}&size=${params.size}&role=${params.role || ""}`)),
      listRecords: (params) => req(buildAppUrl(`/api/borrow/records?page=${params.page}&size=${params.size}`)),
      listLogs: (params) => req(buildAppUrl(`/api/admin/logs?page=${params.page}&size=${params.size}&operation=${params.operation || ""}`)),
      listNotices: (params) => req(buildAppUrl(`/api/admin/notices?page=${params.page}&size=${params.size}`))
    };
  }
};
```

- [ ] **Step 4: 运行后台页面联调确认通过**

Run: `mvn spring-boot:run`
Expected: `index/books/users/records/logs/notices` 页面均能加载且分页正常

- [ ] **Step 5: 提交**

Run: `git add src/main/resources/static/js/api/admin-api.js src/main/resources/static/js/pages/admin-dashboard.js src/main/resources/static/js/pages/admin-notices.js src/main/resources/static/js/pages/admin-books.js src/main/resources/static/js/pages/admin-users.js src/main/resources/static/js/pages/admin-records.js src/main/resources/static/js/pages/admin-logs.js && git commit -m "feat: migrate admin pages to unified admin api adapter"`

---

### Task 5: User API 适配层与闭环动作接入

**Files:**
- Create: `src/main/resources/static/js/api/user-api.js`
- Modify: `src/main/resources/static/js/pages/user-dashboard.js`

- [ ] **Step 1: 写失败检查（用户页动作方法存在）**

```javascript
console.assert(typeof window.UserApi?.renewBorrow === "function");
console.assert(typeof window.UserApi?.returnBorrow === "function");
```

- [ ] **Step 2: 运行检查确认失败**

Run: `mvn spring-boot:run`
Expected: 控制台断言失败（`UserApi` 未定义）

- [ ] **Step 3: 最小实现 UserApi 并接入页面**

```javascript
window.UserApi = {
  create(req, buildAppUrl) {
    return {
      getDashboard: () => req(buildAppUrl("/api/user/dashboard")),
      listBorrowings: () => req(buildAppUrl("/api/user/borrowings")),
      listHistory: (params) => req(buildAppUrl(`/api/user/history?page=${params.page}&size=${params.size}`)),
      getFines: () => req(buildAppUrl("/api/user/fines")),
      getProfile: () => req(buildAppUrl("/api/user/profile")),
      updateProfile: (payload) => req(buildAppUrl("/api/user/profile"), "PUT", payload),
      renewBorrow: (recordId) => req(buildAppUrl(`/api/borrow/renew/${recordId}`), "POST"),
      returnBorrow: (recordId) => req(buildAppUrl(`/api/borrow/return/${recordId}`), "POST")
    };
  }
};
```

- [ ] **Step 4: 运行用户流程确认通过**

Run: `mvn spring-boot:run`
Expected: 在 `/user/borrowings.html` 可续借/归还；`/user/history.html` 可分页；`/user/profile.html` 可更新

- [ ] **Step 5: 提交**

Run: `git add src/main/resources/static/js/api/user-api.js src/main/resources/static/js/pages/user-dashboard.js && git commit -m "feat: add user api adapter and action flow for renew return"`

---

### Task 6: 用户页面 UI 增强（筛选/分页/状态/反馈）

**Files:**
- Create: `src/main/resources/static/js/ui/table.js`
- Create: `src/main/resources/static/js/ui/filters.js`
- Modify: `src/main/resources/static/user/borrowings.html`
- Modify: `src/main/resources/static/user/history.html`
- Modify: `src/main/resources/static/user/fines.html`
- Modify: `src/main/resources/static/user/profile.html`
- Modify: `src/main/resources/static/user/dashboard.html`

- [ ] **Step 1: 写失败检查（页面包含状态区与分页区）**

检查 DOM 目标（初始应失败）：

```javascript
console.assert(document.getElementById("historyPageInfo"));
console.assert(document.getElementById("borrowingsEmpty"));
```

- [ ] **Step 2: 运行检查确认失败**

Run: `mvn spring-boot:run`
Expected: 至少一个断言失败

- [ ] **Step 3: 最小实现页面结构与组件接线**

```html
<div class="row compact">
  <button id="historyPrevBtn" class="btn btn-secondary" type="button">上一页</button>
  <span id="historyPageInfo" class="muted">第 1 / 1 页</span>
  <button id="historyNextBtn" class="btn btn-secondary" type="button">下一页</button>
</div>
<div id="historyEmpty" class="empty-state hidden">暂无历史借阅记录。</div>
```

- [ ] **Step 4: 运行检查确认通过**

Run: `mvn spring-boot:run`
Expected: 用户中心页面具备统一三态、分页与操作反馈

- [ ] **Step 5: 提交**

Run: `git add src/main/resources/static/js/ui/table.js src/main/resources/static/js/ui/filters.js src/main/resources/static/user/borrowings.html src/main/resources/static/user/history.html src/main/resources/static/user/fines.html src/main/resources/static/user/profile.html src/main/resources/static/user/dashboard.html && git commit -m "feat: enhance user portal ui states paging and actions"`

---

### Task 7: 旧后台入口降级与文档更新

**Files:**
- Modify: `src/main/resources/static/index.html`
- Modify: `README.md`

- [ ] **Step 1: 写失败检查（旧页不再展示主业务区）**

检查点（初始应失败）：旧页仍包含完整管理模块交互入口。

- [ ] **Step 2: 运行检查确认失败**

Run: `mvn spring-boot:run`
Expected: 访问 `/index.html` 仍看到旧工作台完整功能

- [ ] **Step 3: 最小实现（兼容跳转页 + README 更新）**

```html
<section class="glass-card panel">
  <div class="panel-head">
    <h3>后台入口已升级</h3>
    <a class="btn" href="/admin/index.html">进入新版后台</a>
  </div>
  <p class="muted">旧版后台已退役，当前页面仅用于兼容跳转。</p>
</section>
```

```markdown
### 新页面入口
- 门户：`/home.html`
- 用户中心：`/user/dashboard.html`
- 管理后台：`/admin/index.html`
```

- [ ] **Step 4: 运行检查确认通过**

Run: `mvn spring-boot:run`
Expected: `/index.html` 仅提供跳转，不再承载旧后台主流程

- [ ] **Step 5: 提交**

Run: `git add src/main/resources/static/index.html README.md && git commit -m "chore: deprecate legacy admin shell and update docs"`

---

### Task 8: 回归测试与最终验收

**Files:**
- Modify: `src/test/java/com/lms/controller/UserPortalControllerTest.java`（若需补断言）
- Optional Modify: `src/test/java/com/lms/controller/AdminNoticeControllerTest.java`（仅回归调整）

- [ ] **Step 1: 写失败测试（补齐历史分页断言）**

```java
mockMvc.perform(get("/api/user/history")
        .header("X-Token", "token")
        .queryParam("page", "0")
        .queryParam("size", "5"))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.pagination.totalPages").exists());
```

- [ ] **Step 2: 运行测试确认失败**

Run: `mvn -Dtest=UserPortalControllerTest test`
Expected: FAIL（直到分页实现接入）

- [ ] **Step 3: 最小实现（修正断言/映射）**

```java
// 在 UserPortalControllerTest 中补充分页场景 mock 与断言
Mockito.when(borrowService.myHistoryPaged(user, 0, 5))
    .thenReturn(new PageImpl<>(List.of(record), PageRequest.of(0, 5), 1));
```

- [ ] **Step 4: 全量验证**

Run: `mvn test`
Expected: PASS

- [ ] **Step 5: 提交**

Run: `git add src/test/java/com/lms/controller/UserPortalControllerTest.java src/test/java/com/lms/controller/UserPortalHistoryPagingTest.java && git commit -m "test: cover user history paging and portal regression"`

---

## 人工验收清单（发布前）

- `/admin/index.html`、`/admin/books.html`、`/admin/users.html`、`/admin/records.html`、`/admin/logs.html`、`/admin/notices.html` 全部可访问；
- 非管理员访问 `/admin/*` 会被统一拒绝并跳转登录；
- 用户在 `/user/borrowings.html` 可执行续借/归还并看到即时反馈；
- 用户在 `/user/history.html` 可分页浏览历史记录；
- 用户在 `/user/profile.html` 更新资料时有校验和成功/失败反馈；
- `/index.html` 只做兼容跳转，不再承载主业务。

## 风险与应对

- 风险：前端页面迁移期间 class/id 不一致导致事件失效。  
  应对：每个任务提交前做页面 DOM 自检 + 关键按钮点击验证。

- 风险：历史分页改造影响旧调用。  
  应对：保持“未传 page/size 时沿用旧返回结构”的兼容分支。

- 风险：旧入口一次性退役导致习惯性访问失败。  
  应对：过渡期保留兼容页和明显跳转提示。
