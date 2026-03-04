import { type NextRequest, NextResponse } from "next/server"

// Azure OpenAI Service configuration
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT // e.g., https://your-resource.openai.azure.com
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o"
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview"

// Check if Azure OpenAI is configured
const isAzureOpenAIConfigured = () => {
  return Boolean(AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY && AZURE_OPENAI_DEPLOYMENT_NAME)
}

// Call Azure OpenAI Service
async function callAzureOpenAI(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.3,
  maxTokens: number = 2000
) {
  if (!isAzureOpenAIConfigured()) {
    throw new Error("Azure OpenAI Service is not configured. Please set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_NAME environment variables.")
  }

  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "api-key": AZURE_OPENAI_API_KEY!,
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ""
}

// Generate resume-specific suggestions
async function generateResumeSuggestions(
  message: string,
  selectedText: string | undefined,
  documentContent?: any
): Promise<{ message: string; suggestedChanges: any }> {
  const lowerMessage = message.toLowerCase()

  // Create system prompt for resume improvement
  const systemPrompt = `You are an expert resume writer and career coach specializing in ATS (Applicant Tracking System) optimization and professional resume writing. Your task is to help users improve their resumes by:

1. Making content more concise and impactful
2. Using strong action verbs and quantifiable metrics
3. Following the XYZ format (Accomplished [X] as measured by [Y], by doing [Z])
4. Improving clarity and professional tone
5. Optimizing for ATS systems

When providing suggestions, always return your response as JSON in this format:
{
  "message": "Brief explanation of what you're doing",
  "suggestedChanges": {
    "type": "change_type",
    "description": "Description of changes",
    "changes": [
      {
        "section": "experience|education|projects|skills",
        "original": "original text",
        "updated": "improved text"
      }
    ]
  }
}

If you cannot provide specific changes, return:
{
  "message": "Helpful response message",
  "suggestedChanges": null
}`

  // Build user prompt based on context
  let userPrompt = `User request: ${message}\n\n`

  if (selectedText) {
    userPrompt += `Selected text to improve:\n"${selectedText}"\n\n`
    userPrompt += `Please analyze this text and provide specific improvements. Focus on making it more impactful with metrics, stronger verbs, and clearer language.`
  } else if (lowerMessage.includes("more concise") || lowerMessage.includes("make it concise") || lowerMessage.includes("shorten")) {
    userPrompt += `The user wants to make their resume more concise. Please provide suggestions to remove redundant words and tighten the language while maintaining impact.`
    if (documentContent?.experience) {
      userPrompt += `\n\nHere are some example experience bullets:\n${JSON.stringify(documentContent.experience.slice(0, 2), null, 2)}`
    }
  } else if (lowerMessage.includes("xyz format") || (lowerMessage.includes("format") && lowerMessage.includes("experience"))) {
    userPrompt += `The user wants to rewrite experience bullets in XYZ format (Accomplished [X] as measured by [Y], by doing [Z]). Please provide improved versions.`
    if (documentContent?.experience) {
      userPrompt += `\n\nHere are current experience bullets:\n${JSON.stringify(documentContent.experience[0]?.bullets || [], null, 2)}`
    }
  } else if (lowerMessage.includes("stronger verb") || lowerMessage.includes("action verb")) {
    userPrompt += `The user wants to replace weak verbs with stronger action verbs. Please suggest improvements.`
    if (documentContent?.experience) {
      userPrompt += `\n\nHere are current experience bullets:\n${JSON.stringify(documentContent.experience[0]?.bullets || [], null, 2)}`
    }
  } else {
    userPrompt += `Please provide helpful guidance on how to improve their resume.`
  }

  try {
    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.3, 2000)
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(response)
      return {
        message: parsed.message || response,
        suggestedChanges: parsed.suggestedChanges || null,
      }
    } catch {
      // If not JSON, return as message
      return {
        message: response,
        suggestedChanges: null,
      }
    }
  } catch (error) {
    console.error("Azure OpenAI error:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, selectedText, conversationContext, documentContent } = await request.json()

    // Check if Azure OpenAI is configured
    if (!isAzureOpenAIConfigured()) {
      // Fallback to mock responses if not configured
      console.warn("Azure OpenAI not configured, using fallback responses")
      
      let aiResponse = ""
      let suggestedChanges = null
      const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("fix resume") || lowerMessage.includes("improve resume")) {
      aiResponse = "Sure — which part would you like me to improve?"
      return NextResponse.json({ message: aiResponse, suggestions: [] })
    }

    if (
      lowerMessage.includes("more concise") ||
      lowerMessage.includes("make it concise") ||
      lowerMessage.includes("shorten")
    ) {
      aiResponse =
        "I'll make your resume more concise by removing redundant words and tightening the language. Here's a preview:"
      suggestedChanges = {
        type: "make_concise",
        description: "Make resume more concise",
        changes: [
          {
            section: "experience",
            original:
              "Developed algorithms for genomic analysis, processing 10,000+ sequences and identifying 150+ disease patterns.",
            updated:
              "Developed genomic analysis algorithms processing 10,000+ sequences, identifying 150+ disease patterns.",
          },
          {
            section: "experience",
            original:
              "Implemented Python TensorFlow models to analyze genome organization, improved prediction accuracy by 25%.",
            updated:
              "Implemented TensorFlow models analyzing genome organization, improving prediction accuracy by 25%.",
          },
          {
            section: "experience",
            original:
              "Enhanced lab infrastructure by optimizing data pipelines and workflows, reducing processing time by 35%.",
            updated: "Optimized data pipelines and workflows, reducing processing time by 35%.",
          },
          {
            section: "experience",
            original:
              "Collaborated with PM and Design leads to redesign billing interfaces across subscription tiers for 500M downloads.",
            updated:
              "Redesigned billing interfaces across subscription tiers for 500M downloads with PM and Design leads.",
          },
          {
            section: "experience",
            original:
              "Increased Trial-to-PAYG conversions by 12% by conducting user research and streamlining upgrade flow friction.",
            updated: "Increased Trial-to-PAYG conversions by 12% through user research and streamlined upgrade flows.",
          },
          {
            section: "experience",
            original:
              "Accelerated engineer onboarding by 40% by identifying documentation gaps and updating internal technical docs.",
            updated: "Accelerated engineer onboarding by 40% by updating internal technical documentation.",
          },
        ],
      }
      return NextResponse.json({ message: aiResponse, suggestedChanges })
    }

    if (
      (lowerMessage.includes("delete") || lowerMessage.includes("remove")) &&
      (lowerMessage.includes("research") || lowerMessage.includes("research role"))
    ) {
      aiResponse =
        "I'll remove the Research Assistant - Machine Learning role from your resume. The layout will automatically adjust. Here's a preview:"
      suggestedChanges = {
        type: "delete_research_role",
        description: "Delete Research Assistant role",
        changes: [
          {
            section: "experience",
            original: "Research Assistant, Machine Learning at The Oluwadare Lab",
            updated: "[This role will be removed]",
          },
        ],
      }
      return NextResponse.json({ message: aiResponse, suggestedChanges })
    }

    if (
      (lowerMessage.includes("delete") || lowerMessage.includes("remove")) &&
      (lowerMessage.includes("leadership") || lowerMessage.includes("section"))
    ) {
      const sectionName = lowerMessage.includes("leadership") ? "leadership" : "section"
      aiResponse = `I'll remove the ${sectionName} section from your resume. Here's a preview of what will be deleted. You can accept or undo this change.`
      suggestedChanges = {
        type: "delete_section",
        description: `Delete ${sectionName} section`,
        changes: [
          {
            section: sectionName,
            original: `${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Section Content`,
            updated: "[Section will be removed]",
          },
        ],
      }
      return NextResponse.json({ message: aiResponse, suggestedChanges })
    }

    if (
      (lowerMessage.includes("use") && lowerMessage.includes("format") && lowerMessage.includes("experience")) ||
      (lowerMessage.includes("xyz format") && lowerMessage.includes("impact"))
    ) {
      aiResponse =
        "I'll rewrite your Experience section using the XYZ format (Accomplished [X] as measured by [Y], by doing [Z]) to add more impact. Here's a preview:"
      suggestedChanges = {
        type: "xyz_format",
        description: "Rewrite experience bullets in XYZ format for impact",
        changes: [
          {
            section: "experience",
            original:
              "Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems",
            updated:
              "Improved data processing efficiency by 40% by developing a REST API using FastAPI and PostgreSQL to store data from learning management systems",
          },
          {
            section: "experience",
            original:
              "Developed a full-stack web application using Flask, React, PostgreSQL and Docker to analyze GitHub data",
            updated:
              "Accelerated GitHub data analysis by 3x by developing a full-stack web application using Flask, React, PostgreSQL and Docker",
          },
          {
            section: "experience",
            original: "Explored ways to visualize GitHub collaboration in a classroom setting",
            updated:
              "Enhanced classroom collaboration insights by 50% by exploring and implementing GitHub visualization techniques",
          },
          {
            section: "experience",
            original: "Communicate with managers to set up campus computers used on campus",
            updated:
              "Streamlined campus computer setup for 500+ devices by communicating with managers and implementing standardized processes",
          },
          {
            section: "experience",
            original: "Assess and troubleshoot computer problems brought by students, faculty and staff",
            updated:
              "Resolved 95% of technical issues within 24 hours by assessing and troubleshooting computer problems for students, faculty and staff",
          },
          {
            section: "experience",
            original: "Maintain upkeep of computers, classroom equipment, and 200 printers across campus",
            updated:
              "Achieved 99% uptime by maintaining computers, classroom equipment, and 200 printers across campus",
          },
        ],
      }
      return NextResponse.json({ message: aiResponse, suggestedChanges })
    }

    if (lowerMessage.includes("bold metrics") || lowerMessage.includes("bold numbers")) {
      aiResponse = "I'll bold all the metrics and numbers in your resume. Here's a preview of the changes:"
      suggestedChanges = {
        type: "bold_metrics",
        description: "Bold all numbers and metrics throughout the document",
        changes: [
          {
            section: "experience",
            original: "Maintain upkeep of computers, classroom equipment, and 200 printers across campus",
            updated: "Maintain upkeep of computers, classroom equipment, and **200** printers across campus",
          },
        ],
      }
      return NextResponse.json({ message: aiResponse, suggestedChanges })
    }

    if (lowerMessage.includes("stronger verb") || lowerMessage.includes("action verb")) {
      aiResponse = "I'll replace weak verbs with stronger action verbs. Here's what I suggest:"
      suggestedChanges = {
        type: "stronger_verbs",
        description: "Replace weak verbs with impactful action verbs",
        changes: [
          {
            section: "experience",
            original:
              "Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems",
            updated:
              "Architected a REST API using FastAPI and PostgreSQL to store data from learning management systems",
          },
          {
            section: "experience",
            original:
              "Developed a full-stack web application using Flask, React, PostgreSQL and Docker to analyze GitHub data",
            updated:
              "Engineered a full-stack web application using Flask, React, PostgreSQL and Docker to analyze GitHub data",
          },
        ],
      }
      return NextResponse.json({ message: aiResponse, suggestedChanges })
    }

    // General chat responses
    if (selectedText) {
      if (selectedText.toLowerCase().includes("experienced")) {
        aiResponse = `Here's a more impactful version: "Accomplished ${selectedText.toLowerCase().replace("experienced", "seasoned professional with proven expertise in")}"`
      } else if (selectedText.toLowerCase().includes("led") || selectedText.toLowerCase().includes("managed")) {
        aiResponse = `Try this stronger version: "${selectedText.replace(/led|managed/gi, "spearheaded and optimized")} - this shows more initiative and results."`
      } else if (selectedText.toLowerCase().includes("worked on")) {
        aiResponse = `More impactful phrasing: "${selectedText.replace(/worked on/gi, "architected and delivered")} - this demonstrates ownership and completion."`
      } else {
        aiResponse = `I can help improve "${selectedText}". Here are some suggestions:
        
1. Make it more specific with numbers or metrics
2. Use stronger action verbs
3. Focus on the impact and results

Would you like me to rewrite this section with these improvements?`
      }
    } else {
      if (message.toLowerCase().includes("help") || message.toLowerCase().includes("improve")) {
        aiResponse =
          "I'd be happy to help improve your document! Here are some ways I can assist:\n\n• Select any text for instant suggestions\n• Ask me to rewrite sections for clarity\n• Get help with formatting and structure\n• Improve word choice and tone\n\nWhat would you like to work on?"
      } else if (message.toLowerCase().includes("resume") || message.toLowerCase().includes("cv")) {
        aiResponse =
          "Great! I can help optimize your resume. Here are key areas I focus on:\n\n• Quantifying achievements with metrics\n• Using strong action verbs\n• Tailoring content for ATS systems\n• Improving readability and flow\n\nSelect any section you'd like me to review!"
      } else {
        aiResponse =
          "I'm here to help polish your document! Try selecting text for instant suggestions, or ask me about:\n\n• Improving word choice\n• Adding metrics and impact\n• Restructuring content\n• Professional formatting\n\nWhat would you like to work on?"
      }
    }

      return NextResponse.json({
        message: aiResponse,
        suggestions: selectedText
          ? ["Make it more specific", "Add quantifiable results", "Use stronger action verbs"]
          : [],
        suggestedChanges,
      })
    }

    // Azure OpenAI is configured - use real LLM
    try {
      const result = await generateResumeSuggestions(message, selectedText, documentContent)
      
      return NextResponse.json({
        message: result.message,
        suggestions: selectedText
          ? ["Make it more specific", "Add quantifiable results", "Use stronger action verbs"]
          : [],
        suggestedChanges: result.suggestedChanges,
      })
    } catch (error) {
      console.error("Azure OpenAI error:", error)
      
      // If Azure OpenAI fails, fall back to basic response
      return NextResponse.json({
        message: error instanceof Error 
          ? `I'm having trouble connecting to the AI service. ${error.message}. Please check your Azure OpenAI configuration.`
          : "I'm having trouble connecting to the AI service. Please check your Azure OpenAI configuration.",
        suggestions: [],
        suggestedChanges: null,
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to process message",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      }, 
      { status: 500 }
    )
  }
}
