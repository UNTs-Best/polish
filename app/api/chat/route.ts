import { type NextRequest, NextResponse } from "next/server"
import { createClaudeClient, chatWithTools } from "@/lib/claude-client"
import type { DocumentContent } from "@/lib/mcp-tools"

export async function POST(request: NextRequest) {
  try {
    const { message, selectedText, documentContent } = await request.json()

    // Get API key from header
    const apiKey = request.headers.get("x-anthropic-key")
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Not connected",
          message: "Please connect your Claude API key first. Click the 'Connect Claude' button in the toolbar.",
        },
        { status: 401 },
      )
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Create Claude client and chat with MCP tools
    const client = createClaudeClient(apiKey)
    const result = await chatWithTools(
      client,
      message,
      selectedText,
      documentContent as DocumentContent,
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Chat API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // Handle specific Anthropic API errors
    if (errorMessage.includes("401") || errorMessage.includes("authentication")) {
      return NextResponse.json(
        {
          error: "Invalid API key",
          message: "Your Claude API key appears to be invalid. Please reconnect with a valid key.",
        },
        { status: 401 },
      )
    }

    if (errorMessage.includes("429") || errorMessage.includes("rate")) {
      return NextResponse.json(
        {
          error: "Rate limited",
          message: "Too many requests. Please wait a moment and try again.",
        },
        { status: 429 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to process message",
        message: `Sorry, I encountered an error: ${errorMessage}`,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    )
  }
}
