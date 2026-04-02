"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Undo, Download, Check, ArrowLeft, HelpCircle, Clock, Upload, User, LogOut, ChevronDown, Settings } from "lucide-react"
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
import { type FormatLabel, parseResumeText } from "@/lib/document-parser"
import { useAutosave } from "@/hooks/use-autosave"
import { useToast } from "@/hooks/use-toast"
import { getUserItem, setUserItem, removeUserItem, clearUserData } from "@/lib/user-storage"
import { supabase, signOut as supabaseSignOut } from "@/lib/supabase-browser"

interface SuggestedChanges {
  type: string
  description: string
  changes?: Array<{
    section: string
    original: string
    updated: string
  }>
  resume?: DocumentContent
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
  const router = useRouter()
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
  const [autoReformat, setAutoReformat] = useState(false)
  const { toast } = useToast()

  // Claude connection state
  // Source format state (from uploaded file)
  const [sourceFormat, setSourceFormat] = useState<FormatLabel | null>(null)

  const blankDocument: DocumentContent = {
    name: "",
    title: "",
    contact: "",
    education: [{ school: "", degree: "", location: "", period: "" }],
    experience: [{ role: "", company: "", location: "", period: "", bullets: [""] }],
    projects: [],
    leadership: [],
    skills: "",
  }

  const [documentContent, setDocumentContent] = useState<DocumentContent>(blankDocument)

  const [originalDocumentContent, setOriginalDocumentContent] = useState<DocumentContent | null>(null)

  const [showInlinePrompt, setShowInlinePrompt] = useState(false)
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 })
  const aiChatRef = useRef<{ sendMessage: (prompt: string, text: string) => void } | null>(null)
  const uploadConsumedRef = useRef(false)
  const documentContentRef = useRef(documentContent)
  const documentVersionsRef = useRef(documentVersions)

  useEffect(() => {
    const syncSessionUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const u = session.user
          const name =
            [u.user_metadata?.first_name, u.user_metadata?.last_name].filter(Boolean).join(" ") ||
            u.user_metadata?.name ||
            u.email?.split("@")[0] ||
            "User"
          const normalized = { email: u.email ?? "", name }
          setUser(normalized)
          localStorage.setItem("polish_user", JSON.stringify({ ...normalized, id: u.id }))
          return
        }
      } catch {
        // Supabase unreachable — fall through to redirect
      }
      setUser(null)
      router.replace("/signin")
    }

    syncSessionUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null)
        router.replace("/signin")
        return
      }
      const u = session.user
      const name =
        [u.user_metadata?.first_name, u.user_metadata?.last_name].filter(Boolean).join(" ") ||
        u.user_metadata?.name ||
        u.email?.split("@")[0] ||
        "User"
      setUser({ email: u.email ?? "", name })
      localStorage.setItem("polish_user", JSON.stringify({ email: u.email, name, id: u.id }))
    })

    return () => subscription.unsubscribe()
  }, [router])

  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    clearUserData()
    sessionStorage.clear()
    setUser(null)
    await supabaseSignOut()
    router.push("/signin")
  }

  useEffect(() => {
    const loadInitialDocument = async () => {
      // Guard against React Strict Mode double-fire: once we consume
      // the uploaded content from localStorage, don't run the fallback
      // paths on the second invocation.
      if (uploadConsumedRef.current) return

      const uploadedContent = getUserItem("polish_uploaded_content")
      const uploadedFilename = getUserItem("polish_uploaded_filename")

      if (uploadedContent && uploadedContent.length > 0) {
        try {
          const parsedContent = JSON.parse(uploadedContent) as DocumentContent

          // Mark consumed BEFORE removing from storage so a Strict Mode
          // re-run skips the fallback paths entirely.
          uploadConsumedRef.current = true

          // Check if "Upload & polish" was selected
          const reformatFlag = getUserItem("polish_reformat")
          if (reformatFlag) {
            removeUserItem("polish_reformat")
            setAutoReformat(true)
          }

          removeUserItem("polish_uploaded_content")
          removeUserItem("polish_uploaded_filename")

          setDocumentContent(parsedContent)
          setOriginalDocumentContent(parsedContent)

          if (uploadedFilename) {
            setUploadedFileName(uploadedFilename)
          }

          const initialVersion: DocumentVersion = {
            id: `v-${Date.now()}`,
            timestamp: new Date().toISOString(),
            description: `Imported from: ${uploadedFilename || "uploaded file"}`,
            content: parsedContent,
          }
          setDocumentVersions([initialVersion])
          setLastSavedAt(new Date())
          return
        } catch {
          console.error("[editor] Failed to parse uploaded content")
        }
      }

      // Load from Supabase if authenticated, otherwise localStorage
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          loadFromLocalStorage(setDocumentContent, setDocumentVersions)
          return
        }

        const requestedId = getUserItem("polish_open_document_id")
        if (requestedId) {
          removeUserItem("polish_open_document_id")
        }

        const query = requestedId
          ? supabase.from("documents").select("id, title, content").eq("id", requestedId)
          : supabase.from("documents").select("id, title, content").order("updated_at", { ascending: false }).limit(1)

        const { data, error } = await query.single()

        if (!error && data?.content) {
          try {
            const parsed = typeof data.content === "string" ? JSON.parse(data.content) : data.content
            setDocumentId(data.id)
            setDocumentContent(parsed)
            if (data.title) {
              setUploadedFileName(data.title)
            }
          } catch {
            loadFromLocalStorage(setDocumentContent, setDocumentVersions)
          }
        } else {
          loadFromLocalStorage(setDocumentContent, setDocumentVersions)
        }
      } catch {
        loadFromLocalStorage(setDocumentContent, setDocumentVersions)
      }
    }

    loadInitialDocument()
  }, [])

  const handleAutosave = async () => {
    // Skip saving a blank/empty document to Supabase — only save once the
    // user has actually loaded or entered content.
    const hasContent = documentContent.name?.trim() ||
      documentContent.experience?.some(e => e.role?.trim() || e.company?.trim()) ||
      documentContent.skills?.trim()

    setIsSaving(true)
    try {
      setUserItem("polishEditor_document", JSON.stringify(documentContent))
      setUserItem("polishEditor_versions", JSON.stringify(documentVersions))

      // Sync to Supabase if signed in AND document has real content
      if (hasContent) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const now = new Date().toISOString()
          const baseTitle = documentContent.name
            ? `${documentContent.name}'s Resume`
            : "Untitled"

          // For new documents, ensure the title is unique
          let title = baseTitle
          if (!documentId) {
            try {
              const { data: existing } = await supabase
                .from("documents")
                .select("title")
                .eq("user_id", session.user.id)
              if (existing) {
                const titles = new Set(existing.map((d: { title: string }) => d.title))
                if (titles.has(baseTitle)) {
                  let counter = 2
                  while (titles.has(`${baseTitle} (${counter})`)) counter++
                  title = `${baseTitle} (${counter})`
                }
              }
            } catch {
              // ignore — use baseTitle
            }
          }

          const payload: Record<string, unknown> = {
            user_id: session.user.id,
            title,
            content: JSON.stringify(documentContent),
            updated_at: now,
          }
          if (documentId) {
            payload.id = documentId
          } else {
            payload.created_at = now
          }

          const { data, error: saveError } = await supabase
            .from("documents")
            .upsert(payload, { onConflict: "id" })
            .select("id")
            .single()

          if (!saveError && data?.id) {
            if (!documentId) setDocumentId(data.id)
          }
        }
      }
      setLastSavedAt(new Date())
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

    // Version snapshots are stored in localStorage via the versions state effect below
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

    const newPendingChanges: PendingChange[] = (changes.changes || []).map((change, idx) => ({
      id: `${changes.type}-${idx}`,
      section: change.section,
      field: "bullets",
      original: change.original,
      updated: change.updated,
    }))

    setPendingChanges(newPendingChanges)
    setShowPendingChanges(true)

    // Handle "full_resume" type — replace entire document with AI-generated resume
    if (changes.type === "full_resume" && changes.resume) {
      const resume = changes.resume
      setDocumentContent({
        name: resume.name || "",
        title: resume.title || "",
        contact: resume.contact || "",
        education: resume.education?.length
          ? resume.education
          : [{ school: "", degree: "", location: "", period: "" }],
        experience: resume.experience?.length
          ? resume.experience.map(exp => ({
              ...exp,
              bullets: exp.bullets || [],
            }))
          : [{ role: "", company: "", location: "", period: "", bullets: [""] }],
        projects: resume.projects?.length
          ? resume.projects.map(proj => ({
              ...proj,
              bullets: proj.bullets || [],
            }))
          : [],
        leadership: (resume as any).leadership || [],
        skills: resume.skills || "",
      })
      createVersionSnapshot(changes.description || "AI-generated resume")
      return
    }

    // Legacy: Handle "build_resume" type — populate blank fields from scratch
    if (changes.type === "build_resume" && changes.changes) {
      setDocumentContent((prev) => {
        const updated = { ...prev }

        for (const change of changes.changes!) {
          const section = change.section.toLowerCase()

          if (section === "name" || section === "header") {
            if (!updated.name?.trim()) updated.name = change.updated
          } else if (section === "title" || section === "target_role") {
            if (!updated.title?.trim()) updated.title = change.updated
          } else if (section === "contact") {
            updated.contact = change.updated
          } else if (section === "skills") {
            updated.skills = updated.skills?.trim()
              ? `${updated.skills}, ${change.updated}`
              : change.updated
          } else if (section === "education") {
            // Parse education entry: "School | Degree | Location | Period"
            const parts = change.updated.split("|").map((s: string) => s.trim())
            const newEdu = {
              school: parts[0] || "",
              degree: parts[1] || "",
              location: parts[2] || "",
              period: parts[3] || "",
            }
            // Replace empty placeholder or append
            const emptyIdx = updated.education.findIndex(
              (e) => !e.school?.trim() && !e.degree?.trim()
            )
            if (emptyIdx >= 0) {
              updated.education = [...updated.education]
              updated.education[emptyIdx] = newEdu
            } else {
              updated.education = [...updated.education, newEdu]
            }
          } else if (section === "experience") {
            // Check if this is a role header "Role | Company | Location | Period"
            // or a bullet point
            if (change.updated.includes("|")) {
              const parts = change.updated.split("|").map((s: string) => s.trim())
              const newExp = {
                role: parts[0] || "",
                company: parts[1] || "",
                location: parts[2] || "",
                period: parts[3] || "",
                bullets: [],
              }
              const emptyIdx = updated.experience.findIndex(
                (e) => !e.role?.trim() && !e.company?.trim()
              )
              if (emptyIdx >= 0) {
                updated.experience = [...updated.experience]
                updated.experience[emptyIdx] = newExp
              } else {
                updated.experience = [...updated.experience, newExp]
              }
            } else {
              // It's a bullet — add to the last experience entry
              const lastIdx = updated.experience.length - 1
              if (lastIdx >= 0) {
                updated.experience = [...updated.experience]
                const lastExp = { ...updated.experience[lastIdx] }
                const emptyBulletIdx = lastExp.bullets.findIndex((b) => !b.trim())
                if (emptyBulletIdx >= 0) {
                  lastExp.bullets = [...lastExp.bullets]
                  lastExp.bullets[emptyBulletIdx] = change.updated
                } else {
                  lastExp.bullets = [...lastExp.bullets, change.updated]
                }
                updated.experience[lastIdx] = lastExp
              }
            }
          } else if (section === "projects") {
            if (change.updated.includes("|")) {
              const parts = change.updated.split("|").map((s: string) => s.trim())
              updated.projects = [
                ...updated.projects,
                { name: parts[0] || "", tech: parts[1] || "", period: parts[2] || "", bullets: [] },
              ]
            } else {
              const lastIdx = updated.projects.length - 1
              if (lastIdx >= 0) {
                updated.projects = [...updated.projects]
                const lastProj = { ...updated.projects[lastIdx] }
                lastProj.bullets = [...lastProj.bullets, change.updated]
                updated.projects[lastIdx] = lastProj
              }
            }
          }
        }

        return updated
      })
      return
    }

    // If no changes array, nothing to do
    if (!changes.changes?.length) return

    // Strip leading bullet symbols (•, -, *) that the AI may include
    const stripBullet = (s: string) => s.replace(/^\s*[•\-*]\s*/, "")

    // Standard handler: find and replace the original text with updated text across all sections
    setDocumentContent((prev) => {
      const updated = { ...prev }

      // Normalize changes: strip bullet prefixes from original and updated
      const normalizedChanges = changes.changes!.map((c) => ({
        ...c,
        original: stripBullet(c.original),
        updated: stripBullet(c.updated),
      }))

      // Update header fields
      for (const change of normalizedChanges) {
        if (change.original === prev.name) updated.name = change.updated
        if (change.original === prev.title) updated.title = change.updated
        if (change.original === prev.contact) updated.contact = change.updated
        if (change.original === prev.skills) updated.skills = change.updated
      }

      // Update education fields
      updated.education = prev.education.map((edu) => {
        const newEdu = { ...edu }
        for (const change of normalizedChanges) {
          if (change.original === edu.school) newEdu.school = change.updated
          if (change.original === edu.degree) newEdu.degree = change.updated
          if (change.original === edu.location) newEdu.location = change.updated
          if (change.original === edu.period) newEdu.period = change.updated
        }
        return newEdu
      })

      // Update experience bullets
      updated.experience = prev.experience.map((exp) => {
        const newExp = { ...exp }
        // Update role/company/location/period fields
        for (const change of normalizedChanges) {
          if (change.original === exp.role) newExp.role = change.updated
          if (change.original === exp.company) newExp.company = change.updated
          if (change.original === exp.location) newExp.location = change.updated
          if (change.original === exp.period) newExp.period = change.updated
        }
        // Update existing bullets and track which changes were matched
        const matchedChangeIndices = new Set<number>()
        newExp.bullets = exp.bullets.map((bullet) => {
          const changeIdx = normalizedChanges.findIndex((c) => {
            if (c.section?.toLowerCase() !== "experience") return false
            if (c.original === bullet) return true
            if (c.original.toLowerCase() === bullet.toLowerCase()) return true
            if (bullet.includes(c.original) || c.original.includes(bullet)) return true
            return false
          })
          if (changeIdx !== -1) {
            matchedChangeIndices.add(changeIdx)
            return normalizedChanges[changeIdx].updated
          }
          return bullet
        })
        // Append new bullets from unmatched changes that target this experience's section
        const unmatchedExpChanges = normalizedChanges.filter((c, idx) =>
          !matchedChangeIndices.has(idx) &&
          c.section?.toLowerCase() === "experience" &&
          !c.original?.trim()
        )
        for (const change of unmatchedExpChanges) {
          newExp.bullets.push(change.updated)
        }
        return newExp
      })

      // Update project bullets
      updated.projects = prev.projects.map((proj) => {
        const matchedChangeIndices = new Set<number>()
        const newBullets = proj.bullets.map((bullet) => {
          const changeIdx = normalizedChanges.findIndex((c) => {
            if (c.section?.toLowerCase() !== "projects") return false
            if (c.original === bullet) return true
            if (c.original.toLowerCase() === bullet.toLowerCase()) return true
            if (bullet.includes(c.original) || c.original.includes(bullet)) return true
            return false
          })
          if (changeIdx !== -1) {
            matchedChangeIndices.add(changeIdx)
            return normalizedChanges[changeIdx].updated
          }
          return bullet
        })
        const unmatchedProjChanges = normalizedChanges.filter((c, idx) =>
          !matchedChangeIndices.has(idx) &&
          c.section?.toLowerCase() === "projects" &&
          !c.original?.trim()
        )
        for (const change of unmatchedProjChanges) {
          newBullets.push(change.updated)
        }
        return { ...proj, bullets: newBullets }
      })

      // Update leadership bullets if they exist
      if (updated.leadership) {
        updated.leadership = prev.leadership?.map((lead) => {
          const matchedChangeIndices = new Set<number>()
          const newBullets = lead.bullets.map((bullet) => {
            const changeIdx = normalizedChanges.findIndex((c) => {
              if (c.section?.toLowerCase() !== "leadership") return false
              if (c.original === bullet) return true
              if (c.original.toLowerCase() === bullet.toLowerCase()) return true
              if (bullet.includes(c.original) || c.original.includes(bullet)) return true
              return false
            })
            if (changeIdx !== -1) {
              matchedChangeIndices.add(changeIdx)
              return normalizedChanges[changeIdx].updated
            }
            return bullet
          })
          const unmatchedLeadChanges = normalizedChanges.filter((c, idx) =>
            !matchedChangeIndices.has(idx) &&
            c.section?.toLowerCase() === "leadership" &&
            !c.original?.trim()
          )
          for (const change of unmatchedLeadChanges) {
            newBullets.push(change.updated)
          }
          return { ...lead, bullets: newBullets }
        })
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

  const handleFileUpload = (file: File, content: string, format: FormatLabel) => {
    setSourceFormat(format)
    setShowUploadDialog(false)

    const parsed = parseResumeText(content)

    const displayName = parsed.name && parsed.name !== "Your Name"
      ? `${parsed.name}'s Resume`
      : file.name
    setUploadedFileName(displayName)

    setDocumentContent({
      name: parsed.name || "Your Name",
      title: parsed.title || "",
      contact: parsed.contact || "",
      education: parsed.education?.length ? parsed.education : [{ school: "", degree: "", location: "", period: "" }],
      experience: parsed.experience || [],
      projects: parsed.projects || [],
      leadership: parsed.leadership || [],
      skills: parsed.skills || "",
    })

    createVersionSnapshot(`Uploaded file: ${displayName}`)
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

  // Keep refs in sync so event handlers always read the latest values
  useEffect(() => { documentContentRef.current = documentContent }, [documentContent])
  useEffect(() => { documentVersionsRef.current = documentVersions }, [documentVersions])

  // Save to localStorage + trigger Supabase sync on page close
  useEffect(() => {
    const handleBeforeUnload = () => {
      setUserItem("polishEditor_document", JSON.stringify(documentContentRef.current))
      setUserItem("polishEditor_versions", JSON.stringify(documentVersionsRef.current))
      triggerSave()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [triggerSave])

  // Save to localStorage + trigger Supabase sync on SPA navigation away (unmount only)
  useEffect(() => {
    return () => {
      setUserItem("polishEditor_document", JSON.stringify(documentContentRef.current))
      setUserItem("polishEditor_versions", JSON.stringify(documentVersionsRef.current))
      triggerSave()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    <div className="min-h-svh h-svh flex flex-col bg-background">
      {showWelcomeModal && <EditorWelcomeModal onClose={handleCloseWelcome} userRole={userRole} />}

      <header className="border-b border-border bg-background sticky top-0 z-40">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <span className="font-medium text-foreground">Polish</span>
            <span className="text-xs text-muted-foreground">{isSaving ? "Saving..." : "Autosaved"}</span>
            {uploadedFileName && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                {uploadedFileName}
              </span>
            )}
            {sourceFormat && (
              <span className="text-xs font-medium bg-slate-900 text-white px-2 py-0.5 rounded-full">{sourceFormat}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              <Upload className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
            <ExportDialog documentContent={documentContent} simulateError={simulateExportError} sourceFormat={sourceFormat || undefined}>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
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
                  <DropdownMenuItem onSelect={() => router.push("/profile")} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Profile & Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowWelcomeModal(true)}
                    className="cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Open Guide
                  </DropdownMenuItem>
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

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="border-b border-border px-3 sm:px-6 py-2 bg-muted/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
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
            onContentChange={setDocumentContent}
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
          className="lg:shrink-0"
          ref={aiChatRef}
          selectedText={selectedText}
          onSuggestionApply={handleApplySuggestion}
          onUndo={handleUndoChanges}
          onClearSelection={handleClearSelection}
          documentContent={documentContent}
          autoReformat={autoReformat}
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

