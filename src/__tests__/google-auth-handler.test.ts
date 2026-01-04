import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleGoogleAuthCallback } from '../google-auth-handler';

// Mock the fetch function
global.fetch = vi.fn();

describe('Google Auth Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle Google OAuth callback successfully', async () => {
    // Mock the token exchange response
    const mockTokenResponse = {
      ok: true,
      json: async () => ({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token'
      })
    };

    // Mock the user info response
    const mockUserInfoResponse = {
      ok: true,
      json: async () => ({
        id: '123456789',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      })
    };

    // Mock the database
    const mockDb = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true })
    };

    // Mock the fetch calls
    (global.fetch as any)
      .mockResolvedValueOnce(mockTokenResponse)
      .mockResolvedValueOnce(mockUserInfoResponse);

    // Create a mock request
    const mockRequest = {
      url: 'https://worker.example.com/auth/callback?state=test-state&code=test-code&auth_redirect=vscode://test'
    } as unknown as Request;

    // Create mock environment
    const mockEnv = {
      OAUTH_CLIENT_ID: 'test-client-id',
      OAUTH_CLIENT_SECRET: 'test-client-secret',
      DB: mockDb
    } as any;

    // Call the handler
    const response = await handleGoogleAuthCallback(mockRequest, mockEnv);

    // Assertions
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('vscode://test/auth/google/callback');
    expect(response.headers.get('Location')).toContain('state=test-state');
    expect(response.headers.get('Location')).toContain('code=test-code');
    expect(response.headers.get('Location')).toContain('auth=success');
    
    // Verify that fetch was called for token exchange
    expect(global.fetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
    );
    
    // Verify that fetch was called for user info
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      expect.objectContaining({
        headers: {
          'Authorization': 'Bearer mock-access-token'
        }
      })
    );
  });

  it('should handle OAuth error', async () => {
    // Create a mock request with error
    const mockRequest = {
      url: 'https://worker.example.com/auth/callback?error=access_denied'
    } as unknown as Request;

    // Create mock environment
    const mockEnv = {
      OAUTH_CLIENT_ID: 'test-client-id',
      OAUTH_CLIENT_SECRET: 'test-client-secret',
      DB: {} as any
    } as any;

    // Call the handler
    const response = await handleGoogleAuthCallback(mockRequest, mockEnv);

    // Assertions
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('Authentication failed: access_denied');
  });

  it('should handle missing parameters', async () => {
    // Create a mock request with missing parameters
    const mockRequest = {
      url: 'https://worker.example.com/auth/callback'
    } as unknown as Request;

    // Create mock environment
    const mockEnv = {
      OAUTH_CLIENT_ID: 'test-client-id',
      OAUTH_CLIENT_SECRET: 'test-client-secret',
      DB: {} as any
    } as any;

    // Call the handler
    const response = await handleGoogleAuthCallback(mockRequest, mockEnv);

    // Assertions
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('Missing required authentication parameters');
  });
});