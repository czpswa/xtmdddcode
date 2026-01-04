# Roo-Code Cloudflare 集成方案

## 项目概述

本项目是 Roo-Code 的 Cloudflare Worker 后端服务实现，主要用于处理 VSCode 插件的认证流程和相关 API 服务。

## 业务流程说明

详细的认证流程说明请参考 [AUTHENTICATION_FLOW.md](AUTHENTICATION_FLOW.md) 文件。

### 1. 整体架构
Roo-Code 是一个 VSCode 插件，通过 Cloudflare Worker 作为轻量级后端服务来处理认证相关的业务逻辑。当用户在 VSCode 中使用 Roo-Code 插件时，需要进行身份认证，此时插件会与 Cloudflare Worker 进行交互完成整个认证流程。

### 2. 认证流程概述

#### OAuth 2.0 授权码流程
Roo-Code 使用标准的 OAuth 2.0 授权码流程进行用户认证：
1. 用户在 VSCode 插件中点击登录
2. 插件将用户重定向到 Cloudflare Worker
3. Worker 将用户重定向到 Google OAuth 页面
4. 用户在 Google 页面授权应用访问
5. Google 将用户重定向回 Worker 的回调地址
6. Worker 处理回调并将用户信息存储到 D1 数据库
7. Worker 将认证令牌返回给 VSCode 插件

### 3. 核心功能模块

#### 健康检查
提供简单的健康检查接口，用于监控 Worker 服务的可用性。

#### OAuth 认证处理
负责处理完整的 OAuth 2.0 认证流程，包括初始重定向和回调处理。

#### VSCode 协议支持
支持 VSCode 自定义协议回调，确保认证结果能正确返回到插件。

## 环境配置说明

详细的环境配置说明请参考 [CONFIGURATION.md](CONFIGURATION.md) 文件。

### 环境变量
Worker 使用环境变量来管理不同部署环境的配置：
- ENVIRONMENT: 部署环境标识（production/development）
- OAUTH_CLIENT_ID: OAuth 客户端 ID
- JWT_SECRET: JWT 签名密钥

### 多环境支持
支持开发环境和生产环境的独立配置，便于测试和部署。

## 部署说明

### 部署方式
通过 Cloudflare Wrangler CLI 工具进行部署，支持一键部署到 Cloudflare Workers 平台。

### 配置管理
使用 wrangler.toml 文件管理部署配置，支持不同环境的差异化配置。

## 安全考虑

### 状态参数保护
使用 state 参数防止 CSRF 攻击，确保认证流程的安全性。

### HTTPS 强制
所有通信都通过 HTTPS 加密传输，保障数据安全。

### 敏感信息保护
通过 Cloudflare 的加密环境变量存储敏感配置信息。

## 扩展性设计

### 多 OAuth 提供商支持
架构设计上支持接入不同的 OAuth 提供商，只需调整相应的配置和处理逻辑。

### 自定义认证流程
可根据业务需求定制认证流程，支持企业内部认证系统集成。

## 故障排查

### 常见问题
1. 重定向循环：检查 URL 配置是否正确
2. 认证失败：验证 OAuth 客户端凭据
3. 回调失败：确认 VSCode 协议处理是否正常

### 日志查看
通过 Cloudflare 控制台查看 Worker 执行日志，帮助定位问题。