"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface GuideModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const guideSteps = [
  {
    title: "Upload Any Format",
    description:
      "Upload your resume as PDF, DOCX, RTF, TXT, or LaTeX. Polish parses it automatically so you can start editing right away.",
  },
  {
    title: "Connect Claude AI",
    description:
      "Click 'Connect Claude' in the header and enter your Anthropic API key. Once connected, all AI editing features become active.",
  },
  {
    title: "Select & Edit with AI",
    description:
      "Highlight any text in your resume to see an inline prompt with quick actions like 'Improve', 'Shorten', 'ATS optimize', and more. Or type a custom request.",
  },
  {
    title: "Review Suggestions",
    description:
      "AI suggestions appear in the chat panel with highlighted diffs. Accept changes to apply them, dismiss to skip, or undo to revert.",
  },
  {
    title: "Quick Actions",
    description:
      "Use the quick action buttons in the chat panel to instantly optimize for ATS, proofread, quantify achievements, or make your resume more concise.",
  },
  {
    title: "Export Anywhere",
    description:
      "Download your polished resume as PDF, DOCX, LaTeX, RTF, or TXT. Convert between any format seamlessly.",
  },
]

export function GuideModal({ open, onOpenChange }: GuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    setCurrentStep(0)
    onOpenChange(false)
  }

  const step = guideSteps[currentStep]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-slate-100/40 pointer-events-none" />

        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="text-center mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Guide</span>
          </div>

          {/* Content */}
          <div className="py-8 flex flex-col items-center">
            <span className="text-xs font-medium text-slate-400 mb-4">
              {currentStep + 1} of {guideSteps.length}
            </span>
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-4 tracking-tight">{step.title}</h3>
            <p className="text-slate-600 text-center text-base leading-relaxed max-w-sm">{step.description}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200/60">
            <div className="flex gap-1.5">
              {guideSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep ? "bg-slate-900 w-6" : "bg-slate-200 w-1.5 hover:bg-slate-300"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              {currentStep < guideSteps.length - 1 ? (
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleClose}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                >
                  Got it
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
