"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement login logic
    console.log("Login:", { email, password })
  }

  return (
    <div
      className="min-h-screen relative flex items-center justify-center"
      style={{
        backgroundColor: "#f8fafc",
        backgroundImage: `
        linear-gradient(to right, rgba(148,163,184,0.1) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(148,163,184,0.1) 1px, transparent 1px)
      `,
        backgroundSize: "32px 32px",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-transparent to-slate-100/40"></div>
      
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 p-8">
          <Link
            href="/"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">
              Sign In
            </h1>
            <p className="text-slate-600">Welcome back to Polish</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-slate-900 font-semibold hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
