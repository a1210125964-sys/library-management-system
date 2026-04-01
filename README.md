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

2. 修改配置文件 [src/main/resources/application.properties](src/main/resources/application.properties) 中的 MySQL 用户名和密码。

3. 在项目根目录执行：

```bash
mvn spring-boot:run
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
  - `POST /api/auth/register-admin`（管理员）
- 用户
  - `GET /api/users/me`
  - `PUT /api/users/me`
  - `POST /api/users/me/change-password`
- 图书
  - `GET /api/books`
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
  - `GET /api/admin/users`
  - `POST /api/admin/users/{id}/reset-password`

除公开接口外，请在 Header 中带上：`X-Token: <登录返回token>`
