"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowRight } from "lucide-react"

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please enter email and password")
      return
    }

    setIsLoading(true)
    setError("")

    await new Promise((resolve) => setTimeout(resolve, 1000))

    localStorage.setItem("polish_user", JSON.stringify({ email, name: email.split("@")[0] }))

    const userId = email.replace(/[^a-zA-Z0-9]/g, "_")
    const hasOnboarded = localStorage.getItem(`polish_onboarding_${userId}`)

    if (hasOnboarded) {
      router.push("/editor")
    } else {
      router.push("/onboarding")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#fafafa",
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Gradient blurs for depth */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-bl from-slate-200/40 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-slate-100/60 to-transparent rounded-full blur-3xl" />

      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/60" />

      {/* Form card */}
      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">Polish</span>
          </Link>
        </div>

        {/* Card with enhanced styling */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-2 text-sm">Sign in to continue editing your resume</p>
          </div>

          {error && (
            <div className="bg-red-50/80 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-xl border-slate-200/80 bg-white/60 focus:bg-white focus:border-slate-300 transition-all shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 rounded-xl border-slate-200/80 bg-white/60 focus:bg-white focus:border-slate-300 transition-all shadow-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-sm font-medium shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/15 transition-all mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/60" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white/70 px-3 text-xs text-slate-400">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link href="/signup" className="text-slate-900 font-semibold hover:underline underline-offset-2">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
