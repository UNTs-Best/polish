"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, Upload, FileText, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { setUserItem } from "@/lib/user-storage"
import { parseDocument, parseResumeText } from "@/lib/document-parser"

interface OnboardingData {
  targetRole: string
  startOption: string | null
  uploadedFile: File | null
  parsedContent: any | null
}

const popularRoles = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "UX Designer",
  "Marketing Manager",
  "Business Analyst",
  "Project Manager",
  "Sales Representative",
]

const steps = [
  { title: "What role are you targeting?", subtitle: "This helps us tailor AI suggestions" },
  { title: "How do you want to start?", subtitle: "Upload existing or start fresh" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    targetRole: "",
    startOption: null,
    uploadedFile: null,
    parsedContent: null,
  })
  const [customRole, setCustomRole] = useState("")
  const [isParsingFile, setIsParsingFile] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleRoleSelect = (role: string) => {
    setData((prev) => ({ ...prev, targetRole: role }))
    setCustomRole("")
  }

  const handleCustomRoleChange = (value: string) => {
    setCustomRole(value)
    setData((prev) => ({ ...prev, targetRole: value }))
  }

  const handleStartOptionSelect = (option: string) => {
    setData((prev) => ({ ...prev, startOption: option }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsingFile(true)
    setParseError(null)

    try {
      // Parse the document
      const parsed = await parseDocument(file)

      // Convert to structured resume content
      const resumeContent = parseResumeText(parsed.text)

      setData((prev) => ({
        ...prev,
        startOption: "upload",
        uploadedFile: file,
        parsedContent: resumeContent,
      }))
    } catch (error) {
      console.error("[v0] File parsing error:", error)
      setParseError(error instanceof Error ? error.message : "Failed to parse file")
      setData((prev) => ({
        ...prev,
        startOption: null,
        uploadedFile: null,
        parsedContent: null,
      }))
    } finally {
      setIsParsingFile(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      setUserItem("polish_target_role", data.targetRole)
      setUserItem("polish_onboarding", JSON.stringify(data))

      // Save parsed content for editor to load
      if (data.parsedContent) {
        setUserItem("polish_uploaded_content", JSON.stringify(data.parsedContent))
        setUserItem("polish_uploaded_filename", data.uploadedFile?.name || "")
      } else {
        // Clear any previous uploaded content if starting fresh
        setUserItem("polish_uploaded_content", "")
        setUserItem("polish_uploaded_filename", "")
      }

      router.push("/editor")
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return data.targetRole.trim().length > 0
      case 1:
        return data.startOption !== null
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="max-w-xl mx-auto space-y-6">
            {/* Custom input */}
            <div>
              <input
                type="text"
                placeholder="Type your target job title..."
                value={customRole || data.targetRole}
                onChange={(e) => handleCustomRoleChange(e.target.value)}
                className={cn(
                  "w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900",
                  "placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400",
                  "transition-all duration-200 text-base",
                )}
              />
            </div>

            {/* Quick select options */}
            <div>
              <p className="text-sm text-slate-500 mb-3">Or choose a common role:</p>
              <div className="flex flex-wrap gap-2">
                {popularRoles.map((role) => {
                  const isSelected = data.targetRole === role && !customRole
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSelect(role)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm border transition-all duration-200",
                        "hover:border-slate-400",
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {role}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
            />

            {/* Upload option */}
            <button
              onClick={handleUploadClick}
              disabled={isParsingFile}
              className={cn(
                "flex-1 flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all duration-200",
                "hover:border-slate-400 hover:shadow-sm",
                isParsingFile && "opacity-70 cursor-wait",
                data.startOption === "upload" ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white",
              )}
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                  data.startOption === "upload" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                {isParsingFile ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
              </div>
              <div className="text-center">
                <span className="font-semibold text-slate-900 block text-lg">
                  {isParsingFile ? "Parsing..." : "Upload resume"}
                </span>
                <span className="text-sm text-slate-500">
                  {data.uploadedFile ? data.uploadedFile.name : "PDF, DOCX, or TXT"}
                </span>
                {parseError && <span className="text-sm text-red-500 block mt-1">{parseError}</span>}
              </div>
              {data.startOption === "upload" && !isParsingFile && <Check className="w-5 h-5 text-slate-900" />}
            </button>

            {/* Start fresh option */}
            <button
              onClick={() => handleStartOptionSelect("scratch")}
              className={cn(
                "flex-1 flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all duration-200",
                "hover:border-slate-400 hover:shadow-sm",
                data.startOption === "scratch" ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white",
              )}
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                  data.startOption === "scratch" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="font-semibold text-slate-900 block text-lg">Start fresh</span>
                <span className="text-sm text-slate-500">Build from scratch</span>
              </div>
              {data.startOption === "scratch" && <Check className="w-5 h-5 text-slate-900" />}
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "#fafbfc",
        backgroundImage: `
          linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)
        `,
        backgroundSize: "24px 24px",
      }}
    >
      {/* Header */}
      <header className="border-b border-slate-200/60 px-6 py-4 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-900 hover:opacity-80 transition-opacity">
            Polish
          </Link>
          <span className="text-sm text-slate-400">
            {currentStep + 1} / {steps.length}
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-0.5">
        <div
          className="bg-slate-900 h-0.5 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl">
          {/* Step Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
              {steps[currentStep].title}
            </h1>
            <p className="text-slate-500 text-lg">{steps[currentStep].subtitle}</p>
          </div>

          {/* Step Content */}
          <div className="mb-12">{renderStepContent()}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <div className="flex gap-1.5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-200",
                    idx === currentStep
                      ? "bg-slate-900 w-6"
                      : idx < currentStep
                        ? "bg-slate-900 w-1.5"
                        : "bg-slate-200 w-1.5",
                  )}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-slate-900 text-white hover:bg-slate-800 rounded-lg"
            >
              {currentStep === steps.length - 1 ? "Start" : "Next"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
