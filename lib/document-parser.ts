// Document parser utility for PDF, DOCX, and TXT files
// Uses browser APIs and external libraries for parsing

export interface ParsedDocument {
  text: string
  fileName: string
  fileType: string
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

// Parse PDF files using pdf-parse
async function parsePdf(file: File): Promise<string> {
  // Use pdfjs-dist for browser-side PDF parsing
  const pdfjsLib = await import("pdfjs-dist")

  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ""
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(" ")
    fullText += pageText + "\n"
  }

  return fullText.trim()
}

// Main parser function
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const fileName = file.name
  const fileType = file.type || fileName.split(".").pop()?.toLowerCase() || ""

  let text = ""

  try {
    if (fileType.includes("pdf") || fileName.endsWith(".pdf")) {
      text = await parsePdf(file)
    } else if (
      fileType.includes("wordprocessingml") ||
      fileType.includes("msword") ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".doc")
    ) {
      text = await parseDocx(file)
    } else if (fileType.includes("text") || fileName.endsWith(".txt")) {
      text = await parseTxt(file)
    } else {
      // Try to read as text as fallback
      text = await parseTxt(file)
    }
  } catch (error) {
    console.error("[v0] Error parsing document:", error)
    throw new Error(`Failed to parse ${fileName}. Please try a different format.`)
  }

  return {
    text,
    fileName,
    fileType,
  }
}

// Convert raw text to structured document content
export function parseResumeText(text: string): any {
  const lines = text.split("\n").filter((line) => line.trim())

  // Try to extract name from first line
  const name = lines[0]?.trim() || "Your Name"

  // Try to find contact info (email, phone, etc.)
  const contactLine = lines.find((line) => line.includes("@") || line.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/))
  const contact = contactLine?.trim() || ""

  // Find section headers and their content
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
    // Simple parsing: assume alternating school/degree lines
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
      // Check if this is a new role (contains company indicators)
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
