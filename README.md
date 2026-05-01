# 图书管理系统（Java + Vue 3 + H2/MySQL）

本项目依据需求文档实现，包含：

- 用户注册 / 登录 / 个人信息管理
- 管理员与普通用户权限区分（管理员可变更用户角色）
- 图书增删改查与多条件检索
- 借阅 / 归还 / 续借 / 逾期处理
- 逾期费用自动计算
- 管理员统计面板与系统参数配置（计费规则）
- 管理员操作日志记录
- 逾期记录查看与管理

## 1. 技术栈

- 后端：Java 17, Spring Boot 3, Spring Data JPA
- 数据库：H2 内嵌（开发）/ MySQL 8+（生产）
- 前端：Vue 3 + Vite + Element Plus

## 2. 本地运行

### 2.1 启动后端（二选一）

#### 方式 A：H2 内嵌数据库（开发，无需安装 MySQL）

项目默认配置为 H2，直接启动即可：

```bash
mvn spring-boot:run
```

#### 方式 B：MySQL（生产）

1. 创建数据库：

```sql
CREATE DATABASE library_management DEFAULT CHARSET utf8mb4;
```

2. 配置环境变量：

```bash
# Linux / macOS
export DB_USERNAME=root
export DB_PASSWORD=你的密码

# Windows PowerShell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="你的密码"

# Windows CMD
set DB_USERNAME=root
set DB_PASSWORD=你的密码
```

3. 在 [application.properties](src/main/resources/application.properties) 中取消注释 MySQL 配置并注释 H2 配置。

4. 启动：

```bash
mvn spring-boot:run
```

### 2.2 启动前端

```bash
cd frontend
npm install   # 首次运行
npm run dev
```

### 2.3 访问地址

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:5173 |
| 后端 API | http://localhost:8080 |
| H2 控制台 | http://localhost:8080/h2-console |

> 前端 Vite 开发服务器将 `/api` 请求自动代理到后端 `localhost:8080`。

## 3. 默认管理员

- 用户名：admin
- 密码：admin123

首次启动自动创建（若不存在）。

## 4. 前端页面

### 公共页面
| 路径 | 说明 |
|------|------|
| `/home` | 首页 |
| `/catalog` | 图书目录 |
| `/news` | 公告列表 |
| `/news/:id` | 公告详情 |
| `/about` | 关于页面 |
| `/login` | 登录 |
| `/register` | 注册 |

### 用户中心
| 路径 | 说明 |
|------|------|
| `/user/dashboard` | 用户仪表盘 |
| `/user/borrowings` | 当前借阅 |
| `/user/history` | 借阅历史 |
| `/user/fines` | 逾期罚金 |
| `/user/profile` | 个人信息 |

### 管理后台
| 路径 | 说明 |
|------|------|
| `/admin/dashboard` | 后台仪表盘 |
| `/admin/books` | 图书管理 |
| `/admin/users` | 用户管理（含角色变更） |
| `/admin/records` | 借阅记录 |
| `/admin/overdue` | 逾期管理 |
| `/admin/notices` | 公告管理 |
| `/admin/settings` | 系统设置（计费规则） |
| `/admin/logs` | 操作日志 |

## 5. 核心接口

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/refresh` | 刷新 Token |
| POST | `/api/auth/register-admin` | 注册管理员 |

### 用户
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users/me` | 获取当前用户信息 |
| PUT | `/api/users/me` | 更新个人信息 |
| POST | `/api/users/me/change-password` | 修改密码 |

### 图书
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/books` | 查询图书列表（支持 `keyword`、`page`、`size`） |
| POST | `/api/books` | 新增图书（管理员） |
| PUT | `/api/books/{id}` | 修改图书（管理员） |
| DELETE | `/api/books/{id}` | 删除图书（管理员） |

### 图书分类
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/book-categories` | 查询所有分类 |
| POST | `/api/book-categories` | 新增分类（管理员） |
| PUT | `/api/book-categories/{id}` | 修改分类（管理员） |
| DELETE | `/api/book-categories/{id}` | 删除分类（管理员） |

### 借阅
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/borrow/{bookId}` | 借阅图书 |
| POST | `/api/borrow/renew/{recordId}` | 续借 |
| POST | `/api/borrow/return/{recordId}` | 归还 |
| GET | `/api/borrow/my` | 我的当前借阅 |
| GET | `/api/borrow/my-overdue` | 我的逾期记录 |
| POST | `/api/borrow/scan-overdue` | 手动触发逾期扫描（管理员） |

### 管理员
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/stats` | 统计概览 |
| GET | `/api/admin/configs` | 查看系统配置 |
| PUT | `/api/admin/configs` | 更新系统配置（借阅天数 / 最大借阅数 / 逾期日费） |
| GET | `/api/admin/users` | 用户列表（支持 `role`、`page`、`size`） |
| PUT | `/api/admin/users/{id}/role` | 变更用户角色 |
| POST | `/api/admin/users/{id}/reset-password` | 重置用户密码 |
| GET | `/api/admin/overdue-records` | 逾期记录列表（支持 `page`、`size`） |
| GET | `/api/admin/overdue-stats` | 逾期统计概览 |
| GET | `/api/admin/logs` | 操作日志（支持 `operation`、`startTime`、`endTime`、`page`、`size`） |
| GET | `/api/admin/records` | 借阅记录（支持 `status`、`keyword`、`page`、`size`） |
| POST/PUT/DELETE | `/api/admin/notices` | 公告管理 |

除公开接口外，请在 Header 中带上：`X-Token: <登录返回的 accessToken>`

分页请求的响应中会额外返回 `pagination` 字段。

## 6. 系统配置项

管理员可在管理后台「系统设置」页面或通过 API 配置以下参数：

| 配置键 | 说明 | 默认值 |
|--------|------|--------|
| `borrow_days` | 默认借阅天数 | 30 |
| `max_borrow_count` | 最大借阅数量 | 5 |
| `overdue_daily_fee` | 每日逾期费用（元） | 1.0 |

## 7. 安全与配置说明

- 认证采用 JWT，Header 使用 `X-Token: <accessToken>`。
- 登录返回 `accessToken` + `refreshToken`，可通过 `/api/auth/refresh` 刷新。
- 未登录访问受保护接口返回 401，越权访问返回 403。
- 推荐生产环境设置：
  - `JPA_DDL_AUTO=validate`
  - `SQL_INIT_MODE=never`
  - `JWT_SECRET=<至少32位随机密钥>`

## 8. 运行与发布检查清单

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
  - 用户角色变更、逾期记录查看、计费规则配置功能验证
  - `/api/admin/logs` 过滤条件（操作关键字/时间范围）验证
