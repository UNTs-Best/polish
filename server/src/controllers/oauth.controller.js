import OAuthService from '../services/oauth.service.js';

const oauthService = new OAuthService();

export const getAuthProviders = async (req, res) => {
  try {
    const providers = oauthService.getAvailableProviders();

    res.json({
      providers,
      message: providers.length > 0
        ? 'OAuth providers available'
        : 'No OAuth providers configured'
    });
  } catch (err) {
    console.error('Get auth providers error:', err);
    res.status(500).json({ message: 'Failed to fetch OAuth providers' });
  }
};

export const getAuthUrl = async (req, res) => {
  try {
    const { provider } = req.params;
    const { state } = req.query;

    const authUrl = oauthService.getAuthUrl(provider, state);

    res.json({
      authUrl,
      provider
    });
  } catch (err) {
    console.error('Get auth URL error:', err);
    res.status(400).json({ message: err.message });
  }
};

export const handleCallback = async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, error_description);
      return res.status(400).json({
        message: 'OAuth authentication failed',
        error,
        error_description
      });
    }

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // Validate state if provided
    if (state && !oauthService.validateState(state, req.session?.oauthState)) {
      return res.status(400).json({ message: 'Invalid OAuth state' });
    }

    // Handle the OAuth callback
    const authResult = await oauthService.handleCallback(
      provider,
      code,
      req.get('User-Agent'),
      req.ip
    );

    // In a real app, you'd redirect to your frontend with the tokens
    // For API response, we'll return the tokens directly
    res.json({
      message: authResult.isNewUser ? 'Account created and logged in' : 'Logged in successfully',
      user: authResult.user,
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      expiresIn: authResult.expiresIn,
      isNewUser: authResult.isNewUser
    });

  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).json({ message: err.message || 'OAuth authentication failed' });
  }
};

export const initiateAuth = async (req, res) => {
  try {
    const { provider } = req.params;
    const { redirectUri } = req.query;

    // Generate state for CSRF protection
    const state = require('crypto').randomBytes(32).toString('hex');

    // Store state in session (in a real app)
    // req.session.oauthState = state;

    const authUrl = oauthService.getAuthUrl(provider, state);

    // If redirect URI is provided, redirect directly
    if (redirectUri) {
      res.redirect(authUrl);
    } else {
      res.json({
        authUrl,
        state,
        provider
      });
    }
  } catch (err) {
    console.error('Initiate auth error:', err);
    res.status(400).json({ message: err.message });
  }
};
