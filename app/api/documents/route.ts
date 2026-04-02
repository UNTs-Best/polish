import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const res = await fetch(`${API_URL}/api/docs`, {
    headers: { Authorization: token },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const res = await fetch(`${API_URL}/api/docs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
