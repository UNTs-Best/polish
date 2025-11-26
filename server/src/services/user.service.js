import { getContainer, isCosmosConfigured } from '../config/db.js';
import UserModel from '../models/user.model.js';

class UserService {
    constructor() {
        this.container = null;
    }

    async getContainer() {
        if (!this.container) {
            this.container = await getContainer('Users');
        }
        return this.container;
    }

    async getUserbyEmail(email) {
        if (!isCosmosConfigured()) throw new Error('CosmosDB not configured');
        const container = await this.getContainer();
        const query = { query: 'SELECT TOP 1 * FROM c WHERE c.email = @email', parameters: [{ name: '@email', value: email }] };
        const { resources } = await container.items.query(query).fetchAll();
        return resources[0] ? new UserModel(resources[0]) : null;
    }

    async getUserByProviderId(provider, providerId) {
        if (!isCosmosConfigured()) throw new Error('CosmosDB not configured');
        const container = await this.getContainer();
        const query = {
            query: 'SELECT TOP 1 * FROM c WHERE c.provider = @provider AND c.providerId = @providerId',
            parameters: [
                { name: '@provider', value: provider },
                { name: '@providerId', value: providerId }
            ]
        };
        const { resources } = await container.items.query(query).fetchAll();
        return resources[0] ? new UserModel(resources[0]) : null;
    }

    async createUser(data) {
        if (!isCosmosConfigured()) throw new Error('CosmosDB not configured');
        const container = await this.getContainer();
        const user = new UserModel(data);
        const { resource } = await container.items.create(user.toJSON());
        return new UserModel(resource);
    }

    async createOAuthUser(provider, providerData) {
        if (!isCosmosConfigured()) throw new Error('CosmosDB not configured');

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
        if (!isCosmosConfigured()) throw new Error('CosmosDB not configured');
        const container = await this.getContainer();
        const existing = await this.getUserbyID(id);
        if (!existing) return null;

        const updatedUser = new UserModel({ ...existing.toJSON(), ...updates });
        const { resource } = await container.item(id, existing.email).replace(updatedUser.toJSON());
        return new UserModel(resource);
    }

    async deleteUser(id) {
        if (!isCosmosConfigured()) throw new Error('CosmosDB not configured');
        const container = await this.getContainer();
        const existing = await this.getUserbyID(id);
        if (!existing) return null;
        await container.item(id, existing.email).delete();
        return true;
    }

    async getAllUsers(limit = 100, offset = 0) {
        if (!isCosmosConfigured()) throw new Error('CosmosDB not configured');
        const container = await this.getContainer();
        const query = {
            query: 'SELECT * FROM c ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit',
            parameters: [
                { name: '@offset', value: offset },
                { name: '@limit', value: limit }
            ]
        };
        const { resources } = await container.items.query(query).fetchAll();
        return resources.map(user => new UserModel(user));
    }

    async getUserbyID(id) {
        if (!isCosmosConfigured()) throw new Error('CosmosDB not configured');
        const container = await this.getContainer();
        const query = { query: 'SELECT TOP 1 * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] };
        const { resources } = await container.items.query(query).fetchAll();
        return resources[0] ? new UserModel(resources[0]) : null;
    }

    async updateRefreshToken(userId, refreshToken, expiresAt) {
        const user = await this.getUserbyID(userId);
        if (!user) return null;

        user.setRefreshToken(refreshToken);
        return await this.updateUser(userId, user);
    }

    async clearRefreshToken(userId) {
        const user = await this.getUserbyID(userId);
        if (!user) return null;

        user.clearRefreshToken();
        return await this.updateUser(userId, user);
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