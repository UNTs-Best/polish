import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")
  const documentId = request.nextUrl.searchParams.get("documentId")

  if (!documentId || !token) {
    return NextResponse.json({ error: "Missing documentId or auth" }, { status: 400 })
  }

  const res = await fetch(`${API_URL}/api/versions/document/${documentId}`, {
    headers: { Authorization: token },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")
  const { documentId, versionId } = await request.json()

  if (!documentId || !versionId || !token) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const res = await fetch(
    `${API_URL}/api/versions/document/${documentId}/restore/${versionId}`,
    { method: "POST", headers: { Authorization: token } }
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
