import { NextResponse } from "next/server"

// TODO: proxy to Express API (NEXT_PUBLIC_API_URL/api/versions/document/:id/restore/:versionId) in TypeScript rewrite
export async function POST() {
  return NextResponse.json({ error: "Not implemented — use Express API" }, { status: 501 })
}
