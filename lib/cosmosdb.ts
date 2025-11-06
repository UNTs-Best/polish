import { CosmosClient, type Database, type Container } from "@azure/cosmos"

let client: CosmosClient | null = null
let database: Database | null = null
let documentsContainer: Container | null = null
let versionsContainer: Container | null = null

export function getCosmosClient() {
  if (!client) {
    const endpoint = process.env.COSMOS_DB_ENDPOINT
    const key = process.env.COSMOS_DB_KEY

    if (!endpoint || !key) {
      throw new Error(
        "Cosmos DB credentials not configured. Please set COSMOS_DB_ENDPOINT and COSMOS_DB_KEY environment variables.",
      )
    }

    client = new CosmosClient({ endpoint, key })
  }
  return client
}

export async function getDatabase() {
  if (!database) {
    const client = getCosmosClient()
    const databaseId = process.env.COSMOS_DB_DATABASE_ID || "PolishDocumentEditor"

    // Create database if it doesn't exist
    const { database: db } = await client.databases.createIfNotExists({ id: databaseId })
    database = db
  }
  return database
}

export async function getDocumentsContainer() {
  if (!documentsContainer) {
    const db = await getDatabase()

    // Create container if it doesn't exist
    const { container } = await db.containers.createIfNotExists({
      id: "documents",
      partitionKey: { paths: ["/userId"] },
    })
    documentsContainer = container
  }
  return documentsContainer
}

export async function getVersionsContainer() {
  if (!versionsContainer) {
    const db = await getDatabase()

    // Create container if it doesn't exist
    const { container } = await db.containers.createIfNotExists({
      id: "versions",
      partitionKey: { paths: ["/documentId"] },
    })
    versionsContainer = container
  }
  return versionsContainer
}

export interface DocumentRecord {
  id: string
  userId: string
  title: string
  content: {
    title: string
    sections: Array<{
      heading: string
      content: string
    }>
  }
  createdAt: string
  updatedAt: string
  versionCount: number
}

export interface VersionRecord {
  id: string
  documentId: string
  versionNumber: number
  content: DocumentRecord["content"]
  createdAt: string
  changeDescription?: string
}
