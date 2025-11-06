import { type NextRequest, NextResponse } from "next/server"
import { getVersionsContainer, getDocumentsContainer, type VersionRecord, type DocumentRecord } from "@/lib/cosmosdb"

// GET /api/documents/:id/versions - Get version history
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const container = await getVersionsContainer()

    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.documentId = @documentId ORDER BY c.versionNumber DESC",
        parameters: [{ name: "@documentId", value: id }],
      })
      .fetchAll()

    return NextResponse.json({ versions: resources })
  } catch (error) {
    console.error("[v0] Error fetching versions:", error)
    return NextResponse.json(
      { error: "Failed to fetch versions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// POST /api/documents/:id/versions - Create a new version
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = request.headers.get("x-user-id") || "anonymous"
    const body = await request.json()
    const { content, changeDescription } = body

    const documentsContainer = await getDocumentsContainer()
    const versionsContainer = await getVersionsContainer()

    // Get current document to determine version number
    const { resource: document } = await documentsContainer.item(id, userId).read<DocumentRecord>()

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Create version record
    const newVersion: VersionRecord = {
      id: `v-${Date.now()}`,
      documentId: id,
      versionNumber: document.versionCount,
      content,
      createdAt: new Date().toISOString(),
      changeDescription,
    }

    const { resource } = await versionsContainer.items.create(newVersion)
    return NextResponse.json({ version: resource })
  } catch (error) {
    console.error("[v0] Error creating version:", error)
    return NextResponse.json(
      { error: "Failed to create version", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// DELETE /api/documents/:id/versions - Clear all versions for a document
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const container = await getVersionsContainer()

    // Query all versions for this document
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.documentId = @documentId",
        parameters: [{ name: "@documentId", value: id }],
      })
      .fetchAll()

    // Delete each version
    const deletePromises = resources.map((version) => container.item(version.id, id).delete())

    await Promise.all(deletePromises)

    return NextResponse.json({ message: "All versions deleted", count: resources.length })
  } catch (error) {
    console.error("[v0] Error deleting versions:", error)
    return NextResponse.json(
      { error: "Failed to delete versions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
