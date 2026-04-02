import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")
    const { documentId, content } = await request.json()

    if (!documentId || !token) {
      return NextResponse.json({ error: "Missing documentId or auth token" }, { status: 400 })
    }

    const res = await fetch(`${API_URL}/api/docs/${documentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ content }),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json(data, { status: res.status })

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: "Autosave failed" }, { status: 500 })
  }
}
