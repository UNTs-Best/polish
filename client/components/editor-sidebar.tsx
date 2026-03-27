"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { User, GraduationCap, Briefcase, FolderKanban, Award, Wrench, ChevronRight, Lightbulb } from "lucide-react"

interface Section {
  id: string
  label: string
  icon: React.ElementType
  tip: string
}

const sections: Section[] = [
  { id: "header", label: "Header", icon: User, tip: "Include name, title, and contact info" },
  { id: "education", label: "Education", icon: GraduationCap, tip: "List degrees in reverse chronological order" },
  { id: "experience", label: "Experience", icon: Briefcase, tip: "Use action verbs and quantify achievements" },
  { id: "projects", label: "Projects", icon: FolderKanban, tip: "Highlight relevant technical projects" },
  { id: "leadership", label: "Leadership", icon: Award, tip: "Show leadership and soft skills" },
  { id: "skills", label: "Skills", icon: Wrench, tip: "Match skills to job requirements" },
]

interface EditorSidebarProps {
  activeSection?: string
  onSectionClick?: (sectionId: string) => void
  completionScore?: number
}

export function EditorSidebar({ activeSection, onSectionClick, completionScore = 75 }: EditorSidebarProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)

  return (
    <div className="w-64 border-r border-border bg-muted/30 flex flex-col">
      {/* Completion Score */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Resume Score</span>
          <span className="text-sm font-bold text-foreground">{completionScore}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-500"
            style={{ width: `${completionScore}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {completionScore < 50 && "Add more details to improve your score"}
          {completionScore >= 50 && completionScore < 80 && "Good progress! Keep refining"}
          {completionScore >= 80 && "Looking great! Ready to export"}
        </p>
      </div>

      {/* Sections */}
      <div className="flex-1 p-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">Sections</p>
        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            const isHovered = hoveredSection === section.id

            return (
              <div key={section.id} className="relative">
                <button
                  onClick={() => onSectionClick?.(section.id)}
                  onMouseEnter={() => setHoveredSection(section.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{section.label}</span>
                  <ChevronRight className={cn("w-4 h-4 transition-transform", isActive && "rotate-90")} />
                </button>

                {/* Tooltip */}
                {isHovered && !isActive && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50">
                    <div className="bg-foreground text-background text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-2">
                      <Lightbulb className="w-3 h-3" />
                      {section.tip}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Quick Tips */}
      <div className="p-4 border-t border-border">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-foreground" />
            <span className="text-xs font-medium text-foreground">Quick Tip</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Select any text in your resume and ask the AI to improve it with specific suggestions.
          </p>
        </div>
      </div>
    </div>
  )
}
