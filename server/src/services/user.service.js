import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import UserModel from '../models/user.model.js';

/**
 * DB columns: id, email, password_hash, first_name, last_name, display_name,
 *             avatar_url, auth_provider, auth_provider_id, email_verified,
 *             last_login, created_at, updated_at
 */
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

    modelToDb(user) {
        const db = {};
        if (user.id !== undefined) db.id = user.id;
        if (user.email !== undefined) db.email = user.email;
        if (user.password !== undefined) db.password_hash = user.password;
        if (user.firstName !== undefined) db.first_name = user.firstName;
        if (user.lastName !== undefined) db.last_name = user.lastName;
        if (user.avatar !== undefined) db.avatar_url = user.avatar;
        if (user.provider !== undefined) db.auth_provider = user.provider;
        if (user.providerId !== undefined) db.auth_provider_id = user.providerId;
        if (user.emailVerified !== undefined) db.email_verified = user.emailVerified;
        if (user.createdAt !== undefined) db.created_at = user.createdAt;
        if (user.updatedAt !== undefined) db.updated_at = user.updatedAt;
        if (user.lastLoginAt !== undefined) db.last_login = user.lastLoginAt;
        if (user.firstName || user.lastName) {
            db.display_name = [user.firstName, user.lastName].filter(Boolean).join(' ');
        }
        return db;
    }

    dbToModel(dbUser) {
        if (!dbUser) return null;
        return new UserModel({
            id: dbUser.id,
            email: dbUser.email,
            password: dbUser.password_hash,
            firstName: dbUser.first_name,
            lastName: dbUser.last_name,
            avatar: dbUser.avatar_url,
            provider: dbUser.auth_provider,
            providerId: dbUser.auth_provider_id,
            emailVerified: dbUser.email_verified,
            isActive: true,
            createdAt: dbUser.created_at,
            updatedAt: dbUser.updated_at,
            lastLoginAt: dbUser.last_login
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

        if (error && error.code !== 'PGRST116') throw error;
        return this.dbToModel(data);
    }

    async getUserByProviderId(provider, providerId) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
        const supabase = this.getSupabase();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('auth_provider', provider)
            .eq('auth_provider_id', providerId)
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

        let userData = {
            provider,
            providerId: providerData.id,
            emailVerified: true
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
                userData.firstName = providerData.name?.firstName;
                userData.lastName = providerData.name?.lastName;
                break;
            default:
                throw new Error(`Unsupported OAuth provider: ${provider}`);
        }

        let existingUser = await this.getUserbyEmail(userData.email);
        if (existingUser) {
            if (!existingUser.providerId) {
                existingUser.provider = provider;
                existingUser.providerId = userData.providerId;
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
