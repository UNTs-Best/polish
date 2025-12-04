"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, RotateCcw, X, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DocumentVersion {
  id: string
  timestamp: string
  description: string
  content?: any
}

interface VersionHistoryProps {
  isOpen: boolean
  onClose: () => void
  onRestore: (version: DocumentVersion) => void
  currentVersions: DocumentVersion[]
  onReset?: () => void
}

export function VersionHistory({ isOpen, onClose, onRestore, currentVersions, onReset }: VersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>(currentVersions)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)

  useEffect(() => {
    setVersions(currentVersions)
  }, [currentVersions])

  const handleRestore = (version: DocumentVersion) => {
    setSelectedVersion(version.id)
    setTimeout(() => {
      onRestore(version)
      setSelectedVersion(null)
      onClose()
    }, 600)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleResetClick = () => {
    setShowResetDialog(true)
  }

  const handleConfirmReset = () => {
    if (onReset) {
      onReset()
      setShowResetDialog(false)
      onClose()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh]" aria-describedby="version-history-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Version History
            </DialogTitle>
          </DialogHeader>
          <p id="version-history-description" className="text-sm text-slate-600 -mt-2">
            View and restore previous versions of your resume
          </p>

          <ScrollArea className="h-[500px] pr-4">
            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">No version history</p>
                <p className="text-sm text-slate-500 mt-1">Version history has been cleared</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <Card
                    key={version.id}
                    className={`p-4 transition-all duration-300 hover:shadow-md ${
                      selectedVersion === version.id ? "ring-2 ring-slate-900 scale-[0.98]" : ""
                    } ${index === 0 ? "border-slate-900 border-2" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{version.description}</h4>
                          {index === 0 && (
                            <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded-full">Current</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{formatTimestamp(version.timestamp)}</p>
                        <p className="text-xs text-slate-500 mt-1">Version ID: {version.id}</p>
                      </div>
                      {index !== 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(version)}
                          disabled={selectedVersion === version.id}
                          className="focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                          aria-label={`Restore version from ${formatTimestamp(version.timestamp)}`}
                        >
                          {selectedVersion === version.id ? (
                            <>
                              <div className="w-3 h-3 mr-1 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                              Restoring...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Restore
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-between pt-4 border-t">
            {onReset && versions.length > 0 && (
              <Button
                variant="outline"
                onClick={handleResetClick}
                className="focus:ring-2 focus:ring-red-600 focus:ring-offset-2 text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset History
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 bg-transparent ml-auto"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Version History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all version history. Your current resume will remain unchanged, but you won't
              be able to restore any previous versions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              Clear History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
