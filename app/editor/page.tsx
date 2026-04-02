"use client"

import type React from "react"
import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Undo, Download, Check, ArrowLeft, HelpCircle, Clock, Upload, User, LogOut, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AIChat } from "@/components/ai-chat"
import { VersionHistory } from "@/components/version-history"
import { ExportDialog } from "@/components/export-dialog"
import { FileUpload } from "@/components/file-upload"
import { EditorWelcomeModal } from "@/components/editor-welcome-modal"
import { InlinePrompt } from "@/components/inline-prompt"
import { ResumeRenderer } from "@/components/resume-renderer"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAutosave } from "@/hooks/use-autosave"
import { useToast } from "@/hooks/use-toast"
import { getUserItem, setUserItem, removeUserItem, clearUserData, getAccessToken } from "@/lib/user-storage"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

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

function EditorPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const docId = searchParams.get("id")
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [selectedText, setSelectedText] = useState("")
  const [simulateExportError] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [showPendingChanges, setShowPendingChanges] = useState(false)
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [, setLastSavedAt] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [userRole, setUserRole] = useState<string | undefined>()
  const { toast } = useToast()

  // Source format state (from uploaded file)
  const [sourceFormat, setSourceFormat] = useState<string | null>(null)

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

  // Auth guard + load user
  useEffect(() => {
    const storedUser = localStorage.getItem("polish_user")
    const token = getAccessToken()
    if (!storedUser || !token) {
      router.replace("/signin")
      return
    }
    try {
      setUser(JSON.parse(storedUser))
    } catch {
      router.replace("/signin")
    }

  }, [router])

  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    // Clear all user-specific data (Claude API key, preferences, etc.)
    clearUserData()
    // Clear core session
    localStorage.removeItem("polish_user")
    sessionStorage.clear()
    // Reset local state
    setUser(null)
    // Brief delay so the user sees the "Signing out..." state
    await new Promise((resolve) => setTimeout(resolve, 500))
    router.push("/signin")
  }

  useEffect(() => {
    if (!docId) {
      router.replace("/dashboard")
      return
    }

    const token = getAccessToken()
    if (!token) return

    setDocumentId(docId)

    const loadDocument = async () => {
      try {
        const res = await fetch(`${API_URL}/api/docs/${docId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          router.replace("/dashboard")
          return
        }
        const { document: doc } = await res.json()

        if (doc.content) {
          try {
            const parsed = JSON.parse(doc.content)
            if (parsed && typeof parsed === "object" && parsed.name) {
              setDocumentContent(parsed)
            }
          } catch {
            // plain text content — leave default
          }
        }
      } catch {
        loadFromLocalStorage(setDocumentContent, setDocumentVersions)
      }
    }

    loadDocument()
  }, [docId, router])

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
        } catch {
          console.error("[v0] Failed to parse uploaded content")
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
    if (!documentId) return
    const token = getAccessToken()
    if (!token) return

    setIsSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/docs/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: documentContent.name || "Untitled Resume",
          content: JSON.stringify(documentContent),
        }),
      })

      if (res.ok) {
        setLastSavedAt(new Date())
      } else {
        toast({ title: "Save Warning", description: "Cloud sync failed. Changes saved locally.", variant: "default" })
        setUserItem("polishEditor_document", JSON.stringify(documentContent))
      }
    } catch {
      toast({ title: "Save Error", description: "Failed to save. Changes stored locally.", variant: "destructive" })
      setUserItem("polishEditor_document", JSON.stringify(documentContent))
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

    // Save version to API if document is loaded
    if (documentId) {
      const token = getAccessToken()
      if (token) {
        try {
          await fetch(`${API_URL}/api/versions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              documentId,
              content: JSON.stringify(documentContent),
              changeDescription: description,
            }),
          })
        } catch {
          // version save is best-effort, don't block the user
        }
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

    // Generic handler: find and replace the original text with updated text across all sections
    setDocumentContent((prev) => {
      const updated = { ...prev }

      // Update header fields
      for (const change of changes.changes) {
        if (change.original === prev.name) updated.name = change.updated
        if (change.original === prev.title) updated.title = change.updated
        if (change.original === prev.contact) updated.contact = change.updated
        if (change.original === prev.skills) updated.skills = change.updated
      }

      // Update education fields
      updated.education = prev.education.map((edu) => {
        const newEdu = { ...edu }
        for (const change of changes.changes) {
          if (change.original === edu.school) newEdu.school = change.updated
          if (change.original === edu.degree) newEdu.degree = change.updated
          if (change.original === edu.location) newEdu.location = change.updated
          if (change.original === edu.period) newEdu.period = change.updated
        }
        return newEdu
      })

      // Update experience bullets
      updated.experience = prev.experience.map((exp) => ({
        ...exp,
        bullets: exp.bullets.map((bullet) => {
          const change = changes.changes.find((c) => {
            if (c.original === bullet) return true
            if (c.original.toLowerCase() === bullet.toLowerCase()) return true
            if (bullet.includes(c.original) || c.original.includes(bullet)) return true
            return false
          })
          return change ? change.updated : bullet
        }),
      }))

      // Update project bullets
      updated.projects = prev.projects.map((proj) => ({
        ...proj,
        bullets: proj.bullets.map((bullet) => {
          const change = changes.changes.find((c) => {
            if (c.original === bullet) return true
            if (c.original.toLowerCase() === bullet.toLowerCase()) return true
            if (bullet.includes(c.original) || c.original.includes(bullet)) return true
            return false
          })
          return change ? change.updated : bullet
        }),
      }))

      // Update leadership bullets if they exist
      if (updated.leadership) {
        updated.leadership = prev.leadership?.map((lead) => ({
          ...lead,
          bullets: lead.bullets.map((bullet) => {
            const change = changes.changes.find((c) => {
              if (c.original === bullet) return true
              if (c.original.toLowerCase() === bullet.toLowerCase()) return true
              if (bullet.includes(c.original) || c.original.includes(bullet)) return true
              return false
            })
            return change ? change.updated : bullet
          }),
        }))
      }

      return updated
    })
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

  const handleFileUpload = (file: File, content: string, format: string) => {
    setUploadedFileName(file.name)
    setSourceFormat(format)
    setShowUploadDialog(false)

    // content is already extracted text — store as skills until AI structures it
    setDocumentContent((prev) => ({
      ...prev,
      skills: content,
    }))

    createVersionSnapshot(`Uploaded file: ${file.name}`)
    setTimeout(() => {
      triggerSave()
    }, 100)
  }

  const handleRestoreVersion = async (version: { id: string; timestamp: string; description: string; content?: any }) => {
    if (version.content) {
      setDocumentContent(version.content)
      await createVersionSnapshot(`Restored to: ${version.description}`)
      console.log("[v0] Restored version:", version.id)
    }
  }

  const handleResetVersionHistory = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem("polishEditor_versions")
      console.log("[v0] Cleared version history from localStorage")


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
      } catch {
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
  const handleMouseUp = (_e: React.MouseEvent) => {
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
            {sourceFormat && (
              <span className="text-xs font-medium bg-slate-900 text-white px-2 py-0.5 rounded-full">{sourceFormat}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWelcomeModal(true)}
              className="text-muted-foreground hover:text-foreground"
              title="Guide"
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
            <ExportDialog documentContent={documentContent} simulateError={simulateExportError} sourceFormat={sourceFormat || undefined}>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </ExportDialog>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 cursor-pointer hover:bg-muted transition-colors"
                    disabled={isSigningOut}
                  >
                    <User className="w-4 h-4" />
                    <span className="max-w-[120px] truncate">
                      {isSigningOut ? "Signing out..." : user.name}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-muted-foreground font-normal text-xs truncate">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    variant="destructive"
                    className="cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="border-b border-border px-6 py-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Page 1 of 1</span>
              </div>
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

          {/* Resume Renderer */}
          <ResumeRenderer
            documentContent={documentContent}
            template="classic"
            onMouseUp={handleMouseUp}
            isTextHighlighted={isTextHighlighted}
          />

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
          documentContent={documentContent}
          documentId={documentId}
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

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>}>
      <EditorPageInner />
    </Suspense>
  )
}
