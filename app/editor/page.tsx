"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Undo, Download, Check, X, ArrowLeft, HelpCircle, Clock, Upload, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AIChat } from "@/components/ai-chat"
import { VersionHistory } from "@/components/version-history"
import { ExportDialog } from "@/components/export-dialog"
import { FileUpload } from "@/components/file-upload"
import { EditorWelcomeModal } from "@/components/editor-welcome-modal"
import { InlinePrompt } from "@/components/inline-prompt"
import Link from "next/link"
import { useAutosave } from "@/hooks/use-autosave"
import { useToast } from "@/hooks/use-toast"
import { getUserItem, setUserItem, removeUserItem } from "@/lib/user-storage"

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

function loadFromLocalStorage(
  setDocumentContent: React.Dispatch<React.SetStateAction<DocumentContent>>,
  setDocumentVersions: React.Dispatch<React.SetStateAction<DocumentVersion[]>>,
) {
  const savedDoc = getUserItem("polishEditor_document")
  const savedVersions = getUserItem("polishEditor_versions")

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
  }
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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [userRole, setUserRole] = useState<string | undefined>()
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

  const [showInlinePrompt, setShowInlinePrompt] = useState(false)
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 })
  const aiChatRef = useRef<{ sendMessage: (prompt: string, text: string) => void } | null>(null)

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
        loadFromLocalStorage(setDocumentContent, setDocumentVersions)
      }
    }

    checkCosmosDb()
  }, [])

  useEffect(() => {
    const loadDocumentContent = () => {
      // FIRST: Check for uploaded content from onboarding (takes priority)
      const uploadedContent = getUserItem("polish_uploaded_content")
      const uploadedFilename = getUserItem("polish_uploaded_filename")

      console.log("[v0] Checking for uploaded content:", uploadedContent ? "found" : "not found")

      if (uploadedContent && uploadedContent.length > 0) {
        try {
          const parsedContent = JSON.parse(uploadedContent)
          console.log("[v0] Parsed uploaded content:", parsedContent)

          setDocumentContent(parsedContent)
          setOriginalDocumentContent(parsedContent)

          if (uploadedFilename) {
            setUploadedFileName(uploadedFilename)
          }

          // Clear the uploaded content so it's not reloaded next time
          removeUserItem("polish_uploaded_content")
          removeUserItem("polish_uploaded_filename")

          // Create initial version snapshot
          const initialVersion: DocumentVersion = {
            id: `v-${Date.now()}`,
            timestamp: new Date().toISOString(),
            description: `Imported from: ${uploadedFilename || "uploaded file"}`,
            content: parsedContent,
          }
          setDocumentVersions([initialVersion])
          setLastSavedAt(new Date())

          console.log("[v0] Successfully loaded uploaded content:", uploadedFilename)
          return true // Uploaded content was loaded
        } catch (e) {
          console.error("[v0] Failed to parse uploaded content:", e)
        }
      }

      return false // No uploaded content
    }

    // Load uploaded content first, only fall back to localStorage if none found
    const hasUploadedContent = loadDocumentContent()
    if (!hasUploadedContent) {
      loadFromLocalStorage(setDocumentContent, setDocumentVersions)
    }
  }, [])

  const handleAutosave = async () => {
    setIsSaving(true)
    try {
      setUserItem("polishEditor_document", JSON.stringify(documentContent))
      setUserItem("polishEditor_versions", JSON.stringify(documentVersions))
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

  useEffect(() => {
    const hasSeenWelcome = getUserItem("polish_seen_welcome")
    const onboardingData = getUserItem("polish_onboarding")

    if (!hasSeenWelcome) {
      setShowWelcomeModal(true)
    }

    if (onboardingData) {
      try {
        const data = JSON.parse(onboardingData)
        setUserRole(data.role)
      } catch (e) {
        console.error("Failed to parse onboarding data")
      }
    }
  }, [])

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false)
    setUserItem("polish_seen_welcome", "true")
  }

  useEffect(() => {
    if (documentVersions.length > 0) {
      setUserItem("polishEditor_versions", JSON.stringify(documentVersions))
    }
  }, [documentVersions])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      setUserItem("polishEditor_document", JSON.stringify(documentContent))
      setUserItem("polishEditor_versions", JSON.stringify(documentVersions))
      console.log("[v0] Saved on beforeunload")
      triggerSave()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      setUserItem("polishEditor_document", JSON.stringify(documentContent))
      setUserItem("polishEditor_versions", JSON.stringify(documentVersions))
      console.log("[v0] Saved on unmount")
      triggerSave()
    }
  }, [triggerSave, documentContent, documentVersions])

  const handleClearSelection = () => {
    setSelectedText("")
    // Also clear the browser's text selection
    window.getSelection()?.removeAllRanges()
  }

  // Handler for mouse up to capture text selection from the resume
  const handleMouseUp = (e: React.MouseEvent) => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim()
      setSelectedText(text)

      // Get selection position for inline prompt
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setSelectionPosition({
        x: rect.left + rect.width / 2 - 160, // Center the popup
        y: rect.bottom,
      })
      setShowInlinePrompt(true)
    } else {
      // Don't close immediately - let click outside handle it
    }
  }

  const handleInlinePromptSubmit = (prompt: string, text: string) => {
    setShowInlinePrompt(false)
    // The AI chat will receive the selectedText and handle the request
    // We trigger the chat by updating selection and letting the chat handle it
    if (aiChatRef.current) {
      aiChatRef.current.sendMessage(prompt, text)
    }
  }

  const handleInlinePromptClose = () => {
    setShowInlinePrompt(false)
    setSelectedText("")
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {showWelcomeModal && <EditorWelcomeModal onClose={handleCloseWelcome} userRole={userRole} />}

      <header className="border-b border-border bg-background sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <span className="font-medium text-foreground">Polish</span>
            <span className="text-xs text-muted-foreground">{isSaving ? "Saving..." : "Autosaved"}</span>
            {uploadedFileName && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{uploadedFileName}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWelcomeModal(true)}
              className="text-muted-foreground"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowVersionHistory(true)}>
              <Clock className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <ExportDialog simulateError={simulateExportError}>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor Area - now full width */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="border-b border-border px-6 py-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Page 1 of 1</span>
              {showPendingChanges && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleAcceptChanges}
                    className="bg-green-600 hover:bg-green-700 text-white h-8"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleUndoChanges} className="h-8 bg-transparent">
                    <Undo className="w-3 h-3 mr-1" />
                    Undo
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Document Preview */}
          <div className="flex-1 p-8 overflow-auto bg-muted/20" onMouseUp={handleMouseUp}>
            <Card className="max-w-4xl mx-auto min-h-[800px] p-12 bg-background shadow-lg select-text cursor-text">
              <div className="space-y-6">
                {/* Header Section */}
                <div id="section-header" className="text-center border-b pb-6">
                  <h1 className="text-3xl font-bold mb-2 text-foreground">{documentContent.name}</h1>
                  <p className="text-muted-foreground mb-1">{documentContent.title}</p>
                  <p className="text-sm text-muted-foreground">{documentContent.contact}</p>
                </div>

                {/* Education Section */}
                <div id="section-education">
                  <h2 className="text-lg font-bold border-b border-border mb-3 text-foreground">Education</h2>
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
                  <h2 className="text-lg font-bold border-b border-border mb-3 text-foreground">Experience</h2>
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
                        <ul className="list-disc list-inside text-sm space-y-1 text-foreground/80">
                          {exp.bullets.map((bullet, bidx) => (
                            <li
                              key={bidx}
                              className={`transition-all duration-300 ${
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
                  <h2 className="text-lg font-bold border-b border-border mb-3 text-foreground">Projects</h2>
                  <div className="space-y-4">
                    {documentContent.projects.map((proj, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between mb-1">
                          <div className="font-semibold text-foreground">
                            {proj.name} | {proj.tech}
                          </div>
                          <div className="text-sm text-muted-foreground">{proj.period}</div>
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1 text-foreground/80">
                          {proj.bullets.map((bullet, bidx) => (
                            <li key={bidx}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leadership Section */}
                {documentContent.leadership && documentContent.leadership.length > 0 && (
                  <div id="section-leadership">
                    <h2 className="text-lg font-bold border-b border-border mb-3 text-foreground">Leadership</h2>
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
                          <ul className="list-disc list-inside text-sm space-y-1 text-foreground/80">
                            {lead.bullets.map((bullet, bidx) => (
                              <li key={bidx}>{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Section */}
                <div id="section-skills">
                  <h2 className="text-lg font-bold border-b border-border mb-3 text-foreground">Technical Skills</h2>
                  <div className="text-sm text-foreground/80">{documentContent.skills}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* AI Suggestion Popup */}
          {showSuggestion && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
              <Card className="p-4 shadow-xl border-border bg-background max-w-md">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Wand2 className="w-4 h-4 text-foreground" />
                    <span className="font-medium text-sm text-foreground">AI Suggestion</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Selected: "{selectedText.substring(0, 50)}
                    {selectedText.length > 50 ? "..." : ""}"
                  </p>
                  <p className="text-sm text-foreground">{aiSuggestion}</p>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={acceptSuggestion}
                      className="bg-foreground text-background hover:bg-foreground/90"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={rejectSuggestion}>
                      <X className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Inline Prompt Component */}
          {showInlinePrompt && selectedText && (
            <InlinePrompt
              selectedText={selectedText}
              position={selectionPosition}
              onSubmit={handleInlinePromptSubmit}
              onClose={handleInlinePromptClose}
            />
          )}
        </div>

        {/* AI Chat Panel */}
        <AIChat
          ref={aiChatRef}
          selectedText={selectedText}
          onSuggestionApply={handleApplySuggestion}
          onUndo={handleUndoChanges}
          onClearSelection={handleClearSelection}
        />
      </div>

      {showUploadDialog && <FileUpload onFileUpload={handleFileUpload} onClose={() => setShowUploadDialog(false)} />}

      <VersionHistory
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestore={handleRestoreVersion}
        currentVersions={documentVersions}
        onReset={handleResetVersionHistory}
      />
    </div>
  )
}

function formatLastSaved(lastSavedAt: Date | null): string {
  if (!lastSavedAt) return "Not saved yet"
  const now = new Date()
  const diff = Math.floor((now.getTime() - lastSavedAt.getTime()) / 1000)
  if (diff < 60) return "Saved just now"
  if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`
  return `Saved ${Math.floor(diff / 3600)}h ago`
}
