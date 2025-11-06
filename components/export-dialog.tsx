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
import { Card } from "@/components/ui/card"
import { Download, FileText, File, Code, Loader2, Check, AlertCircle } from "lucide-react"
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
      icon: FileText,
      popular: true,
    },
    {
      id: "docx",
      name: "Word Document",
      description: "Editable Microsoft Word format",
      icon: File,
      popular: true,
    },
    {
      id: "latex",
      name: "LaTeX",
      description: "For academic and technical documents",
      icon: Code,
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

      // Simulate download
      if (format === "latex") {
        // For LaTeX, show the content in a new window/tab
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
        // For PDF and DOCX, we would normally trigger a real download
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
        className="sm:max-w-md"
        aria-labelledby="export-dialog-title"
        aria-describedby="export-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="export-dialog-title" className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export Document</span>
          </DialogTitle>
          <DialogDescription id="export-dialog-description">
            Choose your preferred format to download your polished document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {exportFormats.map((format) => (
            <Card
              key={format.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
                exportSuccess === format.id
                  ? "border-green-500 bg-green-50"
                  : exportError === format.id
                    ? "border-red-500 bg-red-50"
                    : "border-border hover:border-primary/50"
              }`}
              onClick={() => !isExporting && !exportError && handleExport(format.id)}
              role="button"
              tabIndex={0}
              aria-label={`Export as ${format.name}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  !isExporting && !exportError && handleExport(format.id)
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      exportSuccess === format.id
                        ? "bg-green-500"
                        : exportError === format.id
                          ? "bg-red-500"
                          : format.popular
                            ? "gradient-primary"
                            : "bg-muted"
                    }`}
                  >
                    {exportSuccess === format.id ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : exportError === format.id ? (
                      <AlertCircle className="w-5 h-5 text-white" />
                    ) : (
                      <format.icon className={`w-5 h-5 ${format.popular ? "text-white" : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{format.name}</h3>
                      {format.popular && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Popular</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{format.description}</p>
                    {exportError === format.id && (
                      <div className="mt-2">
                        <p className="text-xs text-red-700 mb-1">Export failed. Please try again.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100 focus:ring-2 focus:ring-red-600 focus:ring-offset-2 bg-transparent"
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
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : exportSuccess === format.id ? (
                    <span className="text-sm text-green-600 font-medium">Downloaded!</span>
                  ) : exportError === format.id ? (
                    <span className="text-sm text-red-600 font-medium">Failed</span>
                  ) : (
                    <Download className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Layout Preservation</p>
              <p>All exports maintain your document's formatting, fonts, and structure perfectly.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
