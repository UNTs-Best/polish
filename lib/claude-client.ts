import Anthropic from "@anthropic-ai/sdk"

export function createClaudeClient(apiKey: string) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

export interface DocumentContent {
  fullText: string
  selectedText?: string
}

export async function chatWithTools(
  client: Anthropic,
  message: string,
  selectedText?: string,
  documentContent?: DocumentContent
) {
  const systemPrompt = `You are an expert resume and cover letter editor. Help users improve their professional documents.
${documentContent?.fullText ? `\nCurrent document:\n${documentContent.fullText}` : ""}
${selectedText ? `\nSelected text: ${selectedText}` : ""}`

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
  })

  const content = response.content[0]
  const text = content.type === "text" ? content.text : ""

  const suggestionMatch = text.match(/```suggestion\n([\s\S]*?)```/)
  const suggestion = suggestionMatch ? suggestionMatch[1].trim() : undefined

  return {
    message: text,
    suggestion,
    usage: response.usage,
  }
}

export async function verifyApiKey(apiKey: string): Promise<boolean> {
  try {
    const client = createClaudeClient(apiKey)
    await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hi" }],
    })
    return true
  } catch {
    return false
  }
}
