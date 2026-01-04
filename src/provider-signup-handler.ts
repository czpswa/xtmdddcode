/**
 * Provider Sign-Up Handler
 * Handles requests to the provider-sign-up route, redirecting to the OAuth authentication flow
 */

export interface Env {
  ENVIRONMENT: string;
  JWT_SECRET: string;
  OAUTH_CLIENT_ID: string;
}

export async function providerSignUpHandler(request: Request, env: Env): Promise<Response> {
  const requestUrl = new URL(request.url)

  // Get required parameters
  const state = requestUrl.searchParams.get('state')
  const authRedirect = requestUrl.searchParams.get('auth_redirect')
  const organizationId = requestUrl.searchParams.get('organization_id') || requestUrl.searchParams.get('organizationId')

  // Validate required parameters
  if (!state) {
    return new Response('Missing required parameter: state', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    })
  }

  // Validate OAuth client ID configuration
  if (!env.OAUTH_CLIENT_ID || env.OAUTH_CLIENT_ID.startsWith('your-')) {
    return new Response('OAuth client ID is not properly configured', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    })
  }

  // Build OAuth authentication URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  
  // Use client ID from environment variables
  const clientId = env.OAUTH_CLIENT_ID
  
  // Add required authentication parameters
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', `${requestUrl.origin}/auth/callback`)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid profile email')
  authUrl.searchParams.set('state', state)
  
  // Pass additional parameters to callback
  if (authRedirect) {
    authUrl.searchParams.set('auth_redirect', authRedirect)
  }
  if (organizationId) {
    authUrl.searchParams.set('organization_id', organizationId)
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Location': authUrl.toString()
    }
  })
}