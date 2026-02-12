import { type NextRequest, NextResponse } from "next/server"
import { verifyApiKey } from "@/lib/claude-client"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ valid: false, error: "API key is required" }, { status: 400 })
    }

    if (!apiKey.startsWith("sk-ant-")) {
      return NextResponse.json(
        { valid: false, error: "Invalid format. Anthropic API keys start with 'sk-ant-'." },
        { status: 400 },
      )
    }

    const result = await verifyApiKey(apiKey)
    return NextResponse.json(result)
  } catch (error) {
    console.error("API key verification error:", error)
    return NextResponse.json({ valid: false, error: "Verification failed. Please try again." }, { status: 500 })
  }
}
