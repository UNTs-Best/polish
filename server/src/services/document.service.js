import { v4 as uuidv4 } from "uuid";
import { getContainer } from "../config/db.js";

/**
 * Create metadata record after upload
 */
export async function createDocumentMeta(data) {
  const container = await getContainer("Documents");
  const item = {
    id: uuidv4(),
    title: data.title,
    ownerId: data.ownerId,
    blobName: data.blobName,
    blobUrl: data.blobUrl,
    size: data.size || 0,
    mimeType: data.mimeType || null,
    version: data.version || 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const { resource } = await container.items.create(item);
  return resource;
}

/**
 * Fetch all docs for a specific user
 */
export async function getUserDocuments(ownerId) {
  const container = await getContainer("Documents");
  const querySpec = {
    query: "SELECT * FROM c WHERE c.ownerId = @ownerId ORDER BY c._ts DESC",
    parameters: [{ name: "@ownerId", value: ownerId }],
  };
  const { resources } = await container.items.query(querySpec).fetchAll();
  return resources;
}

/**
 * Update metadata (rename, version bump, etc.)
 */
export async function updateDocument(id, updates) {
  const container = await getContainer("Documents");
  const existing = await getDocumentbyId(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  const { resource } = await container.item(id, existing.ownerId).replace(merged);
  return resource;
}

/**
 * Delete metadata record
 */
export async function deleteDocument(id) {
  const container = await getContainer("Documents");
  const existing = await getDocumentbyId(id);
  if (!existing) return null;
  await container.item(id, existing.ownerId).delete();
  return true;
}

export async function getDocumentbyId(id) {
  const container = await getContainer("Documents");
  const querySpec = {
    query: "SELECT TOP 1 * FROM c WHERE c.id = @id",
    parameters: [{ name: "@id", value: id }],
  };
  const { resources } = await container.items.query(querySpec).fetchAll();
  return resources[0] || null;
}