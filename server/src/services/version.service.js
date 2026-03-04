import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin, isSupabaseConfigured } from "../config/supabase.js";

/**
 * DB columns: id, document_id, version_number, content, change_summary,
 *             created_by, created_at
 */

function dbToModel(row) {
  if (!row) return null;
  return {
    id: row.id,
    documentId: row.document_id,
    version: row.version_number,
    content: row.content,
    changes: row.change_summary ? [row.change_summary] : [],
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

class VersionService {
  async createVersion(documentId, versionData) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const latestVersion = await this.getLatestVersion(documentId);
    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    // changes can be a string or array — normalize to string for change_summary
    let changeSummary = '';
    if (Array.isArray(versionData.changes)) {
      changeSummary = versionData.changes.join('; ');
    } else if (typeof versionData.changes === 'string') {
      changeSummary = versionData.changes;
    }

    const { data: row, error } = await supabase
      .from('versions')
      .insert({
        id: uuidv4(),
        document_id: documentId,
        version_number: newVersionNumber,
        content: versionData.content || '',
        change_summary: changeSummary,
        created_by: versionData.createdBy || versionData.ownerId || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return dbToModel(row);
  }

  async getDocumentVersions(documentId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbToModel);
  }

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

  async getLatestVersion(documentId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? dbToModel(data[0]) : null;
  }

  async restoreVersion(documentId, versionId, restoredBy) {
    const version = await this.getVersionById(versionId);
    if (!version) throw new Error('Version not found');
    if (version.documentId !== documentId) {
      throw new Error('Version does not belong to the specified document');
    }

    return await this.createVersion(documentId, {
      content: version.content,
      changes: `Restored to version ${version.version}`,
      createdBy: restoredBy,
    });
  }

  async deleteDocumentVersions(documentId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('versions')
      .delete()
      .eq('document_id', documentId);

    if (error) throw error;
  }

  async compareVersions(versionId1, versionId2) {
    const [version1, version2] = await Promise.all([
      this.getVersionById(versionId1),
      this.getVersionById(versionId2)
    ]);

    if (!version1 || !version2) throw new Error('One or both versions not found');
    if (version1.documentId !== version2.documentId) {
      throw new Error('Versions belong to different documents');
    }

    return {
      documentId: version1.documentId,
      version1: {
        id: version1.id,
        version: version1.version,
        content: version1.content,
        createdAt: version1.createdAt,
        createdBy: version1.createdBy
      },
      version2: {
        id: version2.id,
        version: version2.version,
        content: version2.content,
        createdAt: version2.createdAt,
        createdBy: version2.createdBy
      }
    };
  }

  async getVersionHistory(documentId, limit = 50) {
    const versions = await this.getDocumentVersions(documentId);
    return versions.slice(0, limit).map(version => ({
      id: version.id,
      version: version.version,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
      changes: version.changes,
      hasContent: Boolean(version.content)
    }));
  }
}

export default VersionService;
