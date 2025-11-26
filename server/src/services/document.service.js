import { v4 as uuidv4 } from "uuid";
import { getContainer } from "../config/db.js";
import VersionService from "./version.service.js";

/**
 * Create metadata record after upload
 */
export async function createDocumentMeta(data) {
  const container = await getContainer("Documents");
  const item = {
    id: uuidv4(),
    title: data.title,
    ownerId: data.ownerId,
    blobName: data.blobName,
    blobUrl: data.blobUrl,
    size: data.size || 0,
    mimeType: data.mimeType || null,
    version: data.version || 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const { resource } = await container.items.create(item);
  return resource;
}

/**
 * Fetch all docs for a specific user
 */

class DocumentService {
  constructor() {
    this.versionService = new VersionService();
  }

  async getContainer() {
    if (!this.container) {
      this.container = await getContainer("Documents");
    }
    return this.container;
  }
  async getUserDocuments(ownerId) {
    if (!isCosmosConfigured()) throw new Error('Cosmos env not configured');
    const container = await this.getContainer();
    const query = { query: 'SELECT * FROM c WHERE c.ownerId = @ownerId ORDER BY c._ts DESC', parameters: [{ name: '@ownerId', value: ownerId }] };
    const { resources } = await container.items.query(query).fetchAll();
    return resources;
  }
  async createDocument(data) {
    if (!isCosmosConfigured()) throw new Error('Cosmos env not configured');
    const container = await this.getContainer();
    const item = {
      id: uuidv4(),
      title: data.title,
      ownerId: data.ownerId,
      blobName: data.blobName,
      blobUrl: data.blobUrl,
      size: data.size || 0,
      mimeType: data.mimeType || null,
      version: data.version || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: data.content || '' // Add content field for editable documents
    };
    const { resource } = await container.items.create(item);

    // Create initial version
    await this.versionService.createVersion(resource.id, {
      ownerId: data.ownerId,
      title: data.title,
      content: data.content || '',
      changes: ['Document created'],
      createdBy: data.ownerId,
      metadata: { action: 'create' }
    });

    return resource;
  }
  async updateDocument(id, updates, updatedBy = null) {
    if (!isCosmosConfigured()) throw new Error('Cosmos env not configured');
    const existing = await this.getDocumentbyId(id);
    if (!existing) return null;

    // Create version before updating if content changed
    if (updates.content !== undefined || updates.title !== existing.title) {
      const changes = [];
      if (updates.title && updates.title !== existing.title) {
        changes.push(`Title changed from "${existing.title}" to "${updates.title}"`);
      }
      if (updates.content !== undefined && updates.content !== existing.content) {
        changes.push('Content updated');
      }

      if (changes.length > 0) {
        await this.versionService.createVersion(id, {
          ownerId: existing.ownerId,
          title: updates.title || existing.title,
          content: updates.content !== undefined ? updates.content : existing.content,
          changes,
          createdBy: updatedBy || existing.ownerId,
          metadata: { action: 'update' }
        });
      }
    }

    const container = await this.getContainer();
    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const { resource } = await container.item(id, existing.ownerId).replace(merged);
    return resource;
  }
  async deleteDocument(id) {
    if (!isCosmosConfigured()) throw new Error('Cosmos env not configured');
    const existing = await this.getDocumentbyId(id);
    if (!existing) return null;

    // Delete all versions first
    await this.versionService.deleteDocumentVersions(id);

    const container = await this.getContainer();
    await container.item(id, existing.ownerId).delete();
    return true;
  }
  async getDocumentbyId(id) {
    if (!isCosmosConfigured()) throw new Error('Cosmos env not configured');
    const container = await this.getContainer();
    const query = { query: 'SELECT TOP 1 * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] };
    const { resources } = await container.items.query(query).fetchAll();
    return resources[0] || null;
  }
}

export default DocumentService;