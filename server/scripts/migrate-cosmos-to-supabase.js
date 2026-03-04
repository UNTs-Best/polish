import { CosmosClient } from '@azure/cosmos';
import { getSupabaseAdmin } from '../src/config/supabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Cosmos connection
const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
const cosmosKey = process.env.COSMOS_KEY;
const cosmosDatabase = process.env.COSMOS_DATABASE || 'PolishDocumentEditor';

let cosmosClient = null;
let database = null;

// Supabase connection
const supabase = getSupabaseAdmin();

/**
 * Initialize Cosmos DB connection
 */
function initCosmos() {
  if (!cosmosEndpoint || !cosmosKey) {
    throw new Error('Cosmos DB credentials not found. Please set COSMOS_ENDPOINT and COSMOS_KEY in .env');
  }

  cosmosClient = new CosmosClient({
    endpoint: cosmosEndpoint,
    key: cosmosKey
  });

  database = cosmosClient.database(cosmosDatabase);
  console.log('✅ Connected to Cosmos DB');
}

/**
 * Migrate Users container to users table
 */
async function migrateUsers() {
  console.log('\n📦 Migrating Users...');

  try {
    const container = database.container('Users');
    const { resources: users } = await container.items.readAll().fetchAll();

    console.log(`Found ${users.length} users to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            password: user.password,
            first_name: user.firstName,
            last_name: user.lastName,
            avatar: user.avatar,
            provider: user.provider || 'local',
            provider_id: user.providerId,
            provider_data: user.providerData,
            email_verified: user.emailVerified || false,
            is_active: user.isActive !== undefined ? user.isActive : true,
            refresh_token: user.refreshToken,
            refresh_token_expires_at: user.refreshTokenExpiresAt,
            created_at: user.createdAt || new Date().toISOString(),
            updated_at: user.updatedAt || new Date().toISOString(),
            last_login_at: user.lastLoginAt
          });

        if (error) {
          console.error(`  ❌ Failed to migrate user ${user.email}:`, error.message);
          errorCount++;
        } else {
          console.log(`  ✅ Migrated user: ${user.email}`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Error migrating user ${user.email}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Users Migration Complete: ${successCount} successful, ${errorCount} errors`);
  } catch (err) {
    console.error('❌ Users migration failed:', err.message);
    throw err;
  }
}

/**
 * Migrate Documents container to documents table
 */
async function migrateDocuments() {
  console.log('\n📦 Migrating Documents...');

  try {
    const container = database.container('Documents');
    const { resources: documents } = await container.items.readAll().fetchAll();

    console.log(`Found ${documents.length} documents to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const doc of documents) {
      try {
        // Handle content field - can be string or object
        let contentValue = doc.content;
        if (typeof doc.content === 'object') {
          contentValue = JSON.stringify(doc.content);
        }

        const { data, error } = await supabase
          .from('documents')
          .insert({
            id: doc.id,
            owner_id: doc.ownerId || doc.userId, // Support both field names
            title: doc.title,
            content: contentValue,
            blob_name: doc.blobName,
            blob_url: doc.blobUrl,
            size: doc.size || 0,
            mime_type: doc.mimeType,
            version: doc.version || 1,
            version_count: doc.versionCount || 0,
            created_at: doc.createdAt || new Date().toISOString(),
            updated_at: doc.updatedAt || new Date().toISOString()
          });

        if (error) {
          console.error(`  ❌ Failed to migrate document ${doc.title}:`, error.message);
          errorCount++;
        } else {
          console.log(`  ✅ Migrated document: ${doc.title}`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Error migrating document ${doc.title}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Documents Migration Complete: ${successCount} successful, ${errorCount} errors`);
  } catch (err) {
    console.error('❌ Documents migration failed:', err.message);
    throw err;
  }
}

/**
 * Migrate Versions container to versions table
 */
async function migrateVersions() {
  console.log('\n📦 Migrating Versions...');

  try {
    const container = database.container('Versions');
    const { resources: versions } = await container.items.readAll().fetchAll();

    console.log(`Found ${versions.length} versions to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const version of versions) {
      try {
        // Handle content field
        let contentValue = version.content;
        if (typeof version.content === 'object') {
          contentValue = JSON.stringify(version.content);
        }

        const { data, error } = await supabase
          .from('versions')
          .insert({
            id: version.id,
            document_id: version.documentId,
            owner_id: version.ownerId,
            version: version.version || version.versionNumber,
            title: version.title || '',
            content: contentValue || '',
            changes: version.changes || [],
            previous_version_id: version.previousVersion || version.previousVersionId,
            created_by: version.createdBy,
            metadata: version.metadata || {},
            created_at: version.createdAt || new Date().toISOString()
          });

        if (error) {
          console.error(`  ❌ Failed to migrate version ${version.id}:`, error.message);
          errorCount++;
        } else {
          console.log(`  ✅ Migrated version: ${version.id}`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Error migrating version ${version.id}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Versions Migration Complete: ${successCount} successful, ${errorCount} errors`);
  } catch (err) {
    console.error('❌ Versions migration failed:', err.message);
    throw err;
  }
}

/**
 * Migrate Sessions container to sessions table
 */
async function migrateSessions() {
  console.log('\n📦 Migrating Sessions...');

  try {
    const container = database.container('Sessions');
    const { resources: sessions } = await container.items.readAll().fetchAll();

    console.log(`Found ${sessions.length} sessions to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const session of sessions) {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .insert({
            id: session.id,
            user_id: session.userId,
            user_agent: session.userAgent,
            ip_address: session.ipAddress,
            is_active: session.isActive !== undefined ? session.isActive : true,
            created_at: session.createdAt || new Date().toISOString(),
            last_activity_at: session.lastActivityAt || new Date().toISOString(),
            expires_at: session.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            deactivated_at: session.deactivatedAt
          });

        if (error) {
          console.error(`  ❌ Failed to migrate session ${session.id}:`, error.message);
          errorCount++;
        } else {
          console.log(`  ✅ Migrated session: ${session.id}`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Error migrating session ${session.id}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Sessions Migration Complete: ${successCount} successful, ${errorCount} errors`);
  } catch (err) {
    console.error('❌ Sessions migration failed:', err.message);
    throw err;
  }
}

/**
 * Migrate AIInteractions container to ai_interactions table
 */
async function migrateAIInteractions() {
  console.log('\n📦 Migrating AI Interactions...');

  try {
    const container = database.container('AIInteractions');

    // Check if container exists
    try {
      await container.read();
    } catch (err) {
      console.log('  ⚠️  AIInteractions container not found or empty, skipping...');
      return;
    }

    const { resources: interactions } = await container.items.readAll().fetchAll();

    console.log(`Found ${interactions.length} AI interactions to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const interaction of interactions) {
      try {
        const { data, error } = await supabase
          .from('ai_interactions')
          .insert({
            id: interaction.id,
            document_id: interaction.documentId,
            user_id: interaction.userId,
            prompt: interaction.prompt || '',
            response: interaction.response,
            model: interaction.model,
            prompt_tokens: interaction.tokens?.promptTokens || 0,
            completion_tokens: interaction.tokens?.completionTokens || 0,
            total_tokens: interaction.tokens?.totalTokens || 0,
            cost: interaction.cost || 0,
            meta: interaction.meta || {},
            created_at: interaction.createdAt || new Date().toISOString(),
            updated_at: interaction.updatedAt || new Date().toISOString()
          });

        if (error) {
          console.error(`  ❌ Failed to migrate AI interaction ${interaction.id}:`, error.message);
          errorCount++;
        } else {
          console.log(`  ✅ Migrated AI interaction: ${interaction.id}`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Error migrating AI interaction ${interaction.id}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 AI Interactions Migration Complete: ${successCount} successful, ${errorCount} errors`);
  } catch (err) {
    console.error('⚠️  AI Interactions migration error:', err.message);
    // Don't throw - this is optional data
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  try {
    console.log('🚀 Starting Cosmos DB to Supabase migration...\n');
    console.log('This will migrate data from the following containers:');
    console.log('  1. Users');
    console.log('  2. Documents');
    console.log('  3. Versions');
    console.log('  4. Sessions');
    console.log('  5. AIInteractions (if exists)');
    console.log('');

    // Initialize Cosmos DB
    initCosmos();

    // Run migrations in order (respecting foreign key dependencies)
    await migrateUsers();           // No dependencies
    await migrateDocuments();       // Depends on users
    await migrateVersions();        // Depends on documents and users
    await migrateSessions();        // Depends on users
    await migrateAIInteractions();  // Depends on users and documents

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Run validation script: node scripts/validate-migration.js');
    console.log('  2. Test your application with the new database');
    console.log('  3. Keep Cosmos DB running for a few days as backup');
    console.log('  4. Once confident, decommission Cosmos DB\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

// Run migration
runMigration();
