"use client"

import { useEffect, useRef, useCallback } from "react"

interface UseAutosaveOptions {
  delay?: number
  onSave: () => void | Promise<void>
  enabled?: boolean
}

export function useAutosave({ delay = 3000, onSave, enabled = true }: UseAutosaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const onSaveRef = useRef(onSave)

  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  const triggerSave = useCallback(async () => {
    if (isSavingRef.current || !enabled) return

    isSavingRef.current = true
    try {
      await onSaveRef.current()
    } catch (error) {
      console.error("[v0] Autosave error:", error)
    } finally {
      isSavingRef.current = false
    }
  }, [enabled])

  const debouncedSave = useCallback(() => {
    if (!enabled) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      triggerSave()
    }, delay)
  }, [delay, triggerSave, enabled])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { debouncedSave, triggerSave }
}
