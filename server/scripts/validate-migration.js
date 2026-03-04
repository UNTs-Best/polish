import { CosmosClient } from '@azure/cosmos';
import { getSupabaseAdmin } from '../src/config/supabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
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
    console.log('⚠️  Cosmos DB credentials not found. Skipping Cosmos count comparison.');
    return false;
  }

  try {
    cosmosClient = new CosmosClient({
      endpoint: cosmosEndpoint,
      key: cosmosKey
    });

    database = cosmosClient.database(cosmosDatabase);
    console.log('✅ Connected to Cosmos DB');
    return true;
  } catch (err) {
    console.log('⚠️  Could not connect to Cosmos DB:', err.message);
    return false;
  }
}

/**
 * Get count from Cosmos container
 */
async function getCosmosCount(containerName) {
  try {
    const container = database.container(containerName);
    const { resources } = await container.items.readAll().fetchAll();
    return resources.length;
  } catch (err) {
    console.log(`  ⚠️  Could not count ${containerName}:`, err.message);
    return 0;
  }
}

/**
 * Get count from Supabase table
 */
async function getSupabaseCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count;
  } catch (err) {
    console.error(`  ❌ Error querying ${tableName}:`, err.message);
    return 0;
  }
}

/**
 * Validate table structure
 */
async function validateTableStructure() {
  console.log('\n📋 Validating Supabase table structure...\n');

  const tables = ['users', 'documents', 'versions', 'sessions', 'ai_interactions'];

  for (const table of tables) {
    try {
      // Try to query one row to verify table exists and is accessible
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        // No rows, but table exists
        console.log(`  ✅ Table '${table}' exists (empty)`);
      } else if (error) {
        console.error(`  ❌ Table '${table}' error:`, error.message);
      } else {
        console.log(`  ✅ Table '${table}' exists and accessible`);
      }
    } catch (err) {
      console.error(`  ❌ Error checking table '${table}':`, err.message);
    }
  }
}

/**
 * Validate record counts
 */
async function validateRecordCounts(compareToCosmos = false) {
  console.log('\n📊 Validating record counts...\n');

  const tables = [
    { cosmos: 'Users', supabase: 'users' },
    { cosmos: 'Documents', supabase: 'documents' },
    { cosmos: 'Versions', supabase: 'versions' },
    { cosmos: 'Sessions', supabase: 'sessions' },
    { cosmos: 'AIInteractions', supabase: 'ai_interactions' }
  ];

  const results = [];

  for (const { cosmos, supabase: supabaseTable } of tables) {
    const supabaseCount = await getSupabaseCount(supabaseTable);

    if (compareToCosmos && database) {
      const cosmosCount = await getCosmosCount(cosmos);
      const match = cosmosCount === supabaseCount;
      const status = match ? '✅' : '⚠️';

      console.log(`  ${status} ${supabaseTable}: ${supabaseCount} records (Cosmos: ${cosmosCount})`);

      results.push({
        table: supabaseTable,
        supabaseCount,
        cosmosCount,
        match
      });
    } else {
      console.log(`  ✅ ${supabaseTable}: ${supabaseCount} records`);
      results.push({
        table: supabaseTable,
        supabaseCount
      });
    }
  }

  return results;
}

/**
 * Sample data integrity check
 */
async function sampleDataIntegrityCheck() {
  console.log('\n🔍 Sampling data integrity...\n');

  // Check users table
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, provider, created_at')
      .limit(5);

    if (error) throw error;

    if (users && users.length > 0) {
      console.log(`  ✅ Users sample (${users.length} records):`);
      users.forEach(user => {
        console.log(`     - ${user.email} (${user.provider})`);
      });
    } else {
      console.log('  ⚠️  No users found');
    }
  } catch (err) {
    console.error('  ❌ Error sampling users:', err.message);
  }

  // Check documents table
  try {
    const { data: docs, error } = await supabase
      .from('documents')
      .select('id, title, owner_id, created_at')
      .limit(5);

    if (error) throw error;

    if (docs && docs.length > 0) {
      console.log(`\n  ✅ Documents sample (${docs.length} records):`);
      docs.forEach(doc => {
        console.log(`     - ${doc.title}`);
      });
    } else {
      console.log('\n  ⚠️  No documents found');
    }
  } catch (err) {
    console.error('\n  ❌ Error sampling documents:', err.message);
  }

  // Check foreign key relationships
  try {
    const { data: docs, error } = await supabase
      .from('documents')
      .select('id, owner_id')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (docs) {
      // Verify owner exists
      const { data: owner, error: ownerError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', docs.owner_id)
        .single();

      if (ownerError && ownerError.code !== 'PGRST116') throw ownerError;

      if (owner) {
        console.log(`\n  ✅ Foreign key integrity verified (document → user)`);
      } else {
        console.log(`\n  ⚠️  Foreign key mismatch detected (document has invalid owner_id)`);
      }
    }
  } catch (err) {
    console.error('\n  ❌ Error checking foreign keys:', err.message);
  }
}

/**
 * Generate summary report
 */
function generateSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION VALIDATION SUMMARY');
  console.log('='.repeat(60) + '\n');

  let totalRecords = 0;
  let allMatched = true;

  results.forEach(result => {
    totalRecords += result.supabaseCount;
    if (result.cosmosCount !== undefined && !result.match) {
      allMatched = false;
    }
  });

  console.log(`Total records migrated: ${totalRecords}`);

  if (results[0].cosmosCount !== undefined) {
    if (allMatched) {
      console.log('Status: ✅ All record counts match between Cosmos DB and Supabase');
    } else {
      console.log('Status: ⚠️  Some record counts do not match');
      console.log('\nMismatches:');
      results.forEach(result => {
        if (!result.match) {
          console.log(`  - ${result.table}: Cosmos ${result.cosmosCount} vs Supabase ${result.supabaseCount}`);
        }
      });
    }
  } else {
    console.log('Status: ✅ Supabase tables populated');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Main validation function
 */
async function runValidation() {
  try {
    console.log('🔍 Starting migration validation...\n');

    // Initialize Cosmos DB (optional, for comparison)
    const hasCosmos = initCosmos();

    // Validate table structure
    await validateTableStructure();

    // Validate record counts
    const results = await validateRecordCounts(hasCosmos);

    // Sample data integrity
    await sampleDataIntegrityCheck();

    // Generate summary
    generateSummary(results);

    console.log('✅ Validation completed!\n');
    console.log('Next steps:');
    console.log('  1. Review any warnings or mismatches above');
    console.log('  2. Test your application thoroughly');
    console.log('  3. Verify authentication and document operations work');
    console.log('  4. Check that file uploads/downloads function correctly\n');

  } catch (err) {
    console.error('\n❌ Validation failed:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

// Run validation
runValidation();
