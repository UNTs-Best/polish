import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin, isSupabaseConfigured } from "../config/supabase.js";
import VersionService from "./version.service.js";

/**
 * DB columns: id, user_id, title, content, document_type, status,
 *             file_url, file_name, file_size, mime_type, metadata,
 *             created_at, updated_at
 */

function modelToDb(data) {
  const db = {};
  if (data.id !== undefined) db.id = data.id;
  if (data.ownerId !== undefined) db.user_id = data.ownerId;
  if (data.title !== undefined) db.title = data.title;
  if (data.content !== undefined) db.content = data.content;
  if (data.blobName !== undefined) db.file_name = data.blobName;
  if (data.blobUrl !== undefined) db.file_url = data.blobUrl;
  if (data.size !== undefined) db.file_size = data.size;
  if (data.mimeType !== undefined) db.mime_type = data.mimeType;
  if (data.createdAt !== undefined) db.created_at = data.createdAt;
  if (data.updatedAt !== undefined) db.updated_at = data.updatedAt;
  return db;
}

function dbToModel(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    ownerId: row.user_id,
    blobName: row.file_name,
    blobUrl: row.file_url,
    size: row.file_size,
    mimeType: row.mime_type,
    content: row.content,
    documentType: row.document_type,
    status: row.status,
    metadata: row.metadata,
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
      .eq('user_id', ownerId)
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
      changes: 'Document created',
      createdBy: data.ownerId,
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
          changes: changes.join('; '),
          createdBy: updatedBy || existing.ownerId,
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

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return dbToModel(row);
  }
}

export default DocumentService;
