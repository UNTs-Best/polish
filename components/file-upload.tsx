"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X, Check, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"

interface FileUploadProps {
  onFileUpload: (file: File, content: string) => void
  onClose: () => void
}

export function FileUpload({ onFileUpload, onClose }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
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
    if (file) {
      processFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = async (file: File) => {
    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit")
      setIsUploading(false)
      return
    }

    // Check file type
    const validTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
    ]
    const validExtensions = ['.txt', '.pdf', '.doc', '.docx', '.md']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError("Unsupported file type. Please upload TXT, PDF, DOC, DOCX, or MD files.")
      setIsUploading(false)
      return
    }

    // Simulate upload progress
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
      let content = ''

      // Read file content based on type
      if (file.type === 'text/plain' || fileExtension === '.txt' || fileExtension === '.md') {
        // Read text files directly
        content = await file.text()
      } else if (file.type === 'application/pdf' || fileExtension === '.pdf') {
        // For PDF, we'll show a message that PDF parsing needs backend support
        // For now, use a placeholder
        content = await readPDFAsText(file)
      } else {
        // For DOC/DOCX, we'd need a library or backend support
        // For now, show error
        throw new Error('DOC/DOCX files require backend processing. Please convert to TXT or PDF first.')
      }

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Show success state briefly
      await new Promise((resolve) => setTimeout(resolve, 400))

      onFileUpload(file, content)
    } catch (err) {
      clearInterval(progressInterval)
      setError(err instanceof Error ? err.message : 'Failed to process file')
      setIsUploading(false)
    }
  }

  // Simple PDF text extraction (basic - for production you'd want a proper PDF parser)
  const readPDFAsText = async (file: File): Promise<string> => {
    // For now, return a message that PDF parsing needs backend
    // In production, you'd use a PDF parsing library or send to backend
    return `PDF file detected: ${file.name}\n\nNote: Full PDF text extraction requires backend processing.\nFor now, please upload a TXT file or copy-paste your resume text directly into the editor.`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Upload Document</h3>
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

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Upload Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isUploading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                {uploadProgress < 100 ? (
                  <>
                    <div className="w-16 h-16 mx-auto border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-slate-900">Processing document...</p>
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
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-slate-900 bg-slate-50" : "border-slate-300 hover:border-slate-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p className="text-sm text-slate-700 mb-2">Drag and drop your resume here</p>
            <p className="text-xs text-slate-500 mb-4">or</p>
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
              accept=".txt,.pdf,.doc,.docx,.md"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="File input for document upload"
            />
          </div>
        )}

        <p className="text-xs text-slate-500 mt-4 text-center">
          Supported formats: TXT, PDF, DOC, DOCX, MD (max 10MB)
        </p>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Tip: For best results, use a plain text (.txt) file
        </p>
      </Card>
    </div>
  )
}
