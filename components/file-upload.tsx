"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Check, FileText, FileType, FileCode } from "lucide-react"
import { Card } from "@/components/ui/card"
import { parseDocument, type FormatLabel } from "@/lib/document-parser"

interface FileUploadProps {
  onFileUpload: (file: File, content: string, format: FormatLabel) => void
  onClose: () => void
}

const FORMAT_CONFIG: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  "PDF": { icon: FileText, color: "text-red-600", bg: "bg-red-50" },
  "DOCX": { icon: FileType, color: "text-blue-600", bg: "bg-blue-50" },
  "RTF": { icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
  "TXT": { icon: FileText, color: "text-slate-600", bg: "bg-slate-50" },
  "LaTeX": { icon: FileCode, color: "text-green-600", bg: "bg-green-50" },
}

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.doc,.rtf,.txt,.tex,.latex"
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/rtf",
  "text/rtf",
  "text/plain",
  "application/x-tex",
  "application/x-latex",
]

function isAcceptedFile(file: File): boolean {
  const ext = file.name.toLowerCase().split(".").pop() || ""
  return ["pdf", "docx", "doc", "rtf", "txt", "tex", "latex"].includes(ext) || ACCEPTED_TYPES.includes(file.type)
}

export function FileUpload({ onFileUpload, onClose }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [detectedFormat, setDetectedFormat] = useState<FormatLabel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && isAcceptedFile(file)) {
      processFile(file)
    } else if (file) {
      setError(`"${file.name}" is not a supported format. Please upload PDF, DOCX, RTF, TXT, or LaTeX.`)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (isAcceptedFile(file)) {
        processFile(file)
      } else {
        setError(`"${file.name}" is not a supported format.`)
      }
    }
  }

  const processFile = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    try {
      const parsed = await parseDocument(file)
      setDetectedFormat(parsed.formatLabel)

      clearInterval(progressInterval)
      setUploadProgress(100)

      await new Promise((resolve) => setTimeout(resolve, 600))

      onFileUpload(file, parsed.text, parsed.formatLabel)
    } catch (err) {
      clearInterval(progressInterval)
      setIsUploading(false)
      setUploadProgress(0)
      setError(err instanceof Error ? err.message : "Failed to parse file. Please try another format.")
    }
  }

  const formatConfig = detectedFormat ? FORMAT_CONFIG[detectedFormat] : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Upload Resume</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isUploading}
            className="text-slate-600 hover:text-slate-900"
            aria-label="Close upload dialog"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {isUploading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                {uploadProgress < 100 ? (
                  <>
                    <div className="w-16 h-16 mx-auto border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-slate-900">
                      {detectedFormat ? `Parsing ${detectedFormat} file...` : "Uploading resume..."}
                    </p>
                    <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-600">{uploadProgress}%</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-green-700">Upload complete!</p>
                    {detectedFormat && (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${formatConfig?.bg} ${formatConfig?.color}`}>
                        {detectedFormat} detected
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-slate-900 bg-slate-50" : "border-slate-300 hover:border-slate-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileType className="w-5 h-5 text-blue-500" />
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <FileCode className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-1">Drag and drop your resume here</p>
              <p className="text-xs text-slate-500 mb-4">PDF, DOCX, RTF, TXT, or LaTeX</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleFileSelect}
                className="hidden"
                aria-label="File input for resume upload"
              />
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </>
        )}

        <div className="mt-4 flex items-center justify-center gap-2">
          {["PDF", "DOCX", "RTF", "TXT", "LaTeX"].map((fmt) => (
            <span
              key={fmt}
              className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide"
            >
              {fmt}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">Max file size: 10MB</p>
      </Card>
    </div>
  )
}
