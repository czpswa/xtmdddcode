# Roo-Code 认证流程详解

## 整体架构

Roo-Code 使用 OAuth 2.0 授权码流程进行用户认证，结合 Cloudflare Workers 无服务器架构和 D1 数据库存储用户信息。

## 认证流程详解

### 1. 用户发起登录请求
当用户在 VSCode 插件中点击"开始使用"按钮时：
- 插件向 Cloudflare Worker 发送请求到 `/extension/provider-sign-up` 端点
- 请求包含必要的参数如 `state`（用于防止CSRF攻击）和 `auth_redirect`（VSCode回调URL）

### 2. 重定向到 Google OAuth
Cloudflare Worker 接收到请求后：
- 验证参数完整性
- 构造 Google OAuth 2.0 授权URL
- 将用户重定向到 Google 登录页面

### 3. 用户授权
用户在 Google 页面：
- 输入 Google 账号凭据
- 授权 Roo-Code 应用访问其基本信息（姓名、邮箱等）
- Google 返回授权码到 Cloudflare Worker 的回调地址 `/auth/callback`

### 4. 获取用户信息
Cloudflare Worker 在回调处理中：
- 使用授权码向 Google 请求访问令牌
- 使用访问令牌获取用户的 Google 账户信息（姓名、邮箱、头像等）
- 生成 Roo-Code 内部用户标识

### 5. 用户数据存储
系统将用户信息存储到 Cloudflare D1 数据库：
- 用户唯一标识符（UUID）
- Google 用户ID
- 邮箱地址
- 姓名
- 头像URL
- 首次登录时间
- 最后登录时间
- 访问令牌（加密存储）
- 刷新令牌（加密存储）

### 6. 返回 VSCode 插件
完成用户信息存储后：
- Cloudflare Worker 生成 Roo-Code 认证令牌
- 将用户重定向回 VSCode 插件，携带认证令牌
- VSCode 插件接收令牌并完成本地登录状态设置

## 数据存储结构

### 用户表 (users)
| 字段名 | 类型 | 描述 |
|-------|------|-----|
| id | TEXT (UUID) | 用户唯一标识符 |
| google_id | TEXT | Google 用户ID |
| email | TEXT | 邮箱地址 |
| name | TEXT | 用户姓名 |
| avatar_url | TEXT | 头像URL |
| created_at | TEXT (ISO8601) | 账户创建时间 |
| last_login | TEXT (ISO8601) | 最后登录时间 |
| access_token | TEXT (加密) | Google 访问令牌 |
| refresh_token | TEXT (加密) | Google 刷新令牌 |

## 数据库配置

### 创建数据库
在首次部署时需要创建 D1 数据库：

```bash
npx wrangler d1 create roo-code-users
```

### 应用迁移
创建表结构需要应用数据库迁移：

```bash
npx wrangler d1 execute roo-code-users --file=./migrations/0001_create_users_table.sql
```

### 数据库连接
Cloudflare Worker 通过绑定名称 `DB` 访问 D1 数据库，该绑定在 `wrangler.toml` 中配置。

## 安全机制

### 1. 令牌安全
- 访问令牌和刷新令牌在数据库中加密存储
- Roo-Code 内部使用 JWT 令牌进行会话管理
- 定期刷新 Google 访问令牌以保持有效性

### 2. 数据保护
- 敏感信息通过 Cloudflare 环境变量管理
- 数据库连接使用加密通道
- 用户密码不会存储（使用 OAuth 无需密码）

### 3. 防止攻击
- 使用 state 参数防止 CSRF 攻击
- 严格的输入验证和参数检查
- 速率限制防止滥用

## 扩展功能

### 组织管理
系统支持多用户组织结构：
- 用户可以创建或加入组织
- 组织级别的权限管理
- 协作功能的数据隔离

### 订阅管理
- 用户订阅状态跟踪
- 付费计划管理
- 使用额度限制

## 后续操作流程

用户登录后可以：
1. 访问个人资料和设置
2. 查看和管理组织成员
3. 使用 Roo-Code 的核心功能
4. 查看使用统计和历史记录
5. 管理订阅和账单信息

## API 端点

### 认证相关
- `GET /extension/provider-sign-up` - 发起 OAuth 流程
- `GET /auth/callback` - OAuth 回调处理
- `POST /auth/refresh` - 刷新访问令牌
- `POST /auth/logout` - 用户登出

### 用户相关
- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新用户信息
- `DELETE /api/users/me` - 删除用户账户

### 组织相关
- `GET /api/organizations` - 获取用户组织列表
- `POST /api/organizations` - 创建新组织
- `GET /api/organizations/{id}` - 获取组织详情
- `PUT /api/organizations/{id}` - 更新组织信息
- `DELETE /api/organizations/{id}` - 删除组织

这个认证流程确保了用户数据的安全性和隐私保护，同时提供了良好的用户体验和系统的可扩展性。