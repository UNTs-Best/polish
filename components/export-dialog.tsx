"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Download, Loader2, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExportDialogProps {
  children: React.ReactNode
  documentContent?: any
  simulateError?: boolean
}

export function ExportDialog({ children, documentContent, simulateError }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const exportFormats = [
    {
      id: "pdf",
      name: "PDF",
      description: "Perfect for sharing and printing",
      popular: true,
    },
    {
      id: "docx",
      name: "Word Document",
      description: "Editable Microsoft Word format",
      popular: true,
    },
    {
      id: "latex",
      name: "LaTeX",
      description: "For academic and technical resumes",
      popular: false,
    },
  ]

  const handleExport = async (format: string) => {
    setIsExporting(true)
    setExportSuccess(null)
    setExportError(null)

    if (simulateError) {
      setTimeout(() => {
        setIsExporting(false)
        setExportError(format)
      }, 1500)
      return
    }

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format,
          content: documentContent || {
            title: "John Smith",
            author: "John Smith",
            summary:
              "Experienced software engineer with 8+ years of expertise in full-stack development, cloud architecture, and team leadership.",
            experience: "Senior Software Engineer at TechCorp Inc. Led development of microservices architecture.",
            skills: "JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, Kubernetes",
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      const data = await response.json()

      if (format === "latex") {
        const blob = new Blob([data.content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = data.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        console.log("Would download:", data.filename)
      }

      setExportSuccess(format)
    } catch (error) {
      console.error("Export error:", error)
      setExportError(format)
    } finally {
      setIsExporting(false)
    }
  }

  const handleRetry = (format: string) => {
    setExportError(null)
    handleExport(format)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-md border-0 shadow-2xl overflow-hidden p-0"
        style={{
          backgroundColor: "#fafbfc",
          backgroundImage: `
            linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
        aria-labelledby="export-dialog-title"
        aria-describedby="export-dialog-description"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-slate-100/40 pointer-events-none" />

        <div className="relative z-10 p-6">
          <DialogHeader className="mb-6">
            <DialogTitle id="export-dialog-title" className="text-xl font-bold text-slate-900 tracking-tight">
              Export Resume
            </DialogTitle>
            <DialogDescription id="export-dialog-description" className="text-slate-500">
              Choose your preferred format to download.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {exportFormats.map((format) => (
              <button
                key={format.id}
                className={`w-full p-4 rounded-xl border transition-all text-left ${
                  exportSuccess === format.id
                    ? "border-green-500 bg-green-50"
                    : exportError === format.id
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
                onClick={() => !isExporting && !exportError && handleExport(format.id)}
                role="button"
                tabIndex={0}
                aria-label={`Export as ${format.name}`}
                disabled={isExporting}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        exportSuccess === format.id
                          ? "bg-green-500"
                          : exportError === format.id
                            ? "bg-red-500"
                            : "bg-slate-900"
                      }`}
                    >
                      {exportSuccess === format.id ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : exportError === format.id ? (
                        <AlertCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Download className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{format.name}</h3>
                        {format.popular && (
                          <span className="text-[10px] uppercase tracking-wide font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{format.description}</p>
                      {exportError === format.id && (
                        <div className="mt-2">
                          <p className="text-xs text-red-600 mb-1">Export failed. Please try again.</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-600 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRetry(format.id)
                            }}
                            aria-label={`Retry exporting as ${format.name}`}
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : exportSuccess === format.id ? (
                      <span className="text-sm text-green-600 font-medium">Done</span>
                    ) : exportError === format.id ? (
                      <span className="text-sm text-red-600 font-medium">Failed</span>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-white rounded-xl border border-slate-200/60">
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">Layout Preservation</span> — All exports maintain your
              resume's formatting perfectly.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
