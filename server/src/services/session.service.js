import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import UserModel from '../models/user.model.js';

/**
 * Service for managing user sessions and refresh tokens
 */
class SessionService {
  constructor() {
    this.supabase = null;
    this.jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret';
  }

  getSupabase() {
    if (!this.supabase) {
      this.supabase = getSupabaseAdmin();
    }
    return this.supabase;
  }

  // Convert camelCase to snake_case for database
  sessionToDb(session) {
    return {
      id: session.id,
      user_id: session.userId,
      user_agent: session.userAgent,
      ip_address: session.ipAddress,
      is_active: session.isActive,
      created_at: session.createdAt,
      last_activity_at: session.lastActivityAt,
      expires_at: session.expiresAt,
      deactivated_at: session.deactivatedAt
    };
  }

  // Convert snake_case to camelCase from database
  dbToSession(dbSession) {
    if (!dbSession) return null;
    return {
      id: dbSession.id,
      userId: dbSession.user_id,
      userAgent: dbSession.user_agent,
      ipAddress: dbSession.ip_address,
      isActive: dbSession.is_active,
      createdAt: dbSession.created_at,
      lastActivityAt: dbSession.last_activity_at,
      expiresAt: dbSession.expires_at,
      deactivatedAt: dbSession.deactivated_at
    };
  }

  // Helper to convert UserModel to database format
  userToDb(user) {
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      first_name: user.firstName,
      last_name: user.lastName,
      avatar: user.avatar,
      provider: user.provider,
      provider_id: user.providerId,
      provider_data: user.providerData,
      email_verified: user.emailVerified,
      is_active: user.isActive,
      refresh_token: user.refreshToken,
      refresh_token_expires_at: user.refreshTokenExpiresAt,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      last_login_at: user.lastLoginAt
    };
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
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const supabase = this.getSupabase();
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

    const dbSession = this.sessionToDb(session);

    const { data, error } = await supabase
      .from('sessions')
      .insert(dbSession)
      .select()
      .single();

    if (error) throw error;
    return this.dbToSession(data);
  }

  /**
   * Get active sessions for user
   */
  async getUserSessions(userId) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_activity_at', { ascending: false });

    if (error) throw error;
    return data.map(s => this.dbToSession(s));
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const supabase = this.getSupabase();

    // Get session first
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
    if (!session || !session.is_active) {
      return null;
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      await this.deactivateSession(sessionId);
      return null;
    }

    // Update last activity
    const { data: updated, error } = await supabase
      .from('sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return this.dbToSession(updated);
  }

  /**
   * Deactivate a session
   */
  async deactivateSession(sessionId) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const supabase = this.getSupabase();

    const { data, error } = await supabase
      .from('sessions')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select();

    if (error) throw error;
    return data && data.length > 0;
  }

  /**
   * Deactivate all user sessions
   */
  async deactivateAllUserSessions(userId) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const supabase = this.getSupabase();

    const { data, error } = await supabase
      .from('sessions')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true)
      .select();

    if (error) throw error;
    return data ? data.length : 0;
  }

  /**
   * Login user and create session
   */
  async loginUser(user, userAgent = null, ipAddress = null) {
    const supabase = this.getSupabase();

    // Update user's last login
    user.updateLastLogin();

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token in user
    user.setRefreshToken(refreshToken);

    // Update user in database
    const dbUser = this.userToDb(user);
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(dbUser)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

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
    const supabase = this.getSupabase();

    // Verify refresh token
    const decoded = this.verifyRefreshToken(refreshToken);

    // Get user
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!userData || !userData.is_active) {
      throw new Error('User not found or inactive');
    }

    // Check if refresh token matches
    if (userData.refresh_token !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Convert to UserModel
    const user = new UserModel({
      id: userData.id,
      email: userData.email,
      password: userData.password,
      firstName: userData.first_name,
      lastName: userData.last_name,
      avatar: userData.avatar,
      provider: userData.provider,
      providerId: userData.provider_id,
      providerData: userData.provider_data,
      emailVerified: userData.email_verified,
      isActive: userData.is_active,
      refreshToken: userData.refresh_token,
      refreshTokenExpiresAt: userData.refresh_token_expires_at,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
      lastLoginAt: userData.last_login_at
    });

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
    const supabase = this.getSupabase();

    // Get user
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (!userData) {
      return false;
    }

    const user = new UserModel({
      id: userData.id,
      email: userData.email,
      password: userData.password,
      firstName: userData.first_name,
      lastName: userData.last_name,
      avatar: userData.avatar,
      provider: userData.provider,
      providerId: userData.provider_id,
      providerData: userData.provider_data,
      emailVerified: userData.email_verified,
      isActive: userData.is_active,
      refreshToken: userData.refresh_token,
      refreshTokenExpiresAt: userData.refresh_token_expires_at,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
      lastLoginAt: userData.last_login_at
    });

    // Clear refresh token
    user.clearRefreshToken();

    // Update user
    const dbUser = this.userToDb(user);
    const { error } = await supabase
      .from('users')
      .update(dbUser)
      .eq('id', userId);

    if (error) throw error;

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
