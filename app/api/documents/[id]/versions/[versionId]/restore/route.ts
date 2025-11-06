import { type NextRequest, NextResponse } from "next/server"
import { getVersionsContainer, getDocumentsContainer, type VersionRecord, type DocumentRecord } from "@/lib/cosmosdb"

// POST /api/documents/:id/versions/:versionId/restore - Restore a version
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  try {
    const { id, versionId } = await params
    const userId = request.headers.get("x-user-id") || "anonymous"

    const versionsContainer = await getVersionsContainer()
    const documentsContainer = await getDocumentsContainer()

    // Get the version to restore
    const { resource: version } = await versionsContainer.item(versionId, id).read<VersionRecord>()

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 })
    }

    // Get current document
    const { resource: document } = await documentsContainer.item(id, userId).read<DocumentRecord>()

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Update document with version content
    const updatedDoc: DocumentRecord = {
      ...document,
      content: version.content,
      updatedAt: new Date().toISOString(),
      versionCount: document.versionCount + 1,
    }

    const { resource } = await documentsContainer.item(id, userId).replace(updatedDoc)
    return NextResponse.json({ document: resource })
  } catch (error) {
    console.error("[v0] Error restoring version:", error)
    return NextResponse.json(
      { error: "Failed to restore version", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
