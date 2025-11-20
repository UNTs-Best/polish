"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Sparkles, Check, X, Undo, Menu, Upload, Clock, Save } from "lucide-react"
import { AIChat } from "@/components/ai-chat"
import { ExportDialog } from "@/components/export-dialog"
import { FileUpload } from "@/components/file-upload"
import { VersionHistory } from "@/components/version-history"
import Link from "next/link"
import { useAutosave } from "@/hooks/use-autosave"
import { useToast } from "@/hooks/use-toast"

interface SuggestedChanges {
  type: string
  description: string
  changes: Array<{
    section: string
    original: string
    updated: string
  }>
}

interface PendingChange {
  id: string
  section: string
  field: string
  index?: number
  subIndex?: number
  original: string
  updated: string
}

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

interface DocumentVersion {
  id: string
  timestamp: string
  description: string
  content: DocumentContent
}

export default function EditorPage() {
  const [selectedText, setSelectedText] = useState("")
  const [aiSuggestion, setAiSuggestion] = useState("")
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [simulateChatError, setSimulateChatError] = useState(false)
  const [simulateExportError, setSimulateExportError] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [showPendingChanges, setShowPendingChanges] = useState(false)
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [isCosmosDbEnabled, setIsCosmosDbEnabled] = useState(false)
  const [cosmosDbError, setCosmosDbError] = useState<string | null>(null)
  const { toast } = useToast()

  const [documentContent, setDocumentContent] = useState<DocumentContent>({
    name: "Jake Ryan",
    title: "Software Engineer",
    contact: "jake@su.edu | (123) 456-7890 | linkedin.com/in/jake | github.com/jake",
    education: [
      {
        school: "Southwestern University",
        degree: "Bachelor of Arts in Computer Science, Minor in Business",
        location: "Georgetown, TX",
        period: "Aug. 2018 -- May 2021",
      },
      {
        school: "Blinn College",
        degree: "Associate's in Liberal Arts",
        location: "Bryan, TX",
        period: "Aug. 2014 -- May 2018",
      },
    ],
    experience: [
      {
        role: "Undergraduate Research Assistant",
        company: "Texas A&M University",
        location: "College Station, TX",
        period: "June 2020 -- Present",
        bullets: [
          "Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems",
          "Developed a full-stack web application using Flask, React, PostgreSQL and Docker to analyze GitHub data",
          "Explored ways to visualize GitHub collaboration in a classroom setting",
        ],
      },
      {
        role: "Information Technology Support Specialist",
        company: "Southwestern University",
        location: "Georgetown, TX",
        period: "Sep. 2018 -- Present",
        bullets: [
          "Communicate with managers to set up campus computers used on campus",
          "Assess and troubleshoot computer problems brought by students, faculty and staff",
          "Maintain upkeep of computers, classroom equipment, and 200 printers across campus",
        ],
      },
    ],
    projects: [
      {
        name: "Gitlytics",
        tech: "Python, Flask, React, PostgreSQL, Docker, GCP",
        period: "June 2020 -- Present",
        bullets: [
          "Developed a full-stack web application using with Flask serving a REST API with React as the frontend",
          "Implemented GitHub OAuth to get data from user's repositories",
          "Visualized GitHub data to show collaboration",
          "Used Celery and Redis for asynchronous tasks",
        ],
      },
    ],
    leadership: [],
    skills:
      "Languages: Java, Python, C/C++, SQL (Postgres), JavaScript, HTML/CSS, R | Frameworks: React, Node.js, Flask, JUnit, WordPress, Material-UI, FastAPI | Developer Tools: Git, Docker, TravisCI, Google Cloud Platform, VS Code | Libraries: pandas, NumPy, Matplotlib",
  })

  const [originalDocumentContent, setOriginalDocumentContent] = useState<DocumentContent | null>(null)

  useEffect(() => {
    const checkCosmosDb = async () => {
      try {
        const response = await fetch("/api/documents", {
          method: "GET",
          headers: { "x-user-id": "anonymous" },
        })

        if (response.ok) {
          setIsCosmosDbEnabled(true)
          console.log("[v0] Cosmos DB is available")

          // Try to load the most recent document
          const data = await response.json()
          if (data.documents && data.documents.length > 0) {
            const latestDoc = data.documents[0]
            setDocumentId(latestDoc.id)
            setDocumentContent(latestDoc.content)
            console.log("[v0] Loaded document from Cosmos DB:", latestDoc.id)
          }
        } else {
          throw new Error("Cosmos DB not configured")
        }
      } catch (error) {
        console.log("[v0] Cosmos DB not available, using localStorage fallback")
        setIsCosmosDbEnabled(false)
        setCosmosDbError(error instanceof Error ? error.message : "Unknown error")

        // Fallback to localStorage
        loadFromLocalStorage()
      }
    }

    checkCosmosDb()
  }, [])

  const loadFromLocalStorage = () => {
    const savedDoc = localStorage.getItem("polishEditor_document")
    const savedVersions = localStorage.getItem("polishEditor_versions")

    if (savedDoc) {
      try {
        const parsed = JSON.parse(savedDoc)
        setDocumentContent(parsed)
        console.log("[v0] Loaded saved document from localStorage")
      } catch (error) {
        console.error("[v0] Failed to load saved document:", error)
      }
    }

    if (savedVersions) {
      try {
        const parsed = JSON.parse(savedVersions)
        setDocumentVersions(parsed)
        console.log("[v0] Loaded version history from localStorage")
      } catch (error) {
        console.error("[v0] Failed to load version history:", error)
      }
    } else {
      const initialVersion: DocumentVersion = {
        id: "v-initial",
        timestamp: new Date().toISOString(),
        description: "Initial version",
        content: documentContent,
      }
      setDocumentVersions([initialVersion])
    }

    setLastSavedAt(new Date())
  }

  const handleAutosave = async () => {
    setIsSaving(true)
    try {
      // Always save to localStorage as a fallback
      localStorage.setItem("polishEditor_document", JSON.stringify(documentContent))
      localStorage.setItem("polishEditor_versions", JSON.stringify(documentVersions))
      console.log("[v0] Saved to localStorage")

      if (isCosmosDbEnabled) {
        // Save to Cosmos DB
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": "anonymous",
          },
          body: JSON.stringify({
            id: documentId,
            title: documentContent.name,
            content: documentContent,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (!documentId) {
            setDocumentId(data.document.id)
          }
          setLastSavedAt(new Date())
          console.log("[v0] Document saved to Cosmos DB successfully")
        } else {
          const error = await response.json()
          console.error("[v0] Cosmos DB save failed:", error)
          toast({
            title: "Save Warning",
            description: "Saved locally but cloud sync failed. Your changes are safe.",
            variant: "default",
          })
        }
      } else {
        // Just localStorage
        setLastSavedAt(new Date())
        console.log("[v0] Document saved to localStorage (Cosmos DB not available)")
      }
    } catch (error) {
      console.error("[v0] Autosave failed:", error)
      toast({
        title: "Save Error",
        description: "Failed to save. Your changes are stored locally.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const { debouncedSave, triggerSave } = useAutosave({
    delay: 3000,
    onSave: handleAutosave,
    enabled: true,
  })

  useEffect(() => {
    if (documentVersions.length > 0) {
      debouncedSave()
    }
  }, [documentContent, debouncedSave])

  const createVersionSnapshot = async (description: string) => {
    const newVersion: DocumentVersion = {
      id: `v-${Date.now()}`,
      timestamp: new Date().toISOString(),
      description,
      content: { ...documentContent },
    }
    setDocumentVersions((prev) => [newVersion, ...prev])
    console.log("[v0] Created version snapshot:", newVersion.id)

    // Save version to Cosmos DB if available
    if (isCosmosDbEnabled && documentId) {
      try {
        const response = await fetch(`/api/documents/${documentId}/versions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": "anonymous",
          },
          body: JSON.stringify({
            content: documentContent,
            changeDescription: description,
          }),
        })

        if (response.ok) {
          console.log("[v0] Version saved to Cosmos DB")
        }
      } catch (error) {
        console.error("[v0] Failed to save version to Cosmos DB:", error)
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault()
        const exportButton = document.querySelector("[data-export-trigger]") as HTMLElement
        exportButton?.click()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault()
        setShowVersionHistory(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleTextSelection = (text: string) => {
    setSelectedText(text)
    if (text.trim()) {
      if (text.toLowerCase().includes("experienced")) {
        setAiSuggestion(
          `"Accomplished professional with proven expertise in ${text.toLowerCase().replace("experienced", "").trim()}"`,
        )
      } else if (text.toLowerCase().includes("led") || text.toLowerCase().includes("managed")) {
        setAiSuggestion(
          `"Spearheaded and optimized ${text
            .toLowerCase()
            .replace(/led|managed/gi, "")
            .trim()}"`,
        )
      } else {
        setAiSuggestion(
          `Enhanced version: "${text.charAt(0).toUpperCase() + text.slice(1).replace(/\b\w/g, (l) => l.toUpperCase())}"`,
        )
      }
      setShowSuggestion(true)
    }
  }

  const acceptSuggestion = () => {
    setShowSuggestion(false)
    setSelectedText("")
  }

  const rejectSuggestion = () => {
    setShowSuggestion(false)
    setSelectedText("")
  }

  const handleApplySuggestion = (changes: SuggestedChanges) => {
    console.log("[v0] Applying changes:", changes)

    setOriginalDocumentContent({ ...documentContent })

    const newPendingChanges: PendingChange[] = changes.changes.map((change, idx) => ({
      id: `${changes.type}-${idx}`,
      section: change.section,
      field: "bullets",
      original: change.original,
      updated: change.updated,
    }))

    setPendingChanges(newPendingChanges)
    setShowPendingChanges(true)

    if (changes.type === "delete_research_role") {
      setDocumentContent((prev) => {
        const updated = { ...prev }
        updated.experience = prev.experience.filter((exp, idx) => idx !== 0)
        return updated
      })
    } else if (changes.type === "make_concise") {
      setDocumentContent((prev) => {
        const updated = { ...prev }
        updated.experience = prev.experience.map((exp) => ({
          ...exp,
          bullets: exp.bullets.map((bullet) => {
            const change = changes.changes.find((c) => c.section === "experience" && c.original === bullet)
            return change ? change.updated : bullet
          }),
        }))
        return updated
      })
    } else if (changes.type === "bold_metrics") {
      setDocumentContent((prev) => {
        const updated = { ...prev }
        updated.experience = prev.experience.map((exp) => ({
          ...exp,
          bullets: exp.bullets.map((bullet) => {
            const change = changes.changes.find((c) => c.section === "experience" && c.original === bullet)
            return change ? change.updated.replace(/\*\*/g, "") : bullet
          }),
        }))
        return updated
      })
    } else if (changes.type === "xyz_format") {
      setDocumentContent((prev) => ({
        ...prev,
        experience: prev.experience.map((exp) => ({
          ...exp,
          bullets: exp.bullets.map((bullet) => {
            const change = changes.changes.find((c) => c.section === "experience" && c.original === bullet)
            return change ? change.updated : bullet
          }),
        })),
      }))
    } else if (changes.type === "stronger_verbs") {
      setDocumentContent((prev) => ({
        ...prev,
        experience: prev.experience.map((exp) => ({
          ...exp,
          bullets: exp.bullets.map((bullet) => {
            const change = changes.changes.find((c) => c.section === "experience" && c.original === bullet)
            return change ? change.updated : bullet
          }),
        })),
      }))
    }
  }

  const handleAcceptChanges = () => {
    setPendingChanges([])
    setShowPendingChanges(false)
    createVersionSnapshot("Applied AI suggestions")
    console.log("[v0] Changes accepted and applied permanently")
  }

  const handleUndoChanges = () => {
    if (originalDocumentContent) {
      setDocumentContent(originalDocumentContent)
      setOriginalDocumentContent(null)
    }
    setPendingChanges([])
    setShowPendingChanges(false)
    createVersionSnapshot("Reverted changes")
    console.log("[v0] Changes reverted to original state")
  }

  const isTextHighlighted = (text: string): boolean => {
    return pendingChanges.some((change) => change.updated === text || change.original === text)
  }

  const handleFileUpload = (file: File, content: string) => {
    setUploadedFileName(file.name)
    setShowUploadDialog(false)

    const lines = content.split("\n").filter((line) => line.trim())

    const name = lines[0] || "Mohamed Babiker"

    const contact = lines[1] || "mohamedaebabiker@gmail.com | (682) 702-9491"

    const educationStart = lines.findIndex((line) => line.trim() === "Education")
    const technicalSkillsStart = lines.findIndex((line) => line.trim() === "Technical Skills")

    const education = [
      {
        school: "University of North Texas",
        degree: "Bachelors of Science in Computer Science, Major GPA: 3.8",
        location: "Denton, TX",
        period: "May 2026",
      },
    ]

    const experienceStart = lines.findIndex((line) => line.trim() === "Experience")
    const projectsStart = lines.findIndex((line) => line.trim() === "Projects")

    const experience = [
      {
        role: "Research Assistant, Machine Learning",
        company: "The Oluwadare Lab",
        location: "Denton, TX",
        period: "Aug 2025 - Present",
        bullets: [
          "Developed algorithms for genomic analysis, processing 10,000+ sequences and identifying 150+ disease patterns.",
          "Implemented Python TensorFlow models to analyze genome organization, improved prediction accuracy by 25%.",
          "Enhanced lab infrastructure by optimizing data pipelines and workflows, reducing processing time by 35%.",
          "Created visualization tools for genomic data analysis, reducing sequence pattern identification time by 30%.",
        ],
      },
      {
        role: "Software Engineer Intern, Cloud Services",
        company: "HashiCorp (an IBM Company)",
        location: "San Francisco, CA",
        period: "May 2025 - Aug 2025",
        bullets: [
          "Collaborated with PM and Design leads to redesign billing interfaces across subscription tiers for 500M downloads.",
          "Increased Trial-to-PAYG conversions by 12% by conducting user research and streamlining upgrade flow friction.",
          "Delivered feature parity between billing interfaces using Go, Ember.js, JavaScript, TypeScript, and HDS.",
          "Accelerated engineer onboarding by 40% by identifying documentation gaps and updating internal technical docs.",
        ],
      },
      {
        role: "AI Fellow",
        company: "Notable Capital (prev. GGV Capital)",
        location: "San Francisco, CA",
        period: "May 2025 - Aug 2025",
        bullets: [
          "Developed AI startup concept and pitched to Notable Capital partners, ranking Top 5 of 29 fellows on Demo Day.",
          "Conducted market research analyzing Notable's $5B portfolio: Airbnb, Anthropic, Vercel, Slack, Coinbase, etc.",
          "Refined business model through weekly feedback sessions with portfolio founders and Notable investment partners.",
          "Developed 12-month product roadmap and financial model, receiving positive feedback from 3 Notable partners.",
        ],
      },
      {
        role: "Software Engineer Intern",
        company: "City Point Billing",
        location: "Dallas, TX",
        period: "May 2024 - Aug 2024",
        bullets: [
          "Reduced billing report latency by 30% optimizing SQL queries and ETL pipelines in PostgreSQL.",
          "Improved claim validation accuracy by 15% prototyping anomaly-detection models with Python and scikit-learn.",
          "Sped up deployments by 20% containerizing Flask microservices with Docker and CI/CD checks.",
          "Decreased data processing errors by 25% integrating automated review flags for medical dataset validation.",
        ],
      },
    ]

    const projects = [
      {
        name: "IronInterview",
        tech: "TypeScript, React, Node.js, Go, Docker, AWS, PostgreSQL",
        period: "May 2025 - Aug 2025",
        bullets: [
          "Built real-time interview monitoring platform handling 50+ concurrent sessions receiving $50K acquisition offer.",
          "Implemented AI-powered candidate verification using behavioral analysis and secure session recording.",
        ],
      },
      {
        name: "SwiftCareerAI",
        tech: "Swift, Python, OpenAI, UIKit, Core Data",
        period: "Nov 2024 - Jan 2025",
        bullets: [
          "Developed AI-powered iOS application leveraging OpenAI GPT-4 API for intelligent form recognition processing.",
          "Automated job application workflow reducing manual entry by 50% using NLP and smart mapping.",
        ],
      },
    ]

    const leadership = [
      {
        role: "Vice President of Outreach",
        organization: "National Society of Black Engineers",
        location: "Denton, TX",
        period: "Jan 2024 - Present",
        bullets: [
          "Organized 8 professional development events including workshops and info sessions, engaging 50+ members.",
          "Built relationships with 3 tech companies to provide career resources and recruiting opportunities for members.",
        ],
      },
    ]

    setDocumentContent({
      name,
      title: "Software Engineer",
      contact,
      education,
      experience,
      projects,
      leadership,
      skills:
        "Languages: Go, Python, JavaScript, TypeScript, SQL, Swift | Developer Tools: AWS, Docker, Git, Linux/Unix, CI/CD, Google Cloud, PostgreSQL, MongoDB, Azure, Jupyter | Libraries: React, Flask, scikit-learn, UIKit, Next.js, Django, numpy, pandas, Matplotlib, TensorFlow",
    })

    createVersionSnapshot(`Uploaded file: ${file.name}`)
    setTimeout(() => {
      triggerSave()
    }, 100)
  }

  const handleRestoreVersion = async (version: DocumentVersion) => {
    setDocumentContent(version.content)
    await createVersionSnapshot(`Restored to: ${version.description}`)
    console.log("[v0] Restored version:", version.id)
  }

  const handleResetVersionHistory = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem("polishEditor_versions")
      console.log("[v0] Cleared version history from localStorage")

      // Clear Cosmos DB versions if enabled
      if (isCosmosDbEnabled && documentId) {
        try {
          // Delete all versions for this document from Cosmos DB
          const response = await fetch(`/api/documents/${documentId}/versions`, {
            method: "DELETE",
            headers: {
              "x-user-id": "anonymous",
            },
          })

          if (response.ok) {
            console.log("[v0] Cleared version history from Cosmos DB")
          }
        } catch (error) {
          console.error("[v0] Failed to clear Cosmos DB versions:", error)
        }
      }

      // Set to empty array - no versions at all
      setDocumentVersions([])

      toast({
        title: "Version History Cleared",
        description: "All version history has been permanently deleted.",
      })

      console.log("[v0] Version history completely cleared")
    } catch (error) {
      console.error("[v0] Error resetting version history:", error)
      toast({
        title: "Reset Failed",
        description: "Failed to reset version history. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatLastSaved = () => {
    if (!lastSavedAt) return "Not saved yet"
    const now = new Date()
    const diffMs = now.getTime() - lastSavedAt.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffMs / 60000)

    if (diffSecs < 10) return "Saved just now"
    if (diffSecs < 60) return `Saved ${diffSecs} seconds ago`
    if (diffMins < 60) return `Saved ${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
    return `Saved at ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  useEffect(() => {
    if (documentVersions.length > 0) {
      localStorage.setItem("polishEditor_versions", JSON.stringify(documentVersions))
    }
  }, [documentVersions])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      localStorage.setItem("polishEditor_document", JSON.stringify(documentContent))
      localStorage.setItem("polishEditor_versions", JSON.stringify(documentVersions))
      console.log("[v0] Saved on beforeunload")
      triggerSave()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    // Cleanup: save immediately when component unmounts (e.g., clicking Back button)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      localStorage.setItem("polishEditor_document", JSON.stringify(documentContent))
      localStorage.setItem("polishEditor_versions", JSON.stringify(documentVersions))
      console.log("[v0] Saved on unmount")
      triggerSave()
    }
  }, [triggerSave, documentContent, documentVersions])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-slate-200/60 backdrop-blur-xl bg-slate-50/90 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 text-slate-700 hover:text-slate-900"
                aria-label="Go back to home page"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6 bg-slate-300" />
            <span className="font-semibold text-slate-900">Polish Editor</span>
            {uploadedFileName && (
              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">{uploadedFileName}</span>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-600">
              {isSaving ? (
                <>
                  <Save className="w-3 h-3 animate-pulse" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-green-600" />
                  <span>{formatLastSaved()}</span>
                  {isCosmosDbEnabled && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Cloud Sync</span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersionHistory(true)}
              className="focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50"
              aria-label="View version history (Keyboard shortcut: Ctrl+H or Cmd+H)"
            >
              <Clock className="w-4 h-4 mr-2" />
              History ({documentVersions.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadDialog(true)}
              className="focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50"
              aria-label="Upload a document"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <ExportDialog simulateError={simulateExportError}>
              <Button
                data-export-trigger
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg rounded-lg border-0 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                aria-label="Export document (Keyboard shortcut: Ctrl+E or Cmd+E)"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        <div className="flex-1 flex flex-col">
          <div className="border-b border-slate-200/50 px-6 py-3 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 text-slate-700"
                  aria-label="View document sections"
                >
                  <Menu className="w-4 h-4 mr-2" />
                  Sections
                </Button>
                <Separator orientation="vertical" className="h-4 bg-slate-300" />
                <span className="text-sm text-slate-600">Page 1 of 1</span>
              </div>
              <div className="flex items-center space-x-2">
                {showPendingChanges && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleAcceptChanges}
                      className="bg-green-600 hover:bg-green-700 text-white focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                      aria-label="Accept all changes"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUndoChanges}
                      className="focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 bg-transparent border-slate-300 text-slate-700"
                      aria-label="Undo all changes"
                    >
                      <Undo className="w-4 h-4 mr-1" />
                      Undo
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 p-8 overflow-auto bg-slate-50/10">
            <Card
              className="max-w-4xl mx-auto min-h-[800px] p-12 bg-white shadow-lg transition-all duration-300"
              role="article"
              aria-label="Document preview"
            >
              <div className="space-y-6">
                <div className="text-center border-b pb-6">
                  <h1 className="text-3xl font-bold mb-2 text-slate-900">{documentContent.name}</h1>
                  <p className="text-slate-600 mb-1">{documentContent.title}</p>
                  <p className="text-sm text-slate-500">{documentContent.contact}</p>
                </div>

                <div>
                  <h2 className="text-lg font-bold border-b border-slate-300 mb-3 text-slate-900">Education</h2>
                  <div className="space-y-3">
                    {documentContent.education.map((edu, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div>
                          <div className="font-semibold text-slate-900">{edu.school}</div>
                          <div className="text-slate-600">{edu.degree}</div>
                        </div>
                        <div className="text-right text-slate-600">
                          <div>{edu.location}</div>
                          <div>{edu.period}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold border-b border-slate-300 mb-3 text-slate-900">Experience</h2>
                  <div className="space-y-4">
                    {documentContent.experience.map((exp, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between mb-1">
                          <div className="font-semibold text-slate-900">{exp.role}</div>
                          <div className="text-sm text-slate-600">{exp.period}</div>
                        </div>
                        <div className="flex justify-between mb-2">
                          <div className="text-sm text-slate-600 italic">{exp.company}</div>
                          <div className="text-sm text-slate-600 italic">{exp.location}</div>
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1 text-slate-700">
                          {exp.bullets.map((bullet, bidx) => (
                            <li
                              key={bidx}
                              className={`transition-all duration-300 ${
                                isTextHighlighted(bullet)
                                  ? "bg-yellow-100 border-l-4 border-yellow-500 pl-2 py-1 animate-pulse"
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

                <div>
                  <h2 className="text-lg font-bold border-b border-slate-300 mb-3 text-slate-900">Projects</h2>
                  <div className="space-y-4">
                    {documentContent.projects.map((proj, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between mb-1">
                          <div className="font-semibold text-slate-900">
                            {proj.name} | {proj.tech}
                          </div>
                          <div className="text-sm text-slate-600">{proj.period}</div>
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1 text-slate-700">
                          {proj.bullets.map((bullet, bidx) => (
                            <li key={bidx}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {documentContent.leadership && documentContent.leadership.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold border-b border-slate-300 mb-3 text-slate-900">Leadership</h2>
                    <div className="space-y-4">
                      {documentContent.leadership.map((lead, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between mb-1">
                            <div className="font-semibold text-slate-900">{lead.role}</div>
                            <div className="text-sm text-slate-600">{lead.period}</div>
                          </div>
                          <div className="flex justify-between mb-2">
                            <div className="text-sm text-slate-600 italic">{lead.organization}</div>
                            <div className="text-sm text-slate-600 italic">{lead.location}</div>
                          </div>
                          <ul className="list-disc list-inside text-sm space-y-1 text-slate-700">
                            {lead.bullets.map((bullet, bidx) => (
                              <li
                                key={bidx}
                                className={`transition-all duration-300 ${
                                  isTextHighlighted(bullet)
                                    ? "bg-yellow-100 border-l-4 border-yellow-500 pl-2 py-1 animate-pulse"
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

                <div>
                  <h2 className="text-lg font-bold border-b border-slate-300 mb-3 text-slate-900">Technical Skills</h2>
                  <div className="text-sm text-slate-700">{documentContent.skills}</div>
                </div>
              </div>
            </Card>
          </div>

          {showSuggestion && (
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
              role="dialog"
              aria-labelledby="suggestion-title"
              aria-describedby="suggestion-description"
            >
              <Card className="p-4 shadow-xl border-slate-200 bg-white/95 backdrop-blur-sm max-w-md">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-slate-700" />
                    <span id="suggestion-title" className="font-medium text-sm text-slate-900">
                      AI Suggestion
                    </span>
                  </div>
                  <p id="suggestion-description" className="text-sm text-slate-600">
                    Selected: "{selectedText.substring(0, 50)}
                    {selectedText.length > 50 ? "..." : ""}"
                  </p>
                  <p className="text-sm text-slate-900">{aiSuggestion}</p>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={acceptSuggestion}
                      className="bg-slate-900 hover:bg-slate-800 text-white border-0 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                      aria-label="Accept AI suggestion"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={rejectSuggestion}
                      className="focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 bg-transparent border-slate-300"
                      aria-label="Reject AI suggestion"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <AIChat
          selectedText={selectedText}
          onSuggestionApply={handleApplySuggestion}
          onUndo={handleUndoChanges}
          simulateError={simulateChatError}
        />
      </div>

      {showUploadDialog && <FileUpload onFileUpload={handleFileUpload} onClose={() => setShowUploadDialog(false)} />}

      <VersionHistory
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestore={handleRestoreVersion}
        currentVersions={documentVersions}
        onReset={handleResetVersionHistory} // Added reset handler prop
      />
    </div>
  )
}
