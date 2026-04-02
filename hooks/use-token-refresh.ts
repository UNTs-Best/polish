"use client"

import { useEffect } from "react"
import { getAccessToken, getRefreshToken, setTokens, clearUserData } from "@/lib/user-storage"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return typeof payload.exp === "number" ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    setTokens(data.accessToken, refreshToken)
    return true
  } catch {
    return false
  }
}

export function useTokenRefresh() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const scheduleRefresh = () => {
      const token = getAccessToken()
      if (!token) return

      const expiry = getTokenExpiry(token)
      if (!expiry) return

      // Refresh 60 seconds before expiry
      const delay = expiry - Date.now() - 60_000

      if (delay <= 0) {
        // Already expired or about to — refresh immediately
        refreshTokens().then((ok) => {
          if (ok) scheduleRefresh()
          else clearUserData()
        })
      } else {
        timer = setTimeout(async () => {
          const ok = await refreshTokens()
          if (ok) scheduleRefresh()
          else clearUserData()
        }, delay)
      }
    }

    scheduleRefresh()
    return () => clearTimeout(timer)
  }, [])
}
