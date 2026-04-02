"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getUserItem, setUserItem, removeUserItem } from "@/lib/user-storage"

interface ApiKeySettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function ApiKeySettings({ isOpen, onClose }: ApiKeySettingsProps) {
  const [key, setKey] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const stored = getUserItem("gemini_api_key")
      setKey(stored || "")
      setSaved(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    if (key.trim()) {
      setUserItem("gemini_api_key", key.trim())
    } else {
      removeUserItem("gemini_api_key")
    }
    setSaved(true)
    setTimeout(onClose, 800)
  }

  const handleRemove = () => {
    removeUserItem("gemini_api_key")
    setKey("")
    setSaved(true)
    setTimeout(onClose, 800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Gemini API Key</h2>
        <p className="text-sm text-slate-500 mb-5">
          Add your own Gemini API key to use your quota. Leave blank to use the shared key.
          Get a key at{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            aistudio.google.com
          </a>
          .
        </p>

        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="AIza..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-300 mb-4"
        />

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
            {saved ? "Saved!" : "Save"}
          </Button>
          {getUserItem("gemini_api_key") && (
            <Button onClick={handleRemove} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
              Remove
            </Button>
          )}
          <Button onClick={onClose} variant="ghost" className="text-slate-500">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

export function getGeminiApiKey(): string | null {
  return getUserItem("gemini_api_key")
}
