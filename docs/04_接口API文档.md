# 图书管理系统 接口API文档

---

## 1. 概述

### 1.1 基本信息

| 项目 | 说明 |
|------|------|
| 基础路径 | `http://localhost:8080/api` |
| 请求格式 | JSON (`Content-Type: application/json`) |
| 响应格式 | JSON |
| 认证方式 | Header `X-Token: <accessToken>` |
| 字符编码 | UTF-8 |

### 1.2 通用响应格式

**成功响应**：

```json
{
  "code": "SUCCESS",
  "message": "操作成功",
  "data": { ... },
  "pagination": {
    "page": 0,
    "size": 10,
    "totalElements": 100,
    "totalPages": 10,
    "first": true,
    "last": false
  }
}
```

**错误响应**：

```json
{
  "code": "BUSINESS_ERROR",
  "message": "库存不足，无法借阅"
}
```

### 1.3 错误码

| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| SUCCESS | 200 | 成功 |
| AUTH_REQUIRED | 401 | 未登录或登录已失效 |
| ACCESS_DENIED | 403 | 权限不足 |
| VALIDATION_ERROR | 400 | 参数校验失败 |
| BUSINESS_ERROR | 400 | 业务逻辑错误 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 2. 认证接口

### 2.1 用户注册

```
POST /api/auth/register
```

**请求体**：

```json
{
  "username": "reader01",
  "realName": "张三",
  "password": "123456",
  "phone": "13800138000",
  "idCard": "110101199001011234"
}
```

**成功响应**：

```json
{
  "code": "SUCCESS",
  "message": "注册成功",
  "data": {
    "id": 2,
    "username": "reader01",
    "realName": "张三",
    "role": "USER"
  }
}
```

### 2.2 用户登录

```
POST /api/auth/login
```

**请求体**：

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**成功响应**：

```json
{
  "code": "SUCCESS",
  "message": "登录成功",
  "data": {
    "id": 1,
    "username": "admin",
    "realName": "系统管理员",
    "role": "ADMIN",
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "token": "eyJhbGciOi..."
  }
}
```

### 2.3 刷新 Token

```
POST /api/auth/refresh
```

**请求体**：

```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

**成功响应**：

```json
{
  "code": "SUCCESS",
  "message": "刷新成功",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "token": "eyJhbGciOi..."
  }
}
```

### 2.4 注册管理员（需 ADMIN）

```
POST /api/auth/register-admin
Header: X-Token: <adminAccessToken>
```

**请求体**：同"用户注册"。

---

## 3. 用户接口

### 3.1 获取当前用户信息

```
GET /api/users/me
Header: X-Token: <token>
```

### 3.2 更新个人信息

```
PUT /api/users/me
Header: X-Token: <token>
```

**请求体**：

```json
{
  "realName": "张三",
  "phone": "13900139000",
  "idCard": "110101199001011234"
}
```

### 3.3 修改密码

```
POST /api/users/me/change-password
Header: X-Token: <token>
```

**请求体**：

```json
{
  "oldPassword": "oldpass",
  "newPassword": "newpass"
}
```

---

## 4. 用户门户接口（USER）

### 4.1 用户仪表盘

```
GET /api/user/dashboard
Header: X-Token: <token>
```

**响应 data**：

```json
{
  "activeBorrowCount": 2,
  "overdueCount": 0,
  "publishedNoticeCount": 5
}
```

### 4.2 当前借阅列表

```
GET /api/user/borrowings
Header: X-Token: <token>
```

**响应 data 单项**：

```json
{
  "id": 1,
  "bookId": 1,
  "bookTitle": "Java 核心技术（卷 I）",
  "borrowTime": "2026-05-01T10:00:00",
  "dueTime": "2026-05-31T10:00:00",
  "status": "BORROWED",
  "renewCount": 0,
  "overdueFee": 0
}
```

### 4.3 借阅历史

```
GET /api/user/history?page=0&size=10&status=
Header: X-Token: <token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码（从 0 开始） |
| size | int | 否 | 每页数量（1-100） |
| status | string | 否 | "OVERDUE" 过滤逾期，空则返回全部已归还 |

### 4.4 逾期罚金

```
GET /api/user/fines
Header: X-Token: <token>
```

**响应 data**：

```json
{
  "totalFine": 5.50,
  "records": [...]
}
```

---

## 5. 借阅接口（USER）

### 5.1 借阅图书

```
POST /api/borrow/{bookId}
Header: X-Token: <token>
```

**请求体**（可选）：

```json
{
  "dueTime": "2026-06-15T10:00:00"
}
```

### 5.2 归还图书

```
POST /api/borrow/return/{recordId}
Header: X-Token: <token>
```

### 5.3 续借图书

```
POST /api/borrow/renew/{recordId}
Header: X-Token: <token>
```

**请求体**（可选）：

```json
{
  "dueTime": "2026-07-01T10:00:00"
}
```

### 5.4 我的当前借阅（同用户门户）

```
GET /api/borrow/my
Header: X-Token: <token>
```

### 5.5 我的逾期记录

```
GET /api/borrow/my-overdue
Header: X-Token: <token>
```

### 5.6 手动逾期扫描（ADMIN）

```
POST /api/borrow/scan-overdue
Header: X-Token: <adminToken>
```

**响应**：

```json
{
  "code": "SUCCESS",
  "message": "逾期扫描完成",
  "data": { "updatedCount": 3 }
}
```

---

## 6. 图书接口

### 6.1 查询图书列表

```
GET /api/books?keyword=&page=0&size=10&all=false
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词（书名/作者/ISBN/分类） |
| page | int | 否 | 页码 |
| size | int | 否 | 每页数量 |
| all | boolean | 否 | true=管理员查看全部，false=仅查在架（默认） |

**响应 data 单项**：

```json
{
  "id": 1,
  "title": "Java 核心技术（卷 I）",
  "author": "Cay S. Horstmann",
  "publisher": "机械工业出版社",
  "isbn": "9787111213826",
  "category": "编程",
  "stock": 10,
  "availableStock": 8,
  "active": true
}
```

### 6.2 新增图书（ADMIN）

```
POST /api/books
Header: X-Token: <adminToken>
```

**请求体**：

```json
{
  "title": "Java 核心技术（卷 I）",
  "author": "Cay S. Horstmann",
  "publisher": "机械工业出版社",
  "isbn": "9787111213826",
  "category": "编程",
  "stock": 10
}
```

### 6.3 更新图书（ADMIN）

```
PUT /api/books/{id}
Header: X-Token: <adminToken>
```

**请求体**：同"新增图书"。

### 6.4 删除图书（ADMIN）

```
DELETE /api/books/{id}
Header: X-Token: <adminToken>
```

### 6.5 上下架图书（ADMIN）

```
PUT /api/books/{id}/shelve?active=true
PUT /api/books/{id}/shelve?active=false
Header: X-Token: <adminToken>
```

---

## 7. 图书分类接口

### 7.1 查询全部分类（公开）

```
GET /api/book-categories
```

### 7.2 新增分类（ADMIN）

```
POST /api/book-categories
Header: X-Token: <adminToken>
```

**请求体**：

```json
{
  "name": "人工智能",
  "description": "AI 相关书籍"
}
```

### 7.3 更新分类（ADMIN）

```
PUT /api/book-categories/{id}
Header: X-Token: <adminToken>
```

**请求体**：同"新增分类"。

### 7.4 删除分类（ADMIN）

```
DELETE /api/book-categories/{id}
Header: X-Token: <adminToken>
```

---

## 8. 管理员接口

### 8.1 统计概览

```
GET /api/admin/stats
Header: X-Token: <adminToken>
```

**响应 data**：

```json
{
  "userCount": 10,
  "bookCount": 20,
  "borrowCount": 50,
  "overdueRecordCount": 3,
  "activeBorrowCount": 5
}
```

### 8.2 图书借阅统计

```
GET /api/admin/stats/books?limit=10
Header: X-Token: <adminToken>
```

### 8.3 用户借阅统计

```
GET /api/admin/stats/users?limit=20
Header: X-Token: <adminToken>
```

### 8.4 查询系统配置

```
GET /api/admin/configs
Header: X-Token: <adminToken>
```

**响应 data**：

```json
{
  "borrow_days": "30",
  "max_borrow_count": "5",
  "overdue_daily_fee": "1.0"
}
```

### 8.5 更新系统配置

```
PUT /api/admin/configs
Header: X-Token: <adminToken>
```

**请求体**（字段均可选）：

```json
{
  "borrowDays": 30,
  "maxBorrowCount": 5,
  "overdueDailyFee": 1.5
}
```

### 8.6 逾期统计概览

```
GET /api/admin/overdue-stats
Header: X-Token: <adminToken>
```

### 8.7 逾期记录列表

```
GET /api/admin/overdue-records?page=0&size=10
Header: X-Token: <adminToken>
```

### 8.8 用户列表

```
GET /api/admin/users?role=&page=0&size=10
Header: X-Token: <adminToken>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | string | 否 | "USER" 或 "ADMIN" |
| page | int | 否 | 页码 |
| size | int | 否 | 每页数量 |

### 8.9 变更用户角色

```
PUT /api/admin/users/{id}/role
Header: X-Token: <adminToken>
```

**请求体**：

```json
{
  "role": "ADMIN"
}
```

### 8.10 重置用户密码

```
POST /api/admin/users/{id}/reset-password
Header: X-Token: <adminToken>
```

**请求体**：

```json
{
  "newPassword": "newpass123"
}
```

### 8.11 操作日志

```
GET /api/admin/logs?operation=&startTime=&endTime=&page=0&size=10
Header: X-Token: <adminToken>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| operation | string | 否 | 操作名称筛选（如"更新系统参数"） |
| startTime | string | 否 | 开始时间（ISO 格式） |
| endTime | string | 否 | 结束时间（ISO 格式） |
| page | int | 否 | 页码 |
| size | int | 否 | 每页数量 |

**响应 data 单项**：

```json
{
  "id": 1,
  "adminName": "系统管理员",
  "operation": "更新系统参数",
  "detail": "{borrow_days=30, max_borrow_count=5}",
  "result": "SUCCESS",
  "durationMs": 15,
  "clientIp": "127.0.0.1",
  "userAgent": "Mozilla/5.0 ...",
  "createdAt": "2026-05-01T10:00:00"
}
```

---

## 9. 借阅记录管理接口（ADMIN）

### 9.1 全部借阅记录

```
GET /api/admin/records?status=&keyword=&page=0&size=10
Header: X-Token: <adminToken>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | BORROWED / RETURNED / OVERDUE |
| keyword | string | 否 | 搜索关键词（用户名/真实姓名/书名） |
| page | int | 否 | 页码 |
| size | int | 否 | 每页数量 |

**响应 data 单项**：

```json
{
  "id": 1,
  "userId": 2,
  "username": "reader01",
  "realName": "张三",
  "bookId": 1,
  "bookTitle": "Java 核心技术（卷 I）",
  "borrowTime": "2026-05-01T10:00:00",
  "dueTime": "2026-05-31T10:00:00",
  "returnTime": null,
  "status": "BORROWED",
  "renewCount": 0,
  "overdueFee": 0
}
```

---

## 10. 公告管理接口（ADMIN）

### 10.1 公告列表（管理端）

```
GET /api/admin/notices?page=0&size=10
Header: X-Token: <adminToken>
```

### 10.2 创建公告

```
POST /api/admin/notices
Header: X-Token: <adminToken>
```

**请求体**：

```json
{
  "title": "系统升级通知",
  "summary": "系统将于...",
  "content": "<p>详细内容...</p>",
  "published": true
}
```

### 10.3 更新公告

```
PUT /api/admin/notices/{id}
Header: X-Token: <adminToken>
```

### 10.4 删除公告

```
DELETE /api/admin/notices/{id}
Header: X-Token: <adminToken>
```

### 10.5 发布公告

```
POST /api/admin/notices/{id}/publish
Header: X-Token: <adminToken>
```

---

## 11. 公开接口

### 11.1 公共统计概览

```
GET /api/public/stats
```

**响应 data**：

```json
{
  "totalBooks": 20,
  "availableBooks": 15,
  "borrowedBooks": 5
}
```

### 11.2 公告列表

```
GET /api/public/notices?page=0&size=10
```

### 11.3 公告详情

```
GET /api/public/notices/{id}
```

### 11.4 图书目录

```
GET /api/public/books?keyword=&page=0&size=10
```

---

## 12. 错误场景示例

| 场景 | 状态码 | 错误码 | 消息 |
|------|--------|--------|------|
| 未登录访问受保护接口 | 401 | AUTH_REQUIRED | 未登录或登录已失效 |
| 普通用户访问管理接口 | 403 | ACCESS_DENIED | 无权限访问该资源 |
| 用户名已存在 | 400 | BUSINESS_ERROR | 用户名已存在 |
| 库存不足借阅 | 400 | BUSINESS_ERROR | 库存不足，无法借阅 |
| 达到借阅上限 | 400 | BUSINESS_ERROR | 已达到最大借阅数量限制 |
| 续借已逾期记录 | 400 | BUSINESS_ERROR | 已逾期记录不可续借，请先归还 |
| ISBN 重复 | 400 | BUSINESS_ERROR | ISBN 已存在 |
| 参数校验失败 | 400 | VALIDATION_ERROR | username: 不能为空 |
| 服务器错误 | 500 | INTERNAL_ERROR | 服务器内部错误: ... |
