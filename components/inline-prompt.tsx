"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface InlinePromptProps {
  selectedText: string
  position: { x: number; y: number }
  onSubmit: (prompt: string, selectedText: string) => void
  onClose: () => void
}

const QUICK_ACTIONS = [
  { label: "Improve", prompt: "Improve this" },
  { label: "Shorten", prompt: "Make more concise" },
  { label: "Professional", prompt: "Make more professional" },
  { label: "Add metrics", prompt: "Add metrics and numbers" },
  { label: "ATS optimize", prompt: "Optimize for ATS systems" },
  { label: "Action verbs", prompt: "Use stronger action verbs" },
  { label: "Quantify", prompt: "Quantify the achievements" },
  { label: "Proofread", prompt: "Proofread and fix grammar" },
]

export function InlinePrompt({ selectedText, position, onSubmit, onClose }: InlinePromptProps) {
  const [prompt, setPrompt] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (prompt.trim()) {
      onSubmit(prompt.trim(), selectedText)
      setPrompt("")
    }
  }

  const handleQuickAction = (action: string) => {
    onSubmit(action, selectedText)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const getAdjustedPosition = () => {
    const popupWidth = 360
    const popupHeight = 180
    const padding = 16

    let x = position.x
    let y = position.y + 8

    if (x + popupWidth > window.innerWidth - padding) {
      x = window.innerWidth - popupWidth - padding
    }

    if (x < padding) {
      x = padding
    }

    if (y + popupHeight > window.innerHeight - padding) {
      y = position.y - popupHeight - 8
    }

    return { x, y }
  }

  const adjustedPosition = getAdjustedPosition()

  return (
    <div
      ref={containerRef}
      className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-3 w-[360px]">
        {/* Selected text preview */}
        <div className="mb-2 pb-2 border-b border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Selected text</p>
          <p className="text-sm text-slate-700 line-clamp-2">"{selectedText}"</p>
        </div>

        {/* Quick actions - two rows */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.prompt)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Custom prompt input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Or ask Claude anything..."
            className="flex-1 text-sm px-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!prompt.trim()}
            className="bg-slate-900 hover:bg-slate-800 text-white h-8 w-8 p-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-700 transition-colors shadow-md"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
