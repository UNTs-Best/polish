import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin, isSupabaseConfigured } from "../config/supabase.js";

/**
 * Convert camelCase model fields to snake_case DB columns
 */
function modelToDb(data) {
  const map = {
    documentId: 'document_id',
    ownerId: 'owner_id',
    previousVersion: 'previous_version_id',
    createdAt: 'created_at',
    createdBy: 'created_by',
  };
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    result[map[key] || key] = value;
  }
  return result;
}

/**
 * Convert snake_case DB columns to camelCase model fields
 */
function dbToModel(row) {
  if (!row) return null;
  return {
    id: row.id,
    documentId: row.document_id,
    version: row.version,
    ownerId: row.owner_id,
    title: row.title,
    content: row.content,
    changes: row.changes || [],
    previousVersion: row.previous_version_id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    metadata: row.metadata,
  };
}

/**
 * Service for managing document versions and history
 */
class VersionService {
  /**
   * Create a new version for a document
   */
  async createVersion(documentId, versionData) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    // Get the latest version number for this document
    const latestVersion = await this.getLatestVersion(documentId);
    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    const item = modelToDb({
      id: uuidv4(),
      documentId,
      version: newVersionNumber,
      ownerId: versionData.ownerId,
      title: versionData.title,
      content: versionData.content || '',
      changes: versionData.changes || [],
      previousVersion: latestVersion ? latestVersion.id : null,
      createdAt: versionData.createdAt || new Date().toISOString(),
      createdBy: versionData.createdBy || versionData.ownerId,
      metadata: versionData.metadata || {},
    });

    const { data: row, error } = await supabase
      .from('versions')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return dbToModel(row);
  }

  /**
   * Get all versions for a document
   */
  async getDocumentVersions(documentId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbToModel);
  }

  /**
   * Get a specific version by ID
   */
  async getVersionById(versionId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const { data: row, error } = await supabase
      .from('versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return dbToModel(row);
  }

  /**
   * Get the latest version for a document
   */
  async getLatestVersion(documentId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? dbToModel(data[0]) : null;
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
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('versions')
      .delete()
      .eq('document_id', documentId);

    if (error) throw error;
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
