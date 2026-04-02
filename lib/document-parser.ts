"use client"

export type FormatLabel = "PDF" | "DOCX" | "RTF" | "TXT" | "LaTeX"

export interface ParsedResumeContent {
  name: string
  title: string
  contact: string
  education: Array<{ school: string; degree: string; location: string; period: string }>
  experience: Array<{ role: string; company: string; location: string; period: string; bullets: string[] }>
  projects: Array<{ name: string; tech: string; period: string; bullets: string[] }>
  leadership: Array<{ role: string; organization: string; location: string; period: string; bullets: string[] }>
  skills: string
}

function detectFormatLabel(file: File): FormatLabel {
  const ext = file.name.toLowerCase().split(".").pop() || ""
  const type = file.type.toLowerCase()

  if (ext === "pdf" || type === "application/pdf") return "PDF"
  if (
    ext === "docx" ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) return "DOCX"
  if (ext === "rtf" || type === "application/rtf" || type === "text/rtf") return "RTF"
  if (ext === "tex" || ext === "latex" || type === "application/x-tex" || type === "application/x-latex") {
    return "LaTeX"
  }

  return "TXT"
}

async function parseResumeFileText(file: File): Promise<string> {
  if (file.type === "text/plain") {
    return file.text()
  }

  if (file.type === "application/pdf") {
    return parsePdf(file)
  }

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return parseDocx(file)
  }

  throw new Error(`Unsupported file type: ${file.type}`)
}

function isSectionHeader(line: string): boolean {
  const cleaned = line.replace(/[:\-–—_|]/g, "").trim()
  return /^(education|academic background|experience|work experience|work history|professional experience|employment|employment history|relevant experience|projects?|personal projects?|skills?|technical skills?|technical proficiencies|core competencies|tools\s*&?\s*technologies|areas of expertise|leadership|leadership\s*&?\s*activities|extracurricular|activities|volunteer|volunteering|community involvement|certifications?|licenses?\s*&?\s*certifications?|summary|professional summary|executive summary|objective|career objective|profile|awards?|honors?\s*&?\s*awards?|publications?|research|interests|additional|additional information|languages|references)$/i.test(cleaned)
}

function isBullet(line: string): boolean {
  return /^[•\-\*►▸✓◦→○●■□▪▫◆◇–—⁃‣⬥>]/.test(line) || /^\d+\.\s/.test(line)
}

function isPeriod(text: string): boolean {
  return /\d{4}/.test(text) ||
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(text) ||
    /\bpresent\b/i.test(text)
}

function stripBullet(line: string): string {
  return line.replace(/^[•\-\*►▸✓◦→○●■□▪▫◆◇–—⁃‣⬥>]\s*/, "").replace(/^\d+\.\s*/, "").trim()
}

function isContactLine(line: string): boolean {
  if (/@/.test(line)) return true
  if (/\(\d{3}\)\s*\d{3}[-.\s]?\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4}/.test(line)) return true
  if (/linkedin|github|portfolio/i.test(line)) return true
  if (/\.(com|org|net|io|dev)\b/i.test(line)) return true
  return false
}

function isLocation(text: string): boolean {
  return /,\s*[A-Z]{2}\b/.test(text)
}

// Split a line that has left-aligned and right-aligned columns
// e.g. "Software Engineer\tJan 2020 - Present" or
//      "Software Engineer     Jan 2020 - Present"
function splitColumns(line: string): [string, string] {
  // Tab separator (inserted by PDF/DOCX parsers for large gaps)
  const tabParts = line.split(/\t+/)
  if (tabParts.length >= 2) {
    return [tabParts[0].trim(), tabParts.slice(1).join(" ").trim()]
  }
  // 4+ space separator (column-aligned text)
  const match = line.match(/^(.+?)\s{4,}(.+)$/)
  if (match) {
    return [match[1].trim(), match[2].trim()]
  }
  return [line.trim(), ""]
}

function parseEducationSection(lines: string[]): ParsedResumeContent["education"] {
  const entries: ParsedResumeContent["education"] = []
  let i = 0
  while (i < lines.length) {
    if (isBullet(lines[i])) { i++; continue }

    // Check pipe-separated single-line format
    const pipeParts = lines[i].split(/\s*\|\s*/)
    if (pipeParts.length >= 3) {
      entries.push({
        school: pipeParts[0] || "",
        degree: pipeParts[1] || "",
        location: pipeParts[2] || "",
        period: pipeParts[3] || "",
      })
      i++
      while (i < lines.length && isBullet(lines[i])) i++
      continue
    }

    // Column-split first line: typically "School Name      City, ST"
    const [left1, right1] = splitColumns(lines[i])
    let school = left1, degree = "", location = "", period = ""

    if (isLocation(right1)) location = right1
    else if (isPeriod(right1)) period = right1
    else if (right1) location = right1

    // Collect non-bullet metadata lines
    let j = i + 1
    while (j < lines.length && !isBullet(lines[j]) && !isSectionHeader(lines[j])) {
      const [leftN, rightN] = splitColumns(lines[j])
      if (!degree) {
        degree = leftN
        if (rightN) {
          if (isPeriod(rightN) && !period) period = rightN
          else if (isLocation(rightN) && !location) location = rightN
        }
      } else {
        if (isPeriod(leftN) && !period) period = leftN
        else if (isLocation(leftN) && !location) location = leftN
        if (rightN) {
          if (isPeriod(rightN) && !period) period = rightN
          else if (isLocation(rightN) && !location) location = rightN
        }
      }
      j++
    }

    // Skip bullets after education entry
    while (j < lines.length && isBullet(lines[j])) j++

    if (school) entries.push({ school, degree, location, period })
    i = j
  }
  return entries
}

function parseExperienceSection(lines: string[]): ParsedResumeContent["experience"] {
  const entries: ParsedResumeContent["experience"] = []
  let i = 0
  while (i < lines.length) {
    if (isBullet(lines[i])) { i++; continue }

    let role = "", company = "", location = "", period = ""

    // Check pipe-separated single-line format
    const pipeParts = lines[i].split(/\s*\|\s*/)
    if (pipeParts.length >= 3) {
      role = pipeParts[0]
      company = pipeParts[1]
      if (pipeParts.length >= 4) {
        location = pipeParts[2]
        period = pipeParts[3]
      } else {
        period = pipeParts[2]
      }
    } else if (pipeParts.length === 2) {
      role = pipeParts[0]
      if (isPeriod(pipeParts[1])) period = pipeParts[1]
      else company = pipeParts[1]
    } else {
      // Column-split: "Role Title      Jan 2020 - Present"
      const [left1, right1] = splitColumns(lines[i])
      role = left1
      if (isPeriod(right1)) period = right1
      else if (isLocation(right1)) location = right1
    }

    // Collect non-bullet, non-header meta lines (max 2 — role + company lines)
    let j = i + 1
    const metaLines: string[] = []
    let metaCount = 0
    while (j < lines.length && !isBullet(lines[j]) && !isSectionHeader(lines[j]) && metaCount < 2) {
      metaLines.push(lines[j])
      metaCount++
      j++
    }

    // Parse meta lines for company/location/period
    if (pipeParts.length < 3 && metaLines.length > 0) {
      const firstMetaPipes = metaLines[0].split(/\s*\|\s*/)
      if (firstMetaPipes.length >= 3) {
        if (!company) company = firstMetaPipes[0]
        if (!location) location = firstMetaPipes[1]
        if (!period) period = firstMetaPipes[2]
      } else if (firstMetaPipes.length === 2) {
        if (!company) company = firstMetaPipes[0]
        if (!period && isPeriod(firstMetaPipes[1])) period = firstMetaPipes[1]
        else if (!location) location = firstMetaPipes[1]
      } else {
        // Column-split each meta line
        for (const ml of metaLines) {
          const [mLeft, mRight] = splitColumns(ml)
          if (!company) {
            company = mLeft
            if (mRight) {
              if (isLocation(mRight) && !location) location = mRight
              else if (isPeriod(mRight) && !period) period = mRight
            }
          } else {
            if (isPeriod(mLeft) && !period) period = mLeft
            else if (isLocation(mLeft) && !location) location = mLeft
            if (mRight) {
              if (isPeriod(mRight) && !period) period = mRight
              else if (isLocation(mRight) && !location) location = mRight
            }
          }
        }
      }
    }

    // Collect bullet lines and treat non-header plain text lines as bullets too
    // (many resumes have unbulleted content lines under a role)
    const bullets: string[] = []
    while (j < lines.length && !isSectionHeader(lines[j])) {
      if (isBullet(lines[j])) {
        bullets.push(stripBullet(lines[j]))
        j++
      } else {
        // Non-bullet, non-header line — check if it looks like a new entry header
        // (has a date/period or pipe-separated fields) to stop collecting bullets
        const [testLeft, testRight] = splitColumns(lines[j])
        const looksLikeNewEntry = (isPeriod(testRight) && testLeft.length > 3) ||
          lines[j].split(/\s*\|\s*/).length >= 2
        if (looksLikeNewEntry) break
        // Otherwise treat as an unbulleted content line
        bullets.push(lines[j].trim())
        j++
      }
    }

    if (role || company) entries.push({ role, company, location, period, bullets })
    i = j
  }
  return entries
}

function parseProjectsSection(lines: string[]): ParsedResumeContent["projects"] {
  const entries: ParsedResumeContent["projects"] = []
  let i = 0
  while (i < lines.length) {
    if (isBullet(lines[i])) { i++; continue }

    let projectName = "", tech = "", period = ""

    // Check pipe-separated format: "Name | Tech | Period"
    const pipeParts = lines[i].split(/\s*\|\s*/)
    if (pipeParts.length >= 2) {
      projectName = pipeParts[0]
      tech = pipeParts[1] || ""
      period = pipeParts[2] || ""
    } else {
      // Column-split: "Project Name      Jan 2020"
      const [left1, right1] = splitColumns(lines[i])
      projectName = left1
      if (isPeriod(right1)) period = right1
    }

    let j = i + 1
    // If no pipe split, check next non-bullet line for tech/period
    if (pipeParts.length < 2 && j < lines.length && !isBullet(lines[j]) && !isSectionHeader(lines[j])) {
      const meta = lines[j].split(/\s*\|\s*/)
      if (meta.length >= 2) {
        tech = meta[0]; period = period || meta[1] || ""
      } else if (isPeriod(lines[j])) {
        period = period || lines[j]
      } else {
        tech = lines[j]
      }
      j++
    }

    const bullets: string[] = []
    while (j < lines.length && isBullet(lines[j])) {
      bullets.push(stripBullet(lines[j]))
      j++
    }

    if (projectName) entries.push({ name: projectName, tech, period, bullets })
    i = j
  }
  return entries
}

function parseLeadershipSection(lines: string[]): ParsedResumeContent["leadership"] {
  const entries: ParsedResumeContent["leadership"] = []
  let i = 0
  while (i < lines.length) {
    if (isBullet(lines[i])) { i++; continue }

    let role = "", organization = "", location = "", period = ""

    // Check pipe-separated format
    const pipeParts = lines[i].split(/\s*\|\s*/)
    if (pipeParts.length >= 3) {
      role = pipeParts[0]
      organization = pipeParts[1]
      if (pipeParts.length >= 4) {
        location = pipeParts[2]
        period = pipeParts[3]
      } else {
        period = pipeParts[2]
      }
    } else if (pipeParts.length === 2) {
      role = pipeParts[0]
      if (isPeriod(pipeParts[1])) period = pipeParts[1]
      else organization = pipeParts[1]
    } else {
      const [left1, right1] = splitColumns(lines[i])
      role = left1
      if (isPeriod(right1)) period = right1
      else if (isLocation(right1)) location = right1
    }

    // Collect meta lines
    let j = i + 1
    const metaLines: string[] = []
    while (j < lines.length && !isBullet(lines[j]) && !isSectionHeader(lines[j])) {
      metaLines.push(lines[j])
      j++
    }

    // Parse meta for organization/location/period
    if (pipeParts.length < 3 && metaLines.length > 0) {
      const firstMetaPipes = metaLines[0].split(/\s*\|\s*/)
      if (firstMetaPipes.length >= 3) {
        if (!organization) organization = firstMetaPipes[0]
        if (!location) location = firstMetaPipes[1]
        if (!period) period = firstMetaPipes[2]
      } else if (firstMetaPipes.length === 2) {
        if (!organization) organization = firstMetaPipes[0]
        if (!period) period = firstMetaPipes[1]
      } else {
        for (const ml of metaLines) {
          const [mLeft, mRight] = splitColumns(ml)
          if (!organization) {
            organization = mLeft
            if (mRight) {
              if (isLocation(mRight) && !location) location = mRight
              else if (isPeriod(mRight) && !period) period = mRight
            }
          } else {
            if (isPeriod(mLeft) && !period) period = mLeft
            else if (isLocation(mLeft) && !location) location = mLeft
            if (mRight) {
              if (isPeriod(mRight) && !period) period = mRight
              else if (isLocation(mRight) && !location) location = mRight
            }
          }
        }
      }
    }

    // Collect only actual bullet lines
    const bullets: string[] = []
    while (j < lines.length && isBullet(lines[j])) {
      bullets.push(stripBullet(lines[j]))
      j++
    }

    if (role || organization) entries.push({ role, organization, location, period, bullets })
    i = j
  }
  return entries
}

function parseResumeTextContent(content: string): ParsedResumeContent {
  const allLines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  if (allLines.length === 0) {
    return { name: "", title: "", contact: "", education: [], experience: [], projects: [], leadership: [], skills: "" }
  }

  // Find where the first section header appears to delimit the resume header
  const firstHeaderIdx = allLines.findIndex(isSectionHeader)
  const headerEnd = firstHeaderIdx === -1 ? Math.min(5, allLines.length) : firstHeaderIdx

  const name = allLines[0] || ""

  // Scan header lines (between name and first section) for title vs contact
  const headerLines = allLines.slice(1, headerEnd)
  const contactParts: string[] = []
  const titleParts: string[] = []

  for (const line of headerLines) {
    if (isContactLine(line) || isLocation(line)) {
      contactParts.push(line)
    } else {
      titleParts.push(line)
    }
  }

  const title = titleParts.join(" ")
  const contact = contactParts.join(" | ")

  // Split content into named sections
  const sections: Record<string, string[]> = {}
  let currentKey = ""
  for (let i = headerEnd; i < allLines.length; i++) {
    const line = allLines[i]
    if (isSectionHeader(line)) {
      currentKey = line.toLowerCase().replace(/[:\-–—\s]+/g, "_").trim()
      sections[currentKey] = []
    } else if (currentKey) {
      sections[currentKey].push(line)
    }
  }

  const findSection = (...keywords: string[]): string[] => {
    for (const kw of keywords) {
      const key = Object.keys(sections).find((k) => k.includes(kw))
      if (key) return sections[key]
    }
    return []
  }

  const skillsLines = findSection("skill", "technical_skill", "technical_proficien", "core_competen", "tools", "areas_of_expertise")
  const skills = skillsLines.join(" | ")

  return {
    name,
    title,
    contact,
    education: parseEducationSection(findSection("education")),
    experience: parseExperienceSection(findSection("experience", "work", "professional", "employment")),
    projects: parseProjectsSection(findSection("project", "personal_project")),
    leadership: parseLeadershipSection(findSection("leadership", "activit", "volunteer", "extracurricular", "community")),
    skills,
  }
}

export function parseResumeText(content: string): ParsedResumeContent
export function parseResumeText(file: File): Promise<string>
export function parseResumeText(input: File | string): Promise<string> | ParsedResumeContent {
  if (typeof input === "string") {
    return parseResumeTextContent(input)
  }
  return parseResumeFileText(input)
}

async function parsePdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist")
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    const textItems = content.items.filter(
      (item): item is typeof item & { str: string; transform: number[]; width: number } =>
        "str" in item && typeof (item as any).str === "string"
    )

    if (textItems.length === 0) continue

    // Group items by y-coordinate into lines (items at similar y = same line)
    const yThreshold = 3
    const lineGroups: Array<{ y: number; items: typeof textItems }> = []

    for (const item of textItems) {
      if (!item.str) continue
      const y = item.transform[5]
      let group = lineGroups.find((g) => Math.abs(g.y - y) <= yThreshold)
      if (!group) {
        group = { y, items: [] }
        lineGroups.push(group)
      }
      group.items.push(item)
    }

    // Sort lines top-to-bottom (higher y = higher on page)
    lineGroups.sort((a, b) => b.y - a.y)

    const pageLines: string[] = []
    for (const group of lineGroups) {
      // Sort items left-to-right within the line
      group.items.sort((a, b) => a.transform[4] - b.transform[4])

      let lineText = ""
      for (let j = 0; j < group.items.length; j++) {
        const item = group.items[j]
        if (j > 0) {
          const prev = group.items[j - 1]
          const prevEndX = prev.transform[4] + (prev.width || 0)
          const gap = item.transform[4] - prevEndX
          const fontSize = Math.abs(item.transform[0]) || 10
          const prevEndsWithSpace = prev.str.endsWith(" ")
          const currStartsWithSpace = item.str.startsWith(" ")

          if (gap > fontSize * 0.25 && !prevEndsWithSpace && !currStartsWithSpace) {
            // Large gap = tab (column separator), normal gap = space
            lineText += gap > fontSize * 4 ? "\t" : " "
          }
        }
        lineText += item.str
      }

      const trimmed = lineText.trim()
      if (trimmed) pageLines.push(trimmed)
    }

    pages.push(pageLines.join("\n"))
  }

  return pages.join("\n\n")
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const { unzipSync, strFromU8 } = await import("fflate")

  const zip = unzipSync(new Uint8Array(arrayBuffer))
  const docXml = zip["word/document.xml"]
  if (!docXml) return ""

  const xml = strFromU8(docXml)
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, "application/xml")

  const nsW = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  const paragraphs = doc.getElementsByTagNameNS(nsW, "p")
  const lines: string[] = []

  for (const para of Array.from(paragraphs)) {
    const runs = para.getElementsByTagNameNS(nsW, "r")
    const parts: string[] = []

    for (const run of Array.from(runs)) {
      const children = Array.from(run.childNodes)
      for (const child of children) {
        if (!(child instanceof Element)) continue
        const localName = child.localName

        if (localName === "t") {
          parts.push(child.textContent || "")
        } else if (localName === "tab") {
          parts.push("\t")
        } else if (localName === "br") {
          parts.push("\n")
        }
      }
    }

    const lineText = parts.join("")
    lines.push(lineText)
  }

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function parseDocument(file: File): Promise<{ text: string; formatLabel: FormatLabel }> {
  const text = await parseResumeFileText(file)
  return {
    text,
    formatLabel: detectFormatLabel(file),
  }
}
