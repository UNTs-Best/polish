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

// Convert raw text to structured document content
export function parseResumeText(text: string): any {
  const lines = text.split("\n").filter((line) => line.trim())

  const name = lines[0]?.trim() || "Your Name"

  const contactLine = lines.find((line) => line.includes("@") || line.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/))
  const contact = contactLine?.trim() || ""

  const sections: Record<string, string[]> = {}
  let currentSection = "header"

  const sectionKeywords = [
    "education",
    "experience",
    "work experience",
    "employment",
    "projects",
    "skills",
    "technical skills",
    "certifications",
    "leadership",
    "activities",
    "summary",
    "objective",
    "awards",
  ]

  for (const line of lines.slice(1)) {
    const lowerLine = line.toLowerCase().trim()
    const matchedSection = sectionKeywords.find((kw) => lowerLine === kw || lowerLine.startsWith(kw + " "))

    if (matchedSection) {
      currentSection = matchedSection
      sections[currentSection] = []
    } else if (line.trim()) {
      if (!sections[currentSection]) {
        sections[currentSection] = []
      }
      sections[currentSection].push(line.trim())
    }
  }

  // Build education array
  const education = []
  if (sections.education?.length) {
    for (let i = 0; i < sections.education.length; i += 2) {
      education.push({
        school: sections.education[i] || "",
        degree: sections.education[i + 1] || "",
        location: "",
        period: "",
      })
    }
  }

  // Build experience array
  const experience = []
  const expSection = sections.experience || sections["work experience"] || sections.employment || []
  if (expSection.length) {
    let currentExp: any = null
    for (const line of expSection) {
      if (line.includes(" at ") || line.includes(" - ") || line.match(/^[A-Z]/)) {
        if (currentExp) {
          experience.push(currentExp)
        }
        currentExp = {
          role: line,
          company: "",
          location: "",
          period: "",
          bullets: [],
        }
      } else if (currentExp && (line.startsWith("•") || line.startsWith("-") || line.startsWith("*"))) {
        currentExp.bullets.push(line.replace(/^[•\-*]\s*/, ""))
      } else if (currentExp) {
        currentExp.bullets.push(line)
      }
    }
    if (currentExp) {
      experience.push(currentExp)
    }
  }

  // Build projects array
  const projects = []
  if (sections.projects?.length) {
    let currentProject: any = null
    for (const line of sections.projects) {
      if (!line.startsWith("•") && !line.startsWith("-") && !line.startsWith("*")) {
        if (currentProject) {
          projects.push(currentProject)
        }
        currentProject = {
          name: line,
          tech: "",
          period: "",
          bullets: [],
        }
      } else if (currentProject) {
        currentProject.bullets.push(line.replace(/^[•\-*]\s*/, ""))
      }
    }
    if (currentProject) {
      projects.push(currentProject)
    }
  }

  // Extract skills
  const skillsSection = sections.skills || sections["technical skills"] || []
  const skills = skillsSection.join(" | ")

  // Build leadership/activities array
  const leadership = []
  const leadershipSection = sections.leadership || sections.activities || []
  if (leadershipSection.length) {
    let currentItem: any = null
    for (const line of leadershipSection) {
      if (!line.startsWith("•") && !line.startsWith("-") && !line.startsWith("*")) {
        if (currentItem) {
          leadership.push(currentItem)
        }
        currentItem = {
          role: line,
          organization: "",
          location: "",
          period: "",
          bullets: [],
        }
      } else if (currentItem) {
        currentItem.bullets.push(line.replace(/^[•\-*]\s*/, ""))
      }
    }
    if (currentItem) {
      leadership.push(currentItem)
    }
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
