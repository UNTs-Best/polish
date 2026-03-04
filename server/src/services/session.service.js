import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import UserModel from '../models/user.model.js';

/**
 * DB sessions columns: id, user_id, token, refresh_token, expires_at,
 *                      ip_address, user_agent, is_active, created_at
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

  dbToSession(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      refreshToken: row.refresh_token,
      userAgent: row.user_agent,
      ipAddress: row.ip_address,
      isActive: row.is_active,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    };
  }

  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        provider: user.provider || user.auth_provider,
        type: 'access'
      },
      this.jwtSecret,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );
  }

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

  async createSession(userId, accessToken, refreshToken, userAgent = null, ipAddress = null) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = this.getSupabase();

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        id: uuidv4(),
        user_id: userId,
        token: accessToken,
        refresh_token: refreshToken,
        user_agent: userAgent,
        ip_address: ipAddress,
        is_active: true,
        expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return this.dbToSession(data);
  }

  async getUserSessions(userId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(s => this.dbToSession(s));
  }

  async updateSessionActivity(sessionId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = this.getSupabase();

    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!session || !session.is_active) return null;

    if (new Date(session.expires_at) < new Date()) {
      await this.deactivateSession(sessionId);
      return null;
    }

    return this.dbToSession(session);
  }

  async deactivateSession(sessionId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = this.getSupabase();

    const { data, error } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('id', sessionId)
      .select();

    if (error) throw error;
    return data && data.length > 0;
  }

  async deactivateAllUserSessions(userId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = this.getSupabase();

    const { data, error } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)
      .select();

    if (error) throw error;
    return data ? data.length : 0;
  }

  async loginUser(user, userAgent = null, ipAddress = null) {
    const supabase = this.getSupabase();

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', user.id);

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const session = await this.createSession(user.id, accessToken, refreshToken, userAgent, ipAddress);

    return {
      user: user.toPublicProfile ? user.toPublicProfile() : user,
      accessToken,
      refreshToken,
      session,
      expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN?.replace('m', '') || '15') * 60
    };
  }

  async refreshAccessToken(refreshToken) {
    const supabase = this.getSupabase();
    const decoded = this.verifyRefreshToken(refreshToken);

    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .select('*')
      .eq('refresh_token', refreshToken)
      .eq('is_active', true)
      .single();

    if (sessionErr && sessionErr.code !== 'PGRST116') throw sessionErr;
    if (!session) throw new Error('Invalid refresh token - no active session');

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!userData) throw new Error('User not found');

    const user = new UserModel({
      id: userData.id,
      email: userData.email,
      password: userData.password_hash,
      firstName: userData.first_name,
      lastName: userData.last_name,
      avatar: userData.avatar_url,
      provider: userData.auth_provider,
      providerId: userData.auth_provider_id,
      emailVerified: userData.email_verified,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
      lastLoginAt: userData.last_login
    });

    const accessToken = this.generateAccessToken(user);

    await supabase
      .from('sessions')
      .update({ token: accessToken })
      .eq('id', session.id);

    return {
      accessToken,
      expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN?.replace('m', '') || '15') * 60
    };
  }

  async logoutUser(userId, sessionId = null) {
    if (sessionId) {
      await this.deactivateSession(sessionId);
    } else {
      await this.deactivateAllUserSessions(userId);
    }
    return true;
  }
}

export default SessionService;
