"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, AlertCircle, Check, X, Undo } from "lucide-react"
import { Card } from "@/components/ui/card"

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
  simulateError?: boolean
}

export function AIChat({ selectedText, onSuggestionApply, onUndo, simulateError }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI editing assistant. Select any text in your document and I'll help you improve it, or ask me questions about writing and formatting.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showTypingDots, setShowTypingDots] = useState(false)
  const [acceptedChanges, setAcceptedChanges] = useState<Set<number>>(new Set())
  const [acceptingChange, setAcceptingChange] = useState<number | null>(null)
  const [canUndo, setCanUndo] = useState(false)
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
      handleSendMessage(`Please suggest improvements for: "${selectedText}"`, selectedText)
    }
  }, [selectedText])

  const handleSendMessage = async (messageText?: string, contextText?: string) => {
    const messageToSend = messageText || input
    if (!messageToSend.trim() || isLoading) return

    if (simulateError) {
      const userMessage: Message = {
        role: "user",
        content: messageToSend,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])
      setInput("")

      setIsLoading(true)
      setShowTypingDots(true)

      setTimeout(() => {
        setShowTypingDots(false)
        setIsLoading(false)

        const errorMessage: Message = {
          role: "error",
          content: "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])

        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = "Error: Failed to process your request. Please try again."
        }
      }, 2500)
      return
    }

    const userMessage: Message = {
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setShowTypingDots(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2500))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
          selectedText: contextText || selectedText,
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

  return (
    <div
      className="w-96 border-l border-slate-200/60 flex flex-col bg-slate-50/30"
      role="complementary"
      aria-label="AI chat assistant"
    >
      <div ref={liveRegionRef} className="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>

      {/* Chat Header */}
      <div className="border-b border-slate-200/60 p-4 bg-slate-50/90">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">AI Assistant</h3>
            <p className="text-xs text-slate-600">
              {selectedText ? "Analyzing selected text..." : "Ready to help improve your document"}
            </p>
          </div>
          {canUndo && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              className="text-xs bg-transparent border-slate-300 text-slate-700 hover:bg-slate-100 focus:ring-2 focus:ring-slate-900"
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
              className={`max-w-[85%] rounded-lg p-3 text-sm ${
                message.role === "user"
                  ? "bg-slate-900 text-white"
                  : message.role === "error"
                    ? "bg-red-50 border border-red-200 text-red-900"
                    : "bg-white border border-slate-200 shadow-sm"
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
                <Card className="mt-3 p-3 bg-slate-50 border-slate-200">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-900 mb-2">
                      Preview of changes ({message.suggestedChanges.changes.length} updates):
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {message.suggestedChanges.changes.map((change, idx) => (
                        <div key={idx} className="text-xs space-y-1 pb-2 border-b border-slate-200 last:border-0">
                          <div className="text-red-700 line-through opacity-75">{change.original}</div>
                          <div className="text-green-700 font-medium">{change.updated}</div>
                        </div>
                      ))}
                    </div>
                    {!acceptedChanges.has(index) ? (
                      <div className="flex gap-2 mt-3 pt-2 border-t border-slate-200">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptChanges(message.suggestedChanges!, index)}
                          disabled={acceptingChange === index}
                          className={`flex-1 bg-slate-900 hover:bg-slate-800 text-white border-0 transition-all duration-300 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${
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
                              Accept Changes
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRejectChanges}
                          disabled={acceptingChange === index}
                          className="flex-1 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50"
                          aria-label="Reject suggested changes"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 py-2 rounded-lg">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">Changes applied successfully</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {message.role === "error" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full border-red-300 text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-600 focus:ring-offset-2 bg-transparent"
                  onClick={handleRetry}
                  aria-label="Retry sending message"
                >
                  Retry
                </Button>
              )}
              <div
                className={`text-xs mt-2 opacity-70 ${
                  message.role === "user"
                    ? "text-white/70"
                    : message.role === "error"
                      ? "text-red-700/70"
                      : "text-slate-500"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {showTypingDots && (
          <div className="flex justify-start" role="status" aria-label="AI is typing">
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm shadow-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-slate-700 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-slate-700 rounded-full animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-slate-700 rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {selectedText && (
        <div className="border-t border-slate-200/60 p-3 bg-slate-50/50">
          <p className="text-xs text-slate-600 mb-2">Quick actions for selected text:</p>
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              onClick={() => handleSendMessage("Make this more professional", selectedText)}
              aria-label="Make selected text more professional"
            >
              Make Professional
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              onClick={() => handleSendMessage("Add metrics and numbers", selectedText)}
              aria-label="Add metrics to selected text"
            >
              Add Metrics
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              onClick={() => handleSendMessage("Use stronger action verbs", selectedText)}
              aria-label="Use stronger verbs in selected text"
            >
              Stronger Verbs
            </Button>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="border-t border-slate-200/60 p-4 bg-slate-50/90">
        <div className="flex space-x-2">
          <Input
            placeholder="Ask me to improve any section..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 border-slate-300"
            aria-label="Chat input field"
          />
          <Button
            size="sm"
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            className="bg-slate-900 hover:bg-slate-800 text-white border-0 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-600 mt-2">Tip: Select text in the document for instant suggestions</p>
      </div>
    </div>
  )
}
