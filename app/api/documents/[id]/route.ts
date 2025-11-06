import { type NextRequest, NextResponse } from "next/server"
import { getDocumentsContainer } from "@/lib/cosmosdb"

// GET /api/documents/:id - Get a specific document
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = request.headers.get("x-user-id") || "anonymous"
    const container = await getDocumentsContainer()

    const { resource } = await container.item(id, userId).read()

    if (!resource) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ document: resource })
  } catch (error) {
    console.error("[v0] Error fetching document:", error)
    return NextResponse.json(
      { error: "Failed to fetch document", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// DELETE /api/documents/:id - Delete a document
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = request.headers.get("x-user-id") || "anonymous"
    const container = await getDocumentsContainer()

    await container.item(id, userId).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting document:", error)
    return NextResponse.json(
      { error: "Failed to delete document", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
