// Claude API client wrapper with MCP tool use support
import Anthropic from "@anthropic-ai/sdk"
import { resumeTools, executeResumeTool, type DocumentContent } from "./mcp-tools"

const SYSTEM_PROMPT = `You are an expert resume writing assistant integrated into the Polish resume editor. You have access to tools that let you read and edit the user's resume directly.

## How to work:
1. When asked to improve text, FIRST use read_resume or read_section to see the current content
2. Then use edit_bullet or edit_section_field to make specific changes
3. Always explain what you changed and why

## Resume writing guidelines:
- Use strong, specific action verbs (Led, Developed, Implemented, Optimized, Architected)
- Include quantifiable metrics and results whenever possible (percentages, numbers, dollar amounts)
- Focus on achievements and impact, not just responsibilities
- Keep bullet points concise (1-2 lines each)
- Use consistent tense (past tense for previous roles, present for current)
- Avoid filler words, clichés, and vague statements
- Tailor language to the industry and role

## When the user selects specific text:
- Focus your improvements on that exact text
- Use edit_bullet to replace the specific bullet point
- Provide a brief explanation of what you improved

## When asked general questions:
- Use get_resume_stats to assess the resume overall
- Use search_resume to find relevant content
- Give specific, actionable advice

Always be concise in your responses. Lead with the action, follow with brief reasoning.`

export function createClaudeClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey })
}

export async function verifyApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = new Anthropic({ apiKey })
    // Make a minimal API call to verify the key
    await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 10,
      messages: [{ role: "user", content: "hi" }],
    })
    return { valid: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    if (msg.includes("authentication") || msg.includes("api_key") || msg.includes("401")) {
      return { valid: false, error: "Invalid API key. Please check your Anthropic API key." }
    }
    if (msg.includes("rate") || msg.includes("429")) {
      // Rate limited means the key is valid
      return { valid: true }
    }
    return { valid: false, error: msg }
  }
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface ToolChange {
  section: string
  original: string
  updated: string
}

export async function chatWithTools(
  client: Anthropic,
  userMessage: string,
  selectedText: string | undefined,
  documentContent: DocumentContent,
): Promise<{
  message: string
  suggestedChanges: {
    type: string
    description: string
    changes: ToolChange[]
  } | null
}> {
  const allChanges: ToolChange[] = []

  // Build the user message with selection context
  let fullMessage = userMessage
  if (selectedText) {
    fullMessage = `The user has selected this text from their resume: "${selectedText}"\n\nTheir request: ${userMessage}`
  }

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: fullMessage }]

  // Multi-turn tool use loop
  let maxIterations = 10
  let finalText = ""

  while (maxIterations > 0) {
    maxIterations--

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: resumeTools,
      messages,
    })

    // Collect text blocks and tool use blocks
    const textBlocks: string[] = []
    const toolUseBlocks: Anthropic.ContentBlockParam[] = []

    for (const block of response.content) {
      if (block.type === "text") {
        textBlocks.push(block.text)
      } else if (block.type === "tool_use") {
        // Execute the tool
        const { result, changes } = executeResumeTool(
          block.name,
          block.input as Record<string, unknown>,
          documentContent,
        )

        if (changes) {
          allChanges.push(...changes)
        }

        // Add assistant message with tool use
        toolUseBlocks.push({
          type: "tool_use",
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        })

        // We'll add the tool result after processing all blocks
        messages.push({
          role: "assistant",
          content: [
            ...textBlocks.map((t) => ({ type: "text" as const, text: t })),
            {
              type: "tool_use" as const,
              id: block.id,
              name: block.name,
              input: block.input as Record<string, unknown>,
            },
          ],
        })

        messages.push({
          role: "user",
          content: [
            {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: JSON.stringify(result),
            },
          ],
        })

        // Clear text blocks since they were already added
        textBlocks.length = 0
      }
    }

    // If stop reason is end_turn or no more tool use, we're done
    if (response.stop_reason === "end_turn" || toolUseBlocks.length === 0) {
      finalText = textBlocks.join("\n")
      break
    }
  }

  // Build the response
  const suggestedChanges =
    allChanges.length > 0
      ? {
          type: "ai_suggestions",
          description: finalText.split("\n")[0]?.substring(0, 100) || "AI improvements",
          changes: allChanges,
        }
      : null

  return {
    message: finalText || "I've made the requested changes to your resume.",
    suggestedChanges,
  }
}
