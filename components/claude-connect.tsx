"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Unplug, Plug } from "lucide-react"

interface ClaudeConnectProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (apiKey: string) => void
  onDisconnect: () => void
  isConnected: boolean
}

export function ClaudeConnect({ isOpen, onClose, onConnect, onDisconnect, isConnected }: ClaudeConnectProps) {
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; error?: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setVerifyResult(null)
      if (!isConnected) {
        setApiKey("")
      }
    }
  }, [isOpen, isConnected])

  const handleVerifyAndConnect = async () => {
    if (!apiKey.trim()) return

    setIsVerifying(true)
    setVerifyResult(null)

    try {
      const response = await fetch("/api/claude/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      const data = await response.json()
      setVerifyResult(data)

      if (data.valid) {
        onConnect(apiKey.trim())
        setTimeout(() => onClose(), 1000)
      }
    } catch {
      setVerifyResult({ valid: false, error: "Failed to verify. Check your connection." })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisconnect = () => {
    onDisconnect()
    setApiKey("")
    setVerifyResult(null)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && apiKey.trim() && !isVerifying) {
      handleVerifyAndConnect()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isConnected ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Plug className="w-5 h-5 text-muted-foreground" />
            )}
            Connect to Claude
          </DialogTitle>
          <DialogDescription>
            {isConnected
              ? "Your Claude API key is connected. AI features are active."
              : "Enter your Anthropic API key to enable AI-powered resume editing."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-800">Connected to Claude (Sonnet 4.5)</span>
              </div>
              <Button variant="outline" className="w-full" onClick={handleDisconnect}>
                <Unplug className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showKey ? "text" : "password"}
                    placeholder="sk-ant-..."
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value)
                      setVerifyResult(null)
                    }}
                    onKeyDown={handleKeyDown}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your key at{" "}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    console.anthropic.com
                  </a>
                  . Your key is stored locally and never sent to our servers.
                </p>
              </div>

              {verifyResult && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    verifyResult.valid
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  {verifyResult.valid ? (
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className="text-sm">{verifyResult.valid ? "API key verified!" : verifyResult.error}</span>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleVerifyAndConnect}
                disabled={!apiKey.trim() || isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Plug className="w-4 h-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Connection status indicator for the header
export function ClaudeConnectionStatus({
  isConnected,
  onClick,
}: {
  isConnected: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`gap-2 cursor-pointer ${isConnected ? "border-orange-200 hover:border-orange-300" : ""}`}
    >
      <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-orange-500" : "bg-gray-400"}`} />
      {isConnected ? (
        <span><span className="text-orange-600 font-medium">Claude</span> Connected</span>
      ) : (
        "Connect Claude"
      )}
    </Button>
  )
}
