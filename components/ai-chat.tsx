"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Send, Check, X, Undo, Sparkles, MessageSquare } from "lucide-react"
import { getAccessToken } from "@/lib/user-storage"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface Message {
  role: "user" | "assistant" | "error"
  content: string
  timestamp: Date
  suggestedChanges?: SuggestedChanges
}

interface SuggestedChanges {
  type: string
  description: string
  changes: Array<{
    section: string
    original: string
    updated: string
  }>
}

interface DocumentContent {
  name?: string
  title?: string
  contact?: string
  education?: Array<any>
  experience?: Array<any>
  projects?: Array<any>
  leadership?: Array<any>
  skills?: string
}

interface AIChatProps {
  selectedText?: string
  onSuggestionApply?: (changes: SuggestedChanges) => void
  onUndo?: () => void
  onClearSelection?: () => void
  documentContent?: DocumentContent
  documentId?: string | null
  geminiApiKey?: string
}

const QUICK_ACTIONS = [
  { label: "Optimize for ATS", prompt: "Optimize the entire resume for ATS. Use strong action verbs and relevant keywords." },
  { label: "Proofread", prompt: "Proofread the resume and fix any grammar, spelling, or punctuation issues." },
  { label: "Make concise", prompt: "Make all bullet points more concise while preserving impact and metrics." },
  { label: "Quantify achievements", prompt: "Add quantifiable metrics and numbers to bullet points that lack them." },
  { label: "Score resume", prompt: "__score__" },
  { label: "Summarize", prompt: "__summary__" },
]

export const AIChat = forwardRef<{ sendMessage: (prompt: string, text: string) => void }, AIChatProps>(function AIChat(
  { selectedText, onSuggestionApply, onUndo, onClearSelection, documentContent, documentId, geminiApiKey },
  ref,
) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "What would you like me to improve? Select text or use a quick action below.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showTypingDots, setShowTypingDots] = useState(false)
  const [acceptedChanges, setAcceptedChanges] = useState<Set<number>>(new Set())
  const [acceptingChange, setAcceptingChange] = useState<number | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [currentSelection, setCurrentSelection] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (selectedText && selectedText.trim()) {
      setCurrentSelection(selectedText)
    }
  }, [selectedText])

  const handleSendMessage = async (messageText?: string, contextText?: string) => {
    const messageToSend = messageText || input
    if (!messageToSend.trim() || isLoading) return

    // Special quick actions that hit dedicated endpoints
    if (messageToSend === "__score__") {
      await handleScoreAction()
      return
    }
    if (messageToSend === "__summary__") {
      await handleSummaryAction()
      return
    }

    const displayContent =
      contextText || currentSelection
        ? `${messageToSend}\n\nSelected: "${(contextText || currentSelection).substring(0, 150)}${(contextText || currentSelection).length > 150 ? "…" : ""}"`
        : messageToSend

    setMessages((prev) => [...prev, { role: "user", content: displayContent, timestamp: new Date() }])
    setInput("")
    setIsLoading(true)
    setShowTypingDots(true)

    try {
      const token = getAccessToken()
      if (!token || !documentId) throw new Error("Not authenticated")

      const res = await fetch(`${API_URL}/api/llm/documents/${documentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(geminiApiKey ? { 'x-gemini-api-key': geminiApiKey } : {}) },
        body: JSON.stringify({
          message: messageToSend,
          selectedText: contextText || currentSelection || undefined,
        }),
      })

      if (!res.ok) throw new Error("AI request failed")
      const data = await res.json()

      setShowTypingDots(false)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          suggestedChanges: data.suggestedChanges,
        },
      ])

      setCurrentSelection("")
      onClearSelection?.()
    } catch (error) {
      setShowTypingDots(false)
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: error instanceof Error ? error.message : "Something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleScoreAction = async () => {
    setMessages((prev) => [...prev, { role: "user", content: "Score my resume", timestamp: new Date() }])
    setIsLoading(true)
    setShowTypingDots(true)
    try {
      const token = getAccessToken()
      if (!token || !documentId) throw new Error("Not authenticated")

      const res = await fetch(`${API_URL}/api/llm/documents/${documentId}/quality`, {
        headers: { Authorization: `Bearer ${token}`, ...(geminiApiKey ? { 'x-gemini-api-key': geminiApiKey } : {}) },
      })
      if (!res.ok) throw new Error("Quality check failed")
      const data = await res.json()

      const content = `**Score: ${data.score}/10**\n\n**Strengths:**\n${data.strengths.map((s: string) => `• ${s}`).join("\n")}\n\n**Issues:**\n${data.issues.map((i: string) => `• ${i}`).join("\n")}`
      setShowTypingDots(false)
      setMessages((prev) => [...prev, { role: "assistant", content, timestamp: new Date() }])
    } catch (error) {
      setShowTypingDots(false)
      setMessages((prev) => [
        ...prev,
        { role: "error", content: "Failed to score resume.", timestamp: new Date() },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSummaryAction = async () => {
    setMessages((prev) => [...prev, { role: "user", content: "Summarize my resume", timestamp: new Date() }])
    setIsLoading(true)
    setShowTypingDots(true)
    try {
      const token = getAccessToken()
      if (!token || !documentId) throw new Error("Not authenticated")

      const res = await fetch(`${API_URL}/api/llm/documents/${documentId}/summary`, {
        headers: { Authorization: `Bearer ${token}`, ...(geminiApiKey ? { 'x-gemini-api-key': geminiApiKey } : {}) },
      })
      if (!res.ok) throw new Error("Summary failed")
      const data = await res.json()

      setShowTypingDots(false)
      setMessages((prev) => [...prev, { role: "assistant", content: data.summary, timestamp: new Date() }])
    } catch (error) {
      setShowTypingDots(false)
      setMessages((prev) => [
        ...prev,
        { role: "error", content: "Failed to summarize resume.", timestamp: new Date() },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleAcceptChanges = (changes: SuggestedChanges, messageIndex: number) => {
    setAcceptingChange(messageIndex)
    setTimeout(() => {
      onSuggestionApply?.(changes)
      setAcceptedChanges((prev) => new Set(prev).add(messageIndex))
      setAcceptingChange(null)
      setCanUndo(true)
    }, 600)
  }

  const handleUndo = () => {
    onUndo?.()
    setCanUndo(false)
    setAcceptedChanges(new Set())
  }

  useImperativeHandle(ref, () => ({
    sendMessage: (prompt: string, text: string) => {
      setCurrentSelection(text)
      handleSendMessage(prompt, text)
    },
  }))

  return (
    <div
      className="w-96 border-l border-slate-200/60 flex flex-col"
      style={{
        backgroundColor: "#fafbfc",
        backgroundImage: `
          linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
      }}
    >
      {/* Header */}
      <div className="border-b border-slate-200/60 p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200/80">
              <MessageSquare className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">AI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-xs text-slate-500">Powered by Gemini</p>
              </div>
            </div>
          </div>
          {canUndo && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleUndo}
              className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Undo className="w-3 h-3 mr-1" />
              Undo
            </Button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Quick actions</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleSendMessage(action.prompt)}
                disabled={!documentId}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                message.role === "user"
                  ? "bg-slate-100 text-slate-900"
                  : message.role === "error"
                    ? "bg-red-50 border border-red-200 text-red-900"
                    : "bg-white border border-slate-200/80 shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>

              {message.suggestedChanges && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Suggested changes
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {message.suggestedChanges.changes.map((change, idx) => (
                        <div key={idx} className="text-xs space-y-1 pb-2 border-b border-slate-200/60 last:border-0">
                          {change.original && (
                            <div className="text-red-600/80 line-through">{change.original}</div>
                          )}
                          <div className="text-green-700 font-medium">{change.updated}</div>
                        </div>
                      ))}
                    </div>
                    {!acceptedChanges.has(index) ? (
                      <div className="flex gap-2 mt-3 pt-2 border-t border-slate-200/60">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptChanges(message.suggestedChanges!, index)}
                          disabled={acceptingChange === index}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                        >
                          {acceptingChange === index ? (
                            <>
                              <div className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Apply
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={acceptingChange === index}
                          className="flex-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 py-2 rounded-lg">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">Applied</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {showTypingDots && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm shadow-sm">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-slate-200/60">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2">
          <input
            type="text"
            placeholder={documentId ? "Ask AI to improve your resume…" : "Open a document to use AI"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || !documentId}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim() || !documentId}
            className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
})
