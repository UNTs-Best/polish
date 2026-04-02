-- ============================================================
-- Polish — Supabase Database Setup
-- ============================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- This script is idempotent — safe to re-run.
-- ============================================================

-- 1. PUBLIC USERS TABLE
--    Mirrors auth.users so foreign keys work.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY,            -- matches auth.users.id
  email       TEXT NOT NULL,
  first_name  TEXT NOT NULL DEFAULT '',
  last_name   TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON public.users (email);

-- 2. TRIGGER: auto-create a public.users row on sign-up
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop and re-create so the function body is always current
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Back-fill any existing auth users that don't have a public row yet
INSERT INTO public.users (id, email, first_name, last_name)
SELECT
  id,
  COALESCE(email, ''),
  COALESCE(raw_user_meta_data ->> 'first_name', ''),
  COALESCE(raw_user_meta_data ->> 'last_name', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. DOCUMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT 'Untitled',
  content       TEXT NOT NULL DEFAULT '',
  document_type TEXT,
  file_name     TEXT,
  file_url      TEXT,
  file_size     INTEGER,
  mime_type     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_user_id_idx ON public.documents (user_id);

-- If the table already exists but updated_at has no default, add one
ALTER TABLE public.documents ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.documents ALTER COLUMN created_at SET DEFAULT now();

-- 4. VERSIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES public.documents (id) ON DELETE CASCADE,
  created_by      UUID REFERENCES public.users (id) ON DELETE SET NULL,
  version_number  INTEGER NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  change_summary  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS versions_document_id_idx ON public.versions (document_id);

-- 5. AI INTERACTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  document_id       UUID REFERENCES public.documents (id) ON DELETE SET NULL,
  prompt            TEXT,
  response          TEXT,
  model             TEXT,
  prompt_tokens     INTEGER,
  completion_tokens INTEGER,
  total_tokens      INTEGER,
  cost              DECIMAL(10,6),
  meta              JSONB,
  interaction_type  TEXT NOT NULL DEFAULT 'chat',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_interactions_user_id_idx ON public.ai_interactions (user_id);
CREATE INDEX IF NOT EXISTS ai_interactions_document_id_idx ON public.ai_interactions (document_id);

-- 6. CHAT MESSAGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  document_id       UUID NOT NULL REFERENCES public.documents (id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'error')),
  content           TEXT NOT NULL,
  suggested_changes JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_document_id_idx
  ON public.chat_messages (document_id);

CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx
  ON public.chat_messages (user_id);

CREATE INDEX IF NOT EXISTS chat_messages_doc_created_idx
  ON public.chat_messages (document_id, created_at ASC);

-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages   ENABLE ROW LEVEL SECURITY;

-- users: can only read/update own row
DROP POLICY IF EXISTS "Users can view own profile"     ON public.users;
DROP POLICY IF EXISTS "Users can update own profile"   ON public.users;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- documents: full CRUD scoped to own user_id
DROP POLICY IF EXISTS "Users can view own documents"   ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents"  ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents"  ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents"  ON public.documents;

CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- versions: scoped via document ownership
DROP POLICY IF EXISTS "Users can view own versions"    ON public.versions;
DROP POLICY IF EXISTS "Users can insert own versions"   ON public.versions;

CREATE POLICY "Users can view own versions"
  ON public.versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own versions"
  ON public.versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

-- ai_interactions: scoped to own user_id
DROP POLICY IF EXISTS "Users can view own ai_interactions"  ON public.ai_interactions;
DROP POLICY IF EXISTS "Users can insert own ai_interactions" ON public.ai_interactions;

CREATE POLICY "Users can view own ai_interactions"
  ON public.ai_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_interactions"
  ON public.ai_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- chat_messages: scoped to own user_id
DROP POLICY IF EXISTS "Users can view own chat messages"   ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages"  ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages"  ON public.chat_messages;

CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);
