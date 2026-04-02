"use client"

export async function parseResumeText(file: File): Promise<string> {
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
      .filter((item) => "str" in item)
      .map((item) => (item as { str: string }).str)
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

export async function parseDocument(file: File): Promise<string> {
  return parseResumeText(file)
}
