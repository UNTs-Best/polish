import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getContainer, isCosmosConfigured } from '../config/db.js';
import UserModel from '../models/user.model.js';

/**
 * Service for managing user sessions and refresh tokens
 */
class SessionService {
  constructor() {
    this.usersContainer = null;
    this.sessionsContainer = null;
    this.jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret';
  }

  async getUsersContainer() {
    if (!this.usersContainer) {
      this.usersContainer = await getContainer('Users');
    }
    return this.usersContainer;
  }

  async getSessionsContainer() {
    if (!this.sessionsContainer) {
      this.sessionsContainer = await getContainer('Sessions');
    }
    return this.sessionsContainer;
  }

  /**
   * Generate access token (short-lived)
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        provider: user.provider,
        type: 'access'
      },
      this.jwtSecret,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );
  }

  /**
   * Generate refresh token (long-lived)
   */
  generateRefreshToken(user) {
    const tokenId = uuidv4();
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        tokenId,
        type: 'refresh'
      },
      this.jwtRefreshSecret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtRefreshSecret);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Create a new session for user
   */
  async createSession(userId, userAgent = null, ipAddress = null) {
    if (!isCosmosConfigured()) {
      throw new Error('CosmosDB not configured');
    }

    const container = await this.getSessionsContainer();
    const sessionId = uuidv4();

    const session = {
      id: sessionId,
      userId,
      userAgent,
      ipAddress,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      isActive: true,
      expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString() // 7 days
    };

    const { resource } = await container.items.create(session);
    return resource;
  }

  /**
   * Get active sessions for user
   */
  async getUserSessions(userId) {
    if (!isCosmosConfigured()) {
      throw new Error('CosmosDB not configured');
    }

    const container = await this.getSessionsContainer();
    const query = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.isActive = true ORDER BY c.lastActivityAt DESC',
      parameters: [{ name: '@userId', value: userId }]
    };

    const { resources } = await container.items.query(query).fetchAll();
    return resources;
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId) {
    if (!isCosmosConfigured()) {
      throw new Error('CosmosDB not configured');
    }

    const container = await this.getSessionsContainer();
    const query = {
      query: 'SELECT TOP 1 * FROM c WHERE c.id = @sessionId',
      parameters: [{ name: '@sessionId', value: sessionId }]
    };

    const { resources } = await container.items.query(query).fetchAll();
    const session = resources[0];

    if (!session || !session.isActive) {
      return null;
    }

    // Check if session expired
    if (new Date(session.expiresAt) < new Date()) {
      await this.deactivateSession(sessionId);
      return null;
    }

    // Update last activity
    const updatedSession = {
      ...session,
      lastActivityAt: new Date().toISOString()
    };

    const { resource } = await container.item(sessionId, session.userId).replace(updatedSession);
    return resource;
  }

  /**
   * Deactivate a session
   */
  async deactivateSession(sessionId) {
    if (!isCosmosConfigured()) {
      throw new Error('CosmosDB not configured');
    }

    const container = await this.getSessionsContainer();
    const query = {
      query: 'SELECT TOP 1 * FROM c WHERE c.id = @sessionId',
      parameters: [{ name: '@sessionId', value: sessionId }]
    };

    const { resources } = await container.items.query(query).fetchAll();
    const session = resources[0];

    if (!session) {
      return false;
    }

    const updatedSession = {
      ...session,
      isActive: false,
      deactivatedAt: new Date().toISOString()
    };

    await container.item(sessionId, session.userId).replace(updatedSession);
    return true;
  }

  /**
   * Deactivate all user sessions
   */
  async deactivateAllUserSessions(userId) {
    if (!isCosmosConfigured()) {
      throw new Error('CosmosDB not configured');
    }

    const container = await this.getSessionsContainer();
    const sessions = await this.getUserSessions(userId);

    const promises = sessions.map(session => {
      const updatedSession = {
        ...session,
        isActive: false,
        deactivatedAt: new Date().toISOString()
      };
      return container.item(session.id, session.userId).replace(updatedSession);
    });

    await Promise.all(promises);
    return sessions.length;
  }

  /**
   * Login user and create session
   */
  async loginUser(user, userAgent = null, ipAddress = null) {
    // Update user's last login
    user.updateLastLogin();

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token in user
    user.setRefreshToken(refreshToken);

    // Update user in database
    const usersContainer = await this.getUsersContainer();
    const { resource: updatedUser } = await usersContainer.item(user.id, user.email).replace(user.toJSON());

    // Create session
    const session = await this.createSession(user.id, userAgent, ipAddress);

    return {
      user: updatedUser,
      accessToken,
      refreshToken,
      session,
      expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN?.replace('m', '') || '15') * 60 // seconds
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    // Verify refresh token
    const decoded = this.verifyRefreshToken(refreshToken);

    // Get user
    const usersContainer = await this.getUsersContainer();
    const query = {
      query: 'SELECT TOP 1 * FROM c WHERE c.id = @userId',
      parameters: [{ name: '@userId', value: decoded.id }]
    };

    const { resources } = await usersContainer.items.query(query).fetchAll();
    const userData = resources[0];

    if (!userData || !userData.isActive) {
      throw new Error('User not found or inactive');
    }

    // Check if refresh token matches
    if (userData.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const user = new UserModel(userData);

    // Generate new access token
    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN?.replace('m', '') || '15') * 60
    };
  }

  /**
   * Logout user (invalidate refresh token and sessions)
   */
  async logoutUser(userId, sessionId = null) {
    // Get user
    const usersContainer = await this.getUsersContainer();
    const query = {
      query: 'SELECT TOP 1 * FROM c WHERE c.id = @userId',
      parameters: [{ name: '@userId', value: userId }]
    };

    const { resources } = await usersContainer.items.query(query).fetchAll();
    const userData = resources[0];

    if (!userData) {
      return false;
    }

    const user = new UserModel(userData);

    // Clear refresh token
    user.clearRefreshToken();

    // Update user
    await usersContainer.item(userId, user.email).replace(user.toJSON());

    // Deactivate specific session or all sessions
    if (sessionId) {
      await this.deactivateSession(sessionId);
    } else {
      await this.deactivateAllUserSessions(userId);
    }

    return true;
  }
}

export default SessionService;
