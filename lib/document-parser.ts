"use client"

export type FormatLabel = "PDF" | "DOCX" | "RTF" | "TXT" | "LaTeX"

export interface ParsedResumeContent {
  name: string
  title: string
  contact: string
  education: Array<{ school: string; degree: string; location: string; period: string }>
  experience: Array<{ role: string; company: string; location: string; period: string; bullets: string[] }>
  projects: Array<{ name: string; tech: string; period: string; bullets: string[] }>
  leadership: Array<{ role: string; org: string; period: string; bullets: string[] }>
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

function parseResumeTextContent(content: string): ParsedResumeContent {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const skillsLine = lines.find((line) => /^skills?:?/i.test(line))
  const skills = skillsLine ? skillsLine.replace(/^skills?:?\s*/i, "") : ""

  return {
    name: lines[0] || "",
    title: lines[1] || "",
    contact: lines[2] || "",
    education: [],
    experience: [],
    projects: [],
    leadership: [],
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
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.js`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join(" ")
    pages.push(pageText)
  }

  return pages.join("\n\n")
}

async function parseDocx(file: File): Promise<string> {
  // Basic DOCX text extraction via XML parsing
  const arrayBuffer = await file.arrayBuffer()
  const { unzipSync, strFromU8 } = await import("fflate" as never as string) as {
    unzipSync: (data: Uint8Array) => Record<string, Uint8Array>
    strFromU8: (data: Uint8Array) => string
  }

  const zip = unzipSync(new Uint8Array(arrayBuffer))
  const docXml = zip["word/document.xml"]
  if (!docXml) return ""

  const xml = strFromU8(docXml)
  return xml
    .replace(/<w:br[^/]*/g, "\n")
    .replace(/<w:p[ >][^<]*>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
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
