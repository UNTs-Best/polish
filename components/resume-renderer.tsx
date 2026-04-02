"use client"

import type React from "react"
import { useCallback } from "react"
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

interface ResumeRendererProps {
  documentContent: DocumentContent
  template: TemplateName
  onMouseUp: (e: React.MouseEvent) => void
  isTextHighlighted: (text: string) => boolean
  onContentChange?: (content: DocumentContent) => void
}

function EditableSpan({
  value,
  onCommit,
  className,
  placeholder,
  tag: Tag = "span",
  onEnter,
  onDeleteEmpty,
}: {
  value: string
  onCommit: (v: string) => void
  className?: string
  placeholder?: string
  tag?: "span" | "div" | "h1" | "p" | "li"
  onEnter?: () => void
  onDeleteEmpty?: () => void
}) {
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLElement>) => {
      const text = e.currentTarget.textContent ?? ""
      if (text !== value) onCommit(text)
    },
    [value, onCommit],
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      // Commit current text first
      const text = e.currentTarget.textContent ?? ""
      if (text !== value) onCommit(text)
      if (onEnter) {
        onEnter()
      } else {
        e.currentTarget.blur()
      }
    }
    if (e.key === "Backspace" && onDeleteEmpty) {
      const text = e.currentTarget.textContent ?? ""
      if (text === "") {
        e.preventDefault()
        onDeleteEmpty()
      }
    }
  }, [value, onCommit, onEnter, onDeleteEmpty])

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`outline-none rounded-sm focus:ring-2 focus:ring-primary/30 focus:bg-primary/5 transition-colors cursor-text ${className ?? ""}`}
      data-placeholder={placeholder}
      style={!value ? { minWidth: "4rem", display: "inline-block" } : undefined}
    >
      {value}
    </Tag>
  )
}

export function ResumeRenderer({
  documentContent,
  template,
  onMouseUp,
  isTextHighlighted,
  onContentChange,
}: ResumeRendererProps) {
  const t = templates[template]
  const isModernBullet = t.bulletStyle === "list-none"

  const update = useCallback(
    (fn: (prev: DocumentContent) => DocumentContent) => {
      onContentChange?.(fn(documentContent))
    },
    [documentContent, onContentChange],
  )

  const editable = !!onContentChange

  const renderText = (
    value: string,
    commit: (v: string) => void,
    className?: string,
    placeholder?: string,
    tag?: "span" | "div" | "h1" | "p" | "li",
  ) => {
    if (!editable) {
      if (tag === "h1") return <h1 className={className}>{value}</h1>
      if (tag === "p") return <p className={className}>{value}</p>
      if (tag === "div") return <div className={className}>{value}</div>
      if (tag === "li") return <li className={className}>{value}</li>
      return <span className={className}>{value}</span>
    }
    return <EditableSpan value={value} onCommit={commit} className={className} placeholder={placeholder} tag={tag} />
  }

  return (
    <div className="flex-1 p-3 sm:p-5 lg:p-8 overflow-auto bg-muted/20" onMouseUp={onMouseUp}>
      <Card
        className={`max-w-4xl mx-auto min-h-[800px] bg-background shadow-lg select-text cursor-text ${t.fontFamily} ${t.cardStyle} max-sm:p-4`}
      >
        <div className={t.sectionSpacing}>
          {/* Header Section */}
          <div id="section-header" className={t.headerStyle}>
            {renderText(
              documentContent.name,
              (v) => update((p) => ({ ...p, name: v })),
              `text-3xl font-bold mb-1 text-foreground ${t.headingFont}`,
              "Your Name",
              "h1",
            )}
            {renderText(
              documentContent.title,
              (v) => update((p) => ({ ...p, title: v })),
              "text-muted-foreground mb-1",
              "Job Title",
              "p",
            )}
            {renderText(
              documentContent.contact,
              (v) => update((p) => ({ ...p, contact: v })),
              "text-sm text-muted-foreground",
              "email@example.com | (555) 123-4567",
              "p",
            )}
          </div>

          {/* Education Section */}
          <div id="section-education">
            <h2 className={`${t.headingStyle} ${t.headingBorder} mb-3`}>Education</h2>
            <div className="space-y-3">
              {documentContent.education.map((edu, idx) => (
                <div key={idx} className="flex flex-col gap-1 sm:flex-row sm:justify-between text-sm">
                  <div>
                    {renderText(
                      edu.school,
                      (v) =>
                        update((p) => ({
                          ...p,
                          education: p.education.map((e, i) => (i === idx ? { ...e, school: v } : e)),
                        })),
                      "font-semibold text-foreground",
                      "School Name",
                      "div",
                    )}
                    {renderText(
                      edu.degree,
                      (v) =>
                        update((p) => ({
                          ...p,
                          education: p.education.map((e, i) => (i === idx ? { ...e, degree: v } : e)),
                        })),
                      "text-muted-foreground",
                      "Degree",
                      "div",
                    )}
                  </div>
                  <div className="text-left sm:text-right text-muted-foreground">
                    {renderText(
                      edu.location,
                      (v) =>
                        update((p) => ({
                          ...p,
                          education: p.education.map((e, i) => (i === idx ? { ...e, location: v } : e)),
                        })),
                      undefined,
                      "Location",
                      "div",
                    )}
                    {renderText(
                      edu.period,
                      (v) =>
                        update((p) => ({
                          ...p,
                          education: p.education.map((e, i) => (i === idx ? { ...e, period: v } : e)),
                        })),
                      undefined,
                      "Period",
                      "div",
                    )}
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
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between mb-1">
                    {renderText(
                      exp.role,
                      (v) =>
                        update((p) => ({
                          ...p,
                          experience: p.experience.map((e, i) => (i === idx ? { ...e, role: v } : e)),
                        })),
                      "font-semibold text-foreground",
                      "Role Title",
                      "div",
                    )}
                    {renderText(
                      exp.period,
                      (v) =>
                        update((p) => ({
                          ...p,
                          experience: p.experience.map((e, i) => (i === idx ? { ...e, period: v } : e)),
                        })),
                      "text-sm text-muted-foreground",
                      "Period",
                      "div",
                    )}
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between mb-2">
                    {renderText(
                      exp.company,
                      (v) =>
                        update((p) => ({
                          ...p,
                          experience: p.experience.map((e, i) => (i === idx ? { ...e, company: v } : e)),
                        })),
                      "text-sm text-muted-foreground italic",
                      "Company",
                      "div",
                    )}
                    {renderText(
                      exp.location,
                      (v) =>
                        update((p) => ({
                          ...p,
                          experience: p.experience.map((e, i) => (i === idx ? { ...e, location: v } : e)),
                        })),
                      "text-sm text-muted-foreground italic",
                      "Location",
                      "div",
                    )}
                  </div>
                  <ul className={`${t.bulletStyle} text-sm space-y-1 text-foreground/80`}>
                    {exp.bullets.map((bullet, bidx) => {
                      const highlighted = isTextHighlighted(bullet)
                      const bulletCls = `transition-all duration-300 ${
                        isModernBullet
                          ? "pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-muted-foreground"
                          : ""
                      } ${highlighted ? "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 pl-2 py-1" : ""}`

                      if (!editable) {
                        return (
                          <li key={bidx} className={bulletCls}>
                            {bullet}
                          </li>
                        )
                      }

                      return (
                        <EditableSpan
                          key={bidx}
                          tag="li"
                          value={bullet}
                          onCommit={(v) =>
                            update((p) => ({
                              ...p,
                              experience: p.experience.map((e, i) =>
                                i === idx
                                  ? { ...e, bullets: e.bullets.map((b, bi) => (bi === bidx ? v : b)) }
                                  : e,
                              ),
                            }))
                          }
                          onEnter={() =>
                            update((p) => ({
                              ...p,
                              experience: p.experience.map((e, i) =>
                                i === idx
                                  ? { ...e, bullets: [...e.bullets.slice(0, bidx + 1), "", ...e.bullets.slice(bidx + 1)] }
                                  : e,
                              ),
                            }))
                          }
                          onDeleteEmpty={() =>
                            update((p) => ({
                              ...p,
                              experience: p.experience.map((e, i) =>
                                i === idx
                                  ? { ...e, bullets: e.bullets.length > 1 ? e.bullets.filter((_, bi) => bi !== bidx) : e.bullets }
                                  : e,
                              ),
                            }))
                          }
                          className={bulletCls}
                          placeholder="Add bullet point..."
                        />
                      )
                    })}
                  </ul>
                  {editable && (
                    <button
                      onClick={() =>
                        update((p) => ({
                          ...p,
                          experience: p.experience.map((e, i) =>
                            i === idx ? { ...e, bullets: [...e.bullets, ""] } : e,
                          ),
                        }))
                      }
                      className="text-xs text-muted-foreground hover:text-foreground mt-1 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                    >
                      + Add bullet
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Projects Section */}
          {documentContent.projects.length > 0 && (
            <div id="section-projects">
              <h2 className={`${t.headingStyle} ${t.headingBorder} mb-3`}>Projects</h2>
              <div className="space-y-4">
                {documentContent.projects.map((proj, idx) => (
                  <div key={idx}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between mb-1">
                      <div className="font-semibold text-foreground">
                        {editable ? (
                          <>
                            <EditableSpan
                              value={proj.name}
                              onCommit={(v) =>
                                update((p) => ({
                                  ...p,
                                  projects: p.projects.map((pr, i) => (i === idx ? { ...pr, name: v } : pr)),
                                }))
                              }
                              placeholder="Project Name"
                            />{" "}
                            <span className={`font-normal ${t.accentColor} text-sm`}>
                              |{" "}
                              <EditableSpan
                                value={proj.tech}
                                onCommit={(v) =>
                                  update((p) => ({
                                    ...p,
                                    projects: p.projects.map((pr, i) => (i === idx ? { ...pr, tech: v } : pr)),
                                  }))
                                }
                                placeholder="Technologies"
                              />
                            </span>
                          </>
                        ) : (
                          <>
                            {proj.name}{" "}
                            <span className={`font-normal ${t.accentColor} text-sm`}>| {proj.tech}</span>
                          </>
                        )}
                      </div>
                      {renderText(
                        proj.period,
                        (v) =>
                          update((p) => ({
                            ...p,
                            projects: p.projects.map((pr, i) => (i === idx ? { ...pr, period: v } : pr)),
                          })),
                        "text-sm text-muted-foreground sm:text-right",
                        "Period",
                        "div",
                      )}
                    </div>
                    <ul className={`${t.bulletStyle} text-sm space-y-1 text-foreground/80`}>
                      {proj.bullets.map((bullet, bidx) => {
                        const highlighted = isTextHighlighted(bullet)
                        const bulletCls = `transition-all duration-300 ${
                          isModernBullet
                            ? "pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-muted-foreground"
                            : ""
                        } ${highlighted ? "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 pl-2 py-1" : ""}`

                        if (!editable) {
                          return (
                            <li key={bidx} className={bulletCls}>
                              {bullet}
                            </li>
                          )
                        }

                        return (
                          <EditableSpan
                            key={bidx}
                            tag="li"
                            value={bullet}
                            onCommit={(v) =>
                              update((p) => ({
                                ...p,
                                projects: p.projects.map((pr, i) =>
                                  i === idx
                                    ? { ...pr, bullets: pr.bullets.map((b, bi) => (bi === bidx ? v : b)) }
                                    : pr,
                                ),
                              }))
                            }
                            onEnter={() =>
                              update((p) => ({
                                ...p,
                                projects: p.projects.map((pr, i) =>
                                  i === idx
                                    ? { ...pr, bullets: [...pr.bullets.slice(0, bidx + 1), "", ...pr.bullets.slice(bidx + 1)] }
                                    : pr,
                                ),
                              }))
                            }
                            onDeleteEmpty={() =>
                              update((p) => ({
                                ...p,
                                projects: p.projects.map((pr, i) =>
                                  i === idx
                                    ? { ...pr, bullets: pr.bullets.length > 1 ? pr.bullets.filter((_, bi) => bi !== bidx) : pr.bullets }
                                    : pr,
                                ),
                              }))
                            }
                            className={bulletCls}
                            placeholder="Add bullet point..."
                          />
                        )
                      })}
                    </ul>
                    {editable && (
                      <button
                        onClick={() =>
                          update((p) => ({
                            ...p,
                            projects: p.projects.map((pr, i) =>
                              i === idx ? { ...pr, bullets: [...pr.bullets, ""] } : pr,
                            ),
                          }))
                        }
                        className="text-xs text-muted-foreground hover:text-foreground mt-1 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                      >
                        + Add bullet
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leadership Section */}
          {documentContent.leadership && documentContent.leadership.length > 0 && (
            <div id="section-leadership">
              <h2 className={`${t.headingStyle} ${t.headingBorder} mb-3`}>Leadership</h2>
              <div className="space-y-4">
                {documentContent.leadership.map((lead, idx) => (
                  <div key={idx}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between mb-1">
                      {renderText(
                        lead.role,
                        (v) =>
                          update((p) => ({
                            ...p,
                            leadership: p.leadership?.map((l, i) => (i === idx ? { ...l, role: v } : l)),
                          })),
                        "font-semibold text-foreground",
                        "Role",
                        "div",
                      )}
                      {renderText(
                        lead.period,
                        (v) =>
                          update((p) => ({
                            ...p,
                            leadership: p.leadership?.map((l, i) => (i === idx ? { ...l, period: v } : l)),
                          })),
                        "text-sm text-muted-foreground",
                        "Period",
                        "div",
                      )}
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between mb-2">
                      {renderText(
                        lead.organization,
                        (v) =>
                          update((p) => ({
                            ...p,
                            leadership: p.leadership?.map((l, i) =>
                              i === idx ? { ...l, organization: v } : l,
                            ),
                          })),
                        "text-sm text-muted-foreground italic",
                        "Organization",
                        "div",
                      )}
                      {renderText(
                        lead.location,
                        (v) =>
                          update((p) => ({
                            ...p,
                            leadership: p.leadership?.map((l, i) =>
                              i === idx ? { ...l, location: v } : l,
                            ),
                          })),
                        "text-sm text-muted-foreground italic",
                        "Location",
                        "div",
                      )}
                    </div>
                    <ul className={`${t.bulletStyle} text-sm space-y-1 text-foreground/80`}>
                      {lead.bullets.map((bullet, bidx) => {
                        const highlighted = isTextHighlighted(bullet)
                        const bulletCls = `transition-all duration-300 ${
                          isModernBullet
                            ? "pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-muted-foreground"
                            : ""
                        } ${highlighted ? "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 pl-2 py-1" : ""}`

                        if (!editable) {
                          return (
                            <li key={bidx} className={bulletCls}>
                              {bullet}
                            </li>
                          )
                        }

                        return (
                          <EditableSpan
                            key={bidx}
                            tag="li"
                            value={bullet}
                            onCommit={(v) =>
                              update((p) => ({
                                ...p,
                                leadership: p.leadership?.map((l, i) =>
                                  i === idx
                                    ? { ...l, bullets: l.bullets.map((b, bi) => (bi === bidx ? v : b)) }
                                    : l,
                                ),
                              }))
                            }
                            onEnter={() =>
                              update((p) => ({
                                ...p,
                                leadership: p.leadership?.map((l, i) =>
                                  i === idx
                                    ? { ...l, bullets: [...l.bullets.slice(0, bidx + 1), "", ...l.bullets.slice(bidx + 1)] }
                                    : l,
                                ),
                              }))
                            }
                            onDeleteEmpty={() =>
                              update((p) => ({
                                ...p,
                                leadership: p.leadership?.map((l, i) =>
                                  i === idx
                                    ? { ...l, bullets: l.bullets.length > 1 ? l.bullets.filter((_, bi) => bi !== bidx) : l.bullets }
                                    : l,
                                ),
                              }))
                            }
                            className={bulletCls}
                            placeholder="Add bullet point..."
                          />
                        )
                      })}
                    </ul>
                    {editable && (
                      <button
                        onClick={() =>
                          update((p) => ({
                            ...p,
                            leadership: p.leadership?.map((l, i) =>
                              i === idx ? { ...l, bullets: [...l.bullets, ""] } : l,
                            ),
                          }))
                        }
                        className="text-xs text-muted-foreground hover:text-foreground mt-1 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                      >
                        + Add bullet
                      </button>
                    )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              ) : editable ? (
                <EditableSpan
                  tag="div"
                  value={documentContent.skills}
                  onCommit={(v) => update((p) => ({ ...p, skills: v }))}
                  placeholder="Languages: ... | Frameworks: ... | Tools: ..."
                />
              ) : (
                documentContent.skills
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
