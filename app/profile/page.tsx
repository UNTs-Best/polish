"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  Briefcase,
  User as UserIcon,
} from "lucide-react"
import { supabase, getSessionUser } from "@/lib/supabase-browser"
import { setUserItem, getUserItem } from "@/lib/user-storage"
import { cn } from "@/lib/utils"

const popularRoles = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "UX Designer",
  "Marketing Manager",
  "Business Analyst",
  "Project Manager",
  "Sales Representative",
]

type Section = "email" | "password" | "role" | null

export default function ProfilePage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState("")
  const [currentEmail, setCurrentEmail] = useState("")
  const [targetRole, setTargetRole] = useState("")

  // Section expansion
  const [activeSection, setActiveSection] = useState<Section>(null)

  // Email change
  const [newEmail, setNewEmail] = useState("")
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState("")
  const [emailError, setEmailError] = useState("")

  // Password change
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [passwordError, setPasswordError] = useState("")

  // Role change
  const [newRole, setNewRole] = useState("")
  const [customRole, setCustomRole] = useState("")
  const [roleLoading, setRoleLoading] = useState(false)
  const [roleSuccess, setRoleSuccess] = useState("")

  const passwordRequirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "Contains a number", met: /\d/.test(newPassword) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(newPassword) },
  ]
  const allRequirementsMet = passwordRequirements.every((r) => r.met)

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getSessionUser()
        if (!user) {
          router.replace("/signin")
          return
        }

        const name =
          [user.user_metadata?.first_name, user.user_metadata?.last_name]
            .filter(Boolean)
            .join(" ") ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User"

        setDisplayName(name)
        setCurrentEmail(user.email ?? "")

        const role =
          user.user_metadata?.target_role ||
          getUserItem("polish_target_role") ||
          ""
        setTargetRole(role)
        setNewRole(role)

        setLoading(false)
      } catch {
        // Supabase unreachable — redirect instead of hanging on spinner
        router.replace("/signin")
      }
    }
    init()
  }, [router])

  const toggleSection = (section: Section) => {
    setActiveSection((prev) => (prev === section ? null : section))
    setEmailSuccess("")
    setEmailError("")
    setPasswordSuccess("")
    setPasswordError("")
    setRoleSuccess("")
    setNewEmail("")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return

    setEmailLoading(true)
    setEmailError("")
    setEmailSuccess("")

    const { error } = await supabase.auth.updateUser({ email: newEmail })

    if (error) {
      setEmailError(error.message)
    } else {
      setEmailSuccess(
        "Confirmation email sent to both your current and new address. Please check your inbox."
      )
      setNewEmail("")
    }
    setEmailLoading(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allRequirementsMet) {
      setPasswordError("Please meet all password requirements")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }

    setPasswordLoading(true)
    setPasswordError("")
    setPasswordSuccess("")

    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    })

    if (signInError) {
      setPasswordError("Current password is incorrect")
      setPasswordLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
    setPasswordLoading(false)
  }

  const handleRoleChange = async () => {
    const role = customRole || newRole
    if (!role.trim()) return

    setRoleLoading(true)
    setRoleSuccess("")

    await supabase.auth.updateUser({ data: { target_role: role } })
    setUserItem("polish_target_role", role)
    setTargetRole(role)
    setRoleSuccess("Target role updated")
    setCustomRole("")
    setRoleLoading(false)
  }

  const handleRoleSelect = (role: string) => {
    setNewRole(role)
    setCustomRole("")
  }

  const handleCustomRoleChange = (value: string) => {
    setCustomRole(value)
    setNewRole(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: "#f8fafc",
        backgroundImage: `
          linear-gradient(to right, rgba(148,163,184,0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148,163,184,0.1) 1px, transparent 1px)
        `,
        backgroundSize: "32px 32px",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-transparent to-slate-100/40 pointer-events-none" />

      <nav className="border-b border-slate-200/60 backdrop-blur-xl bg-slate-50/90 sticky top-0 z-50 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-16 py-2">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 bg-clip-text text-transparent tracking-tight"
            >
              Polish
            </Link>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium rounded-lg gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {displayName}
              </h1>
              <p className="text-slate-500 text-sm">{currentEmail}</p>
            </div>
          </div>
          {targetRole && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
              <Briefcase className="w-3.5 h-3.5" />
              {targetRole}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Email Section */}
          <div className="bg-white/90 backdrop-blur border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSection("email")}
              className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    Email address
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {currentEmail}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {activeSection === "email" ? "Close" : "Change"}
              </span>
            </button>

            {activeSection === "email" && (
              <div className="px-6 pb-6 border-t border-slate-100">
                <form onSubmit={handleEmailChange} className="pt-5 space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="newEmail"
                      className="text-sm font-medium text-slate-700"
                    >
                      New email address
                    </Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="newemail@example.com"
                      className="h-11 rounded-xl border-slate-200/80 bg-white/60 focus:bg-white focus:border-slate-300 transition-all"
                      required
                    />
                  </div>

                  {emailError && (
                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      {emailError}
                    </p>
                  )}
                  {emailSuccess && (
                    <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      {emailSuccess}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={emailLoading || !newEmail.trim()}
                    className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-10 text-sm"
                  >
                    {emailLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Update email"
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="bg-white/90 backdrop-blur border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSection("password")}
              className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    Password
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Change your account password
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {activeSection === "password" ? "Close" : "Change"}
              </span>
            </button>

            {activeSection === "password" && (
              <div className="px-6 pb-6 border-t border-slate-100">
                <form
                  onSubmit={handlePasswordChange}
                  className="pt-5 space-y-4"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="currentPassword"
                      className="text-sm font-medium text-slate-700"
                    >
                      Current password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="h-11 rounded-xl border-slate-200/80 bg-white/60 focus:bg-white focus:border-slate-300 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="newPassword"
                      className="text-sm font-medium text-slate-700"
                    >
                      New password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="h-11 rounded-xl border-slate-200/80 bg-white/60 focus:bg-white focus:border-slate-300 transition-all pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {newPassword && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {passwordRequirements.map((req, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                              req.met
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-400"
                            )}
                          >
                            {req.met && <Check className="w-3 h-3" />}
                            {req.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmNewPassword"
                      className="text-sm font-medium text-slate-700"
                    >
                      Confirm new password
                    </Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="h-11 rounded-xl border-slate-200/80 bg-white/60 focus:bg-white focus:border-slate-300 transition-all"
                      required
                    />
                  </div>

                  {passwordError && (
                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      {passwordError}
                    </p>
                  )}
                  {passwordSuccess && (
                    <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      {passwordSuccess}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={
                      passwordLoading ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-10 text-sm"
                  >
                    {passwordLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Update password"
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Target Role Section */}
          <div className="bg-white/90 backdrop-blur border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSection("role")}
              className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    Target role
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {targetRole || "Not set"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {activeSection === "role" ? "Close" : "Edit"}
              </span>
            </button>

            {activeSection === "role" && (
              <div className="px-6 pb-6 border-t border-slate-100">
                <div className="pt-5 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Job title
                    </Label>
                    <Input
                      type="text"
                      placeholder="Type your target job title..."
                      value={customRole || newRole}
                      onChange={(e) => handleCustomRoleChange(e.target.value)}
                      className="h-11 rounded-xl border-slate-200/80 bg-white/60 focus:bg-white focus:border-slate-300 transition-all"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-2">
                      Or choose a common role:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {popularRoles.map((role) => {
                        const isSelected =
                          newRole === role && !customRole
                        return (
                          <button
                            key={role}
                            onClick={() => handleRoleSelect(role)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs border transition-all duration-200",
                              "hover:border-slate-400",
                              isSelected
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            {role}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {roleSuccess && (
                    <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      {roleSuccess}
                    </p>
                  )}

                  <Button
                    onClick={handleRoleChange}
                    disabled={
                      roleLoading ||
                      !(customRole || newRole).trim() ||
                      (customRole || newRole) === targetRole
                    }
                    className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-10 text-sm"
                  >
                    {roleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save role"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Display Name Section */}
          <div className="bg-white/90 backdrop-blur border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    Display name
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {displayName}
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-300 uppercase tracking-wider">
                From account
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
