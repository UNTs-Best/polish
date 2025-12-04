// This ensures each user has their own data

export function getUserId(): string | null {
  if (typeof window === "undefined") return null

  const storedUser = localStorage.getItem("polish_user")
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser)
      // Use email as unique identifier (you could also hash it)
      return user.email?.replace(/[^a-zA-Z0-9]/g, "_") || null
    } catch {
      return null
    }
  }
  return null
}

export function getUserStorageKey(baseKey: string): string {
  const userId = getUserId()
  if (userId) {
    return `${baseKey}_${userId}`
  }
  return baseKey
}

export function setUserItem(key: string, value: string): void {
  const userKey = getUserStorageKey(key)
  localStorage.setItem(userKey, value)
}

export function getUserItem(key: string): string | null {
  const userKey = getUserStorageKey(key)
  return localStorage.getItem(userKey)
}

export function removeUserItem(key: string): void {
  const userKey = getUserStorageKey(key)
  localStorage.removeItem(userKey)
}

// Clear all user-specific data (for sign out)
export function clearUserData(): void {
  const userId = getUserId()
  if (!userId) return

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.endsWith(`_${userId}`)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}
