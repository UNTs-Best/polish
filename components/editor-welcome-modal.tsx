"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, ArrowRight } from "lucide-react"

interface EditorWelcomeModalProps {
  onClose: () => void
  userRole?: string
}

const tips = [
  {
    title: "Your Resume Preview",
    description: "See your resume in real-time on the left. Click any section to select text for AI suggestions.",
  },
  {
    title: "AI Assistant",
    description: "Chat with AI on the right panel. Select text and ask for improvements, or type your own questions.",
  },
  {
    title: "Quick Actions",
    description: "Use quick action buttons for instant improvements like 'Make Professional' or 'Add Metrics'.",
  },
  {
    title: "Export Ready",
    description: "When you're done, export to PDF, DOCX, or plain text with one click.",
  },
]

export function EditorWelcomeModal({ onClose, userRole }: EditorWelcomeModalProps) {
  const [currentTip, setCurrentTip] = useState(0)

  const roleMessages: Record<string, string> = {
    "software-engineer": "We'll help you highlight technical skills and quantify your engineering impact.",
    "product-manager": "Focus on metrics, stakeholder management, and product outcomes.",
    designer: "Showcase your design process, user research, and visual portfolio.",
    "data-scientist": "Emphasize data-driven insights, models built, and business impact.",
    marketing: "Highlight campaign results, growth metrics, and brand achievements.",
    student: "We'll help you translate coursework and projects into professional experience.",
    other: "Let's craft a resume that showcases your unique strengths.",
  }

  const handleNext = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden bg-slate-50">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
            linear-gradient(to right, rgba(148,163,184,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148,163,184,0.1) 1px, transparent 1px)
          `,
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-10 p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Welcome to the Editor</h2>
              {userRole && (
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  {roleMessages[userRole] || roleMessages["other"]}
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {currentTip + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{tips[currentTip].title}</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{tips[currentTip].description}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              {tips.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTip(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentTip ? "bg-slate-900 w-6" : "bg-slate-200 w-1.5 hover:bg-slate-300"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
              <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                Skip tour
              </button>
              <Button onClick={handleNext} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg">
                {currentTip < tips.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
