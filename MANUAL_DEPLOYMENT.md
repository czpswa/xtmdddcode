# 手动部署 Cloudflare Worker

由于网络问题或权限问题无法通过 GitHub Actions 自动部署，您可以按照以下步骤手动部署 Cloudflare Worker：

## 前提条件

1. 确保已安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
2. 确保已登录到 Cloudflare 账户：`wrangler login`

## 部署步骤

### 1. 配置环境变量

在 `cloudflarecode` 目录中创建 `.env` 文件：

```bash
# Cloudflare 环境配置
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_ZONE_ID=your_zone_id_here

# Google OAuth 配置
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
CALLBACK_URL=https://your-worker.your-subdomain.workers.dev/callback

# Cloudflare D1 数据库配置
D1_DATABASE_ID=your_d1_database_id_here
```

### 2. 部署到 Cloudflare

```bash
cd cloudflarecode
wrangler deploy
```

### 3. 配置 D1 数据库

如果尚未创建 D1 数据库，请按以下步骤操作：

1. 创建 D1 数据库：
   ```bash
   wrangler d1 create roo-code-users
   ```

2. 应用数据库迁移：
   ```bash
   wrangler d1 migrations apply roo-code-users
   ```

### 4. 配置环境变量

在 Cloudflare Dashboard 中设置环境变量：
1. 进入 Workers & Pages
2. 选择您的 Worker
3. 进入 Settings -> Variables
4. 添加以下环境变量：
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - CALLBACK_URL
   - D1_DATABASE_ID

## GitHub Actions 部署（可选）

如果您希望通过 GitHub Actions 自动部署，需要创建一个具有 `workflow` 权限的 Personal Access Token：

1. 登录到您的 GitHub 账户
2. 点击右上角的头像，选择 "Settings"
3. 在左侧菜单中选择 "Developer settings"
4. 选择 "Personal access tokens" -> "Tokens (classic)"
5. 点击 "Generate new token" -> "Generate new token (classic)"
6. 给 token 起个名字，比如 "roo-code-cloudflare"
7. 选择以下权限：
   - repo (全部)
   - workflow (全部)
   - admin:public_key (全部)
8. 点击 "Generate token"
9. 复制生成的 token 并保存好（只会显示一次）

然后在 GitHub 仓库中设置以下 secrets：
- `CF_API_TOKEN`: Cloudflare API token
- `CF_ACCOUNT_ID`: Cloudflare Account ID

## 验证部署

部署完成后，您可以通过以下 URL 访问您的 Worker：
- 主页：`https://your-worker.your-subdomain.workers.dev/`
- 认证端点：`https://your-worker.your-subdomain.workers.dev/auth/google`
- 回调端点：`https://your-worker.your-subdomain.workers.dev/callback`

## 故障排除

1. 如果遇到 CORS 问题，请检查 `src/index.ts` 中的 CORS 配置
2. 如果数据库连接失败，请确保 D1 数据库已正确创建并配置
3. 如果 OAuth 失败，请检查 Google Cloud Console 中的 OAuth 配置

## 后续步骤

部署成功后，您可以将 Worker URL 配置到 Roo-Code 插件中，使其能够使用 Cloudflare 作为后端服务。