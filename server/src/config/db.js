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

  // Ensure all required containers exist
  await initializeContainers(database);

  console.log("✅ All database containers initialized");

    console.log("✅ Cosmos DB connected and containers initialized");
  } catch (err) {
    console.error("❌ Cosmos DB connection failed:", err.message);
    process.exit(1);
  }
};

/**
 * Initialize all required containers with proper partition keys
 */
const initializeContainers = async (database) => {
  const containers = [
    {
      id: "Documents",
      partitionKey: { paths: ["/ownerId"] },
      throughput: 400 // RU/s
    },
    {
      id: "Versions",
      partitionKey: { paths: ["/ownerId"] },
      throughput: 400 // RU/s
    },
    {
      id: "Users",
      partitionKey: { paths: ["/id"] },
      throughput: 400 // RU/s
    },
    {
      id: "Sessions",
      partitionKey: { paths: ["/userId"] },
      throughput: 400 // RU/s
    },
    {
      id: "AIInteractions",
      partitionKey: { paths: ["/userId"] },
      throughput: 400 // RU/s
    }
  ];

  for (const containerConfig of containers) {
    try {
      const { container } = await database.containers.createIfNotExists({
        id: containerConfig.id,
        partitionKey: containerConfig.partitionKey,
        throughput: containerConfig.throughput
      });
      console.log(`✅ Container '${containerConfig.id}' ready`);
    } catch (error) {
      console.warn(`⚠️  Container '${containerConfig.id}' initialization warning:`, error.message);
    }
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