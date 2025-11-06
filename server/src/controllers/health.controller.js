import { CosmosClient } from '@azure/cosmos';

export async function dbHealth(req, res) {
  try {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE;
    if (!endpoint || !key || !databaseId) {
      return res.status(500).json({ status: 'error', message: 'Cosmos env not configured' });
    }
    const client = new CosmosClient({ endpoint, key });
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    await database.read();
    return res.json({ status: 'ok' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}


