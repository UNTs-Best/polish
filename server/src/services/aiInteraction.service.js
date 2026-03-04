import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin, isSupabaseConfigured } from "../config/supabase.js";

function modelToDb(data) {
  const map = {
    userId: 'user_id',
    documentId: 'document_id',
    promptTokens: 'prompt_tokens',
    completionTokens: 'completion_tokens',
    totalTokens: 'total_tokens',
    interactionType: 'interaction_type',
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

function dbToModel(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    documentId: row.document_id,
    prompt: row.prompt,
    response: row.response,
    model: row.model,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    totalTokens: row.total_tokens,
    cost: row.cost,
    meta: row.meta,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class AIInteractionService {
  async logInteraction(data) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const item = modelToDb({
      id: uuidv4(),
      userId: data.userId,
      documentId: data.documentId || null,
      prompt: data.prompt,
      response: data.response || null,
      model: data.model || null,
      promptTokens: data.promptTokens || 0,
      completionTokens: data.completionTokens || 0,
      totalTokens: data.totalTokens || 0,
      cost: data.cost || 0,
      meta: data.meta || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data: row, error } = await supabase
      .from('ai_interactions')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return dbToModel(row);
  }

  async getUserInteractions(userId, limit = 50) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(dbToModel);
  }

  async getDocumentInteractions(documentId, limit = 50) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(dbToModel);
  }
}

export default AIInteractionService;
