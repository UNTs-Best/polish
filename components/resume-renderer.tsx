"use client"

import type React from "react"
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
}

export function ResumeRenderer({ documentContent, template, onMouseUp, isTextHighlighted }: ResumeRendererProps) {
  const t = templates[template]
  const isModernBullet = t.bulletStyle === "list-none"

  return (
    <div className="flex-1 p-8 overflow-auto bg-muted/20" onMouseUp={onMouseUp}>
      <Card
        className={`max-w-4xl mx-auto min-h-[800px] bg-background shadow-lg select-text cursor-text ${t.fontFamily} ${t.cardStyle}`}
      >
        <div className={t.sectionSpacing}>
          {/* Header Section */}
          <div id="section-header" className={t.headerStyle}>
            <h1 className={`text-3xl font-bold mb-1 text-foreground ${t.headingFont}`}>{documentContent.name}</h1>
            <p className="text-muted-foreground mb-1">{documentContent.title}</p>
            <p className="text-sm text-muted-foreground">{documentContent.contact}</p>
          </div>

          {/* Education Section */}
          <div id="section-education">
            <h2 className={`${t.headingStyle} ${t.headingBorder} mb-3`}>Education</h2>
            <div className="space-y-3">
              {documentContent.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div>
                    <div className="font-semibold text-foreground">{edu.school}</div>
                    <div className="text-muted-foreground">{edu.degree}</div>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <div>{edu.location}</div>
                    <div>{edu.period}</div>
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
                    <div className="font-semibold text-foreground">{exp.role}</div>
                    <div className="text-sm text-muted-foreground">{exp.period}</div>
                  </div>
                  <div className="flex justify-between mb-2">
                    <div className="text-sm text-muted-foreground italic">{exp.company}</div>
                    <div className="text-sm text-muted-foreground italic">{exp.location}</div>
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
                        {bullet}
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
                      {proj.name}{" "}
                      <span className={`font-normal ${t.accentColor} text-sm`}>| {proj.tech}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{proj.period}</div>
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
                        {bullet}
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
                      <div className="font-semibold text-foreground">{lead.role}</div>
                      <div className="text-sm text-muted-foreground">{lead.period}</div>
                    </div>
                    <div className="flex justify-between mb-2">
                      <div className="text-sm text-muted-foreground italic">{lead.organization}</div>
                      <div className="text-sm text-muted-foreground italic">{lead.location}</div>
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
                          {bullet}
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
                documentContent.skills
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
