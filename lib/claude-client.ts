import Anthropic from "@anthropic-ai/sdk"

export function createClaudeClient(apiKey: string) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

export interface DocumentContent {
  name?: string
  title?: string
  contact?: string
  education?: Array<{
    school: string
    degree: string
    location: string
    period: string
  }>
  experience?: Array<{
    role: string
    company: string
    location: string
    period: string
    bullets: string[]
  }>
  projects?: Array<{
    name: string
    tech: string
    period: string
    bullets: string[]
  }>
  leadership?: Array<{
    role: string
    organization: string
    location: string
    period: string
    bullets: string[]
  }>
  skills?: string
}

function isResumeBlank(doc?: DocumentContent): boolean {
  if (!doc) return true
  const hasName = !!doc.name?.trim()
  const hasExperience = doc.experience?.some(e => e.role?.trim() || e.company?.trim() || e.bullets?.some(b => b.trim())) ?? false
  const hasEducation = doc.education?.some(e => e.school?.trim() || e.degree?.trim()) ?? false
  const hasSkills = !!doc.skills?.trim()
  return !hasName && !hasExperience && !hasEducation && !hasSkills
}

function serializeDocumentContent(doc: DocumentContent): string {
  const parts: string[] = []

  if (doc.name) parts.push(`Name: ${doc.name}`)
  if (doc.title) parts.push(`Title: ${doc.title}`)
  if (doc.contact) parts.push(`Contact: ${doc.contact}`)

  if (doc.education?.length) {
    parts.push("\n--- EDUCATION ---")
    for (const edu of doc.education) {
      if (edu.school || edu.degree) {
        parts.push(`${edu.school}${edu.degree ? ` | ${edu.degree}` : ""}${edu.location ? ` | ${edu.location}` : ""}${edu.period ? ` | ${edu.period}` : ""}`)
      }
    }
  }

  if (doc.experience?.length) {
    parts.push("\n--- EXPERIENCE ---")
    for (const exp of doc.experience) {
      if (exp.role || exp.company) {
        parts.push(`${exp.role}${exp.company ? ` at ${exp.company}` : ""}${exp.location ? ` | ${exp.location}` : ""}${exp.period ? ` | ${exp.period}` : ""}`)
        for (const bullet of exp.bullets) {
          if (bullet.trim()) parts.push(`  • ${bullet}`)
        }
      }
    }
  }

  if (doc.projects?.length) {
    parts.push("\n--- PROJECTS ---")
    for (const proj of doc.projects) {
      if (proj.name) {
        parts.push(`${proj.name}${proj.tech ? ` (${proj.tech})` : ""}${proj.period ? ` | ${proj.period}` : ""}`)
        for (const bullet of proj.bullets) {
          if (bullet.trim()) parts.push(`  • ${bullet}`)
        }
      }
    }
  }

  if (doc.leadership?.length) {
    parts.push("\n--- LEADERSHIP ---")
    for (const lead of doc.leadership) {
      if (lead.role || lead.organization) {
        parts.push(`${lead.role}${lead.organization ? ` at ${lead.organization}` : ""}${lead.location ? ` | ${lead.location}` : ""}${lead.period ? ` | ${lead.period}` : ""}`)
        for (const bullet of lead.bullets) {
          if (bullet.trim()) parts.push(`  • ${bullet}`)
        }
      }
    }
  }

  if (doc.skills) {
    parts.push("\n--- SKILLS ---")
    parts.push(doc.skills)
  }

  return parts.join("\n")
}

export async function chatWithTools(
  client: Anthropic,
  message: string,
  selectedText?: string,
  documentContent?: DocumentContent
) {
  const resumeIsBlank = isResumeBlank(documentContent)
  const serialized = documentContent && !resumeIsBlank ? serializeDocumentContent(documentContent) : ""

  const systemPrompt = resumeIsBlank
    ? `You are an expert resume editor built into a resume builder app called Polish.

The user has a BLANK resume — they are starting from scratch.

Your job is to help them build a professional, ATS-optimized resume as quickly as possible.

APPROACH:
- Encourage the user to tell you EVERYTHING at once: name, target role, work experience, education, skills, contact info.
- They can paste content from an existing resume, their LinkedIn summary, or just describe their background in plain text.
- Do NOT ask one question at a time. If the user gives you partial info, generate a resume with what you have and ask what's missing.
- As soon as you have enough information (at minimum: name and some experience or skills), generate the COMPLETE resume.

When you have information to build the resume, you MUST return a full_resume JSON block:

\`\`\`suggestion
{
  "type": "full_resume",
  "description": "Brief description",
  "resume": {
    "name": "Full Name",
    "title": "Target Role",
    "contact": "email@example.com | (555) 123-4567 | linkedin.com/in/name | City, ST",
    "education": [
      { "school": "University Name", "degree": "B.S. Computer Science", "location": "City, ST", "period": "2016 - 2020" }
    ],
    "experience": [
      {
        "role": "Job Title",
        "company": "Company Name",
        "location": "City, ST",
        "period": "Start - End",
        "bullets": [
          "Led development of feature X, resulting in 30% improvement in Y",
          "Designed and implemented Z serving 100K+ daily users"
        ]
      }
    ],
    "projects": [],
    "skills": "Skill1, Skill2, Skill3"
  }
}
\`\`\`

RESUME WRITING RULES:
- Every bullet MUST start with a strong action verb (Led, Developed, Designed, Implemented, Built, Optimized, etc.)
- Include quantifiable metrics wherever possible (%, $, numbers, users)
- Keep bullets concise: 1-2 lines each, max 4 bullets per role
- Use industry-standard keywords for ATS optimization
- Order experience by date, most recent first
- Skills should be comma-separated
- Contact fields separated by " | "
- If the user provides weak or vague bullets, rewrite them to be impactful and specific
- Fill in reasonable structure even if details are sparse — the user can edit afterward`
    : `You are an expert resume editor built into a resume builder app called Polish.

Current resume content:
${serialized}
${selectedText ? `\nThe user has selected this text: "${selectedText}"` : ""}

Your job is to DIRECTLY IMPROVE the resume content. Do NOT give advice or tips — instead, make the actual changes.

IMPORTANT: Choose the right output format based on the request:

## For COMPLETE reformats/overhauls (user asks to reformat, improve everything, polish the whole resume):
Return a full_resume block with the ENTIRE resume rewritten:

\`\`\`suggestion
{
  "type": "full_resume",
  "description": "Brief description",
  "resume": {
    "name": "...",
    "title": "...",
    "contact": "...",
    "education": [{ "school": "...", "degree": "...", "location": "...", "period": "..." }],
    "experience": [{ "role": "...", "company": "...", "location": "...", "period": "...", "bullets": ["..."] }],
    "projects": [{ "name": "...", "tech": "...", "period": "...", "bullets": ["..."] }],
    "skills": "..."
  }
}
\`\`\`

## For TARGETED improvements (specific sections, selected text, individual fixes):
Return change entries:

\`\`\`suggestion
{
  "type": "improvement_type",
  "description": "Brief description of changes",
  "changes": [
    {
      "section": "experience",
      "original": "exact text from the resume",
      "updated": "improved version of that text"
    }
  ]
}
\`\`\`

CRITICAL RULES:
1. ALWAYS return a suggestion JSON block — never just give advice
2. For change entries, the "original" field MUST exactly match text in the resume
3. Every bullet should start with a strong action verb and include measurable impact
4. For ATS optimization: use standard section headers, strong action verbs, quantified achievements, and industry keywords
5. NEVER include bullet point symbols (•, -, *) at the start of "original" or "updated" values
6. When the user asks to "reformat", "improve everything", "polish", or "make it better" — use full_resume format
7. When improving bullets, make each one start with a strong action verb and include metrics where possible`

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
  })

  const content = response.content[0]
  const text = content.type === "text" ? content.text : ""

  // Parse the suggestion JSON block
  const suggestionMatch = text.match(/```suggestion\n([\s\S]*?)```/)
  let suggestedChanges = undefined

  if (suggestionMatch) {
    try {
      suggestedChanges = JSON.parse(suggestionMatch[1].trim())
    } catch (e) {
      console.error("Failed to parse suggestion JSON:", e)
    }
  }

  // Remove the raw suggestion block from the displayed message
  const cleanMessage = text.replace(/```suggestion\n[\s\S]*?```/, "").trim()

  return {
    message: cleanMessage,
    suggestedChanges,
    usage: response.usage,
  }
}

export async function verifyApiKey(apiKey: string): Promise<boolean> {
  try {
    const client = createClaudeClient(apiKey)
    await client.messages.create({
      model: "claude-haiku-4-20250414",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hi" }],
    })
    return true
  } catch {
    return false
  }
}
