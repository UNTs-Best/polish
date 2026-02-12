"use client"

import { Button } from "@/components/ui/button"
import {
  Download,
  Zap,
  Eye,
  ChevronDown,
  Send,
  X,
  Check,
  FileText,
  Upload,
  ArrowRight,
  Menu,
  LogOut,
  User,
  MessageSquare,
  Shield,
  FileType,
  ChevronUp,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GuideModal } from "@/components/guide-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clearUserData } from "@/lib/user-storage"

export default function LandingPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [fontWeight, setFontWeight] = useState("font-bold")
  const [showTyping, setShowTyping] = useState(false)
  const [userTypingText, setUserTypingText] = useState("")
  const [isUserTyping, setIsUserTyping] = useState(false)
  const [showAssistantResponse, setShowAssistantResponse] = useState(false)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [highlightedText, setHighlightedText] = useState("")
  const [showExportSuccess, setShowExportSuccess] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [showCursor, setShowCursor] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [chatInputText, setChatInputText] = useState("")
  const [showChatCaret, setShowChatCaret] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [showAssistantTyping, setShowAssistantTyping] = useState(false)
  const [featureAnimations, setFeatureAnimations] = useState([false, false, false, false])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("polish_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        setUser(null)
      }
    }
  }, [])

  const sequence = [
    {
      user: "",
      assistant: "",
      text: "Upload any format. Edit with AI. Export anywhere.",
      weight: "font-bold",
      delay: 3000,
    },
    {
      user: "Rewrite this bullet with stronger action verbs.",
      assistant: "Spearheaded development of a REST API using FastAPI, improving data throughput by 40%.",
      text: "Spearheaded development of a REST API using FastAPI, improving data throughput by 40%.",
      weight: "font-bold",
      delay: 3000,
    },
    {
      user: "Optimize my resume for ATS systems.",
      assistant: "I'll restructure your experience section with industry-standard keywords and measurable impact.",
      text: "AI-powered editing that gets you past ATS and into interviews.",
      weight: "font-black",
      delay: 3000,
    },
    {
      user: "Quantify all achievements in my experience section.",
      assistant: "Added metrics to 6 bullet points — revenue impact, efficiency gains, and team scaling numbers.",
      text: "Every edit backed by data. Every suggestion you control.",
      weight: "font-bold",
      delay: 3000,
    },
  ]

  const demoSequence = [
    {
      user: "Rewrite in XYZ format with a metric.",
      highlight: "Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems",
      newText:
        "Improved data processing efficiency by 40% by developing a REST API using FastAPI and PostgreSQL to store data from learning management systems",
      delay: 3000,
      section: "experience",
    },
    {
      user: "Make each bullet point in the Education section concise.",
      highlight: "Bachelor of Arts in Computer Science, Minor in Business",
      newText: "B.A. Computer Science, Minor in Business",
      delay: 3000,
      section: "education",
    },
  ]

  const typeText = (text: string, callback: () => void) => {
    setIsTyping(true)
    setDisplayText("")
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
        setIsTyping(false)
        setTimeout(callback, 800)
      }
    }, 60)
  }

  const typeUserMessage = (text: string, callback: () => void) => {
    setIsUserTyping(true)
    setUserTypingText("")
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setUserTypingText(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
        setIsUserTyping(false)
        setTimeout(callback, 400)
      }
    }, 50)
  }

  const runSequence = () => {
    const step = sequence[currentStep]
    setFontWeight(step.weight)
    setShowAssistantResponse(false)

    if (step.user) {
      typeUserMessage(step.user, () => {
        setTimeout(() => {
          setShowTyping(true)
          setTimeout(() => {
            setShowTyping(false)
            setTimeout(() => {
              setShowAssistantResponse(true)
              typeText(step.text, () => {
                setTimeout(() => {
                  setCurrentStep((prev) => (prev + 1) % sequence.length)
                }, step.delay)
              })
            }, 200)
          }, 600)
        }, 800)
      })
    } else {
      setTimeout(() => {
        setShowAssistantResponse(true)
        typeText(step.text, () => {
          setTimeout(() => {
            setCurrentStep((prev) => (prev + 1) % sequence.length)
          }, step.delay)
        })
      }, 300)
    }
  }

  const startDemo = () => {
    setShowDemoModal(true)
    setDemoStep(0)
    setShowCursor(true)
    setChatInputText("")
    setShowChatCaret(false)
    setScrollPosition(0)
    setTimeout(() => runDemoSequence(), 1000)
  }

  const runDemoSequence = () => {
    if (demoStep >= demoSequence.length) {
      setTimeout(() => {
        setShowExportSuccess(true)
        setTimeout(() => {
          setShowDemoModal(false)
          setShowExportSuccess(false)
          setDemoStep(0)
          setShowCursor(false)
          setIsSelecting(false)
          setChatInputText("")
          setShowChatCaret(false)
          setScrollPosition(0)
        }, 2000)
      }, 1000)
      return
    }

    const step = demoSequence[demoStep]

    setIsScrolling(true)
    setCursorPosition({ x: 400, y: 200 })

    let currentScroll = 0
    const scrollInterval = setInterval(() => {
      currentScroll += 20
      setScrollPosition(currentScroll)
      setCursorPosition({ x: 400, y: 200 + currentScroll * 0.5 })

      if (currentScroll >= 300) {
        clearInterval(scrollInterval)
        setIsScrolling(false)

        setTimeout(() => {
          const targetY = step.section === "experience" ? 450 : 250
          setCursorPosition({ x: 350, y: targetY })

          setTimeout(() => {
            setIsSelecting(true)
            setHighlightedText(step.highlight)

            setTimeout(() => {
              setCursorPosition({ x: 600, y: targetY })

              setTimeout(() => {
                setIsSelecting(false)

                setTimeout(() => {
                  setCursorPosition({ x: 600, y: 650 })
                  setShowChatCaret(true)

                  let i = 0
                  const typeTimer = setInterval(() => {
                    if (i < step.user.length) {
                      setChatInputText(step.user.slice(0, i + 1))
                      i++
                    } else {
                      clearInterval(typeTimer)

                      setTimeout(() => {
                        setShowChatCaret(false)
                        setShowAssistantTyping(true)

                        setTimeout(() => {
                          setShowAssistantTyping(false)
                          setHighlightedText("")

                          setTimeout(() => {
                            setChatInputText("")

                            setTimeout(() => {
                              setDemoStep((prev) => prev + 1)
                              setTimeout(runDemoSequence, 1000)
                            }, 1000)
                          }, 1000)
                        }, 2000)
                      }, 1000)
                    }
                  }, 80)
                }, 500)
              }, 1000)
            }, 1000)
          }, 500)
        }, 500)
      }
    }, 100)
  }

  const handleOpenEditor = () => {
    if (user) {
      router.push("/editor")
    } else {
      router.push("/signin")
    }
  }

  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    clearUserData()
    localStorage.removeItem("polish_user")
    sessionStorage.clear()
    setUser(null)
    await new Promise((resolve) => setTimeout(resolve, 500))
    router.push("/signin")
  }

  useEffect(() => {
    const timer = setTimeout(runSequence, currentStep === 0 ? 0 : 800)
    return () => clearTimeout(timer)
  }, [currentStep])

  useEffect(() => {
    const animateFeatures = () => {
      featureAnimations.forEach((_, index) => {
        setTimeout(() => {
          setFeatureAnimations((prev) => {
            const newState = [...prev]
            newState[index] = true
            setTimeout(() => {
              newState[index] = false
              setFeatureAnimations([...newState])
            }, 3000)
            return newState
          })
        }, index * 800)
      })
    }

    const interval = setInterval(animateFeatures, 8000)
    setTimeout(animateFeatures, 1500)
    return () => clearInterval(interval)
  }, [])

  const faqItems = [
    {
      q: "What file formats does Polish support?",
      a: "Polish supports PDF, DOCX, RTF, TXT, and LaTeX files. Upload in any format and export to any other — your content is preserved with full fidelity.",
    },
    {
      q: "How does the AI editing work?",
      a: "Polish uses Claude AI to understand your resume content in context. Select any text, choose a quick action or type a custom prompt, and Claude suggests improvements. You review every change before it's applied.",
    },
    {
      q: "Is my data secure?",
      a: "Your API key is stored only in your browser's local storage and is never sent to our servers. Resume content is processed through the Claude API with your own key — we never store or access your documents.",
    },
    {
      q: "Do I need a Claude API key?",
      a: "Yes. Polish connects directly to the Claude API using your personal Anthropic API key. This gives you full control over usage and costs. Get your key at console.anthropic.com.",
    },
    {
      q: "Can I use Polish without AI features?",
      a: "Yes. You can upload, view, and export resumes in multiple formats without connecting an API key. AI editing features activate once you connect your Claude API key.",
    },
  ]

  return (
    <div
      className="min-h-screen relative opacity-100"
      style={{
        backgroundColor: "#f8fafc",
        backgroundImage: `
        linear-gradient(to right, rgba(148,163,184,0.1) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(148,163,184,0.1) 1px, transparent 1px)
      `,
        backgroundSize: "32px 32px",
      }}
    >
      <a
        href="/editor"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-slate-900 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Skip to editor
      </a>

      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-transparent to-slate-100/40"></div>

      {/* Navigation */}
      <nav className="border-b border-slate-200/60 backdrop-blur-xl bg-slate-50/90 sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 bg-clip-text text-transparent tracking-tight opacity-100">
              Polish
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGuideOpen(true)}
                className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium rounded-lg"
              >
                Guide
              </Button>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent font-medium rounded-lg gap-2 cursor-pointer transition-colors"
                      disabled={isSigningOut}
                    >
                      <User className="w-4 h-4" />
                      {isSigningOut ? "Signing out..." : user.name}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="text-slate-500 font-normal text-xs truncate">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              {user ? (
                <Link href="/editor">
                  <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg opacity-100 rounded-lg border-0 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                  >
                    Open Editor
                  </Button>
                </Link>
              ) : (
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg opacity-100 rounded-lg border-0 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                  >
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200/60 shadow-lg z-50">
            <div className="p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGuideOpen(true)}
                className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium rounded-lg w-full justify-start"
              >
                Guide
              </Button>
            </div>
            <div className="p-4">
              {user ? (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 font-medium">{user.name}</span>
                  </div>
                  <span className="text-xs text-slate-400 px-2 truncate">{user.email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium rounded-lg w-full justify-start"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isSigningOut ? "Signing out..." : "Sign Out"}
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="p-4">
              {user ? (
                <Link href="/editor" className="w-full">
                  <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg opacity-100 rounded-lg border-0 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 w-full justify-start"
                  >
                    Open Editor
                  </Button>
                </Link>
              ) : (
                <Link href="/signup" className="w-full">
                  <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg opacity-100 rounded-lg border-0 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 w-full justify-start"
                  >
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
      <GuideModal open={guideOpen} onOpenChange={setGuideOpen} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative">
          <div className="text-center opacity-90">
            {/* Format badges */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {["PDF", "DOCX", "RTF", "TXT", "LaTeX"].map((fmt) => (
                <span
                  key={fmt}
                  className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wide shadow-sm"
                >
                  {fmt}
                </span>
              ))}
            </div>

            <div className="mb-12">
              <h1
                className={`text-4xl sm:text-5xl lg:text-6xl ${fontWeight} text-balance mb-6 min-h-[160px] flex items-center justify-center transition-all duration-700`}
              >
                <span className="bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
                  {displayText}
                  {isTyping && <span className="animate-pulse">|</span>}
                </span>
              </h1>
            </div>
            <p className="text-lg text-slate-600 text-balance max-w-3xl mx-auto mb-12 leading-relaxed">
              Upload your resume in any format. Edit with Claude AI inline. Export to PDF, DOCX, LaTeX, and more
              — all in one place.
            </p>

            {/* Chat preview widget */}
            <div className="max-w-md mx-auto mb-10 relative">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden backdrop-blur-xl">
                <div className="flex items-center justify-between p-3 border-b border-slate-200/50 bg-gradient-to-r from-slate-50/80 to-slate-100/80">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-5 h-5 bg-slate-100 rounded-lg flex items-center justify-center shadow-sm border border-slate-200/60 opacity-100">
                        <MessageSquare className="w-3 h-3 text-slate-600" />
                      </div>
                    </div>
                    <span className="text-sm font-semibold"><span className="text-orange-600">Claude</span> <span className="text-slate-800">Assistant</span></span>
                  </div>
                  <div className="relative group">
                    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-slate-200 shadow-sm opacity-100">
                      <span className="text-sm font-semibold text-slate-800">Claude Sonnet</span>
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>
                <div className="p-3 space-y-3 min-h-[120px] bg-gradient-to-b from-white to-slate-50/30">
                  {(sequence[currentStep].user || isUserTyping) && (
                    <div className="flex justify-end">
                      <div className="bg-slate-300 text-slate-900 px-3 py-2 rounded-2xl rounded-br-lg text-sm max-w-xs shadow-lg font-medium">
                        {userTypingText}
                        {isUserTyping && <span className="animate-pulse">|</span>}
                      </div>
                    </div>
                  )}
                  {showTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 text-slate-800 px-3 py-2 rounded-2xl rounded-bl-lg text-sm max-w-xs shadow-sm">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gradient-to-r from-slate-500 to-slate-700 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gradient-to-r from-slate-500 to-slate-700 rounded-full animate-bounce"
                            style={{ animationDelay: "0.15s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gradient-to-r from-slate-500 to-slate-700 rounded-full animate-bounce"
                            style={{ animationDelay: "0.3s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  {sequence[currentStep].assistant && showAssistantResponse && !showTyping && !isUserTyping && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-500">
                      <div className="bg-slate-100 text-slate-800 px-3 py-2 rounded-2xl rounded-bl-lg text-sm max-w-xs shadow-sm">
                        {sequence[currentStep].assistant}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-slate-200/50 bg-white">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                    <input
                      type="text"
                      placeholder="Ask Claude to edit your resume..."
                      className="flex-1 text-sm bg-transparent border-none outline-none placeholder-slate-500"
                      disabled
                    />
                    <Send className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
              <Link href={user ? "/editor" : "/signin"}>
                <Button
                  size="lg"
                  className="text-lg px-10 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold tracking-tight border-0 opacity-100 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                  aria-label={user ? "Open the Polish editor to start editing your resume" : "Get started with Polish"}
                >
                  {user ? "Open Editor" : "Get Started"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={startDemo}
                className="text-lg px-8 py-6 rounded-2xl border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
              >
                <Eye className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
            <p className="text-sm text-slate-600 text-center font-medium">
              Connected via MCP Server
            </p>
          </div>
        </div>
      </section>

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {showCursor && (
              <div
                className={`absolute w-0.5 h-5 bg-slate-800 z-10 transition-all duration-500 shadow-lg ${
                  isSelecting ? "w-1 bg-slate-600" : ""
                }`}
                style={{
                  left: `${cursorPosition.x}px`,
                  top: `${cursorPosition.y}px`,
                  transform: "translate(-50%, -50%)",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                }}
              />
            )}

            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Polish Live Demo</h2>
                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  AI-Powered
                </span>
              </div>
              <button
                onClick={() => {
                  setShowDemoModal(false)
                  setShowCursor(false)
                  setIsSelecting(false)
                  setChatInputText("")
                  setShowChatCaret(false)
                  setScrollPosition(0)
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex h-[70vh]">
              <div
                className="flex-1 p-6 bg-slate-50 overflow-y-auto"
                style={{
                  transform: `translateY(-${scrollPosition}px)`,
                  transition: isScrolling ? "transform 0.1s ease-out" : "none",
                }}
              >
                <div className="bg-white p-8 rounded-lg shadow-sm max-w-2xl mx-auto">
                  <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold mb-2">Jake Ryan</h1>
                    <div className="text-sm text-slate-600">
                      123-456-7890 | jake@su.edu | linkedin.com/in/jake | github.com/jake
                    </div>
                  </div>

                  <div className="mb-6" id="education-section">
                    <h2 className="text-lg font-bold border-b border-slate-300 mb-3">Education</h2>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold">Southwestern University</div>
                          <div className="text-sm text-slate-600">
                            <span
                              className={
                                highlightedText.includes("Bachelor of Arts")
                                  ? "bg-yellow-200 px-1 rounded transition-all duration-500"
                                  : ""
                              }
                            >
                              {demoStep > 1
                                ? "B.A. Computer Science, Minor in Business"
                                : "Bachelor of Arts in Computer Science, Minor in Business"}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-slate-600">
                          <div>Georgetown, TX</div>
                          <div>Aug. 2018 -- May 2021</div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold">Blinn College</div>
                          <div className="text-sm text-slate-600">
                            {demoStep > 1 ? "A.A. Liberal Arts" : "Associate's in Liberal Arts"}
                          </div>
                        </div>
                        <div className="text-sm text-slate-600">
                          <div>Bryan, TX</div>
                          <div>Aug. 2014 -- May 2018</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6" id="experience-section">
                    <h2 className="text-lg font-bold border-b border-slate-300 mb-3">Experience</h2>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="font-semibold">Undergraduate Research Assistant</div>
                          <div className="text-sm text-slate-600">June 2020 -- Present</div>
                        </div>
                        <div className="flex justify-between mb-2">
                          <div className="text-sm text-slate-600 italic">Texas A&M University</div>
                          <div className="text-sm text-slate-600 italic">College Station, TX</div>
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li
                            className={
                              highlightedText.includes("Developed a REST API")
                                ? "bg-yellow-200 px-1 rounded transition-all duration-500"
                                : ""
                            }
                          >
                            {demoStep > 0
                              ? "Improved data processing efficiency by 40% by developing a REST API using FastAPI and PostgreSQL to store data from learning management systems"
                              : "Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems"}
                          </li>
                          <li>
                            Developed a full-stack web application using Flask, React, PostgreSQL and Docker to analyze
                            GitHub data
                          </li>
                          <li>Explored ways to visualize GitHub collaboration in a classroom setting</li>
                        </ul>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="font-semibold">Information Technology Support Specialist</div>
                          <div className="text-sm text-slate-600">Sep. 2018 -- Present</div>
                        </div>
                        <div className="flex justify-between mb-2">
                          <div className="text-sm text-slate-600 italic">Southwestern University</div>
                          <div className="text-sm text-slate-600 italic">Georgetown, TX</div>
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>Communicate with managers to set up campus computers used on campus</li>
                          <li>Assess and troubleshoot computer problems brought by students, faculty and staff</li>
                          <li>Maintain upkeep of computers, classroom equipment, and 200 printers across campus</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-lg font-bold border-b border-slate-300 mb-3">Projects</h2>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="font-semibold">Gitlytics | Python, Flask, React, PostgreSQL, Docker, GCP</div>
                          <div className="text-sm text-slate-600">June 2020 -- Present</div>
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>
                            Developed a full-stack web application using with Flask serving a REST API with React as the
                            frontend
                          </li>
                          <li>Implemented GitHub OAuth to get data from user&apos;s repositories</li>
                          <li>Visualized GitHub data to show collaboration</li>
                          <li>Used Celery and Redis for asynchronous tasks</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-lg font-bold border-b border-slate-300 mb-3">Technical Skills</h2>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="font-semibold">Languages:</span> Java, Python, C/C++, SQL, JavaScript, HTML/CSS
                      </div>
                      <div>
                        <span className="font-semibold">Frameworks:</span> React, Node.js, Flask, FastAPI
                      </div>
                      <div>
                        <span className="font-semibold">Developer Tools:</span> Git, Docker, GCP, VS Code
                      </div>
                      <div>
                        <span className="font-semibold">Libraries:</span> pandas, NumPy, Matplotlib
                      </div>
                    </div>
                  </div>

                  {showExportSuccess && (
                    <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Exported successfully!
                    </div>
                  )}
                </div>
              </div>

              <div className="w-80 border-l border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200/50">
                  <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-4 py-2">
                    <MessageSquare className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-semibold"><span className="text-orange-600">Claude</span> Sonnet</span>
                  </div>
                </div>

                <div className="flex-1 p-4 space-y-3">
                  {chatInputText && (
                    <div className="flex justify-end">
                      <div className="bg-slate-300 text-slate-900 px-4 py-3 rounded-2xl rounded-br-lg text-sm max-w-xs shadow-lg font-medium">
                        {chatInputText}
                      </div>
                    </div>
                  )}

                  {showAssistantTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 text-slate-700 px-4 py-3 rounded-2xl rounded-bl-lg text-sm shadow-sm">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gradient-to-r from-slate-500 to-slate-700 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gradient-to-r from-slate-500 to-slate-700 rounded-full animate-bounce"
                            style={{ animationDelay: "0.15s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gradient-to-r from-slate-500 to-slate-700 rounded-full animate-bounce"
                            style={{ animationDelay: "0.3s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {demoStep >= 1 && !showAssistantTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 text-slate-700 px-4 py-3 rounded-2xl rounded-bl-lg text-sm max-w-xs shadow-sm">
                        {demoStep === 1
                          ? "I'll add a metric to make that bullet point more impactful."
                          : "I'll make those education bullets more concise."}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-200/50">
                  {demoStep >= 2 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Download className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium">Export</span>
                      </div>
                      <div className="space-y-1">
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 rounded">PDF</button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 rounded">DOCX</button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 rounded">LaTeX</button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 rounded">RTF</button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 rounded">TXT</button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-4 py-3">
                    <div className="flex-1 text-sm bg-transparent border-none outline-none placeholder-slate-400 min-h-[20px]">
                      {chatInputText && <span>{chatInputText}</span>}
                      {showChatCaret && <span className="animate-pulse">|</span>}
                      {!chatInputText && !showChatCaret && (
                        <span className="text-slate-400">Ask Claude to edit...</span>
                      )}
                    </div>
                    <Send className="w-4 h-4 text-slate-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="py-20 bg-slate-50/60 backdrop-blur-sm relative" id="features" aria-label="Features section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to polish your resume</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From upload to export, every step is streamlined with AI-powered editing and multi-format support.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: FileType,
                title: "Multi-Format Support",
                desc: "Upload PDF, DOCX, RTF, TXT, or LaTeX. Export to any format.",
                index: 0,
                animatedText: "PDF parsed",
              },
              {
                icon: MessageSquare,
                title: "Claude AI Editing",
                desc: "Inline AI suggestions via MCP Server. ATS optimization, proofreading, and more.",
                index: 1,
                animatedText: "Bullet improved",
              },
              {
                icon: Eye,
                title: "Live Preview",
                desc: "See changes rendered in real-time as you edit.",
                index: 2,
                animatedText: "Template applied",
              },
              {
                icon: Shield,
                title: "You Stay in Control",
                desc: "Review every AI suggestion. Accept, reject, or undo with one click.",
                index: 3,
                animatedText: "Change accepted",
              },
            ].map(({ icon: Icon, title, desc, index, animatedText }) => (
              <div
                key={index}
                className="relative p-8 hover:bg-slate-50/80 transition-all duration-500 group rounded-2xl"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`,
                }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 relative text-slate-800">
                  {title}
                  {featureAnimations[index] && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/40 to-transparent animate-pulse opacity-60 rounded-lg"></div>
                  )}
                </h3>
                <p className="text-slate-600 mb-4 relative">
                  {desc}
                  {featureAnimations[index] && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/30 to-transparent animate-pulse opacity-40 rounded"></div>
                  )}
                </p>
                {featureAnimations[index] && (
                  <div className="text-sm bg-slate-100/80 text-slate-800 px-3 py-2 rounded-xl animate-pulse backdrop-blur-sm">
                    <span className="bg-slate-200/60 px-1 rounded">{animatedText}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative" aria-label="How it works">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How it works</h2>
            <p className="text-lg text-slate-600">Five steps from upload to polished resume.</p>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {[
              {
                step: "1",
                title: "Upload",
                desc: "Drop in your PDF, DOCX, RTF, TXT, or LaTeX file.",
                icon: Upload,
              },
              {
                step: "2",
                title: "Connect",
                desc: "Link to Claude via MCP Server to enable AI features.",
                icon: Zap,
              },
              {
                step: "3",
                title: "Select & Edit",
                desc: "Highlight text and choose from quick actions or type a custom prompt.",
                icon: MessageSquare,
              },
              {
                step: "4",
                title: "Review",
                desc: "Accept or reject each suggestion with highlighted diffs.",
                icon: Check,
              },
              {
                step: "5",
                title: "Export",
                desc: "Download in PDF, DOCX, LaTeX, RTF, or TXT.",
                icon: Download,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Step {step}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50/60 backdrop-blur-sm relative" id="faq" aria-label="Frequently asked questions">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 pr-4">{item.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals / CTA Section */}
      <section className="py-20 relative" aria-label="Get started">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to polish your resume?</h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Upload any format. Edit with Claude AI. Export to anything. All in your browser, all under your control.
          </p>
          <Link href={user ? "/editor" : "/signin"}>
            <Button
              size="lg"
              className="text-lg px-10 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold tracking-tight border-0 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              {user ? "Open Editor" : "Get Started Free"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Your data stays local</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Claude AI Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>5 formats supported</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 py-16 relative bg-slate-50/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 bg-clip-text text-transparent tracking-tight opacity-100">
                Polish
              </div>
              <p className="text-xs text-slate-500 mt-1">AI-powered resume editing via MCP Server</p>
            </div>
            <div className="flex items-center gap-3">
              {["PDF", "DOCX", "RTF", "TXT", "LaTeX"].map((fmt) => (
                <span
                  key={fmt}
                  className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide"
                >
                  {fmt}
                </span>
              ))}
            </div>
            <div className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Polish. All rights reserved.</div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
