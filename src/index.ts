import { providerSignUpHandler, Env } from './provider-signup-handler';
import { handleGoogleAuthCallback } from './google-auth-handler';

export interface CloudflareEnv extends Env {
  DB: any; // D1Database type available in Workers
  OAUTH_CLIENT_SECRET: string;
}

export default {
  async fetch(request: Request, env: CloudflareEnv): Promise<Response> {
    const url = new URL(request.url);

    // Handle provider-sign-up route
    if (url.pathname === '/extension/provider-sign-up') {
      return providerSignUpHandler(request, env);
    }

    // Handle Google OAuth callback
    if (url.pathname === '/auth/callback') {
      return handleGoogleAuthCallback(request, env);
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Default handler - return Hello World
    return new Response('Cloudflare Worker - Hello World!-04');
  }
}