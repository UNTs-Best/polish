"use client"

import type React from "react"
import { useRef, useEffect, useCallback } from "react"

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

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function buildResumeHtml(
  doc: DocumentContent,
  template: TemplateName,
  t: TemplateConfig,
  isHighlighted: (text: string) => boolean,
): string {
  const isModernBullet = t.bulletStyle === "list-none"

  const bulletLi = (text: string, idx: number): string => {
    const highlighted = isHighlighted(text)
    const modernClass = isModernBullet ? "pl-4 relative" : ""
    const highlightClass = highlighted
      ? "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 pl-2 py-1"
      : ""
    const dash = isModernBullet
      ? `<span class="absolute left-0 text-muted-foreground" contenteditable="false">—</span>`
      : ""
    return `<li class="transition-all duration-300 ${modernClass} ${highlightClass}">${dash}<span data-bullet="${idx}">${esc(text)}</span></li>`
  }

  const educationHtml = doc.education
    .map(
      (edu, i) => `
    <div data-edu="${i}" class="flex justify-between text-sm">
      <div>
        <div class="font-semibold text-foreground"><span data-field="school">${esc(edu.school)}</span></div>
        <div class="text-muted-foreground"><span data-field="degree">${esc(edu.degree)}</span></div>
      </div>
      <div class="text-right text-muted-foreground">
        <div><span data-field="edu-location">${esc(edu.location)}</span></div>
        <div><span data-field="edu-period">${esc(edu.period)}</span></div>
      </div>
    </div>`,
    )
    .join("")

  const experienceHtml = doc.experience
    .map(
      (exp, i) => `
    <div data-exp="${i}">
      <div class="flex justify-between mb-1">
        <div class="font-semibold text-foreground"><span data-field="role">${esc(exp.role)}</span></div>
        <div class="text-sm text-muted-foreground"><span data-field="exp-period">${esc(exp.period)}</span></div>
      </div>
      <div class="flex justify-between mb-2">
        <div class="text-sm text-muted-foreground italic"><span data-field="company">${esc(exp.company)}</span></div>
        <div class="text-sm text-muted-foreground italic"><span data-field="exp-location">${esc(exp.location)}</span></div>
      </div>
      <ul class="${t.bulletStyle} text-sm space-y-1 text-foreground/80">
        ${exp.bullets.map((b, bi) => bulletLi(b, bi)).join("")}
      </ul>
    </div>`,
    )
    .join("")

  const projectsHtml = doc.projects
    .map(
      (proj, i) => `
    <div data-proj="${i}">
      <div class="flex justify-between mb-1">
        <div class="font-semibold text-foreground">
          <span data-field="proj-name">${esc(proj.name)}</span>
          <span class="font-normal ${t.accentColor} text-sm"> | <span data-field="tech">${esc(proj.tech)}</span></span>
        </div>
        <div class="text-sm text-muted-foreground"><span data-field="proj-period">${esc(proj.period)}</span></div>
      </div>
      <ul class="${t.bulletStyle} text-sm space-y-1 text-foreground/80">
        ${proj.bullets.map((b, bi) => bulletLi(b, bi)).join("")}
      </ul>
    </div>`,
    )
    .join("")

  const leadershipHtml =
    doc.leadership && doc.leadership.length > 0
      ? `<div id="section-leadership">
      <h2 class="${t.headingStyle} ${t.headingBorder} mb-3">Leadership</h2>
      <div class="space-y-4">
        ${doc.leadership
          .map(
            (lead, i) => `
          <div data-lead="${i}">
            <div class="flex justify-between mb-1">
              <div class="font-semibold text-foreground"><span data-field="lead-role">${esc(lead.role)}</span></div>
              <div class="text-sm text-muted-foreground"><span data-field="lead-period">${esc(lead.period)}</span></div>
            </div>
            <div class="flex justify-between mb-2">
              <div class="text-sm text-muted-foreground italic"><span data-field="organization">${esc(lead.organization)}</span></div>
              <div class="text-sm text-muted-foreground italic"><span data-field="lead-location">${esc(lead.location)}</span></div>
            </div>
            <ul class="${t.bulletStyle} text-sm space-y-1 text-foreground/80">
              ${lead.bullets.map((b, bi) => bulletLi(b, bi)).join("")}
            </ul>
          </div>`,
          )
          .join("")}
      </div>
    </div>`
      : ""

  const skillsHtml =
    template === "modern"
      ? `<div class="grid grid-cols-2 gap-2">${doc.skills
          .split("|")
          .map((group) => {
            const [cat, ...rest] = group.split(":")
            return `<div><span class="font-medium text-foreground">${esc(cat?.trim())}:</span> <span class="text-muted-foreground">${esc(rest.join(":").trim())}</span></div>`
          })
          .join("")}</div>`
      : `<span data-field="skills">${esc(doc.skills)}</span>`

  return `<div class="${t.sectionSpacing}">
    <div id="section-header" class="${t.headerStyle}">
      <h1 class="text-3xl font-bold mb-1 text-foreground ${t.headingFont}"><span data-field="name">${esc(doc.name)}</span></h1>
      <p class="text-muted-foreground mb-1"><span data-field="title">${esc(doc.title)}</span></p>
      <p class="text-sm text-muted-foreground"><span data-field="contact">${esc(doc.contact)}</span></p>
    </div>

    <div id="section-education">
      <h2 class="${t.headingStyle} ${t.headingBorder} mb-3">Education</h2>
      <div class="space-y-3">${educationHtml}</div>
    </div>

    <div id="section-experience">
      <h2 class="${t.headingStyle} ${t.headingBorder} mb-3">Experience</h2>
      <div class="space-y-4">${experienceHtml}</div>
    </div>

    <div id="section-projects">
      <h2 class="${t.headingStyle} ${t.headingBorder} mb-3">Projects</h2>
      <div class="space-y-4">${projectsHtml}</div>
    </div>

    ${leadershipHtml}

    <div id="section-skills">
      <h2 class="${t.headingStyle} ${t.headingBorder} mb-3">Technical Skills</h2>
      <div class="text-sm text-foreground/80">${skillsHtml}</div>
    </div>
  </div>`
}

function parseDom(el: HTMLElement, fallback: DocumentContent): DocumentContent {
  const text = (scope: Element | null, sel: string) =>
    scope?.querySelector(sel)?.textContent?.trim() || ""

  const header = el.querySelector("#section-header")
  const eduSection = el.querySelector("#section-education")
  const expSection = el.querySelector("#section-experience")
  const projSection = el.querySelector("#section-projects")
  const leadSection = el.querySelector("#section-leadership")
  const skillsSection = el.querySelector("#section-skills")

  return {
    name: text(header, '[data-field="name"]'),
    title: text(header, '[data-field="title"]'),
    contact: text(header, '[data-field="contact"]'),
    education: Array.from(eduSection?.querySelectorAll("[data-edu]") ?? []).map((entry) => ({
      school: text(entry, '[data-field="school"]'),
      degree: text(entry, '[data-field="degree"]'),
      location: text(entry, '[data-field="edu-location"]'),
      period: text(entry, '[data-field="edu-period"]'),
    })),
    experience: Array.from(expSection?.querySelectorAll("[data-exp]") ?? []).map((entry) => ({
      role: text(entry, '[data-field="role"]'),
      company: text(entry, '[data-field="company"]'),
      location: text(entry, '[data-field="exp-location"]'),
      period: text(entry, '[data-field="exp-period"]'),
      bullets: Array.from(entry.querySelectorAll("[data-bullet]")).map((b) => b.textContent?.trim() || ""),
    })),
    projects: Array.from(projSection?.querySelectorAll("[data-proj]") ?? []).map((entry) => ({
      name: text(entry, '[data-field="proj-name"]'),
      tech: text(entry, '[data-field="tech"]'),
      period: text(entry, '[data-field="proj-period"]'),
      bullets: Array.from(entry.querySelectorAll("[data-bullet]")).map((b) => b.textContent?.trim() || ""),
    })),
    leadership: leadSection
      ? Array.from(leadSection.querySelectorAll("[data-lead]")).map((entry) => ({
          role: text(entry, '[data-field="lead-role"]'),
          organization: text(entry, '[data-field="organization"]'),
          location: text(entry, '[data-field="lead-location"]'),
          period: text(entry, '[data-field="lead-period"]'),
          bullets: Array.from(entry.querySelectorAll("[data-bullet]")).map((b) => b.textContent?.trim() || ""),
        }))
      : fallback.leadership,
    skills: text(skillsSection, '[data-field="skills"]') || fallback.skills,
  }
}

interface ResumeRendererProps {
  documentContent: DocumentContent
  template: TemplateName
  onMouseUp: (e: React.MouseEvent) => void
  isTextHighlighted: (text: string) => boolean
  onUpdate: (updated: DocumentContent) => void
}

export function ResumeRenderer({ documentContent, template, onMouseUp, isTextHighlighted, onUpdate }: ResumeRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isFocused = useRef(false)
  const isHighlightedRef = useRef(isTextHighlighted)
  isHighlightedRef.current = isTextHighlighted

  const t = templates[template]

  const buildHtml = useCallback(
    () => buildResumeHtml(documentContent, template, t, isHighlightedRef.current),
    [documentContent, template, t],
  )

  // Initial render — set innerHTML once on mount
  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = buildHtml()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external state changes (AI suggestions, uploads) into the DOM when not editing
  useEffect(() => {
    if (!containerRef.current || isFocused.current) return
    containerRef.current.innerHTML = buildHtml()
  }, [buildHtml])

  const handleBlur = useCallback(() => {
    isFocused.current = false
    if (!containerRef.current) return
    onUpdate(parseDom(containerRef.current, documentContent))
  }, [documentContent, onUpdate])

  return (
    <div className="flex-1 p-8 overflow-auto bg-muted/20" onMouseUp={onMouseUp}>
      <div
        ref={containerRef}
        contentEditable="true"
        suppressContentEditableWarning
        spellCheck={false}
        onFocus={() => { isFocused.current = true }}
        onBlur={handleBlur}
        className={`max-w-4xl mx-auto min-h-[800px] bg-background shadow-lg outline-none cursor-text ${t.fontFamily} ${t.cardStyle}`}
      />
    </div>
  )
}
