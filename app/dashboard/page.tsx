"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, ArrowRight, Plus, LogOut, User, ChevronDown } from "lucide-react"
import { getUserItem } from "@/lib/user-storage"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clearUserData } from "@/lib/user-storage"

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [documentName, setDocumentName] = useState<string | null>(null)
  const [hasDocument, setHasDocument] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("polish_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        setUser(null)
      }
    } else {
      router.replace("/signin")
      return
    }

    const raw = getUserItem("polishEditor_document")
    if (raw) {
      try {
        const doc = JSON.parse(raw)
        setHasDocument(true)
        setDocumentName(doc.name || doc.title || "My resume")
      } catch {
        setHasDocument(false)
      }
    } else {
      setHasDocument(false)
    }
  }, [router])

  const handleSignOut = () => {
    clearUserData()
    localStorage.removeItem("polish_user")
    setUser(null)
    router.replace("/")
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
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 bg-clip-text text-transparent tracking-tight"
            >
              Polish
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium rounded-lg">
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
                    {user.name}
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
              <Link href="/editor">
                <Button
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg rounded-lg border-0 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  Open Editor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, {user.name}</h1>
        <p className="text-slate-600 mb-10">Manage your resume and jump back into editing.</p>

        {hasDocument ? (
          <Card className="p-6 border-slate-200/60 bg-white/90 backdrop-blur shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{documentName}</h2>
                  <p className="text-sm text-slate-500 mt-1">Continue editing with AI suggestions and export to PDF, DOCX, or LaTeX.</p>
                </div>
              </div>
              <Link href="/editor">
                <Button
                  size="lg"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-lg gap-2"
                >
                  Continue editing
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="p-8 border-slate-200/60 bg-white/90 backdrop-blur shadow-lg border-2 border-dashed border-slate-200">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">No document yet</h2>
              <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                Create a new resume or upload an existing one. Edit visually with AI and export in one click.
              </p>
              <Link href="/editor">
                <Button
                  size="lg"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-lg gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create or upload document
                </Button>
              </Link>
            </div>
          </Card>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/editor">
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 rounded-lg">
              Open Editor
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-600 rounded-lg">
              Back to Home
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
