// MCP Resume Tools - Anthropic-compatible tool definitions + execution handlers
// These tools give Claude structured access to read and edit resume content

export interface DocumentContent {
  name: string
  title: string
  contact: string
  education: Array<{
    school: string
    degree: string
    location: string
    period: string
  }>
  experience: Array<{
    role: string
    company: string
    location: string
    period: string
    bullets: string[]
  }>
  projects: Array<{
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
  skills: string
}

type SectionName = "education" | "experience" | "projects" | "leadership"

// Tool definitions for Claude's tool_use API
export const resumeTools = [
  {
    name: "read_resume" as const,
    description:
      "Returns the full resume content as structured JSON. Use this to understand the complete resume before making suggestions.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [] as string[],
    },
  },
  {
    name: "read_section" as const,
    description:
      "Reads a specific section of the resume. Sections: 'header' (name/title/contact), 'education', 'experience', 'projects', 'leadership', 'skills'.",
    input_schema: {
      type: "object" as const,
      properties: {
        section: {
          type: "string",
          enum: ["header", "education", "experience", "projects", "leadership", "skills"],
          description: "The section to read",
        },
      },
      required: ["section"],
    },
  },
  {
    name: "edit_section_field" as const,
    description:
      "Edits a specific field in a section entry. For example, change a job title, company name, school name, or period. For header fields use section='header' with field='name', 'title', or 'contact'. For skills use section='skills' with field='skills'.",
    input_schema: {
      type: "object" as const,
      properties: {
        section: {
          type: "string",
          enum: ["header", "education", "experience", "projects", "leadership", "skills"],
          description: "The section containing the field",
        },
        index: {
          type: "number",
          description: "The index of the entry within the section (0-based). Not needed for header or skills.",
        },
        field: {
          type: "string",
          description:
            "The field name to edit. Header: 'name', 'title', 'contact'. Education: 'school', 'degree', 'location', 'period'. Experience: 'role', 'company', 'location', 'period'. Projects: 'name', 'tech', 'period'. Leadership: 'role', 'organization', 'location', 'period'. Skills: 'skills'.",
        },
        new_value: {
          type: "string",
          description: "The new value for the field",
        },
      },
      required: ["section", "field", "new_value"],
    },
  },
  {
    name: "edit_bullet" as const,
    description:
      "Edits a specific bullet point in an experience, projects, or leadership section entry. Returns the original and updated text for diff display.",
    input_schema: {
      type: "object" as const,
      properties: {
        section: {
          type: "string",
          enum: ["experience", "projects", "leadership"],
          description: "The section containing the bullet",
        },
        entry_index: {
          type: "number",
          description: "The index of the entry within the section (0-based)",
        },
        bullet_index: {
          type: "number",
          description: "The index of the bullet within the entry (0-based)",
        },
        new_text: {
          type: "string",
          description: "The improved bullet text",
        },
      },
      required: ["section", "entry_index", "bullet_index", "new_text"],
    },
  },
  {
    name: "add_bullet" as const,
    description: "Adds a new bullet point to an experience, projects, or leadership section entry.",
    input_schema: {
      type: "object" as const,
      properties: {
        section: {
          type: "string",
          enum: ["experience", "projects", "leadership"],
          description: "The section to add the bullet to",
        },
        entry_index: {
          type: "number",
          description: "The index of the entry within the section (0-based)",
        },
        text: {
          type: "string",
          description: "The bullet point text to add",
        },
      },
      required: ["section", "entry_index", "text"],
    },
  },
  {
    name: "search_resume" as const,
    description:
      "Searches all resume content for a text pattern (case-insensitive). Returns matching sections, fields, and text.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query (case-insensitive substring match)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_resume_stats" as const,
    description:
      "Returns resume statistics: section counts, total bullet points, word count, and completeness assessment.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [] as string[],
    },
  },
]

// Tool execution handlers
export function executeResumeTool(
  toolName: string,
  params: Record<string, unknown>,
  documentContent: DocumentContent,
): { result: unknown; changes?: Array<{ section: string; original: string; updated: string }> } {
  switch (toolName) {
    case "read_resume":
      return { result: documentContent }

    case "read_section":
      return executeReadSection(params as { section: string }, documentContent)

    case "edit_section_field":
      return executeEditSectionField(
        params as { section: string; index?: number; field: string; new_value: string },
        documentContent,
      )

    case "edit_bullet":
      return executeEditBullet(
        params as { section: string; entry_index: number; bullet_index: number; new_text: string },
        documentContent,
      )

    case "add_bullet":
      return executeAddBullet(params as { section: string; entry_index: number; text: string }, documentContent)

    case "search_resume":
      return executeSearchResume(params as { query: string }, documentContent)

    case "get_resume_stats":
      return executeGetResumeStats(documentContent)

    default:
      return { result: { error: `Unknown tool: ${toolName}` } }
  }
}

function executeReadSection(
  params: { section: string },
  doc: DocumentContent,
): { result: unknown } {
  switch (params.section) {
    case "header":
      return { result: { name: doc.name, title: doc.title, contact: doc.contact } }
    case "education":
      return { result: doc.education }
    case "experience":
      return { result: doc.experience }
    case "projects":
      return { result: doc.projects }
    case "leadership":
      return { result: doc.leadership || [] }
    case "skills":
      return { result: { skills: doc.skills } }
    default:
      return { result: { error: `Unknown section: ${params.section}` } }
  }
}

function executeEditSectionField(
  params: { section: string; index?: number; field: string; new_value: string },
  doc: DocumentContent,
): { result: unknown; changes?: Array<{ section: string; original: string; updated: string }> } {
  const changes: Array<{ section: string; original: string; updated: string }> = []

  if (params.section === "header") {
    const field = params.field as "name" | "title" | "contact"
    if (field in doc) {
      const original = doc[field]
      changes.push({ section: "header", original, updated: params.new_value })
      return { result: { success: true, field: params.field, original, updated: params.new_value }, changes }
    }
    return { result: { error: `Unknown header field: ${params.field}` } }
  }

  if (params.section === "skills") {
    const original = doc.skills
    changes.push({ section: "skills", original, updated: params.new_value })
    return { result: { success: true, field: "skills", original, updated: params.new_value }, changes }
  }

  const sectionName = params.section as SectionName
  const sectionData = doc[sectionName]
  if (!sectionData || !Array.isArray(sectionData)) {
    return { result: { error: `Section ${params.section} not found or empty` } }
  }

  const index = params.index ?? 0
  if (index < 0 || index >= sectionData.length) {
    return { result: { error: `Index ${index} out of range for ${params.section} (length: ${sectionData.length})` } }
  }

  const entry = sectionData[index] as Record<string, unknown>
  if (!(params.field in entry)) {
    return { result: { error: `Field '${params.field}' not found in ${params.section}[${index}]` } }
  }

  const original = String(entry[params.field])
  changes.push({ section: params.section, original, updated: params.new_value })
  return { result: { success: true, section: params.section, index, field: params.field, original, updated: params.new_value }, changes }
}

function executeEditBullet(
  params: { section: string; entry_index: number; bullet_index: number; new_text: string },
  doc: DocumentContent,
): { result: unknown; changes?: Array<{ section: string; original: string; updated: string }> } {
  const sectionName = params.section as SectionName
  const sectionData = doc[sectionName]

  if (!sectionData || !Array.isArray(sectionData)) {
    return { result: { error: `Section ${params.section} not found` } }
  }

  if (params.entry_index < 0 || params.entry_index >= sectionData.length) {
    return { result: { error: `Entry index ${params.entry_index} out of range` } }
  }

  const entry = sectionData[params.entry_index] as { bullets?: string[] }
  if (!entry.bullets || params.bullet_index < 0 || params.bullet_index >= entry.bullets.length) {
    return { result: { error: `Bullet index ${params.bullet_index} out of range` } }
  }

  const original = entry.bullets[params.bullet_index]
  const changes = [{ section: params.section, original, updated: params.new_text }]

  return {
    result: { success: true, section: params.section, entry_index: params.entry_index, bullet_index: params.bullet_index, original, updated: params.new_text },
    changes,
  }
}

function executeAddBullet(
  params: { section: string; entry_index: number; text: string },
  doc: DocumentContent,
): { result: unknown; changes?: Array<{ section: string; original: string; updated: string }> } {
  const sectionName = params.section as SectionName
  const sectionData = doc[sectionName]

  if (!sectionData || !Array.isArray(sectionData)) {
    return { result: { error: `Section ${params.section} not found` } }
  }

  if (params.entry_index < 0 || params.entry_index >= sectionData.length) {
    return { result: { error: `Entry index ${params.entry_index} out of range` } }
  }

  const changes = [{ section: params.section, original: "", updated: params.text }]
  return {
    result: { success: true, section: params.section, entry_index: params.entry_index, added: params.text },
    changes,
  }
}

function executeSearchResume(
  params: { query: string },
  doc: DocumentContent,
): { result: unknown } {
  const query = params.query.toLowerCase()
  const matches: Array<{ location: string; text: string }> = []

  // Search header
  if (doc.name.toLowerCase().includes(query)) matches.push({ location: "header.name", text: doc.name })
  if (doc.title.toLowerCase().includes(query)) matches.push({ location: "header.title", text: doc.title })
  if (doc.contact.toLowerCase().includes(query)) matches.push({ location: "header.contact", text: doc.contact })

  // Search education
  doc.education.forEach((edu, i) => {
    Object.entries(edu).forEach(([field, value]) => {
      if (String(value).toLowerCase().includes(query)) {
        matches.push({ location: `education[${i}].${field}`, text: String(value) })
      }
    })
  })

  // Search experience
  doc.experience.forEach((exp, i) => {
    Object.entries(exp).forEach(([field, value]) => {
      if (field === "bullets" && Array.isArray(value)) {
        value.forEach((bullet: string, j: number) => {
          if (bullet.toLowerCase().includes(query)) {
            matches.push({ location: `experience[${i}].bullets[${j}]`, text: bullet })
          }
        })
      } else if (String(value).toLowerCase().includes(query)) {
        matches.push({ location: `experience[${i}].${field}`, text: String(value) })
      }
    })
  })

  // Search projects
  doc.projects.forEach((proj, i) => {
    Object.entries(proj).forEach(([field, value]) => {
      if (field === "bullets" && Array.isArray(value)) {
        value.forEach((bullet: string, j: number) => {
          if (bullet.toLowerCase().includes(query)) {
            matches.push({ location: `projects[${i}].bullets[${j}]`, text: bullet })
          }
        })
      } else if (String(value).toLowerCase().includes(query)) {
        matches.push({ location: `projects[${i}].${field}`, text: String(value) })
      }
    })
  })

  // Search leadership
  if (doc.leadership) {
    doc.leadership.forEach((lead, i) => {
      Object.entries(lead).forEach(([field, value]) => {
        if (field === "bullets" && Array.isArray(value)) {
          value.forEach((bullet: string, j: number) => {
            if (bullet.toLowerCase().includes(query)) {
              matches.push({ location: `leadership[${i}].bullets[${j}]`, text: bullet })
            }
          })
        } else if (String(value).toLowerCase().includes(query)) {
          matches.push({ location: `leadership[${i}].${field}`, text: String(value) })
        }
      })
    })
  }

  // Search skills
  if (doc.skills.toLowerCase().includes(query)) {
    matches.push({ location: "skills", text: doc.skills })
  }

  return { result: { query: params.query, matchCount: matches.length, matches } }
}

function executeGetResumeStats(doc: DocumentContent): { result: unknown } {
  const bulletCount =
    doc.experience.reduce((sum, exp) => sum + exp.bullets.length, 0) +
    doc.projects.reduce((sum, proj) => sum + proj.bullets.length, 0) +
    (doc.leadership?.reduce((sum, lead) => sum + lead.bullets.length, 0) || 0)

  const allText = [
    doc.name,
    doc.title,
    doc.contact,
    ...doc.education.map((e) => `${e.school} ${e.degree} ${e.location} ${e.period}`),
    ...doc.experience.flatMap((e) => [e.role, e.company, e.location, e.period, ...e.bullets]),
    ...doc.projects.flatMap((p) => [p.name, p.tech, p.period, ...p.bullets]),
    ...(doc.leadership?.flatMap((l) => [l.role, l.organization, l.location, l.period, ...l.bullets]) || []),
    doc.skills,
  ].join(" ")

  const wordCount = allText.split(/\s+/).filter(Boolean).length

  const completeness = {
    hasName: !!doc.name,
    hasTitle: !!doc.title,
    hasContact: !!doc.contact,
    hasEducation: doc.education.length > 0,
    hasExperience: doc.experience.length > 0,
    hasProjects: doc.projects.length > 0,
    hasLeadership: (doc.leadership?.length || 0) > 0,
    hasSkills: !!doc.skills,
  }

  const filledSections = Object.values(completeness).filter(Boolean).length
  const totalSections = Object.keys(completeness).length
  const completenessPercent = Math.round((filledSections / totalSections) * 100)

  return {
    result: {
      sections: {
        education: doc.education.length,
        experience: doc.experience.length,
        projects: doc.projects.length,
        leadership: doc.leadership?.length || 0,
      },
      totalBulletPoints: bulletCount,
      wordCount,
      completeness,
      completenessPercent,
    },
  }
}
