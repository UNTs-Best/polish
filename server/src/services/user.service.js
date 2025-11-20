import { v4 as uuidv4 } from 'uuid';
import { getContainer, isCosmosConfigured } from '../config/db.js';

export async function getUserbyID(id) {
    if (!isCosmosConfigured()) throw new Error('Cosmos env not configured');
    const container = await getContainer('Users', '/email');
    const query = { query: 'SELECT TOP 1 * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] };
    const { resources } = await container.items.query(query).fetchAll();
    return resources[0] || null;
};

export async function getUserbyEmail(email) {
    if (!isCosmosConfigured()) throw new Error('Cosmos env not configured');
    const container = await getContainer('Users', '/email');
    const query = { query: 'SELECT TOP 1 * FROM c WHERE c.email = @email', parameters: [{ name: '@email', value: email }] };
    const { resources } = await container.items.query(query).fetchAll();
    return resources[0] || null;
};

export async function createUser(data) {
    if (!isCosmosConfigured()) throw new Error('Cosmos env not configured');
    const container = await getContainer('Users', '/email');
    const item = { id: uuidv4(), email: data.email, password: data.password, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const { resource } = await container.items.create(item);
    return resource;
};

export async function updateUser(id, updates) {
    if (!isCosmosConfigured()) throw new Error('Cosmos env not configured');
    const container = await getContainer('Users', '/email');
    const existing = await getUserbyID(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const { resource } = await container.item(id, existing.email).replace(merged);
    return resource;
};

export async function deleteUser(id) {
    if (!isCosmosConfigured()) throw new Error('Cosmos env not configured');
    const container = await getContainer('Users', '/email');
    const existing = await getUserbyID(id);
    if (!existing) return null;
    await container.item(id, existing.email).delete();
    return true;
}

export async function getAllUsers() {
    if (!isCosmosConfigured()) throw new Error('Cosmos env not configured');
    const container = await getContainer('Users', '/email');
    const query = { query: 'SELECT * FROM c ORDER BY c._ts DESC' };
    const { resources } = await container.items.query(query).fetchAll();
    return resources;
};


