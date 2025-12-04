import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { message, selectedText } = await request.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        message:
          "To use the AI assistant, please add your OpenAI API key in the environment variables (OPENAI_API_KEY).",
        suggestedChanges: null,
      })
    }

    const openai = createOpenAI({
      apiKey,
    })

    const systemPrompt = `You are an expert resume writing assistant called Polish AI. Your job is to help users improve their resumes.

When the user provides text from their resume, analyze it and provide:
1. A brief explanation of what could be improved
2. Concrete suggestions with before/after examples

Guidelines for resume improvements:
- Use strong action verbs (e.g., "Architected", "Spearheaded", "Orchestrated")
- Include quantifiable metrics and results when possible
- Keep bullet points concise and impactful
- Focus on achievements, not just responsibilities
- Use industry-appropriate terminology

If the user asks a general question about resumes, provide helpful advice.

Always be encouraging and constructive in your feedback.`

    const userPrompt = selectedText
      ? `The user has selected this text from their resume: "${selectedText}"\n\nTheir question/request: ${message}`
      : message

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 1000,
      temperature: 0.7,
    })

    // Parse the AI response to extract suggested changes if it contains before/after patterns
    let suggestedChanges = null

    // Check if the response contains improvement suggestions with before/after format
    const beforeAfterPattern =
      /(?:before|original|current)[:\s]*["']?([^"'\n]+)["']?\s*(?:after|improved|updated|suggested)[:\s]*["']?([^"'\n]+)["']?/gi
    const matches = [...text.matchAll(beforeAfterPattern)]

    if (matches.length > 0) {
      suggestedChanges = {
        type: "ai_suggestions",
        description: "AI-powered improvements",
        changes: matches.map((match) => ({
          section: "resume",
          original: match[1].trim(),
          updated: match[2].trim(),
        })),
      }
    }

    return NextResponse.json({
      message: text,
      suggestedChanges,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Failed to process message", message: "Sorry, I encountered an error. Please try again." },
      { status: 500 },
    )
  }
}
