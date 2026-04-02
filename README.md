# 图书管理系统（Java + MySQL + HTML/CSS/JS）

本项目依据需求文档实现，包含：

- 用户注册 / 登录 / 个人信息管理
- 管理员与普通用户权限区分
- 图书增删改查与多条件检索
- 借阅 / 归还 / 续借 / 逾期处理
- 逾期费用自动计算
- 管理员统计面板与系统参数配置
- 管理员操作日志记录

## 1. 技术栈

- 后端：Java 17, Spring Boot 3, Spring Data JPA
- 数据库：MySQL 8+
- 前端：HTML + CSS + JavaScript（静态资源）

## 2. 本地运行

1. 创建数据库：

```sql
CREATE DATABASE library_management DEFAULT CHARSET utf8mb4;
```

2. 配置数据库环境变量（推荐）：

```bash
DB_USERNAME=root
DB_PASSWORD=你的密码
```

Windows PowerShell：

```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="你的密码"
```

Windows CMD：

```cmd
set DB_USERNAME=root
set DB_PASSWORD=你的密码
```

也可直接调整 [src/main/resources/application.properties](src/main/resources/application.properties) 中的默认值。

3. 在项目根目录执行：

```bash
mvn spring-boot:run
```

PowerShell 也可一行启动：

```powershell
$env:DB_USERNAME="root"; $env:DB_PASSWORD="你的密码"; mvn spring-boot:run
```

4. 打开：

http://localhost:8080

## 3. 默认管理员

- 用户名：admin
- 密码：admin123

首次启动自动创建（若不存在）。

## 4. 核心接口

- 认证
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/register-admin`（管理员）
- 用户
  - `GET /api/users/me`
  - `PUT /api/users/me`
  - `POST /api/users/me/change-password`
- 图书
  - `GET /api/books`（支持 `keyword`；支持分页参数 `page` 从 0 开始、`size`）
  - `POST /api/books`（管理员）
  - `PUT /api/books/{id}`（管理员）
  - `DELETE /api/books/{id}`（管理员）
- 图书分类
  - `GET /api/book-categories`
  - `POST /api/book-categories`（管理员）
  - `PUT /api/book-categories/{id}`（管理员）
  - `DELETE /api/book-categories/{id}`（管理员）
- 借阅
  - `POST /api/borrow/{bookId}`
  - `POST /api/borrow/renew/{recordId}`
  - `POST /api/borrow/return/{recordId}`
  - `GET /api/borrow/my`
  - `GET /api/borrow/my-overdue`
  - `POST /api/borrow/scan-overdue`（管理员）
- 管理员
  - `GET /api/admin/stats`
  - `GET /api/admin/configs`
  - `PUT /api/admin/configs`
  - `GET /api/admin/users`（支持 `role=USER|ADMIN`；支持分页参数 `page`、`size`）
  - `GET /api/admin/logs`（支持分页参数 `page`、`size`；支持 `operation`、`startTime`、`endTime` 过滤）
  - `POST /api/admin/users/{id}/reset-password`

除公开接口外，请在 Header 中带上：`X-Token: <登录返回token>`

分页请求时，响应中会额外返回 `pagination` 字段；不传分页参数时保持原有返回格式（兼容旧前端）。

## 5. 安全与配置说明

- 认证采用 JWT，Header 使用 `X-Token: <accessToken>`。
- 登录返回 `accessToken` + `refreshToken`，可通过 `/api/auth/refresh` 刷新。
- 未登录访问受保护接口返回 401，越权访问返回 403。
- 推荐生产环境设置：
  - `JPA_DDL_AUTO=validate`
  - `SQL_INIT_MODE=never`
  - `JWT_SECRET=<至少32位随机密钥>`

## 6. 运行与发布检查清单

- 配置检查
  - 数据库连接与账号权限正确
  - `JWT_SECRET` 已配置且非默认值
  - `OVERDUE_SCAN_CRON` 按业务时段设置
- 日志级别建议
  - 开发：`LOG_LEVEL_ROOT=INFO`, `LOG_LEVEL_APP=DEBUG`
  - 生产：`LOG_LEVEL_ROOT=INFO`, `LOG_LEVEL_APP=INFO`
- 发布前验证
  - 执行 `mvn test`
  - 管理员登录、借阅、归还、续借、逾期扫描功能抽样验证
  - `/api/admin/logs` 过滤条件（操作关键字/时间范围）验证
