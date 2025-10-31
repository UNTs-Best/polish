import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, selectedText, conversationContext } = await request.json()

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
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}
