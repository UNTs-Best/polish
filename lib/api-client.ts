import { getAccessToken, getRefreshToken, setTokens, clearUserData } from "./user-storage"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return null
    const data = await res.json()
    setTokens(data.accessToken, refreshToken)
    return data.accessToken
  } catch {
    return null
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = getAccessToken()

  const doFetch = async (t: string | null) => {
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options.headers,
      },
    })
  }

  let res = await doFetch(token)

  if (res.status === 401 && token) {
    token = await refreshAccessToken()
    if (token) {
      res = await doFetch(token)
    } else {
      clearUserData()
      window.location.href = "/signin"
      throw new Error("Session expired")
    }
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Request failed")
  return data as T
}

// Auth
export const authApi = {
  register: (body: { email: string; password: string; firstName: string; lastName: string }) =>
    apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

  me: () => apiFetch("/api/auth/me"),

  logout: (refreshToken?: string) =>
    apiFetch("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  updateProfile: (body: { firstName?: string; lastName?: string }) =>
    apiFetch("/api/auth/profile", { method: "PUT", body: JSON.stringify(body) }),
}

// Documents
export const documentsApi = {
  list: () => apiFetch<{ documents: Document[] }>("/api/docs"),

  get: (id: string) => apiFetch<{ document: Document }>(`/api/docs/${id}`),

  create: (body: { title: string; content?: string; documentType?: string }) =>
    apiFetch<{ document: Document }>("/api/docs", { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: { title?: string; content?: string; documentType?: string }) =>
    apiFetch<{ document: Document }>(`/api/docs/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (id: string) => apiFetch(`/api/docs/${id}`, { method: "DELETE" }),
}

// Versions
export const versionsApi = {
  list: (documentId: string) =>
    apiFetch<{ versions: unknown[] }>(`/api/versions/document/${documentId}`),

  history: (documentId: string, page = 1) =>
    apiFetch(`/api/versions/document/${documentId}/history?page=${page}`),

  get: (versionId: string) => apiFetch(`/api/versions/${versionId}`),

  restore: (documentId: string, versionId: string) =>
    apiFetch(`/api/versions/document/${documentId}/restore/${versionId}`, { method: "POST" }),

  compare: (v1: string, v2: string) => apiFetch(`/api/versions/compare/${v1}/${v2}`),
}

// LLM
export const llmApi = {
  suggestions: (documentId: string) =>
    apiFetch(`/api/llm/documents/${documentId}/suggestions`),

  applySuggestions: (documentId: string, suggestions: unknown[]) =>
    apiFetch(`/api/llm/documents/${documentId}/apply-suggestions`, {
      method: "POST",
      body: JSON.stringify({ suggestions }),
    }),

  summary: (documentId: string) =>
    apiFetch(`/api/llm/documents/${documentId}/summary`),

  quality: (documentId: string) =>
    apiFetch(`/api/llm/documents/${documentId}/quality`),
}
