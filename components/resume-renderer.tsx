"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface DocumentContent {
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

export type TemplateName = "classic" | "modern" | "minimal" | "professional"

interface TemplateConfig {
  name: string
  description: string
  fontFamily: string
  headingFont: string
  headingStyle: string
  headingBorder: string
  sectionSpacing: string
  bulletStyle: string
  headerStyle: string
  accentColor: string
  cardStyle: string
}

const templates: Record<TemplateName, TemplateConfig> = {
  classic: {
    name: "Classic",
    description: "Clean and traditional",
    fontFamily: "font-serif",
    headingFont: "font-serif",
    headingStyle: "text-lg font-bold uppercase tracking-wide",
    headingBorder: "border-b-2 border-foreground",
    sectionSpacing: "space-y-5",
    bulletStyle: "list-disc list-inside",
    headerStyle: "text-center border-b-2 border-foreground pb-4",
    accentColor: "text-foreground",
    cardStyle: "p-12",
  },
  modern: {
    name: "Modern",
    description: "Contemporary with accent colors",
    fontFamily: "font-sans",
    headingFont: "font-sans",
    headingStyle: "text-base font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400",
    headingBorder: "border-b border-blue-200 dark:border-blue-800",
    sectionSpacing: "space-y-6",
    bulletStyle: "list-none",
    headerStyle: "text-center pb-4 border-b border-blue-200 dark:border-blue-800",
    accentColor: "text-blue-700 dark:text-blue-400",
    cardStyle: "p-10",
  },
  minimal: {
    name: "Minimal",
    description: "Ultra-clean whitespace",
    fontFamily: "font-sans",
    headingFont: "font-sans",
    headingStyle: "text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground",
    headingBorder: "border-b border-border/50",
    sectionSpacing: "space-y-8",
    bulletStyle: "list-none",
    headerStyle: "text-center pb-6",
    accentColor: "text-muted-foreground",
    cardStyle: "p-16",
  },
  professional: {
    name: "Professional",
    description: "Bold headers, structured layout",
    fontFamily: "font-sans",
    headingFont: "font-sans",
    headingStyle: "text-base font-bold uppercase tracking-wide",
    headingBorder: "border-b-2 border-foreground bg-muted/30 -mx-2 px-2 py-1",
    sectionSpacing: "space-y-5",
    bulletStyle: "list-disc list-inside",
    headerStyle: "text-center pb-4 border-b-2 border-foreground",
    accentColor: "text-foreground",
    cardStyle: "p-10",
  },
}

export function getTemplateOptions(): Array<{ value: TemplateName; label: string; description: string }> {
  return Object.entries(templates).map(([key, config]) => ({
    value: key as TemplateName,
    label: config.name,
    description: config.description,
  }))
}

function parseInlineMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class=\"bg-muted px-0.5 rounded text-xs font-mono\">$1</code>")
}

interface EditableTextProps {
  value: string
  onChange: (val: string) => void
  className?: string
  multiline?: boolean
  renderMarkdown?: boolean
}

function EditableText({ value, onChange, className, multiline, renderMarkdown }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus()
      // Place cursor at end
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(ref.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [isEditing])

  // Sync external value into DOM when not editing
  useEffect(() => {
    const el = ref.current
    if (!el || isEditing) return
    if (el.textContent !== value) {
      el.textContent = value
    }
  }, [value, isEditing])

  if (!isEditing) {
    return (
      <span
        onClick={() => setIsEditing(true)}
        className={`cursor-text rounded px-0.5 -mx-0.5 hover:bg-slate-50 transition-colors${className ? ` ${className}` : ""}`}
        dangerouslySetInnerHTML={{ __html: renderMarkdown ? parseInlineMarkdown(value) : value }}
      />
    )
  }

  const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    setIsEditing(false)
    onChange(e.currentTarget.textContent || "")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  return (
    <span
      ref={ref}
      contentEditable="true"
      suppressContentEditableWarning={true}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      dangerouslySetInnerHTML={{ __html: value }}
      className={`outline-none bg-slate-50 rounded px-0.5 -mx-0.5${className ? ` ${className}` : ""}`}
    />
  )
}

interface ResumeRendererProps {
  documentContent: DocumentContent
  template: TemplateName
  onMouseUp: (e: React.MouseEvent) => void
  isTextHighlighted: (text: string) => boolean
  onUpdate: (updated: DocumentContent) => void
}

export function ResumeRenderer({ documentContent, template, onMouseUp, isTextHighlighted, onUpdate }: ResumeRendererProps) {
  const t = templates[template]
  const isModernBullet = t.bulletStyle === "list-none"

  // Helper to produce a deep-copied DocumentContent with a top-level scalar field replaced.
  const updateField = <K extends keyof DocumentContent>(field: K, val: DocumentContent[K]): DocumentContent => ({
    ...documentContent,
    [field]: val,
  })

  return (
    <div className="flex-1 p-8 overflow-auto bg-muted/20" onMouseUp={onMouseUp}>
      <Card
        className={`max-w-4xl mx-auto min-h-[800px] bg-background shadow-lg select-text cursor-text ${t.fontFamily} ${t.cardStyle}`}
      >
        <div className={t.sectionSpacing}>
          {/* Header Section */}
          <div id="section-header" className={t.headerStyle}>
            <h1 className={`text-3xl font-bold mb-1 text-foreground ${t.headingFont}`}>
              <EditableText
                value={documentContent.name}
                onChange={(val) => onUpdate(updateField("name", val))}
              />
            </h1>
            <p className="text-muted-foreground mb-1">
              <EditableText
                value={documentContent.title}
                onChange={(val) => onUpdate(updateField("title", val))}
              />
            </p>
            <p className="text-sm text-muted-foreground">
              <EditableText
                value={documentContent.contact}
                onChange={(val) => onUpdate(updateField("contact", val))}
              />
            </p>
          </div>

          {/* Education Section */}
          <div id="section-education">
            <h2 className={`${t.headingStyle} ${t.headingBorder} mb-3`}>Education</h2>
            <div className="space-y-3">
              {documentContent.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div>
                    <div className="font-semibold text-foreground">
                      <EditableText
                        value={edu.school}
                        onChange={(val) => {
                          const education = documentContent.education.map((e, i) =>
                            i === idx ? { ...e, school: val } : e
                          )
                          onUpdate({ ...documentContent, education })
                        }}
                      />
                    </div>
                    <div className="text-muted-foreground">
                      <EditableText
                        value={edu.degree}
                        onChange={(val) => {
                          const education = documentContent.education.map((e, i) =>
                            i === idx ? { ...e, degree: val } : e
                          )
                          onUpdate({ ...documentContent, education })
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <div>
                      <EditableText
                        value={edu.location}
                        onChange={(val) => {
                          const education = documentContent.education.map((e, i) =>
                            i === idx ? { ...e, location: val } : e
                          )
                          onUpdate({ ...documentContent, education })
                        }}
                      />
                    </div>
                    <div>
                      <EditableText
                        value={edu.period}
                        onChange={(val) => {
                          const education = documentContent.education.map((e, i) =>
                            i === idx ? { ...e, period: val } : e
                          )
                          onUpdate({ ...documentContent, education })
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Section */}
          <div id="section-experience">
            <h2 className={`${t.headingStyle} ${t.headingBorder} mb-3`}>Experience</h2>
            <div className="space-y-4">
              {documentContent.experience.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <div className="font-semibold text-foreground">
                      <EditableText
                        value={exp.role}
                        onChange={(val) => {
                          const experience = documentContent.experience.map((e, i) =>
                            i === idx ? { ...e, role: val } : e
                          )
                          onUpdate({ ...documentContent, experience })
                        }}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <EditableText
                        value={exp.period}
                        onChange={(val) => {
                          const experience = documentContent.experience.map((e, i) =>
                            i === idx ? { ...e, period: val } : e
                          )
                          onUpdate({ ...documentContent, experience })
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between mb-2">
                    <div className="text-sm text-muted-foreground italic">
                      <EditableText
                        value={exp.company}
                        onChange={(val) => {
                          const experience = documentContent.experience.map((e, i) =>
                            i === idx ? { ...e, company: val } : e
                          )
                          onUpdate({ ...documentContent, experience })
                        }}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground italic">
                      <EditableText
                        value={exp.location}
                        onChange={(val) => {
                          const experience = documentContent.experience.map((e, i) =>
                            i === idx ? { ...e, location: val } : e
                          )
                          onUpdate({ ...documentContent, experience })
                        }}
                      />
                    </div>
                  </div>
                  <ul className={`${t.bulletStyle} text-sm space-y-1 text-foreground/80`}>
                    {exp.bullets.map((bullet, bidx) => (
                      <li
                        key={bidx}
                        className={`transition-all duration-300 ${
                          isModernBullet ? "pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-muted-foreground" : ""
                        } ${
                          isTextHighlighted(bullet)
                            ? "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 pl-2 py-1"
                            : ""
                        }`}
                      >
                        <EditableText
                          value={bullet}
                          multiline={true}
                          renderMarkdown={true}
                          onChange={(val) => {
                            const experience = documentContent.experience.map((e, i) =>
                              i === idx
                                ? { ...e, bullets: e.bullets.map((b, bi) => (bi === bidx ? val : b)) }
                                : e
                            )
                            onUpdate({ ...documentContent, experience })
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Projects Section */}
          <div id="section-projects">
            <h2 className={`${t.headingStyle} ${t.headingBorder} mb-3`}>Projects</h2>
            <div className="space-y-4">
              {documentContent.projects.map((proj, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <div className="font-semibold text-foreground">
                      <EditableText
                        value={proj.name}
                        onChange={(val) => {
                          const projects = documentContent.projects.map((p, i) =>
                            i === idx ? { ...p, name: val } : p
                          )
                          onUpdate({ ...documentContent, projects })
                        }}
                      />{" "}
                      <span className={`font-normal ${t.accentColor} text-sm`}>
                        |{" "}
                        <EditableText
                          value={proj.tech}
                          onChange={(val) => {
                            const projects = documentContent.projects.map((p, i) =>
                              i === idx ? { ...p, tech: val } : p
                            )
                            onUpdate({ ...documentContent, projects })
                          }}
                        />
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <EditableText
                        value={proj.period}
                        onChange={(val) => {
                          const projects = documentContent.projects.map((p, i) =>
                            i === idx ? { ...p, period: val } : p
                          )
                          onUpdate({ ...documentContent, projects })
                        }}
                      />
                    </div>
                  </div>
                  <ul className={`${t.bulletStyle} text-sm space-y-1 text-foreground/80`}>
                    {proj.bullets.map((bullet, bidx) => (
                      <li
                        key={bidx}
                        className={`transition-all duration-300 ${
                          isModernBullet ? "pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-muted-foreground" : ""
                        } ${
                          isTextHighlighted(bullet)
                            ? "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 pl-2 py-1"
                            : ""
                        }`}
                      >
                        <EditableText
                          value={bullet}
                          multiline={true}
                          renderMarkdown={true}
                          onChange={(val) => {
                            const projects = documentContent.projects.map((p, i) =>
                              i === idx
                                ? { ...p, bullets: p.bullets.map((b, bi) => (bi === bidx ? val : b)) }
                                : p
                            )
                            onUpdate({ ...documentContent, projects })
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Leadership Section */}
          {documentContent.leadership && documentContent.leadership.length > 0 && (
            <div id="section-leadership">
              <h2 className={`${t.headingStyle} ${t.headingBorder} mb-3`}>Leadership</h2>
              <div className="space-y-4">
                {documentContent.leadership.map((lead, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <div className="font-semibold text-foreground">
                        <EditableText
                          value={lead.role}
                          onChange={(val) => {
                            const leadership = documentContent.leadership!.map((l, i) =>
                              i === idx ? { ...l, role: val } : l
                            )
                            onUpdate({ ...documentContent, leadership })
                          }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <EditableText
                          value={lead.period}
                          onChange={(val) => {
                            const leadership = documentContent.leadership!.map((l, i) =>
                              i === idx ? { ...l, period: val } : l
                            )
                            onUpdate({ ...documentContent, leadership })
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mb-2">
                      <div className="text-sm text-muted-foreground italic">
                        <EditableText
                          value={lead.organization}
                          onChange={(val) => {
                            const leadership = documentContent.leadership!.map((l, i) =>
                              i === idx ? { ...l, organization: val } : l
                            )
                            onUpdate({ ...documentContent, leadership })
                          }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground italic">
                        <EditableText
                          value={lead.location}
                          onChange={(val) => {
                            const leadership = documentContent.leadership!.map((l, i) =>
                              i === idx ? { ...l, location: val } : l
                            )
                            onUpdate({ ...documentContent, leadership })
                          }}
                        />
                      </div>
                    </div>
                    <ul className={`${t.bulletStyle} text-sm space-y-1 text-foreground/80`}>
                      {lead.bullets.map((bullet, bidx) => (
                        <li
                          key={bidx}
                          className={`transition-all duration-300 ${
                            isModernBullet ? "pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-muted-foreground" : ""
                          } ${
                            isTextHighlighted(bullet)
                              ? "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 pl-2 py-1"
                              : ""
                          }`}
                        >
                          <EditableText
                            value={bullet}
                            multiline={true}
                            renderMarkdown={true}
                            onChange={(val) => {
                              const leadership = documentContent.leadership!.map((l, i) =>
                                i === idx
                                  ? { ...l, bullets: l.bullets.map((b, bi) => (bi === bidx ? val : b)) }
                                  : l
                              )
                              onUpdate({ ...documentContent, leadership })
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Section */}
          <div id="section-skills">
            <h2 className={`${t.headingStyle} ${t.headingBorder} mb-3`}>Technical Skills</h2>
            <div className="text-sm text-foreground/80">
              {template === "modern" ? (
                <div className="grid grid-cols-2 gap-2">
                  {documentContent.skills.split("|").map((group, idx) => {
                    const [category, ...items] = group.split(":")
                    return (
                      <div key={idx}>
                        <span className="font-medium text-foreground">{category?.trim()}:</span>{" "}
                        <span className="text-muted-foreground">{items.join(":").trim()}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EditableText
                  value={documentContent.skills}
                  multiline={true}
                  onChange={(val) => onUpdate(updateField("skills", val))}
                />
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
