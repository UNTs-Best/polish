import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin, isSupabaseConfigured } from "../config/supabase.js";
import VersionService from "./version.service.js";

/**
 * Convert camelCase model fields to snake_case DB columns
 */
function modelToDb(data) {
  const map = {
    ownerId: 'owner_id',
    blobName: 'blob_name',
    blobUrl: 'blob_url',
    mimeType: 'mime_type',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
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
    title: row.title,
    ownerId: row.owner_id,
    blobName: row.blob_name,
    blobUrl: row.blob_url,
    size: row.size,
    mimeType: row.mime_type,
    version: row.version,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create metadata record after upload (standalone helper)
 */
export async function createDocumentMeta(data) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const supabase = getSupabaseAdmin();

  const item = modelToDb({
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
  });

  const { data: row, error } = await supabase
    .from('documents')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return dbToModel(row);
}

class DocumentService {
  constructor() {
    this.versionService = new VersionService();
  }

  async getUserDocuments(ownerId) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbToModel);
  }

  async createDocument(data) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const item = modelToDb({
      id: uuidv4(),
      title: data.title,
      ownerId: data.ownerId,
      blobName: data.blobName,
      blobUrl: data.blobUrl,
      size: data.size || 0,
      mimeType: data.mimeType || null,
      version: data.version || 1,
      content: data.content || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data: row, error } = await supabase
      .from('documents')
      .insert(item)
      .select()
      .single();

    if (error) throw error;

    const doc = dbToModel(row);

    // Create initial version
    await this.versionService.createVersion(doc.id, {
      ownerId: data.ownerId,
      title: data.title,
      content: data.content || '',
      changes: ['Document created'],
      createdBy: data.ownerId,
      metadata: { action: 'create' }
    });

    return doc;
  }

  async updateDocument(id, updates, updatedBy = null) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
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

    const supabase = getSupabaseAdmin();
    const dbUpdates = modelToDb({ ...updates, updatedAt: new Date().toISOString() });

    const { data: row, error } = await supabase
      .from('documents')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return dbToModel(row);
  }

  async deleteDocument(id) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const existing = await this.getDocumentbyId(id);
    if (!existing) return null;

    // Delete all versions first
    await this.versionService.deleteDocumentVersions(id);

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async getDocumentbyId(id) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const { data: row, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') return null; // not found
    if (error) throw error;
    return dbToModel(row);
  }
}

export default DocumentService;
