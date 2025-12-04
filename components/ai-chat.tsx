"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Send, AlertCircle, Check, X, Undo, Mic, Paperclip } from "lucide-react"

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

interface AIChatProps {
  selectedText?: string
  onSuggestionApply?: (changes: SuggestedChanges) => void
  onUndo?: () => void
  onClearSelection?: () => void
  simulateError?: boolean
}

export const AIChat = forwardRef<{ sendMessage: (prompt: string, text: string) => void }, AIChatProps>(function AIChat(
  { selectedText, onSuggestionApply, onUndo, onClearSelection, simulateError },
  ref,
) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Select any text to improve it, or ask me anything.",
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
  const liveRegionRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (selectedText && selectedText.trim()) {
      setCurrentSelection(selectedText)
    }
  }, [selectedText])

  const handleSendMessage = async (messageText?: string, contextText?: string) => {
    const messageToSend = messageText || input
    if (!messageToSend.trim() || isLoading) return

    const displayMessage =
      contextText || currentSelection
        ? `${messageToSend}\n\nSelected text: "${contextText || currentSelection}"`
        : messageToSend

    const userMessage: Message = {
      role: "user",
      content: displayMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setShowTypingDots(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
          selectedText: contextText || currentSelection,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()

      setShowTypingDots(false)

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        suggestedChanges: data.suggestedChanges,
      }

      setMessages((prev) => [...prev, assistantMessage])

      setCurrentSelection("")
      if (onClearSelection) {
        onClearSelection()
      }

      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = `AI Assistant: ${data.message}`
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setShowTypingDots(false)
      const errorMessage: Message = {
        role: "error",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])

      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = "Error: Failed to get AI response. Please try again."
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearSelection = () => {
    setCurrentSelection("")
    if (onClearSelection) {
      onClearSelection()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content)
    }
  }

  const handleAcceptChanges = (changes: SuggestedChanges, messageIndex: number) => {
    setAcceptingChange(messageIndex)

    setTimeout(() => {
      if (onSuggestionApply) {
        onSuggestionApply(changes)
      }

      setAcceptedChanges((prev) => new Set(prev).add(messageIndex))
      setAcceptingChange(null)
      setCanUndo(true)

      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = "Changes applied successfully"
      }
    }, 600)
  }

  const handleRejectChanges = () => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "Changes rejected"
    }
  }

  const handleUndo = () => {
    if (onUndo) {
      onUndo()
    }
    setCanUndo(false)
    setAcceptedChanges(new Set())

    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "Changes undone successfully"
    }
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
      role="complementary"
      aria-label="AI chat assistant"
    >
      <div ref={liveRegionRef} className="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>

      <div className="border-b border-slate-200/60 p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Assistant</h3>
              <p className="text-xs text-slate-500">Select text or ask</p>
            </div>
          </div>
          {canUndo && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleUndo}
              className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Undo last changes"
            >
              <Undo className="w-3 h-3 mr-1" />
              Undo
            </Button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
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
              {message.role === "error" && (
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-900">Error</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>

              {message.suggestedChanges && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Suggested changes</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {message.suggestedChanges.changes.map((change, idx) => (
                        <div key={idx} className="text-xs space-y-1 pb-2 border-b border-slate-200/60 last:border-0">
                          <div className="text-red-600/80 line-through">{change.original}</div>
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
                          className={`flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all duration-300 ${
                            acceptingChange === index ? "scale-95 opacity-80" : ""
                          }`}
                          aria-label="Accept suggested changes"
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
                          onClick={handleRejectChanges}
                          disabled={acceptingChange === index}
                          className="flex-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                          aria-label="Reject suggested changes"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 border-t border-slate-200/60 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 py-2 rounded-lg">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">Applied</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {message.role === "error" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 w-full text-red-700 hover:bg-red-50"
                  onClick={handleRetry}
                  aria-label="Retry sending message"
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        ))}

        {showTypingDots && (
          <div className="flex justify-start" role="status" aria-label="AI is typing">
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm shadow-sm">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                <div
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-slate-200/60">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2">
          <input
            type="text"
            placeholder="Ask AI to edit your resume..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            aria-label="Chat input field"
          />
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Voice input">
              <Mic className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Attach file">
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-50 transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})
