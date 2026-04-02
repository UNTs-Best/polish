"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Check, AlertCircle, FileText, FileType, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DocumentContent {
  name: string
  title: string
  contact: string
  education: Array<{ school: string; degree: string; location: string; period: string }>
  experience: Array<{ role: string; company: string; location: string; period: string; bullets: string[] }>
  projects: Array<{ name: string; tech: string; period: string; bullets: string[] }>
  leadership?: Array<{ role: string; organization: string; location: string; period: string; bullets: string[] }>
  skills: string
}

// Filter helpers to skip empty content
const hasText = (s?: string) => !!s?.trim()
const nonEmptyBullets = (bullets: string[]) => bullets.filter((b) => hasText(b))
const hasEducation = (edu: DocumentContent["education"][0]) => hasText(edu.school) || hasText(edu.degree)
const hasExperience = (exp: DocumentContent["experience"][0]) => hasText(exp.role) || hasText(exp.company)
const hasProject = (proj: DocumentContent["projects"][0]) => hasText(proj.name)
const hasLeadership = (lead: NonNullable<DocumentContent["leadership"]>[0]) => hasText(lead.role) || hasText(lead.organization)

interface ExportDialogProps {
  children: React.ReactNode
  documentContent?: DocumentContent
  simulateError?: boolean
  sourceFormat?: string
}

// Generate PDF using jsPDF
async function generatePdf(doc: DocumentContent): Promise<Blob> {
  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({ unit: "pt", format: "letter" })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 54 // ~0.75 inches
  const contentWidth = pageWidth - margin * 2
  let y = 50

  // Use a generous line height factor to prevent overlapping characters
  pdf.setLineHeightFactor(1.5)

  const checkPage = (needed: number) => {
    if (y + needed > pdf.internal.pageSize.getHeight() - 40) {
      pdf.addPage()
      y = 50
    }
  }

  // Header
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(20)
  pdf.text(doc.name, pageWidth / 2, y, { align: "center" })
  y += 24
  if (doc.title) {
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    pdf.text(doc.title, pageWidth / 2, y, { align: "center" })
    y += 16
  }
  if (doc.contact) {
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.text(doc.contact, pageWidth / 2, y, { align: "center" })
    y += 16
  }

  // Horizontal rule
  pdf.setDrawColor(0)
  pdf.setLineWidth(0.75)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 18

  const drawSectionHeading = (title: string) => {
    checkPage(30)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(11)
    pdf.text(title.toUpperCase(), margin, y)
    y += 4
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.5)
    pdf.line(margin, y, pageWidth - margin, y)
    y += 16
  }

  const drawEntryHeader = (left: string, right: string, bold = true) => {
    checkPage(18)
    pdf.setFont("helvetica", bold ? "bold" : "normal")
    pdf.setFontSize(10)
    pdf.text(left, margin, y)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.text(right, pageWidth - margin, y, { align: "right" })
    y += 15
  }

  const drawSubHeader = (left: string, right: string) => {
    checkPage(16)
    pdf.setFont("helvetica", "italic")
    pdf.setFontSize(9)
    pdf.text(left, margin, y)
    pdf.text(right, pageWidth - margin, y, { align: "right" })
    y += 14
  }

  const drawBullet = (text: string) => {
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    const bulletX = margin + 8
    const textX = margin + 16
    const maxWidth = contentWidth - 16
    const lines = pdf.splitTextToSize(text, maxWidth)
    const lineHeight = pdf.getLineHeight() / pdf.internal.scaleFactor
    const blockHeight = lines.length * lineHeight
    checkPage(blockHeight)
    pdf.text("•", bulletX, y)
    // Render each line individually for consistent spacing
    for (let i = 0; i < lines.length; i++) {
      pdf.text(lines[i], textX, y + i * lineHeight)
    }
    y += blockHeight
  }

  // Education
  const validEducation = doc.education?.filter(hasEducation) ?? []
  if (validEducation.length) {
    drawSectionHeading("Education")
    for (const edu of validEducation) {
      if (hasText(edu.school)) drawEntryHeader(edu.school, edu.location || "")
      if (hasText(edu.degree)) drawSubHeader(edu.degree, edu.period || "")
    }
    y += 4
  }

  // Experience
  const validExperience = doc.experience?.filter(hasExperience) ?? []
  if (validExperience.length) {
    drawSectionHeading("Experience")
    for (const exp of validExperience) {
      if (hasText(exp.role)) drawEntryHeader(exp.role, exp.period || "")
      if (hasText(exp.company)) drawSubHeader(exp.company, exp.location || "")
      for (const bullet of nonEmptyBullets(exp.bullets)) {
        drawBullet(bullet)
      }
      y += 4
    }
  }

  // Projects
  const validProjects = doc.projects?.filter(hasProject) ?? []
  if (validProjects.length) {
    drawSectionHeading("Projects")
    for (const proj of validProjects) {
      const projTitle = proj.tech ? `${proj.name} | ${proj.tech}` : proj.name
      drawEntryHeader(projTitle, proj.period || "")
      for (const bullet of nonEmptyBullets(proj.bullets)) {
        drawBullet(bullet)
      }
      y += 4
    }
  }

  // Leadership
  const validLeadership = doc.leadership?.filter(hasLeadership) ?? []
  if (validLeadership.length) {
    drawSectionHeading("Leadership")
    for (const lead of validLeadership) {
      if (hasText(lead.role)) drawEntryHeader(lead.role, lead.period || "")
      if (hasText(lead.organization)) drawSubHeader(lead.organization, lead.location || "")
      for (const bullet of nonEmptyBullets(lead.bullets)) {
        drawBullet(bullet)
      }
      y += 4
    }
  }

  // Skills
  if (hasText(doc.skills)) {
    drawSectionHeading("Technical Skills")
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    const skillLines = pdf.splitTextToSize(doc.skills.replace(/\|/g, "  |  "), contentWidth)
    const skillLineHeight = pdf.getLineHeight() / pdf.internal.scaleFactor
    const skillBlockHeight = skillLines.length * skillLineHeight
    checkPage(skillBlockHeight)
    for (let i = 0; i < skillLines.length; i++) {
      pdf.text(skillLines[i], margin, y + i * skillLineHeight)
    }
    y += skillBlockHeight
  }

  return pdf.output("blob")
}

// Generate plain text
function generateTxt(doc: DocumentContent): string {
  const lines: string[] = []
  if (hasText(doc.name)) lines.push(doc.name)
  if (hasText(doc.title)) lines.push(doc.title)
  if (hasText(doc.contact)) lines.push(doc.contact)
  lines.push("", "=".repeat(60), "")

  const tValidEducation = doc.education?.filter(hasEducation) ?? []
  if (tValidEducation.length) {
    lines.push("EDUCATION", "-".repeat(40))
    for (const edu of tValidEducation) {
      if (hasText(edu.school)) lines.push(`${edu.school}${hasText(edu.location) ? "  |  " + edu.location : ""}`)
      if (hasText(edu.degree)) lines.push(`${edu.degree}${hasText(edu.period) ? "  |  " + edu.period : ""}`)
      lines.push("")
    }
  }

  const tValidExperience = doc.experience?.filter(hasExperience) ?? []
  if (tValidExperience.length) {
    lines.push("EXPERIENCE", "-".repeat(40))
    for (const exp of tValidExperience) {
      if (hasText(exp.role)) lines.push(`${exp.role}${hasText(exp.period) ? "  |  " + exp.period : ""}`)
      if (hasText(exp.company)) lines.push(`${exp.company}${hasText(exp.location) ? "  |  " + exp.location : ""}`)
      for (const bullet of nonEmptyBullets(exp.bullets)) lines.push(`  • ${bullet}`)
      lines.push("")
    }
  }

  const tValidProjects = doc.projects?.filter(hasProject) ?? []
  if (tValidProjects.length) {
    lines.push("PROJECTS", "-".repeat(40))
    for (const proj of tValidProjects) {
      lines.push(`${proj.name}${hasText(proj.tech) ? " | " + proj.tech : ""}${hasText(proj.period) ? "  |  " + proj.period : ""}`)
      for (const bullet of nonEmptyBullets(proj.bullets)) lines.push(`  • ${bullet}`)
      lines.push("")
    }
  }

  const tValidLeadership = doc.leadership?.filter(hasLeadership) ?? []
  if (tValidLeadership.length) {
    lines.push("LEADERSHIP", "-".repeat(40))
    for (const lead of tValidLeadership) {
      if (hasText(lead.role)) lines.push(`${lead.role}${hasText(lead.period) ? "  |  " + lead.period : ""}`)
      if (hasText(lead.organization)) lines.push(`${lead.organization}${hasText(lead.location) ? "  |  " + lead.location : ""}`)
      for (const bullet of nonEmptyBullets(lead.bullets)) lines.push(`  • ${bullet}`)
      lines.push("")
    }
  }

  if (hasText(doc.skills)) {
    lines.push("TECHNICAL SKILLS", "-".repeat(40))
    lines.push(doc.skills)
  }

  return lines.join("\n")
}

// Generate LaTeX
function generateLatex(doc: DocumentContent): string {
  const esc = (s: string) => s.replace(/[&%$#_{}~^\\]/g, (m) => "\\" + m)
  const lines: string[] = []
  lines.push("\\documentclass[11pt,a4paper]{article}")
  lines.push("\\usepackage[utf8]{inputenc}")
  lines.push("\\usepackage[margin=0.75in]{geometry}")
  lines.push("\\usepackage{enumitem}")
  lines.push("\\usepackage{titlesec}")
  lines.push("\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]")
  lines.push("\\setlength{\\parindent}{0pt}")
  lines.push("\\begin{document}")
  lines.push("")
  lines.push(`\\begin{center}`)
  lines.push(`{\\LARGE\\textbf{${esc(doc.name)}}}\\\\[4pt]`)
  if (doc.title) lines.push(`${esc(doc.title)}\\\\[2pt]`)
  if (doc.contact) lines.push(`\\small ${esc(doc.contact)}`)
  lines.push(`\\end{center}`)
  lines.push("")

  const lValidEducation = doc.education?.filter(hasEducation) ?? []
  if (lValidEducation.length) {
    lines.push("\\section*{Education}")
    for (const edu of lValidEducation) {
      if (hasText(edu.school)) lines.push(`\\textbf{${esc(edu.school)}} \\hfill ${esc(edu.location || "")}\\\\`)
      if (hasText(edu.degree)) lines.push(`\\textit{${esc(edu.degree)}} \\hfill ${esc(edu.period || "")}\\\\[4pt]`)
    }
  }

  const lValidExperience = doc.experience?.filter(hasExperience) ?? []
  if (lValidExperience.length) {
    lines.push("\\section*{Experience}")
    for (const exp of lValidExperience) {
      if (hasText(exp.role)) lines.push(`\\textbf{${esc(exp.role)}} \\hfill ${esc(exp.period || "")}\\\\`)
      if (hasText(exp.company)) lines.push(`\\textit{${esc(exp.company)}} \\hfill \\textit{${esc(exp.location || "")}}\\\\`)
      const bullets = nonEmptyBullets(exp.bullets)
      if (bullets.length) {
        lines.push("\\begin{itemize}[leftmargin=1.5em,nosep]")
        for (const b of bullets) lines.push(`  \\item ${esc(b)}`)
        lines.push("\\end{itemize}")
      }
      lines.push("")
    }
  }

  const lValidProjects = doc.projects?.filter(hasProject) ?? []
  if (lValidProjects.length) {
    lines.push("\\section*{Projects}")
    for (const proj of lValidProjects) {
      const title = hasText(proj.tech) ? `${esc(proj.name)} | \\textit{${esc(proj.tech)}}` : esc(proj.name)
      lines.push(`\\textbf{${title}} \\hfill ${esc(proj.period || "")}\\\\`)
      const bullets = nonEmptyBullets(proj.bullets)
      if (bullets.length) {
        lines.push("\\begin{itemize}[leftmargin=1.5em,nosep]")
        for (const b of bullets) lines.push(`  \\item ${esc(b)}`)
        lines.push("\\end{itemize}")
      }
      lines.push("")
    }
  }

  const lValidLeadership = doc.leadership?.filter(hasLeadership) ?? []
  if (lValidLeadership.length) {
    lines.push("\\section*{Leadership}")
    for (const lead of lValidLeadership) {
      if (hasText(lead.role)) lines.push(`\\textbf{${esc(lead.role)}} \\hfill ${esc(lead.period || "")}\\\\`)
      if (hasText(lead.organization)) lines.push(`\\textit{${esc(lead.organization)}} \\hfill \\textit{${esc(lead.location || "")}}\\\\`)
      const bullets = nonEmptyBullets(lead.bullets)
      if (bullets.length) {
        lines.push("\\begin{itemize}[leftmargin=1.5em,nosep]")
        for (const b of bullets) lines.push(`  \\item ${esc(b)}`)
        lines.push("\\end{itemize}")
      }
      lines.push("")
    }
  }

  if (hasText(doc.skills)) {
    lines.push("\\section*{Technical Skills}")
    lines.push(esc(doc.skills))
  }

  lines.push("")
  lines.push("\\end{document}")
  return lines.join("\n")
}

// Generate real DOCX using the docx library
async function generateDocx(doc: DocumentContent): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, TabStopPosition, TabStopType } = await import("docx")

  const children: any[] = []

  // Header — name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: doc.name, bold: true, size: 32, font: "Calibri" })],
    })
  )
  if (doc.title) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: doc.title, size: 20, font: "Calibri" })],
      })
    )
  }
  if (doc.contact) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: doc.contact, size: 18, font: "Calibri" })],
      })
    )
  }

  const sectionHeading = (title: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 22, font: "Calibri" })],
    })

  const entryHeader = (left: string, right: string, bold = true) =>
    new Paragraph({
      spacing: { after: 20 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({ text: left, bold, size: 20, font: "Calibri" }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: right, size: 18, font: "Calibri" }),
      ],
    })

  const subHeader = (left: string, right: string) =>
    new Paragraph({
      spacing: { after: 40 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({ text: left, italics: true, size: 18, font: "Calibri" }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: right, italics: true, size: 18, font: "Calibri" }),
      ],
    })

  const bullet = (text: string) =>
    new Paragraph({
      bullet: { level: 0 },
      spacing: { after: 20 },
      children: [new TextRun({ text, size: 18, font: "Calibri" })],
    })

  // Education
  const dValidEducation = doc.education?.filter(hasEducation) ?? []
  if (dValidEducation.length) {
    children.push(sectionHeading("Education"))
    for (const edu of dValidEducation) {
      if (hasText(edu.school)) children.push(entryHeader(edu.school, edu.location || ""))
      if (hasText(edu.degree)) children.push(subHeader(edu.degree, edu.period || ""))
    }
  }

  // Experience
  const dValidExperience = doc.experience?.filter(hasExperience) ?? []
  if (dValidExperience.length) {
    children.push(sectionHeading("Experience"))
    for (const exp of dValidExperience) {
      if (hasText(exp.role)) children.push(entryHeader(exp.role, exp.period || ""))
      if (hasText(exp.company)) children.push(subHeader(exp.company, exp.location || ""))
      for (const b of nonEmptyBullets(exp.bullets)) children.push(bullet(b))
    }
  }

  // Projects
  const dValidProjects = doc.projects?.filter(hasProject) ?? []
  if (dValidProjects.length) {
    children.push(sectionHeading("Projects"))
    for (const proj of dValidProjects) {
      const projTitle = proj.tech ? `${proj.name} | ${proj.tech}` : proj.name
      children.push(entryHeader(projTitle, proj.period || ""))
      for (const b of nonEmptyBullets(proj.bullets)) children.push(bullet(b))
    }
  }

  // Leadership
  const dValidLeadership = doc.leadership?.filter(hasLeadership) ?? []
  if (dValidLeadership.length) {
    children.push(sectionHeading("Leadership"))
    for (const lead of dValidLeadership) {
      if (hasText(lead.role)) children.push(entryHeader(lead.role, lead.period || ""))
      if (hasText(lead.organization)) children.push(subHeader(lead.organization, lead.location || ""))
      for (const b of nonEmptyBullets(lead.bullets)) children.push(bullet(b))
    }
  }

  // Skills
  if (hasText(doc.skills)) {
    children.push(sectionHeading("Technical Skills"))
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: doc.skills.replace(/\|/g, "  |  "), size: 18, font: "Calibri" })],
      })
    )
  }

  const docFile = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      },
    ],
  })

  return await Packer.toBlob(docFile)
}

// Generate RTF
function generateRtf(doc: DocumentContent): string {
  const lines: string[] = []
  lines.push("{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Helvetica;}}")
  lines.push("\\f0\\fs22")

  // Header
  if (hasText(doc.name)) lines.push(`\\pard\\qc\\b\\fs32 ${doc.name}\\b0\\par`)
  if (hasText(doc.title)) lines.push(`\\fs20 ${doc.title}\\par`)
  if (hasText(doc.contact)) lines.push(`\\fs18 ${doc.contact}\\par`)
  lines.push("\\pard\\par")

  const section = (title: string) => {
    lines.push(`\\b\\fs24 ${title.toUpperCase()}\\b0\\par`)
    lines.push("\\pard\\brdrb\\brdrs\\brdrw10\\brsp20\\par")
  }

  const rValidEducation = doc.education?.filter(hasEducation) ?? []
  if (rValidEducation.length) {
    section("Education")
    for (const edu of rValidEducation) {
      if (hasText(edu.school)) lines.push(`\\b\\fs20 ${edu.school}\\b0\\par`)
      if (hasText(edu.degree)) lines.push(`\\i\\fs18 ${edu.degree}\\i0  ${edu.period || ""}\\par`)
    }
    lines.push("\\par")
  }

  const rValidExperience = doc.experience?.filter(hasExperience) ?? []
  if (rValidExperience.length) {
    section("Experience")
    for (const exp of rValidExperience) {
      if (hasText(exp.role)) lines.push(`\\b\\fs20 ${exp.role}\\b0  ${exp.period || ""}\\par`)
      if (hasText(exp.company)) lines.push(`\\i\\fs18 ${exp.company}\\i0  ${exp.location || ""}\\par`)
      for (const b of nonEmptyBullets(exp.bullets)) lines.push(`\\fs18 \\bullet  ${b}\\par`)
      lines.push("\\par")
    }
  }

  const rValidProjects = doc.projects?.filter(hasProject) ?? []
  if (rValidProjects.length) {
    section("Projects")
    for (const proj of rValidProjects) {
      lines.push(`\\b\\fs20 ${proj.name}${hasText(proj.tech) ? " | " + proj.tech : ""}\\b0  ${proj.period || ""}\\par`)
      for (const b of nonEmptyBullets(proj.bullets)) lines.push(`\\fs18 \\bullet  ${b}\\par`)
      lines.push("\\par")
    }
  }

  if (hasText(doc.skills)) {
    section("Technical Skills")
    lines.push(`\\fs18 ${doc.skills}\\par`)
  }

  lines.push("}")
  return lines.join("\n")
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function ExportDialog({ children, documentContent, simulateError, sourceFormat }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const exportFormats = [
    {
      id: "pdf",
      name: "PDF",
      description: "Perfect for sharing and printing",
      icon: FileText,
      iconColor: "text-red-600",
      iconBg: "bg-red-50",
      popular: true,
    },
    {
      id: "docx",
      name: "Word Document",
      description: "Editable Microsoft Word format",
      icon: FileType,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      popular: true,
    },
    {
      id: "latex",
      name: "LaTeX",
      description: "For academic and technical resumes",
      icon: FileCode,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
      popular: false,
    },
    {
      id: "rtf",
      name: "Rich Text Format",
      description: "Compatible with most text editors",
      icon: FileText,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
      popular: false,
    },
    {
      id: "txt",
      name: "Plain Text",
      description: "ATS-friendly plain text version",
      icon: FileText,
      iconColor: "text-slate-600",
      iconBg: "bg-slate-50",
      popular: false,
    },
  ]

  const defaultDoc: DocumentContent = {
    name: "Jake Ryan",
    title: "Software Engineer",
    contact: "jake@su.edu | (123) 456-7890 | linkedin.com/in/jake | github.com/jake",
    education: [{ school: "Southwestern University", degree: "B.A. Computer Science", location: "Georgetown, TX", period: "Aug. 2018 -- May 2021" }],
    experience: [{ role: "Software Engineer", company: "TechCorp", location: "Austin, TX", period: "2021 -- Present", bullets: ["Developed full-stack applications with React and Node.js"] }],
    projects: [],
    skills: "JavaScript, TypeScript, React, Node.js, Python",
  }

  const handleExport = async (format: string) => {
    setIsExporting(true)
    setExportSuccess(null)
    setExportError(null)

    if (simulateError) {
      setTimeout(() => {
        setIsExporting(false)
        setExportError(format)
      }, 1500)
      return
    }

    try {
      const doc = documentContent || defaultDoc
      const baseName = doc.name.replace(/\s+/g, "_") || "resume"

      switch (format) {
        case "pdf": {
          const blob = await generatePdf(doc)
          downloadBlob(blob, `${baseName}.pdf`)
          break
        }
        case "txt": {
          const text = generateTxt(doc)
          downloadBlob(new Blob([text], { type: "text/plain" }), `${baseName}.txt`)
          break
        }
        case "latex": {
          const latex = generateLatex(doc)
          downloadBlob(new Blob([latex], { type: "application/x-latex" }), `${baseName}.tex`)
          break
        }
        case "rtf": {
          const rtf = generateRtf(doc)
          downloadBlob(new Blob([rtf], { type: "application/rtf" }), `${baseName}.rtf`)
          break
        }
        case "docx": {
          const docxBlob = await generateDocx(doc)
          downloadBlob(docxBlob, `${baseName}.docx`)
          break
        }
        default:
          throw new Error("Unsupported format")
      }

      setExportSuccess(format)
    } catch (error) {
      console.error("Export error:", error)
      setExportError(format)
    } finally {
      setIsExporting(false)
    }
  }

  const handleRetry = (format: string) => {
    setExportError(null)
    handleExport(format)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-md border-0 shadow-2xl overflow-hidden p-0"
        style={{
          backgroundColor: "#fafbfc",
          backgroundImage: `
            linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
        aria-labelledby="export-dialog-title"
        aria-describedby="export-dialog-description"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-slate-100/40 pointer-events-none" />

        <div className="relative z-10 p-6">
          <DialogHeader className="mb-6">
            <DialogTitle id="export-dialog-title" className="text-xl font-bold text-slate-900 tracking-tight">
              Export Resume
            </DialogTitle>
            <DialogDescription id="export-dialog-description" className="text-slate-500">
              Choose your preferred format.{" "}
              {sourceFormat && (
                <span className="text-slate-400">
                  Source: <span className="font-medium text-slate-500">{sourceFormat}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5">
            {exportFormats.map((format) => (
              <button
                key={format.id}
                className={`w-full p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                  exportSuccess === format.id
                    ? "border-green-500 bg-green-50"
                    : exportError === format.id
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
                onClick={() => !isExporting && !exportError && handleExport(format.id)}
                role="button"
                tabIndex={0}
                aria-label={`Export as ${format.name}`}
                disabled={isExporting}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      exportSuccess === format.id
                        ? "bg-green-500"
                        : exportError === format.id
                          ? "bg-red-500"
                          : format.iconBg
                    }`}>
                      {exportSuccess === format.id ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : exportError === format.id ? (
                        <AlertCircle className="w-4 h-4 text-white" />
                      ) : (
                        <format.icon className={`w-4 h-4 ${format.iconColor}`} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 text-sm">{format.name}</h3>
                        {format.popular && (
                          <span className="text-[10px] uppercase tracking-wide font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{format.description}</p>
                      {exportError === format.id && (
                        <div className="mt-1.5">
                          <p className="text-xs text-red-600 mb-1">Export failed. Please try again.</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs text-red-600 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRetry(format.id)
                            }}
                            aria-label={`Retry exporting as ${format.name}`}
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : exportSuccess === format.id ? (
                      <span className="text-xs text-green-600 font-medium">Done</span>
                    ) : exportError === format.id ? (
                      <span className="text-xs text-red-600 font-medium">Failed</span>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5 p-3.5 bg-white rounded-xl border border-slate-200/60">
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">Layout Preservation</span> — All exports maintain your
              resume's formatting. Convert between any formats seamlessly.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
