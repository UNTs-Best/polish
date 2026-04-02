const PREFIX = "polish_"

export function getUserItem(key: string): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(`${PREFIX}${key}`)
}

export function setUserItem(key: string, value: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(`${PREFIX}${key}`, value)
}

export function removeUserItem(key: string): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(`${PREFIX}${key}`)
}

export function clearUserData(): void {
  if (typeof window === "undefined") return
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k))
}

export function getUser(): { id: string; email: string; firstName: string; lastName: string } | null {
  const raw = getUserItem("user")
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getAccessToken(): string | null {
  return getUserItem("access_token")
}

export function getRefreshToken(): string | null {
  return getUserItem("refresh_token")
}

export function setTokens(accessToken: string, refreshToken: string): void {
  setUserItem("access_token", accessToken)
  setUserItem("refresh_token", refreshToken)
}
