import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";

dotenv.config();

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE;

let client = null;

export const connectDB = async () => {
  try {
    if (!endpoint || !key || !databaseId) {
      console.warn("Cosmos env not fully set. Skipping connection.");
      return;
    }
    client = new CosmosClient({ endpoint, key });
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    await database.read();
    console.log("✅ Cosmos DB connected");
  } catch (err) {
    console.error("❌ Cosmos DB connection failed:", err.message);
    process.exit(1);
  }
};

export const getContainer = async (containerId, partitionKeyPath = "/ownerId") => {
  if (!client) {
    if (!endpoint || !key || !databaseId) throw new Error("Cosmos env not configured");
    client = new CosmosClient({ endpoint, key });
  }
  const { database } = await client.databases.createIfNotExists({ id: databaseId });
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: [partitionKeyPath] },
  });
  return container;
};

export function isCosmosConfigured() {
  return Boolean(endpoint && key && databaseId);
}