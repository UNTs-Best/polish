import Anthropic from "@anthropic-ai/sdk"
import type { DocumentContent } from "./mcp-tools"

export function createClaudeClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey })
}

export async function verifyApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = createClaudeClient(apiKey)
    await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hi" }],
    })
    return { valid: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed"
    return { valid: false, error: message }
  }
}

export async function chatWithTools(
  client: Anthropic,
  message: string,
  selectedText?: string,
  documentContent?: DocumentContent,
): Promise<{ message: string }> {
  const contextParts: string[] = []
  if (selectedText) contextParts.push(`Selected text:\n"${selectedText}"`)
  if (documentContent?.content) contextParts.push(`Document content:\n${documentContent.content}`)

  const system = [
    "You are an expert document editor and writing assistant.",
    "Help the user improve their document with clear, actionable suggestions.",
    contextParts.length > 0 ? `\nContext:\n${contextParts.join("\n\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n")

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: message }],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  return { message: text }
}
