import fetch from 'node-fetch';
import UserService from './user.service.js';
import SessionService from './session.service.js';

class OAuthService {
  constructor() {
    this.userService = new UserService();
    this.sessionService = new SessionService();

    // OAuth configurations
    this.providers = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scopes: ['openid', 'email', 'profile']
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: process.env.GITHUB_REDIRECT_URI,
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        emailsUrl: 'https://api.github.com/user/emails',
        scopes: ['user:email', 'read:user']
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET,
        redirectUri: process.env.APPLE_REDIRECT_URI,
        authUrl: 'https://appleid.apple.com/auth/authorize',
        tokenUrl: 'https://appleid.apple.com/auth/token',
        keysUrl: 'https://appleid.apple.com/auth/keys',
        scopes: ['name', 'email']
      }
    };
  }

  /**
   * Check if OAuth provider is configured
   */
  isProviderConfigured(provider) {
    const config = this.providers[provider];
    return config && config.clientId && config.clientSecret;
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(provider, state = null) {
    if (!this.isProviderConfigured(provider)) {
      throw new Error(`OAuth provider ${provider} is not configured`);
    }

    const config = this.providers[provider];
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      ...(state && { state })
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(provider, code) {
    if (!this.isProviderConfigured(provider)) {
      throw new Error(`OAuth provider ${provider} is not configured`);
    }

    const config = this.providers[provider];

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri
    });

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  /**
   * Get user info from OAuth provider
   */
  async getUserInfo(provider, accessToken, tokenData = {}) {
    const config = this.providers[provider];

    try {
      switch (provider) {
        case 'google':
          return await this.getGoogleUserInfo(accessToken);

        case 'github':
          return await this.getGitHubUserInfo(accessToken);

        case 'apple':
          return await this.getAppleUserInfo(tokenData);

        default:
          throw new Error(`Unsupported OAuth provider: ${provider}`);
      }
    } catch (error) {
      console.error('User info fetch error:', error);
      throw new Error('Failed to fetch user information from OAuth provider');
    }
  }

  /**
   * Get Google user info
   */
  async getGoogleUserInfo(accessToken) {
    const response = await fetch(this.providers.google.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      emailVerified: data.verified_email,
      firstName: data.given_name,
      lastName: data.family_name,
      avatar: data.picture,
      name: data.name,
      locale: data.locale
    };
  }

  /**
   * Get GitHub user info
   */
  async getGitHubUserInfo(accessToken) {
    // Get basic user info
    const userResponse = await fetch(this.providers.github.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Polish-App'
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch GitHub user info');
    }

    const userData = await userResponse.json();

    // Get user emails (GitHub requires separate request)
    const emailsResponse = await fetch(this.providers.github.emailsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Polish-App'
      }
    });

    let emails = [];
    if (emailsResponse.ok) {
      emails = await emailsResponse.json();
    }

    // Find primary email
    const primaryEmail = emails.find(email => email.primary)?.email || userData.email;

    return {
      id: userData.id.toString(),
      email: primaryEmail,
      emailVerified: true, // GitHub emails are verified
      name: userData.name,
      firstName: userData.name?.split(' ')[0],
      lastName: userData.name?.split(' ').slice(1).join(' '),
      avatar: userData.avatar_url,
      username: userData.login,
      bio: userData.bio,
      company: userData.company,
      location: userData.location,
      blog: userData.blog
    };
  }

  /**
   * Get Apple user info
   */
  async getAppleUserInfo(tokenData) {
    // Apple provides user info in the token response during initial authorization
    // For subsequent requests, we need to decode the ID token
    const idToken = tokenData.id_token;

    if (!idToken) {
      throw new Error('Apple ID token not provided');
    }

    // Decode the JWT to get user info
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid Apple ID token format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    return {
      id: payload.sub,
      email: payload.email,
      emailVerified: true,
      firstName: tokenData.user?.name?.firstName,
      lastName: tokenData.user?.name?.lastName,
      name: tokenData.user?.name ? `${tokenData.user.name.firstName} ${tokenData.user.name.lastName}` : null
    };
  }

  /**
   * Handle OAuth callback and create/update user
   */
  async handleCallback(provider, code, userAgent = null, ipAddress = null) {
    if (!this.isProviderConfigured(provider)) {
      throw new Error(`OAuth provider ${provider} is not configured`);
    }

    // Exchange code for token
    const tokenData = await this.exchangeCodeForToken(provider, code);

    // Get user info
    const userInfo = await this.getUserInfo(provider, tokenData.access_token, tokenData);

    // Find or create user
    const user = await this.userService.createOAuthUser(provider, userInfo);

    // Create session and tokens
    const sessionInfo = await this.sessionService.loginUser(user, userAgent, ipAddress);

    return {
      user: sessionInfo.user,
      accessToken: sessionInfo.accessToken,
      refreshToken: sessionInfo.refreshToken,
      expiresIn: sessionInfo.expiresIn,
      isNewUser: user.createdAt === user.updatedAt // Rough check for new user
    };
  }

  /**
   * Get available OAuth providers
   */
  getAvailableProviders() {
    const providers = [];

    for (const [name, config] of Object.entries(this.providers)) {
      if (this.isProviderConfigured(name)) {
        providers.push({
          name,
          authUrl: this.getAuthUrl(name),
          scopes: config.scopes
        });
      }
    }

    return providers;
  }

  /**
   * Validate OAuth state parameter (for CSRF protection)
   */
  validateState(state, expectedState) {
    // In a production app, you should validate the state parameter
    // to prevent CSRF attacks. For now, we'll do a simple check.
    return state === expectedState;
  }
}

export default OAuthService;
