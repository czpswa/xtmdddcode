# Deployment Guide

## Prerequisites

1. A Cloudflare account with Workers enabled
2. A GitHub repository with this code
3. Cloudflare API token with Workers permissions

## Setting up GitHub Secrets

To deploy using GitHub Actions, you need to set up the following secrets in your GitHub repository:

1. Go to your repository settings
2. Click on "Secrets and variables" -> "Actions"
3. Add the following secrets:
   - `CF_API_TOKEN`: Your Cloudflare API token
   - `CF_ACCOUNT_ID`: Your Cloudflare account ID

## Creating a Cloudflare API Token

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com/)
2. Click on "My Profile" -> "API Tokens"
3. Click "Create Token"
4. Use the "Edit Cloudflare Workers" template or create a custom token with the following permissions:
   - Account > Cloudflare Workers Scripts > Edit
   - Account > Cloudflare Workers Routes > Edit
   - Account > Cloudflare Workers KV Storage > Edit
   - Account > Cloudflare Workers Tail > Read
   - Account > Cloudflare Workers R2 Storage > Edit
   - Account > Cloudflare Workers D1 Storage > Edit
   - User > User Details > Read

## Finding Your Account ID

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com/)
2. Select your domain
3. Your account ID is shown in the URL: `https://dash.cloudflare.com/[ACCOUNT_ID]/...`

## Deploying

Once you've set up the secrets, you can deploy by:

1. Pushing to the `main` branch
2. Manually triggering the workflow from the GitHub Actions tab

The deployment will automatically run and deploy your Worker to the production environment.