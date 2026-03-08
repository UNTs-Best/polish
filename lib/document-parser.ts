// Document parser utility for PDF, DOCX, RTF, TXT, and LaTeX files
// Uses browser APIs and external libraries for parsing

export interface ParsedDocument {
  text: string
  fileName: string
  fileType: string
  formatLabel: FormatLabel
}

export type FormatLabel = "PDF" | "DOCX" | "RTF" | "TXT" | "LaTeX"

// Detect format from file
export function detectFormat(file: File): FormatLabel {
  const name = file.name.toLowerCase()
  const type = file.type

  if (name.endsWith(".pdf") || type.includes("pdf")) return "PDF"
  if (name.endsWith(".docx") || name.endsWith(".doc") || type.includes("wordprocessingml") || type.includes("msword")) return "DOCX"
  if (name.endsWith(".rtf") || type.includes("rtf")) return "RTF"
  if (name.endsWith(".tex") || name.endsWith(".latex")) return "LaTeX"
  return "TXT"
}

// Parse TXT files
async function parseTxt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error("Failed to read text file"))
    reader.readAsText(file)
  })
}

// Parse DOCX files using mammoth.js
async function parseDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth")
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

// Parse PDF files using pdfjs-dist
async function parsePdf(file: File): Promise<string> {
  // Import from the explicit build path for Next.js compatibility with pdfjs-dist v5
  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs")

  // Use the worker file copied to public/ (pdfjs-dist v5 uses .mjs workers)
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
  const pdf = await loadingTask.promise

  let fullText = ""
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()

    // Sort items by vertical position (y desc) then horizontal (x asc) to preserve reading order
    const items = textContent.items
      .filter((item: any) => item.str !== undefined)
      .sort((a: any, b: any) => {
        const yDiff = b.transform[5] - a.transform[5]
        if (Math.abs(yDiff) > 5) return yDiff
        return a.transform[4] - b.transform[4]
      })

    // Group items into lines based on y-position proximity
    let currentY = -Infinity
    const lines: string[] = []
    let currentLine = ""

    for (const item of items) {
      const y = Math.round((item as any).transform[5])
      if (Math.abs(y - currentY) > 5) {
        if (currentLine.trim()) lines.push(currentLine.trim())
        currentLine = (item as any).str
        currentY = y
      } else {
        currentLine += (currentLine.endsWith(" ") || (item as any).str.startsWith(" ") ? "" : " ") + (item as any).str
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim())

    fullText += lines.join("\n") + "\n"
  }

  return fullText.trim()
}

// Parse RTF files - extract plain text from RTF markup
async function parseRtf(file: File): Promise<string> {
  const content = await parseTxt(file)

  // Strip RTF control words and groups to extract plain text
  let text = content
    // Remove RTF header
    .replace(/^\{\\rtf\d?/, "")
    // Remove font tables, color tables, etc.
    .replace(/\{\\fonttbl[^}]*\}/g, "")
    .replace(/\{\\colortbl[^}]*\}/g, "")
    .replace(/\{\\stylesheet[^}]*\}/g, "")
    .replace(/\{\\info[^}]*\}/g, "")
    // Handle common RTF control words
    .replace(/\\par\b/g, "\n")
    .replace(/\\line\b/g, "\n")
    .replace(/\\tab\b/g, "\t")
    .replace(/\\\n/g, "\n")
    // Remove control words (e.g., \fs24, \b, \i)
    .replace(/\\[a-z]+\d*\s?/gi, "")
    // Remove escaped special characters
    .replace(/\\\{/g, "{")
    .replace(/\\\}/g, "}")
    .replace(/\\\\/g, "\\")
    // Remove remaining braces
    .replace(/[{}]/g, "")
    // Clean up whitespace
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return text
}

// Parse LaTeX files - extract text content from LaTeX markup
async function parseLatex(file: File): Promise<string> {
  const content = await parseTxt(file)

  let text = content
    // Remove comments
    .replace(/%.*$/gm, "")
    // Remove document class and usepackage
    .replace(/\\documentclass(\[.*?\])?\{.*?\}/g, "")
    .replace(/\\usepackage(\[.*?\])?\{.*?\}/g, "")
    // Remove begin/end document
    .replace(/\\begin\{document\}/g, "")
    .replace(/\\end\{document\}/g, "")
    // Convert sections to plain text headers
    .replace(/\\section\*?\{([^}]*)\}/g, "\n$1\n")
    .replace(/\\subsection\*?\{([^}]*)\}/g, "\n$1\n")
    // Convert textbf, textit, etc.
    .replace(/\\textbf\{([^}]*)\}/g, "$1")
    .replace(/\\textit\{([^}]*)\}/g, "$1")
    .replace(/\\emph\{([^}]*)\}/g, "$1")
    .replace(/\\underline\{([^}]*)\}/g, "$1")
    // Convert href
    .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, "$1")
    // Convert itemize/enumerate items
    .replace(/\\item\s*/g, "• ")
    // Remove begin/end environments
    .replace(/\\begin\{[^}]*\}/g, "")
    .replace(/\\end\{[^}]*\}/g, "")
    // Remove remaining commands
    .replace(/\\[a-zA-Z]+\*?(\{[^}]*\})?/g, "")
    // Clean special chars
    .replace(/~/g, " ")
    .replace(/\\\\/g, "\n")
    .replace(/\\&/g, "&")
    .replace(/\\%/g, "%")
    .replace(/\\\$/g, "$")
    // Clean whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return text
}

// Main parser function
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const fileName = file.name
  const formatLabel = detectFormat(file)

  let text = ""

  try {
    switch (formatLabel) {
      case "PDF":
        text = await parsePdf(file)
        break
      case "DOCX":
        text = await parseDocx(file)
        break
      case "RTF":
        text = await parseRtf(file)
        break
      case "LaTeX":
        text = await parseLatex(file)
        break
      case "TXT":
      default:
        text = await parseTxt(file)
        break
    }
  } catch (error: any) {
    console.error("[parser] Error parsing document:", error?.message || error, error?.stack)
    throw new Error(`Failed to parse ${fileName}: ${error?.message || "Unknown error"}`)
  }

  return {
    text,
    fileName,
    fileType: file.type || fileName.split(".").pop()?.toLowerCase() || "",
    formatLabel,
  }
}

// Date pattern for extracting periods from lines
const DATE_PATTERN =
  /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|(?:Spring|Summer|Fall|Winter)\s*\d{4}|\d{1,2}\/\d{4}|\d{4})\s*(?:[-–—]+\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|Present|Current|Now|(?:Spring|Summer|Fall|Winter)\s*\d{4}|\d{1,2}\/\d{4}|\d{4}))?/i

// Location pattern (City, ST or City, State)
const LOCATION_PATTERN = /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})\b/

function isBulletLine(line: string): boolean {
  return /^[•\-*▪▸►◦‣⁃]\s*/.test(line) || /^\d+[.)]\s/.test(line)
}

function stripBullet(line: string): string {
  return line.replace(/^[•\-*▪▸►◦‣⁃]\s*/, "").replace(/^\d+[.)]\s*/, "")
}

function extractDateFromLine(line: string): { period: string; remainder: string } {
  const match = line.match(DATE_PATTERN)
  if (match) {
    const period = match[0].trim()
    const remainder = line.replace(match[0], "").replace(/\s*[|,]\s*$/, "").replace(/^\s*[|,]\s*/, "").trim()
    return { period, remainder }
  }
  return { period: "", remainder: line }
}

function extractLocationFromLine(line: string): { location: string; remainder: string } {
  const match = line.match(LOCATION_PATTERN)
  if (match) {
    const location = match[1].trim()
    const remainder = line.replace(match[0], "").replace(/\s*[|,]\s*$/, "").replace(/^\s*[|,]\s*/, "").trim()
    return { location, remainder }
  }
  return { location: "", remainder: line }
}

// Detect if a line looks like a new entry header (not a bullet, has a date or location, or is a title-like line)
function isEntryHeader(line: string): boolean {
  if (isBulletLine(line)) return false
  // Contains a date pattern — strong signal
  if (DATE_PATTERN.test(line)) return true
  // Contains " at " or " - " separating role/company — strong signal
  if (/\s+at\s+/i.test(line) || /\s+[-–—]\s+/.test(line)) return true
  // Contains a pipe separator with location-like content
  if (/\|/.test(line) && LOCATION_PATTERN.test(line)) return true
  return false
}

// Convert raw text to structured document content
export function parseResumeText(text: string): any {
  const lines = text.split("\n").filter((line) => line.trim())

  const name = lines[0]?.trim() || "Your Name"

  // Look for contact info in the first few lines (email, phone, LinkedIn, etc.)
  const contactLines: string[] = []
  for (let i = 1; i < Math.min(lines.length, 5); i++) {
    const line = lines[i]?.trim() || ""
    const hasEmail = line.includes("@")
    const hasPhone = /\d{3}[-.\s()]*\d{3}[-.\s]*\d{4}/.test(line)
    const hasLink = /linkedin|github|portfolio|http/i.test(line)
    if (hasEmail || hasPhone || hasLink) {
      contactLines.push(line)
    }
  }
  const contact = contactLines.join(" | ")

  const sections: Record<string, string[]> = {}
  let currentSection = "header"

  const sectionKeywords = [
    "education",
    "experience",
    "work experience",
    "professional experience",
    "employment",
    "projects",
    "personal projects",
    "skills",
    "technical skills",
    "core competencies",
    "certifications",
    "leadership",
    "leadership & activities",
    "activities",
    "extracurricular",
    "volunteer",
    "summary",
    "professional summary",
    "objective",
    "awards",
    "honors",
    "publications",
  ]

  for (const line of lines.slice(1)) {
    const lowerLine = line.toLowerCase().trim()
    // Skip contact lines already captured
    if (contactLines.includes(line.trim())) continue

    const matchedSection = sectionKeywords.find(
      (kw) => lowerLine === kw || lowerLine === kw + ":" || lowerLine.replace(/[:\s]+$/, "") === kw
    )

    if (matchedSection) {
      // Normalize to base section name
      const normalized = matchedSection
        .replace("work ", "")
        .replace("professional ", "")
        .replace("personal ", "")
        .replace("core ", "")
        .replace("technical ", "")
        .replace(" & activities", "")
      currentSection = normalized === "competencies" ? "skills" : normalized
      sections[currentSection] = []
    } else if (line.trim()) {
      if (!sections[currentSection]) {
        sections[currentSection] = []
      }
      sections[currentSection].push(line.trim())
    }
  }

  // Build education array — group lines into entries using date/location detection
  const education: Array<{ school: string; degree: string; location: string; period: string }> = []
  if (sections.education?.length) {
    let currentEdu: { school: string; degree: string; location: string; period: string } | null = null

    for (const line of sections.education) {
      if (isBulletLine(line)) {
        // Skip bullet lines in education (e.g., coursework, GPA details) — append to degree
        if (currentEdu) {
          currentEdu.degree += currentEdu.degree ? "; " + stripBullet(line) : stripBullet(line)
        }
        continue
      }

      const { period, remainder: afterDate } = extractDateFromLine(line)
      const { location, remainder: afterLocation } = extractLocationFromLine(afterDate)

      if (period || location) {
        // This line has metadata — decide if it's a new entry or sub-line
        if (!currentEdu || (period && currentEdu.period && currentEdu.degree)) {
          // New education entry
          if (currentEdu) education.push(currentEdu)
          currentEdu = { school: afterLocation || afterDate, degree: "", location, period }
        } else {
          // Sub-line (degree line with date/location)
          if (!currentEdu.period) currentEdu.period = period
          if (!currentEdu.location) currentEdu.location = location
          if (afterLocation) currentEdu.degree = afterLocation
        }
      } else if (!currentEdu) {
        // First line without metadata — treat as school name
        currentEdu = { school: line, degree: "", location: "", period: "" }
      } else if (!currentEdu.degree) {
        currentEdu.degree = line
      } else {
        // Additional line — likely a new entry
        education.push(currentEdu)
        currentEdu = { school: line, degree: "", location: "", period: "" }
      }
    }
    if (currentEdu) education.push(currentEdu)
  }

  // Build experience array — use smarter entry detection
  const experience: Array<{ role: string; company: string; location: string; period: string; bullets: string[] }> = []
  const expSection = sections.experience || sections["work experience"] || sections.employment || []
  if (expSection.length) {
    let currentExp: { role: string; company: string; location: string; period: string; bullets: string[] } | null = null

    for (const line of expSection) {
      if (isBulletLine(line)) {
        if (currentExp) {
          currentExp.bullets.push(stripBullet(line))
        }
      } else if (isEntryHeader(line)) {
        if (currentExp) experience.push(currentExp)

        const { period, remainder: afterDate } = extractDateFromLine(line)
        const { location, remainder: afterLocation } = extractLocationFromLine(afterDate)

        // Try to split role and company
        let role = afterLocation
        let company = ""
        const separators = [/ at /i, /\s*[|]\s*/, /\s*[-–—]\s+/]
        for (const sep of separators) {
          const parts = role.split(sep)
          if (parts.length >= 2) {
            role = parts[0].trim()
            company = parts.slice(1).join(" ").trim()
            break
          }
        }

        currentExp = { role, company, location, period, bullets: [] }
      } else if (currentExp && !currentExp.company && currentExp.bullets.length === 0) {
        // Second non-bullet line after header — likely company/subtitle
        const { location, remainder } = extractLocationFromLine(line)
        const { period, remainder: afterDate } = extractDateFromLine(remainder)
        if (!currentExp.location && location) currentExp.location = location
        if (!currentExp.period && period) currentExp.period = period
        currentExp.company = afterDate || remainder
      } else if (currentExp) {
        // Non-bullet, non-header line — treat as a bullet without marker
        currentExp.bullets.push(line)
      } else {
        // First line with no date — start an entry anyway
        currentExp = { role: line, company: "", location: "", period: "", bullets: [] }
      }
    }
    if (currentExp) experience.push(currentExp)
  }

  // Build projects array
  const projects: Array<{ name: string; tech: string; period: string; bullets: string[] }> = []
  if (sections.projects?.length) {
    let currentProject: { name: string; tech: string; period: string; bullets: string[] } | null = null

    for (const line of sections.projects) {
      if (isBulletLine(line)) {
        if (currentProject) {
          currentProject.bullets.push(stripBullet(line))
        }
      } else if (isEntryHeader(line) || (!currentProject && !isBulletLine(line))) {
        if (currentProject) projects.push(currentProject)

        const { period, remainder: afterDate } = extractDateFromLine(line)
        let name = afterDate
        let tech = ""

        // Try to extract tech stack after pipe separator
        const pipeIdx = name.indexOf("|")
        if (pipeIdx > 0) {
          tech = name.slice(pipeIdx + 1).trim()
          name = name.slice(0, pipeIdx).trim()
        }

        currentProject = { name, tech, period, bullets: [] }
      } else if (currentProject) {
        currentProject.bullets.push(line)
      }
    }
    if (currentProject) projects.push(currentProject)
  }

  // Extract skills
  const skillsSection = sections.skills || sections["technical skills"] || []
  const skills = skillsSection.join(" | ")

  // Build leadership/activities array
  const leadership: Array<{ role: string; organization: string; location: string; period: string; bullets: string[] }> = []
  const leadershipSection = sections.leadership || sections.activities || sections.extracurricular || sections.volunteer || []
  if (leadershipSection.length) {
    let currentItem: { role: string; organization: string; location: string; period: string; bullets: string[] } | null = null

    for (const line of leadershipSection) {
      if (isBulletLine(line)) {
        if (currentItem) {
          currentItem.bullets.push(stripBullet(line))
        }
      } else if (isEntryHeader(line) || !currentItem) {
        if (currentItem) leadership.push(currentItem)

        const { period, remainder: afterDate } = extractDateFromLine(line)
        const { location, remainder: afterLocation } = extractLocationFromLine(afterDate)

        let role = afterLocation
        let organization = ""
        const separators = [/ at /i, /\s*[|]\s*/, /\s*[-–—]\s+/]
        for (const sep of separators) {
          const parts = role.split(sep)
          if (parts.length >= 2) {
            role = parts[0].trim()
            organization = parts.slice(1).join(" ").trim()
            break
          }
        }

        currentItem = { role, organization, location, period, bullets: [] }
      } else if (currentItem && !currentItem.organization && currentItem.bullets.length === 0) {
        const { location, remainder } = extractLocationFromLine(line)
        if (!currentItem.location && location) currentItem.location = location
        currentItem.organization = remainder
      } else if (currentItem) {
        currentItem.bullets.push(line)
      }
    }
    if (currentItem) leadership.push(currentItem)
  }

  return {
    name,
    title: "",
    contact,
    education: education.length ? education : [{ school: "", degree: "", location: "", period: "" }],
    experience: experience.length ? experience : [],
    projects: projects.length ? projects : [],
    leadership: leadership.length ? leadership : [],
    skills,
  }
}
