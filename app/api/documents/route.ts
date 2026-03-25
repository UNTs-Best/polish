import { NextResponse } from "next/server"

// TODO: proxy to Express API (NEXT_PUBLIC_API_URL/api/docs) in TypeScript rewrite
export async function GET() {
  return NextResponse.json({ error: "Not implemented — use Express API" }, { status: 501 })
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented — use Express API" }, { status: 501 })
}
