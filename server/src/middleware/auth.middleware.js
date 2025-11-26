import SessionService from '../services/session.service.js';

const sessionService = new SessionService();

export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Missing or invalid authorization header' });
    }

    const token = parts[1];

    // Verify access token
    const payload = sessionService.verifyAccessToken(token);

    // Set user info on request
    req.auth = {
      id: payload.id,
      email: payload.email,
      provider: payload.provider,
      type: payload.type
    };

    // Extract session ID if present (for logout)
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
      req.sessionId = sessionId;
    }

    // Update session activity if session ID is provided
    if (sessionId) {
      sessionService.updateSessionActivity(sessionId).catch(err => {
        console.warn('Failed to update session activity:', err.message);
      });
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');

    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const payload = sessionService.verifyAccessToken(token);

      req.auth = {
        id: payload.id,
        email: payload.email,
        provider: payload.provider,
        type: payload.type
      };
    }

    next();
  } catch (err) {
    // Don't fail, just continue without auth
    req.auth = null;
    next();
  }
}

/**
 * Admin-only middleware
 */
export function requireAdmin(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // TODO: Implement role-based access control
  // For now, just check if user exists
  next();
}