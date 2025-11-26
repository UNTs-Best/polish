import { v4 as uuidv4 } from 'uuid';

/**
 * User Model for authentication and profile management
 * Supports both local authentication and OAuth providers
 */
export class UserModel {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.email = data.email;
    this.password = data.password || null; // null for OAuth users
    this.firstName = data.firstName || null;
    this.lastName = data.lastName || null;
    this.avatar = data.avatar || null;

    // OAuth provider information
    this.provider = data.provider || 'local'; // 'local', 'google', 'github', 'apple'
    this.providerId = data.providerId || null; // OAuth provider's user ID
    this.providerData = data.providerData || null; // Additional OAuth data

    // Account status
    this.emailVerified = data.emailVerified || false;
    this.isActive = data.isActive !== undefined ? data.isActive : true;

    // Session management
    this.refreshToken = data.refreshToken || null;
    this.refreshTokenExpiresAt = data.refreshTokenExpiresAt || null;

    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastLoginAt = data.lastLoginAt || null;
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      avatar: this.avatar,
      provider: this.provider,
      providerId: this.providerId,
      providerData: this.providerData,
      emailVerified: this.emailVerified,
      isActive: this.isActive,
      refreshToken: this.refreshToken,
      refreshTokenExpiresAt: this.refreshTokenExpiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
    };
  }

  // Public profile data (safe for client)
  toPublicProfile() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      avatar: this.avatar,
      provider: this.provider,
      emailVerified: this.emailVerified,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
    };
  }

  // Check if user is authenticated via OAuth
  isOAuthUser() {
    return this.provider !== 'local';
  }

  // Check if refresh token is valid
  isRefreshTokenValid() {
    if (!this.refreshToken || !this.refreshTokenExpiresAt) {
      return false;
    }
    return new Date(this.refreshTokenExpiresAt) > new Date();
  }

  // Update last login time
  updateLastLogin() {
    this.lastLoginAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // Set refresh token
  setRefreshToken(token, expiresInHours = 24 * 7) { // Default 7 days
    this.refreshToken = token;
    this.refreshTokenExpiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000)).toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // Clear refresh token
  clearRefreshToken() {
    this.refreshToken = null;
    this.refreshTokenExpiresAt = null;
    this.updatedAt = new Date().toISOString();
  }
}

export default UserModel;
