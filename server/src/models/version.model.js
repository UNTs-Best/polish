import { v4 as uuidv4 } from "uuid";

/**
 * Version Model for document history tracking
 * Stores version snapshots of documents
 */
export class VersionModel {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.documentId = data.documentId;
    this.version = data.version || 1;
    this.ownerId = data.ownerId;
    this.title = data.title;
    this.content = data.content || '';
    this.changes = data.changes || []; // Array of change descriptions
    this.previousVersion = data.previousVersion || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.createdBy = data.createdBy || data.ownerId;
    this.metadata = data.metadata || {};
  }

  toJSON() {
    return {
      id: this.id,
      documentId: this.documentId,
      version: this.version,
      ownerId: this.ownerId,
      title: this.title,
      content: this.content,
      changes: this.changes,
      previousVersion: this.previousVersion,
      createdAt: this.createdAt,
      createdBy: this.createdBy,
      metadata: this.metadata,
    };
  }
}

export default VersionModel;


