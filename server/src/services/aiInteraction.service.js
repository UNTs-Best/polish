import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin, isSupabaseConfigured } from "../config/supabase.js";

/**
 * DB columns: id, user_id, document_id, prompt, response, model,
 *             tokens_used, interaction_type, created_at
 */

function dbToModel(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    documentId: row.document_id,
    prompt: row.prompt,
    response: row.response,
    model: row.model,
    tokensUsed: row.tokens_used,
    interactionType: row.interaction_type,
    createdAt: row.created_at,
  };
}

class AIInteractionService {
  async logInteraction(data) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const supabase = getSupabaseAdmin();

    const { data: row, error } = await supabase
      .from('ai_interactions')
      .insert({
        id: uuidv4(),
        user_id: data.userId,
        document_id: data.documentId || null,
        prompt: data.prompt,
        response: data.response || null,
        model: data.model || null,
        tokens_used: data.tokensUsed || 0,
        interaction_type: data.interactionType || 'chat',
        created_at: new Date().toISOString(),
      })
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
