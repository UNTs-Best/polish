import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { documentContent, timestamp } = await request.json()

    // Simulate saving to database/storage
    await new Promise((resolve) => setTimeout(resolve, 500))

    console.log("[v0] Autosaved document at:", new Date(timestamp).toLocaleTimeString())

    return NextResponse.json({
      success: true,
      savedAt: timestamp,
      message: "Document autosaved successfully",
    })
  } catch (error) {
    console.error("Autosave API error:", error)
    return NextResponse.json({ error: "Failed to autosave document" }, { status: 500 })
  }
}
