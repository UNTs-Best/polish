"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  FileText,
  Plus,
  LogOut,
  User,
  ChevronDown,
  Trash2,
  Clock,
  FileType,
  FileCode,
  Upload,
  FilePlus2,
  Settings,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clearUserData, setUserItem, removeUserItem } from "@/lib/user-storage"
import { supabase, signOut as supabaseSignOut } from "@/lib/supabase-browser"
import { FileUpload } from "@/components/file-upload"
import { type FormatLabel, parseResumeText } from "@/lib/document-parser"

interface Doc {
  id: string
  title: string
  mime_type?: string
  created_at?: string
  updated_at?: string
}

function fileIcon(mimeType?: string) {
  if (!mimeType) return FileText
  if (mimeType.includes("pdf")) return FileText
  if (mimeType.includes("word") || mimeType.includes("msword")) return FileType
  if (mimeType.includes("latex") || mimeType.includes("tex")) return FileCode
  return FileText
}

function fileColor(mimeType?: string) {
  if (!mimeType) return "text-slate-500"
  if (mimeType.includes("pdf")) return "text-red-500"
  if (mimeType.includes("word") || mimeType.includes("msword")) return "text-blue-500"
  if (mimeType.includes("latex") || mimeType.includes("tex")) return "text-green-500"
  return "text-slate-500"
}

function formatDate(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name: string; id?: string } | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showNewDocModal, setShowNewDocModal] = useState(false)

  const fetchDocs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, mime_type, created_at, updated_at")
        .order("updated_at", { ascending: false })
      if (!error) setDocs(data ?? [])
    } catch {
      // Supabase unreachable — show empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const cached = localStorage.getItem("polish_user")
    if (cached) {
      try {
        setUser(JSON.parse(cached))
      } catch {
        // ignore malformed cache
      }
    }

    const syncSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
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
        setUser({ email: u.email ?? "", name, id: u.id })
        localStorage.setItem("polish_user", JSON.stringify({ email: u.email, name, id: u.id }))
        fetchDocs()
      } catch {
        // Supabase unreachable — redirect to sign-in instead of hanging
        setUser(null)
        router.replace("/signin")
      }
    }

    syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
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
      setUser({ email: u.email ?? "", name, id: u.id })
      localStorage.setItem("polish_user", JSON.stringify({ email: u.email, name, id: u.id }))
    })

    return () => subscription.unsubscribe()
  }, [router, fetchDocs])

  const handleSignOut = async () => {
    clearUserData()
    await supabaseSignOut()
    setUser(null)
    router.replace("/signin")
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await supabase.from("documents").delete().eq("id", id)
      setDocs((prev) => prev.filter((d) => d.id !== id))
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  const openDocument = (doc: Doc) => {
    setUserItem("polish_open_document_id", doc.id)
    router.push("/editor")
  }

  const makeUniqueTitle = async (baseTitle: string, userId: string): Promise<string> => {
    try {
      const { data } = await supabase
        .from("documents")
        .select("title")
        .eq("user_id", userId)
      if (!data || data.length === 0) return baseTitle

      const existing = new Set(data.map((d: { title: string }) => d.title))
      if (!existing.has(baseTitle)) return baseTitle

      let counter = 2
      while (existing.has(`${baseTitle} (${counter})`)) counter++
      return `${baseTitle} (${counter})`
    } catch {
      return baseTitle
    }
  }

  const handleFileUpload = async (_file: File, content: string, format: FormatLabel) => {
    setShowUploadDialog(false)
    const parsed = parseResumeText(content)
    const docContent = {
      name: parsed.name || "Your Name",
      title: parsed.title || "",
      contact: parsed.contact || "",
      education: parsed.education?.length
        ? parsed.education
        : [{ school: "", degree: "", location: "", period: "" }],
      experience: parsed.experience || [],
      projects: parsed.projects || [],
      leadership: parsed.leadership || [],
      skills: parsed.skills || "",
    }
    const baseDisplayName = parsed.name && parsed.name !== "Your Name"
      ? `${parsed.name}'s Resume`
      : _file.name

    // Create the document in Supabase immediately so it persists
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const displayName = await makeUniqueTitle(baseDisplayName, session.user.id)
        const now = new Date().toISOString()
        const { data, error } = await supabase
          .from("documents")
          .insert({
            user_id: session.user.id,
            title: displayName,
            content: JSON.stringify(docContent),
            created_at: now,
            updated_at: now,
          })
          .select("id")
          .single()

        if (!error && data?.id) {
          setUserItem("polish_open_document_id", data.id)
          router.push("/editor")
          return
        }
      }
    } catch {
      // Supabase unreachable — fall through to localStorage fallback
    }

    // Fallback: pass via localStorage if Supabase insert failed
    setUserItem("polish_uploaded_content", JSON.stringify(docContent))
    setUserItem("polish_uploaded_filename", baseDisplayName)
    router.push("/editor")
  }

  const startFromScratch = () => {
    removeUserItem("polishEditor_document")
    removeUserItem("polishEditor_versions")
    removeUserItem("polish_open_document_id")
    router.push("/editor")
  }

  if (!user) {
    return null
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: "#f8fafc",
        backgroundImage: `
          linear-gradient(to right, rgba(148,163,184,0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148,163,184,0.1) 1px, transparent 1px)
        `,
        backgroundSize: "32px 32px",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-transparent to-slate-100/40 pointer-events-none" />
      <nav className="border-b border-slate-200/60 backdrop-blur-xl bg-slate-50/90 sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center gap-2 min-h-16 py-2">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 bg-clip-text text-transparent tracking-tight"
            >
              Polish
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium rounded-lg px-2 sm:px-3">
                  Home
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent font-medium rounded-lg gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span className="max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem className="text-slate-600 cursor-default truncate max-w-full">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push("/profile")} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Profile & Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Welcome back, {user.name}</h1>
            <p className="text-slate-500">Your documents</p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowNewDocModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg rounded-lg gap-2"
          >
            <Plus className="w-4 h-4" />
            New Document
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <Card className="p-12 border-2 border-dashed border-slate-200 bg-white/80 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No documents yet</h2>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Upload an existing resume or start from scratch with a blank template.
            </p>
            <Button
              onClick={() => setShowNewDocModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl gap-2"
            >
              <Plus className="w-4 h-4" />
              Get started
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc) => {
              const Icon = fileIcon(doc.mime_type)
              const color = fileColor(doc.mime_type)
              return (
                <Card
                  key={doc.id}
                  className="group p-5 border-slate-200/60 bg-white/90 backdrop-blur shadow hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => openDocument(doc)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(doc.id)
                      }}
                      disabled={deletingId === doc.id}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                      aria-label="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mb-2">
                    {doc.title}
                  </p>
                  {(doc.updated_at || doc.created_at) && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(doc.updated_at || doc.created_at)}
                    </div>
                  )}
                </Card>
              )
            })}

            <Card
              className="p-5 border-2 border-dashed border-slate-200 bg-transparent hover:border-slate-400 hover:bg-white/60 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[144px]"
              onClick={() => setShowNewDocModal(true)}
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Plus className="w-5 h-5 text-slate-500" />
              </div>
              <span className="text-sm font-medium text-slate-500">New document</span>
            </Card>
          </div>
        )}
      </main>

      {showNewDocModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNewDocModal(false)}
        >
          <Card
            className="max-w-md w-full p-6 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">New Document</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewDocModal(false)}
                className="text-slate-500 hover:text-slate-900"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowNewDocModal(false)
                  setShowUploadDialog(true)
                }}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <Upload className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Upload a resume</p>
                  <p className="text-xs text-slate-500 mt-0.5">PDF, DOCX, or TXT</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowNewDocModal(false)
                  startFromScratch()
                }}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <FilePlus2 className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Start from scratch</p>
                  <p className="text-xs text-slate-500 mt-0.5">Blank resume template</p>
                </div>
              </button>
            </div>
          </Card>
        </div>
      )}

      {showUploadDialog && (
        <FileUpload
          onFileUpload={handleFileUpload}
          onClose={() => setShowUploadDialog(false)}
        />
      )}
    </div>
  )
}
