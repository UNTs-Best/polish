"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, ArrowRight, Plus, LogOut, User, ChevronDown, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clearUserData, getAccessToken } from "@/lib/user-storage"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface Document {
  id: string
  title: string
  documentType: string | null
  updatedAt: string
  createdAt: string
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      return
    }

    fetchDocuments(token)
  }, [router])

  const fetchDocuments = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/docs`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        router.replace("/signin")
        return
      }
      const data = await res.json()
      setDocuments(data.documents ?? [])
    } catch {
      // show empty state, don't crash
    } finally {
      setLoading(false)
    }
  }

  const handleNewDocument = async () => {
    const token = getAccessToken()
    if (!token) return router.replace("/signin")

    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/api/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: "Untitled Resume", documentType: "resume", content: "" }),
      })
      const data = await res.json()
      router.push(`/editor?id=${data.document.id}`)
    } catch {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const token = getAccessToken()
    if (!token) return

    setDeletingId(id)
    try {
      await fetch(`${API_URL}/api/docs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const handleSignOut = () => {
    clearUserData()
    localStorage.removeItem("polish_user")
    router.replace("/")
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  if (!user) return null

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
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 bg-clip-text text-transparent tracking-tight">
              Polish
            </Link>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent font-medium rounded-lg gap-2">
                    <User className="w-4 h-4" />
                    {user.firstName}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem className="text-slate-600 cursor-default truncate">{user.email}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                onClick={handleNewDocument}
                disabled={creating}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg rounded-lg border-0"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Document
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-slate-600 mb-10">Your documents</p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="p-6 border-slate-200/60 bg-white/90 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/4" />
              </Card>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <Card className="p-8 border-slate-200/60 bg-white/90 backdrop-blur shadow-lg border-2 border-dashed border-slate-200">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">No documents yet</h2>
              <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                Create a new resume or upload an existing one.
              </p>
              <Button
                size="lg"
                onClick={handleNewDocument}
                disabled={creating}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-lg gap-2"
              >
                <Plus className="w-4 h-4" />
                {creating ? "Creating..." : "Create document"}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Link key={doc.id} href={`/editor?id=${doc.id}`}>
                <Card className="p-6 border-slate-200/60 bg-white/90 backdrop-blur shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-slate-900 truncate">{doc.title}</h2>
                        <p className="text-sm text-slate-500">
                          {doc.documentType ?? "document"} · edited {formatDate(doc.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handleDelete(doc.id, e)}
                        disabled={deletingId === doc.id}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}

            <button
              onClick={handleNewDocument}
              disabled={creating}
              className="w-full p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-700 transition-all text-sm font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {creating ? "Creating..." : "New document"}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
