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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clearUserData } from "@/lib/user-storage"
import { supabase, signOut as supabaseSignOut } from "@/lib/supabase-browser"

interface Doc {
  id: string
  title: string
  mimeType?: string
  createdAt?: string
  updatedAt?: string
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
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
    })
  }, [router, fetchDocs])

  const handleSignOut = async () => {
    clearUserData()
    await supabaseSignOut()
    setUser(null)
    router.replace("/")
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
    localStorage.setItem(
      "polishEditor_document",
      JSON.stringify({ id: doc.id, name: doc.title, title: doc.title })
    )
    router.push("/editor")
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    )
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
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/editor">
              <Button
                size="sm"
                variant="outline"
                className="border-slate-300 text-slate-700 rounded-lg gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </Link>
            <Link href="/editor">
              <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg rounded-lg gap-2"
              >
                <Plus className="w-4 h-4" />
                New Document
              </Button>
            </Link>
          </div>
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
              Create a new document or upload an existing resume in PDF, DOCX, LaTeX, or more.
            </p>
            <Link href="/editor">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl gap-2">
                <Plus className="w-4 h-4" />
                Create or upload document
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc) => {
              const Icon = fileIcon(doc.mimeType)
              const color = fileColor(doc.mimeType)
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
                  {(doc.updatedAt || doc.createdAt) && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(doc.updatedAt || doc.createdAt)}
                    </div>
                  )}
                </Card>
              )
            })}

            {/* New document card */}
            <Link href="/editor">
              <Card className="p-5 border-2 border-dashed border-slate-200 bg-transparent hover:border-slate-400 hover:bg-white/60 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[144px]">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-slate-500" />
                </div>
                <span className="text-sm font-medium text-slate-500">New document</span>
              </Card>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
