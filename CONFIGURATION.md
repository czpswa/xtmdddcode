# Cloudflare Worker 配置说明

## 环境变量配置

为了使 Cloudflare Worker 正常工作，您需要配置以下环境变量：

### 必需的环境变量

1. `OAUTH_CLIENT_ID` - Google OAuth 客户端 ID
2. `OAUTH_CLIENT_SECRET` - Google OAuth 客户端密钥
3. `JWT_SECRET` - 用于签名 JWT 令牌的密钥
4. `ENVIRONMENT` - 部署环境 (production 或 development)

### 获取 Google OAuth 凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建一个新的项目或选择现有项目
3. 启用 Google+ API
4. 在"凭证"页面创建 OAuth 2.0 客户端 ID
5. 设置授权回调 URL 为: `https://your-worker-url.workers.dev/auth/callback`
6. 复制生成的客户端 ID 和客户端密钥并配置到环境变量中

### 数据库配置

项目使用 Cloudflare D1 数据库存储用户信息。在首次部署时需要创建数据库：

```bash
# 创建 D1 数据库
npx wrangler d1 create roo-code-users

# 应用数据库迁移
npx wrangler d1 execute roo-code-users --file=./migrations/0001_create_users_table.sql
```

### 配置方法

#### 方法一：使用 .env 文件（推荐）

在项目根目录创建 `.env.production` 文件：

```env
OAUTH_CLIENT_ID=your-actual-google-oauth-client-id.apps.googleusercontent.com
OAUTH_CLIENT_SECRET=your-actual-google-oauth-client-secret-here
JWT_SECRET=your-production-secret-key-here-change-me
ENVIRONMENT=production
```

#### 方法二：直接在 wrangler.toml 中配置

编辑 `wrangler.toml` 文件：

```toml
[[ d1_databases ]]
binding = "DB"
database_name = "roo-code-users"
database_id = "your-database-id-here"

[env.production]
name = "roo-code-api-prod"
vars = {
  ENVIRONMENT = "production",
  OAUTH_CLIENT_SECRET = "your-production-oauth-client-secret-here",
  JWT_SECRET = "your-production-secret-key-here-change-me"
}
```

注意：OAuth 客户端 ID 仍然通过环境变量传递，以避免硬编码。

## 部署

### 使用自动化部署脚本（推荐）

项目提供了自动化部署脚本，可以自动检查配置并部署：

#### Linux/macOS:

```bash
npm run deploy:script
```

#### Windows:

```bash
npm run deploy:script:win
```

这些脚本会：
1. 检查是否已安装 wrangler
2. 验证 .env.production 文件中的环境变量配置
3. 自动部署到生产环境

### 手动部署

您也可以手动部署：

```bash
# 首次部署前创建数据库（仅需执行一次）
npx wrangler d1 create roo-code-users

# 应用数据库迁移（仅需执行一次）
npx wrangler d1 execute roo-code-users --file=./migrations/0001_create_users_table.sql

# 部署 Worker
npx wrangler deploy --env production
```

### 验证配置

部署后，您可以通过以下方式验证配置是否正确：

1. 访问健康检查端点: `https://your-worker-url.workers.dev/health`
2. 测试 OAuth 重定向: `https://your-worker-url.workers.dev/extension/provider-sign-up?state=test123`

如果配置正确，您应该被重定向到 Google 登录页面，而不是看到 "invalid_client" 错误。