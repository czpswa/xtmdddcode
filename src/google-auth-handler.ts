/**
 * Google OAuth Handler
 * Handles Google OAuth callbacks, retrieves user information and stores it in the D1 database
 */

export interface Env {
  ENVIRONMENT: string;
  JWT_SECRET: string;
  OAUTH_CLIENT_ID: string;
  OAUTH_CLIENT_SECRET: string;
  DB: any; // D1Database type available in Workers
}

/**
 * Handle Google OAuth callback
 */
export async function handleGoogleAuthCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // Get authentication information from query parameters
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const authRedirect = url.searchParams.get('auth_redirect') || 'vscode://RooVeterinaryInc.xtmddd';
  const organizationId = url.searchParams.get('organization_id') || url.searchParams.get('organizationId');

  // Check for errors
  if (error) {
    return new Response(`Authentication failed: ${error}`, {
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Validate required parameters
  if (!state || !code) {
    return new Response('Missing required authentication parameters', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForTokens(code, env.OAUTH_CLIENT_ID, env.OAUTH_CLIENT_SECRET, `${url.origin}/auth/callback`);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to exchange code for tokens: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`);
    }
    
    const tokens = await tokenResponse.json();

    // Use access token to get user information
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      throw new Error(`Failed to fetch user info: ${userInfoResponse.status} ${userInfoResponse.statusText} - ${errorText}`);
    }
    
    const userInfo = await userInfoResponse.json();

    // Store user information in D1 database
    const userId = await storeUserInDatabase(userInfo, tokens, env);

    // Construct redirect URL back to VSCode
    const baseRedirect = authRedirect.replace(/\/?$/, '');
    const redirectUrl = new URL(`${baseRedirect}/auth/clerk/callback`);
    redirectUrl.searchParams.set('state', state);
    redirectUrl.searchParams.set('code', code);
    redirectUrl.searchParams.set('userId', userId);
    redirectUrl.searchParams.set('auth', 'success');
    redirectUrl.searchParams.set('provider', 'google');
    redirectUrl.searchParams.set('organizationId', organizationId || 'null');

    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString()
      }
    });
  } catch (error: unknown) {
    console.error('Authentication error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(`Authentication failed: ${errorMessage}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForTokens(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<Response> {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const body = new URLSearchParams({
    'client_id': clientId,
    'client_secret': clientSecret,
    'code': code,
    'grant_type': 'authorization_code',
    'redirect_uri': redirectUri
  });

  return fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });
}

/**
 * Store user information in D1 database
 */
async function storeUserInDatabase(userInfo: any, tokens: any, env: Env): Promise<string> {
  // Generate user ID
  const userId = crypto.randomUUID();
  
  // Insert or update user information
  const stmt = env.DB.prepare(`
    INSERT INTO users (id, google_id, email, name, avatar_url, access_token, refresh_token, created_at, last_login)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(google_id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      avatar_url = excluded.avatar_url,
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      last_login = datetime('now')
  `);
  
  const result = await stmt.bind(
    userId,
    userInfo.id,
    userInfo.email,
    userInfo.name,
    userInfo.picture,
    tokens.access_token,
    tokens.refresh_token
  ).run();
  
  if (!result.success) {
    throw new Error('Failed to store user in database');
  }
  
  return userId;
}