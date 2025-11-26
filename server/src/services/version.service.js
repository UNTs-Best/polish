import { v4 as uuidv4 } from "uuid";
import { getContainer } from "../config/db.js";
import VersionModel from "../models/version.model.js";

/**
 * Service for managing document versions and history
 */
class VersionService {
  constructor() {
    this.versionsContainer = null;
    this.documentsContainer = null;
  }

  async getVersionsContainer() {
    if (!this.versionsContainer) {
      this.versionsContainer = await getContainer("Versions");
    }
    return this.versionsContainer;
  }

  async getDocumentsContainer() {
    if (!this.documentsContainer) {
      this.documentsContainer = await getContainer("Documents");
    }
    return this.documentsContainer;
  }

  /**
   * Create a new version for a document
   */
  async createVersion(documentId, versionData) {
    const container = await this.getVersionsContainer();

    // Get the latest version number for this document
    const latestVersion = await this.getLatestVersion(documentId);
    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    const version = new VersionModel({
      ...versionData,
      documentId,
      version: newVersionNumber,
      previousVersion: latestVersion ? latestVersion.id : null,
      createdAt: new Date().toISOString(),
    });

    const { resource } = await container.items.create(version.toJSON());
    return resource;
  }

  /**
   * Get all versions for a document
   */
  async getDocumentVersions(documentId) {
    const container = await this.getVersionsContainer();
    const query = {
      query: 'SELECT * FROM c WHERE c.documentId = @documentId ORDER BY c.version DESC',
      parameters: [{ name: '@documentId', value: documentId }]
    };
    const { resources } = await container.items.query(query).fetchAll();
    return resources;
  }

  /**
   * Get a specific version by ID
   */
  async getVersionById(versionId) {
    const container = await this.getVersionsContainer();
    const query = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: versionId }]
    };
    const { resources } = await container.items.query(query).fetchAll();
    return resources[0] || null;
  }

  /**
   * Get the latest version for a document
   */
  async getLatestVersion(documentId) {
    const container = await this.getVersionsContainer();
    const query = {
      query: 'SELECT TOP 1 * FROM c WHERE c.documentId = @documentId ORDER BY c.version DESC',
      parameters: [{ name: '@documentId', value: documentId }]
    };
    const { resources } = await container.items.query(query).fetchAll();
    return resources[0] || null;
  }

  /**
   * Restore a document to a specific version
   */
  async restoreVersion(documentId, versionId, restoredBy) {
    const version = await this.getVersionById(versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    if (version.documentId !== documentId) {
      throw new Error('Version does not belong to the specified document');
    }

    // Create a new version with the restored content
    const restoredVersion = await this.createVersion(documentId, {
      ownerId: version.ownerId,
      title: version.title,
      content: version.content,
      changes: [`Restored to version ${version.version}`],
      createdBy: restoredBy,
      metadata: {
        ...version.metadata,
        restoredFrom: versionId,
        action: 'restore'
      }
    });

    return restoredVersion;
  }

  /**
   * Delete all versions of a document
   */
  async deleteDocumentVersions(documentId) {
    const container = await this.getVersionsContainer();
    const versions = await this.getDocumentVersions(documentId);

    const deletePromises = versions.map(version =>
      container.item(version.id, version.ownerId).delete()
    );

    await Promise.all(deletePromises);
    return versions.length;
  }

  /**
   * Compare two versions
   */
  async compareVersions(versionId1, versionId2) {
    const [version1, version2] = await Promise.all([
      this.getVersionById(versionId1),
      this.getVersionById(versionId2)
    ]);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    if (version1.documentId !== version2.documentId) {
      throw new Error('Versions belong to different documents');
    }

    return {
      documentId: version1.documentId,
      version1: {
        id: version1.id,
        version: version1.version,
        title: version1.title,
        content: version1.content,
        createdAt: version1.createdAt,
        createdBy: version1.createdBy
      },
      version2: {
        id: version2.id,
        version: version2.version,
        title: version2.title,
        content: version2.content,
        createdAt: version2.createdAt,
        createdBy: version2.createdBy
      }
    };
  }

  /**
   * Get version history summary
   */
  async getVersionHistory(documentId, limit = 50) {
    const versions = await this.getDocumentVersions(documentId);

    return versions.slice(0, limit).map(version => ({
      id: version.id,
      version: version.version,
      title: version.title,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
      changes: version.changes,
      hasContent: Boolean(version.content)
    }));
  }
}

export default VersionService;
