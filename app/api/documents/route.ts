import { type NextRequest, NextResponse } from "next/server"
import { getDocumentsContainer, type DocumentRecord } from "@/lib/cosmosdb"

// GET /api/documents - List all documents for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "anonymous"
    const container = await getDocumentsContainer()

    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.updatedAt DESC",
        parameters: [{ name: "@userId", value: userId }],
      })
      .fetchAll()

    return NextResponse.json({ documents: resources })
  } catch (error) {
    console.error("[v0] Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// POST /api/documents - Create or update a document
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "anonymous"
    const body = await request.json()
    const { id, title, content } = body

    const container = await getDocumentsContainer()

    if (id) {
      // Update existing document
      const { resource: existingDoc } = await container.item(id, userId).read<DocumentRecord>()

      if (!existingDoc) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 })
      }

      const updatedDoc: DocumentRecord = {
        ...existingDoc,
        title,
        content,
        updatedAt: new Date().toISOString(),
        versionCount: existingDoc.versionCount + 1,
      }

      const { resource } = await container.item(id, userId).replace(updatedDoc)
      return NextResponse.json({ document: resource })
    } else {
      // Create new document
      const newDoc: DocumentRecord = {
        id: `doc-${Date.now()}`,
        userId,
        title,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versionCount: 1,
      }

      const { resource } = await container.items.create(newDoc)
      return NextResponse.json({ document: resource })
    }
  } catch (error) {
    console.error("[v0] Error saving document:", error)
    return NextResponse.json(
      { error: "Failed to save document", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
