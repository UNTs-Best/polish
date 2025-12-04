import { type NextRequest, NextResponse } from "next/server"

// Azure OpenAI Foundry configuration
const AZURE_FOUNDRY_ENDPOINT = process.env.AZURE_FOUNDRY_ENDPOINT
const AZURE_FOUNDRY_API_KEY = process.env.AZURE_FOUNDRY_API_KEY
const AZURE_FOUNDRY_API_VERSION = process.env.AZURE_FOUNDRY_API_VERSION || "2024-12-01-preview"
const AZURE_FOUNDRY_DEPLOYMENT = process.env.AZURE_FOUNDRY_DEPLOYMENT || "gpt-5.1-chat"

// Call Azure OpenAI Foundry API
async function callAzureFoundry(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 16384
): Promise<string> {
  if (!AZURE_FOUNDRY_ENDPOINT) {
    throw new Error("AZURE_FOUNDRY_ENDPOINT is not configured. Please set it in your .env.local file.")
  }
  
  if (!AZURE_FOUNDRY_API_KEY) {
    throw new Error("AZURE_FOUNDRY_API_KEY is not configured. Please set it in your .env.local file.")
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "api-key": AZURE_FOUNDRY_API_KEY,
  }

  // Use standard Azure OpenAI chat completions endpoint format
  // Format: {endpoint}/openai/deployments/{deployment}/chat/completions?api-version={api-version}
  const url = `${AZURE_FOUNDRY_ENDPOINT}/openai/deployments/${AZURE_FOUNDRY_DEPLOYMENT}/chat/completions?api-version=${AZURE_FOUNDRY_API_VERSION}`
  
  const requestBody: any = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: maxTokens,
    model: AZURE_FOUNDRY_DEPLOYMENT,
  }
  
  // Only include temperature if it's 1 (the only supported value for this model)
  // The model only supports temperature = 1, so we'll omit it to use the default
  // if (temperature === 1) {
  //   requestBody.temperature = temperature
  // }

  console.log("=== Azure OpenAI API Call ===")
  console.log("URL:", url)
  console.log("Request body:", JSON.stringify(requestBody, null, 2))

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()
    console.log("=== Azure OpenAI API Response ===")
    console.log("Status:", response.status, response.statusText)
    console.log("Response (first 500 chars):", responseText.substring(0, 500))

    if (!response.ok) {
      console.error("=== Full Error Response ===")
      console.error(responseText)
      
      let errorMsg = `Azure OpenAI API error (${response.status}): `
      try {
        const errorJson = JSON.parse(responseText)
        errorMsg += JSON.stringify(errorJson, null, 2)
      } catch (e) {
        errorMsg += responseText.substring(0, 500)
      }
      throw new Error(errorMsg)
    }

    const data = JSON.parse(responseText)
    return extractResponseText(data)
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("Failed to parse JSON response:", error)
      throw new Error("Invalid JSON response from Azure Foundry API")
    }
    throw error
  }
}

// Helper function to extract text from various response formats
function extractResponseText(data: any): string {
  // Handle different response formats from Azure Foundry
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content
  } else if (data.choices && data.choices[0]?.text) {
    return data.choices[0].text
  } else if (data.content) {
    return data.content
  } else if (data.text) {
    return data.text
  } else if (data.message) {
    return data.message
  } else if (typeof data === 'string') {
    return data
  }
  
  console.error("Unexpected response format:", JSON.stringify(data, null, 2))
  throw new Error("Unexpected response format from Azure Foundry API")
}

export async function POST(request: NextRequest) {
  try {
    const { message, selectedText, documentContent } = await request.json()

    // Format the resume content for context
    let resumeContext = ""
    if (documentContent) {
      resumeContext = `\n\nCurrent Resume Content:\n`
      if (documentContent.name) resumeContext += `Name: ${documentContent.name}\n`
      if (documentContent.title) resumeContext += `Title: ${documentContent.title}\n`
      if (documentContent.contact) resumeContext += `Contact: ${documentContent.contact}\n`
      
      if (documentContent.education && documentContent.education.length > 0) {
        resumeContext += `\nEducation:\n`
        documentContent.education.forEach((edu: any) => {
          resumeContext += `- ${edu.school}: ${edu.degree} (${edu.location}, ${edu.period})\n`
        })
      }
      
      if (documentContent.experience && documentContent.experience.length > 0) {
        resumeContext += `\nExperience:\n`
        documentContent.experience.forEach((exp: any) => {
          resumeContext += `- ${exp.role} at ${exp.company} (${exp.location}, ${exp.period})\n`
          if (exp.bullets) {
            exp.bullets.forEach((bullet: string) => {
              resumeContext += `  • ${bullet}\n`
            })
          }
        })
      }
      
      if (documentContent.projects && documentContent.projects.length > 0) {
        resumeContext += `\nProjects:\n`
        documentContent.projects.forEach((proj: any) => {
          resumeContext += `- ${proj.name} (${proj.tech}, ${proj.period})\n`
          if (proj.bullets) {
            proj.bullets.forEach((bullet: string) => {
              resumeContext += `  • ${bullet}\n`
            })
          }
        })
      }
      
      if (documentContent.skills) {
        resumeContext += `\nSkills: ${documentContent.skills}\n`
      }
    }

    const systemPrompt = `You are a resume writing assistant. You have access to the user's full resume. When the user provides text from their resume, provide ONLY:
1. A brief one-sentence description of the improvement (max 20 words)
2. The improved version of the text

Format your response EXACTLY like this:
Description: [brief description]
Original: [exact original text]
Updated: [improved text]

Guidelines:
- Use strong action verbs
- Include quantifiable metrics when possible
- Keep it concise and impactful
- Focus on achievements, not responsibilities
- Consider the full resume context when making suggestions`

    const userPrompt = selectedText
      ? `Improve this resume text: "${selectedText}"\n\nUser request: ${message}${resumeContext}`
      : `${message}${resumeContext}`

    // Note: This model only supports the default temperature (1), so we omit it
    const text = await callAzureFoundry(systemPrompt, userPrompt, 16384)

    // Parse the AI response to extract suggested changes
    let suggestedChanges = null
    let briefMessage = text

    // Try to parse the structured format first
    const structuredPattern = /Description:\s*(.+?)\s*(?:Original|Updated):/i
    const originalPattern = /Original:\s*["']?([^"'\n]+)["']?/i
    const updatedPattern = /Updated:\s*["']?([^"'\n]+)["']?/i

    const descriptionMatch = text.match(structuredPattern)
    const originalMatch = text.match(originalPattern)
    const updatedMatch = text.match(updatedPattern)

    if (descriptionMatch && originalMatch && updatedMatch) {
      // Structured format found
      const description = descriptionMatch[1].trim()
      const original = originalMatch[1].trim()
      const updated = updatedMatch[1].trim()

      briefMessage = description

      suggestedChanges = {
        type: "ai_suggestions",
        description: description,
        changes: [{
          section: "resume",
          original: selectedText || original, // Use selectedText if available for exact matching
          updated: updated,
        }],
      }
    } else if (selectedText) {
      // Fallback: try to extract before/after patterns
      const beforeAfterPattern =
        /(?:before|original|current)[:\s]*["']?([^"'\n]+)["']?\s*(?:after|improved|updated|suggested)[:\s]*["']?([^"'\n]+)["']?/gi
      const matches = [...text.matchAll(beforeAfterPattern)]

      if (matches.length > 0) {
        const firstMatch = matches[0]
        // Extract description (first line or sentence)
        const description = text.split('\n')[0].replace(/^(Description|Improvement):\s*/i, '').trim() || "AI improvement"
        
        briefMessage = description.length > 100 ? description.substring(0, 100) + "..." : description

        suggestedChanges = {
          type: "ai_suggestions",
          description: description,
          changes: [{
            section: "resume",
            original: selectedText, // Use exact selectedText for highlighting
            updated: firstMatch[2].trim(),
          }],
        }
      } else {
        // No structured format found, try to extract just the improved text
        // Look for text that seems like an improvement
        const lines = text.split('\n').filter(line => line.trim().length > 10)
        if (lines.length > 0) {
          const improvedText = lines[0].replace(/^["']|["']$/g, '').trim()
          if (improvedText && improvedText !== selectedText) {
            briefMessage = "Improved version: " + improvedText.substring(0, 50) + (improvedText.length > 50 ? "..." : "")
            suggestedChanges = {
              type: "ai_suggestions",
              description: "AI improvement",
              changes: [{
                section: "resume",
                original: selectedText,
                updated: improvedText,
              }],
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: briefMessage,
      suggestedChanges,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Log full error details for debugging
    console.error("Full error details:", {
      message: errorMessage,
      stack: errorStack,
      error: error
    })
    
    return NextResponse.json(
      { 
        error: "Failed to process message", 
        message: `Sorry, I encountered an error: ${errorMessage}. Please check the server logs for details.`,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 },
    )
  }
}
