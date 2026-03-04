import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import UserModel from '../models/user.model.js';

class UserService {
    constructor() {
        this.supabase = null;
    }

    getSupabase() {
        if (!this.supabase) {
            this.supabase = getSupabaseAdmin();
        }
        return this.supabase;
    }

    // Convert UserModel (camelCase) to database format (snake_case)
    modelToDb(user) {
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

    // Convert database format (snake_case) to UserModel (camelCase)
    dbToModel(dbUser) {
        if (!dbUser) return null;
        return new UserModel({
            id: dbUser.id,
            email: dbUser.email,
            password: dbUser.password,
            firstName: dbUser.first_name,
            lastName: dbUser.last_name,
            avatar: dbUser.avatar,
            provider: dbUser.provider,
            providerId: dbUser.provider_id,
            providerData: dbUser.provider_data,
            emailVerified: dbUser.email_verified,
            isActive: dbUser.is_active,
            refreshToken: dbUser.refresh_token,
            refreshTokenExpiresAt: dbUser.refresh_token_expires_at,
            createdAt: dbUser.created_at,
            updatedAt: dbUser.updated_at,
            lastLoginAt: dbUser.last_login_at
        });
    }

    async getUserbyEmail(email) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
        const supabase = this.getSupabase();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return this.dbToModel(data);
    }

    async getUserByProviderId(provider, providerId) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
        const supabase = this.getSupabase();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('provider', provider)
            .eq('provider_id', providerId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return this.dbToModel(data);
    }

    async createUser(data) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
        const supabase = this.getSupabase();
        const user = new UserModel(data);
        const dbUser = this.modelToDb(user);

        const { data: created, error } = await supabase
            .from('users')
            .insert(dbUser)
            .select()
            .single();

        if (error) throw error;
        return this.dbToModel(created);
    }

    async createOAuthUser(provider, providerData) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        // Extract user info based on provider
        let userData = {
            provider,
            providerId: providerData.id,
            providerData,
            emailVerified: true // OAuth users are pre-verified
        };

        switch (provider) {
            case 'google':
                userData.email = providerData.email;
                userData.firstName = providerData.given_name;
                userData.lastName = providerData.family_name;
                userData.avatar = providerData.picture;
                break;
            case 'github':
                userData.email = providerData.email;
                userData.firstName = providerData.name?.split(' ')[0];
                userData.lastName = providerData.name?.split(' ').slice(1).join(' ');
                userData.avatar = providerData.avatar_url;
                break;
            case 'apple':
                userData.email = providerData.email;
                // Apple doesn't provide name/avatar in the same way
                userData.firstName = providerData.name?.firstName;
                userData.lastName = providerData.name?.lastName;
                break;
            default:
                throw new Error(`Unsupported OAuth provider: ${provider}`);
        }

        // Check if user already exists
        let existingUser = await this.getUserbyEmail(userData.email);
        if (existingUser) {
            // Update existing user with OAuth info if not already set
            if (!existingUser.providerId) {
                existingUser.provider = provider;
                existingUser.providerId = userData.providerId;
                existingUser.providerData = userData.providerData;
                if (!existingUser.avatar && userData.avatar) {
                    existingUser.avatar = userData.avatar;
                }
                return await this.updateUser(existingUser.id, existingUser);
            }
            return existingUser;
        }

        return await this.createUser(userData);
    }

    async updateUser(id, updates) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
        const supabase = this.getSupabase();
        const existing = await this.getUserbyID(id);
        if (!existing) return null;

        const updatedUser = new UserModel({ ...existing.toJSON(), ...updates });
        updatedUser.updatedAt = new Date().toISOString();
        const dbUser = this.modelToDb(updatedUser);

        const { data: updated, error } = await supabase
            .from('users')
            .update(dbUser)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.dbToModel(updated);
    }

    async deleteUser(id) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
        const supabase = this.getSupabase();
        const existing = await this.getUserbyID(id);
        if (!existing) return null;

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }

    async getAllUsers(limit = 100, offset = 0) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
        const supabase = this.getSupabase();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data.map(user => this.dbToModel(user));
    }

    async getUserbyID(id) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
        const supabase = this.getSupabase();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return this.dbToModel(data);
    }

    async updateRefreshToken(userId, refreshToken, expiresAt) {
        const user = await this.getUserbyID(userId);
        if (!user) return null;

        user.setRefreshToken(refreshToken);
        return await this.updateUser(userId, user.toJSON());
    }

    async clearRefreshToken(userId) {
        const user = await this.getUserbyID(userId);
        if (!user) return null;

        user.clearRefreshToken();
        return await this.updateUser(userId, user.toJSON());
    }

    async findOrCreateUser(email, userData = {}) {
        let user = await this.getUserbyEmail(email);
        if (!user) {
            user = await this.createUser({
                email,
                ...userData,
                provider: userData.provider || 'local'
            });
        }
        return user;
    }
}

export default UserService;