# Roo-Code Cloudflare Worker

这个项目是 Roo-Code 插件的 Cloudflare Worker 后端服务，提供了用户认证和数据存储功能。

## 功能特性

- Google OAuth 2.0 认证
- 用户信息存储到 Cloudflare D1 数据库
- 自动部署到 Cloudflare Workers

## 部署方式

有两种方式可以部署这个 Worker：

### 1. GitHub Actions 自动部署（推荐）

1. Fork 这个仓库
2. 在仓库设置中添加以下 secrets：
   - `CF_API_TOKEN`: Cloudflare API token
   - `CF_ACCOUNT_ID`: Cloudflare Account ID
3. 更新 `.github/workflows/deploy.yml` 中的 `env` 部分，填入你的 Cloudflare 信息
4. 推送代码到 `main` 分支，GitHub Actions 会自动部署

### 2. 手动部署

参考 [MANUAL_DEPLOYMENT.md](MANUAL_DEPLOYMENT.md) 文件中的详细步骤。

## 配置

在部署之前，需要配置以下环境变量：

- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
- `CALLBACK_URL`: OAuth 回调 URL
- `D1_DATABASE_ID`: Cloudflare D1 数据库 ID

## 开发

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 本地开发
wrangler dev

# 部署到 Cloudflare
wrangler deploy
```

## 安全注意事项

- 永远不要在代码中硬编码敏感信息
- 使用环境变量来存储密钥和令牌
- 定期轮换密钥和令牌