# Supabase Setup Guide for Polish Document Editor

This guide will walk you through setting up Supabase as the database and storage backend for the Polish document editor application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Access to your Cosmos DB data (for migration)

## Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in the project details:
   - **Organization**: Select or create one
   - **Project Name**: `polish-document-editor`
   - **Database Password**: Create a strong password (save this securely!)
   - **Region**: Choose the region closest to your users (e.g., US East, Europe West)
   - **Pricing Plan**: Free tier is fine for development
4. Click **"Create new project"**
5. Wait ~2 minutes for the project to be provisioned

## Step 2: Get API Credentials

1. Once your project is ready, go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy the following values:

```bash
# Project URL
SUPABASE_URL=https://your-project-id.supabase.co

# anon/public key (safe for client-side)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role key (keep secret, server-side only!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT**: The `service_role` key has admin access and should NEVER be exposed to the client or committed to version control!

## Step 3: Set Up Environment Variables

### Server Environment Variables

Create or update `/server/.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_STORAGE_BUCKET=documents

# Keep existing JWT and OAuth settings
PORT=5000
NODE_ENV=development

JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Keep Azure OpenAI (unchanged)
AZURE_OPENAI_ENDPOINT=your-azure-openai-endpoint
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Remove these old Cosmos DB variables:
# COSMOS_ENDPOINT=...
# COSMOS_KEY=...
# COSMOS_DATABASE=...
# AZURE_STORAGE_ACCOUNT=...
# AZURE_STORAGE_KEY=...
# AZURE_STORAGE_CONTAINER=...
```

### Client Environment Variables

Create or update `/client/.env.local`:

```bash
# Supabase Public Configuration (safe for browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Keep Azure OpenAI (unchanged)
AZURE_OPENAI_ENDPOINT=your-azure-openai-endpoint
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2025-04-01-preview

# Remove these old Cosmos DB variables:
# COSMOS_DB_ENDPOINT=...
# COSMOS_DB_KEY=...
# COSMOS_DB_DATABASE_ID=...
```

## Step 4: Create Database Schema

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **"New query"**
4. Copy and paste the following SQL schema:

```sql
-- ==========================================
-- Polish Document Editor Database Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Users Table
-- ==========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255), -- NULL for OAuth users
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar TEXT,

  -- OAuth fields
  provider VARCHAR(50) NOT NULL DEFAULT 'local', -- 'local', 'google', 'github', 'apple'
  provider_id VARCHAR(255),
  provider_data JSONB,

  -- Account status
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Session/token management
  refresh_token TEXT,
  refresh_token_expires_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT unique_provider_id UNIQUE (provider, provider_id)
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ==========================================
-- Documents Table
-- ==========================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT, -- Store as text or JSONB depending on structure

  -- Blob storage fields
  blob_name VARCHAR(500),
  blob_url TEXT,
  size BIGINT DEFAULT 0,
  mime_type VARCHAR(100),

  -- Version tracking
  version INTEGER DEFAULT 1,
  version_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search support
  search_vector tsvector
);

-- Indexes for documents table
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);

-- ==========================================
-- Versions Table
-- ==========================================
CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,

  -- Change tracking
  changes TEXT[], -- Array of change descriptions
  previous_version_id UUID REFERENCES versions(id),

  -- Metadata
  created_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_document_version UNIQUE (document_id, version)
);

-- Indexes for versions table
CREATE INDEX idx_versions_document ON versions(document_id, version DESC);
CREATE INDEX idx_versions_owner ON versions(owner_id);
CREATE INDEX idx_versions_created_at ON versions(created_at DESC);

-- ==========================================
-- Sessions Table
-- ==========================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Session details
  user_agent TEXT,
  ip_address INET,
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  deactivated_at TIMESTAMPTZ
);

-- Indexes for sessions table
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_active ON sessions(is_active, expires_at);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ==========================================
-- AI Interactions Table
-- ==========================================
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Interaction details
  prompt TEXT NOT NULL,
  response TEXT,
  model VARCHAR(100),

  -- Token usage
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost DECIMAL(10, 6) DEFAULT 0,

  -- Additional metadata
  meta JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ai_interactions table
CREATE INDEX idx_ai_interactions_user ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_document ON ai_interactions(document_id);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at DESC);

-- ==========================================
-- Triggers for auto-updating timestamps
-- ==========================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for documents table
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for ai_interactions table
CREATE TRIGGER update_ai_interactions_updated_at
BEFORE UPDATE ON ai_interactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Optional: Function to cleanup expired sessions
-- ==========================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE sessions
  SET is_active = FALSE, deactivated_at = NOW()
  WHERE expires_at < NOW() AND is_active = TRUE;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$ language 'plpgsql';

-- You can run this manually or set up a cron job:
-- SELECT cleanup_expired_sessions();
```

5. Click **"Run"** (or press `Ctrl/Cmd + Enter`)
6. Verify that all tables were created successfully (you should see 5 tables in the **Table Editor**)

## Step 5: Set Up Storage Bucket

1. In your Supabase dashboard, click **Storage** in the left sidebar
2. Click **"New bucket"**
3. Configure the bucket:
   - **Name**: `documents`
   - **Public bucket**: **Uncheck** (keep it private)
   - **File size limit**: 50 MB (or as needed)
   - **Allowed MIME types**: Leave empty (allow all) or specify: `application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown`
4. Click **"Create bucket"**

### Storage Policies (Simplified Approach)

For initial setup, we'll use the service role key for all storage operations from the backend. This bypasses RLS and simplifies implementation.

If you want to add RLS policies later for client-side uploads, you can add these policies in **Storage** → **Policies**:

```sql
-- Allow users to upload to their own folder
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own files
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Note**: Since you're using custom JWT auth (not Supabase Auth), the `auth.uid()` won't work automatically. For now, handle authorization in your application code using the service role key.

## Step 6: Verify Setup

Run this SQL query to verify all tables are created:

```sql
SELECT
  tablename,
  schemaname
FROM
  pg_tables
WHERE
  schemaname = 'public'
ORDER BY
  tablename;
```

You should see:
- `ai_interactions`
- `documents`
- `sessions`
- `users`
- `versions`

## Step 7: Update Application Code

### Install Dependencies

If not already done:

```bash
# Server
cd server
npm install @supabase/supabase-js

# Client
cd client
npm install @supabase/supabase-js
```

### Update Server Startup

Update `/server/src/app.js` or `/server/src/server.js` to use Supabase instead of Cosmos DB:

```javascript
// Replace this:
// import { connectDB } from './config/db.js';

// With this:
import { connectSupabase } from './config/supabase.js';

// In your startup code, replace:
// await connectDB();

// With:
await connectSupabase();
```

## Step 8: Data Migration

Once your Supabase setup is complete, you can migrate your existing data from Cosmos DB to Supabase.

The migration script has been created at `/server/scripts/migrate-cosmos-to-supabase.js`.

To run the migration:

```bash
cd server
node scripts/migrate-cosmos-to-supabase.js
```

This will:
1. Connect to both Cosmos DB and Supabase
2. Migrate data from all 5 containers:
   - Users → users table
   - Documents → documents table
   - Versions → versions table
   - Sessions → sessions table
   - AIInteractions → ai_interactions table
3. Transform field names (camelCase → snake_case)
4. Log progress and any errors

After migration, validate the data:

```bash
node scripts/validate-migration.js
```

## Troubleshooting

### Connection Issues

If you see "Supabase connection failed":
- Verify your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check that your Supabase project is running (not paused)
- Ensure the users table exists

### Authentication Not Working

- Make sure you're using `SUPABASE_SERVICE_ROLE_KEY` on the server (not the anon key)
- Verify JWT secrets are set correctly
- Your custom JWT auth is independent of Supabase Auth

### Storage Upload Fails

- Verify the `documents` bucket exists
- Check that you're using the service role key for storage operations
- Ensure file paths follow the pattern: `{userId}/{filename}`

### Migration Errors

- Ensure both Cosmos DB and Supabase credentials are set
- Check that Cosmos DB containers still exist and are accessible
- Verify the Supabase schema was created successfully
- Look for field mapping issues (camelCase vs snake_case)

## Next Steps

1. ✅ Complete Supabase setup (Steps 1-5)
2. ✅ Update environment variables (Step 3)
3. ✅ Create database schema (Step 4)
4. ✅ Set up storage bucket (Step 5)
5. ⏳ Run data migration (Step 8)
6. ⏳ Test authentication and document operations
7. ⏳ Verify file uploads work
8. ⏳ Decommission Cosmos DB (after verification period)

## Support

If you encounter issues:
- Check the [Supabase documentation](https://supabase.com/docs)
- Review error logs in Supabase dashboard (Logs section)
- Ensure all environment variables are set correctly
- Verify the database schema matches the provided SQL

## Summary

You now have:
- ✅ Supabase project configured
- ✅ PostgreSQL database with 5 tables
- ✅ Storage bucket for document files
- ✅ Configuration files for server and client
- ✅ Migration scripts ready to run
- ✅ All services updated to use Supabase

**Azure OpenAI integration remains unchanged** - your AI features will continue to work exactly as before.
