import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Simulate fetching version history from database
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Mock version history data
    const versions = [
      {
        id: "v1",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        description: "Initial version",
      },
      {
        id: "v2",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        description: "Updated experience section",
      },
    ]

    return NextResponse.json({ versions })
  } catch (error) {
    console.error("Versions API error:", error)
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { documentContent, description } = await request.json()

    // Simulate saving version to database
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newVersion = {
      id: `v${Date.now()}`,
      timestamp: new Date().toISOString(),
      description: description || "Manual save",
      content: documentContent,
    }

    console.log("[v0] Created new version:", newVersion.id)

    return NextResponse.json({
      success: true,
      version: newVersion,
    })
  } catch (error) {
    console.error("Create version API error:", error)
    return NextResponse.json({ error: "Failed to create version" }, { status: 500 })
  }
}
