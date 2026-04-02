"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Send, AlertCircle, Check, X, Undo, Mic, Paperclip, Plug, MessageSquare } from "lucide-react"

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
  simulateError?: boolean
  documentContent?: DocumentContent
  apiKey?: string
  onConnectClick?: () => void
}

const QUICK_ACTIONS = [
  { label: "Optimize for ATS", prompt: "Optimize the entire resume for ATS (applicant tracking systems). Use strong keywords and standard section headers." },
  { label: "Proofread", prompt: "Proofread the entire resume. Fix any grammar, spelling, or punctuation issues." },
  { label: "Make concise", prompt: "Make all bullet points more concise while preserving impact and metrics." },
  { label: "Quantify achievements", prompt: "Add quantifiable metrics and numbers to bullet points that lack them." },
  { label: "Improve formatting", prompt: "Review the resume formatting and suggest improvements for readability." },
]

export const AIChat = forwardRef<{ sendMessage: (prompt: string, text: string) => void }, AIChatProps>(function AIChat(
  { selectedText, onSuggestionApply, onUndo, onClearSelection, simulateError, documentContent, apiKey, onConnectClick },
  ref,
) {
  const isConnected = !!apiKey
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: isConnected
        ? "What would you like me to improve? Select text or use a quick action below."
        : "Connect your Claude API key to start editing with AI.",
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

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [
          {
            role: "assistant",
            content: isConnected
              ? "What would you like me to improve? Select text or use a quick action below."
              : "Connect your Claude API key to start editing with AI.",
            timestamp: new Date(),
          },
        ]
      }
      return prev
    })
  }, [isConnected])

  const handleSendMessage = async (messageText?: string, contextText?: string) => {
    const messageToSend = messageText || input
    if (!messageToSend.trim() || isLoading || !isConnected) return

    const displayMessage =
      contextText || currentSelection
        ? `${messageToSend}\n\nSelected text: "${(contextText || currentSelection).substring(0, 200)}${(contextText || currentSelection).length > 200 ? "..." : ""}"`
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
          "x-anthropic-key": apiKey!,
        },
        body: JSON.stringify({
          message: messageToSend,
          selectedText: contextText || currentSelection,
          documentContent: documentContent,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to get AI response")
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
        content: error instanceof Error ? error.message : "Sorry, I encountered an error. Please try again.",
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

      {/* Header */}
      <div className="border-b border-slate-200/60 p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200/80">
              <MessageSquare className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                <span className="text-orange-600">Claude</span>
                <span className="text-slate-900"> Assistant</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-orange-500" : "bg-gray-400"}`} />
                <p className="text-xs text-slate-500">{isConnected ? "MCP Server Active" : "Not connected"}</p>
              </div>
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

      {/* Quick Actions (Prism-inspired) */}
      {isConnected && messages.length <= 2 && !isLoading && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Quick actions</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleSendMessage(action.prompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-sm"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
                    : "bg-white border border-slate-200/80 shadow-sm border-l-2 border-l-orange-400"
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

      {/* Input area */}
      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-slate-200/60">
        {!isConnected ? (
          <button
            onClick={onConnectClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Plug className="w-4 h-4" />
            Connect Claude API Key to start
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2">
            <input
              type="text"
              placeholder="What would you like me to improve?"
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
              <button
                className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Attach file"
              >
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
        )}
      </div>
    </div>
  )
})
