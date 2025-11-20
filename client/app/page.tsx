"use client"

import { Button } from "@/components/ui/button"
import {
  Download,
  Zap,
  Eye,
  Palette,
  ChevronDown,
  Mic,
  Paperclip,
  Send,
  X,
  Check,
  FileText,
  Upload,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function LandingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [fontWeight, setFontWeight] = useState("font-bold")
  const [selectedModel, setSelectedModel] = useState("GPT-5")
  const [showTyping, setShowTyping] = useState(false)
  const [userTypingText, setUserTypingText] = useState("")
  const [isUserTyping, setIsUserTyping] = useState(false)
  const [showAssistantResponse, setShowAssistantResponse] = useState(false)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [demoText, setDemoText] = useState("")
  const [isDemoTyping, setIsDemoTyping] = useState(false)
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
  const [showDocumentFlow, setShowDocumentFlow] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState("")
  const [showInputMethod, setShowInputMethod] = useState(false)
  const [featureAnimations, setFeatureAnimations] = useState([false, false, false, false])

  const sequence = [
    {
      user: "",
      assistant: "",
      text: "The all-in-one platform to edit your documents and resumes visually, powered by AI.",
      weight: "font-bold",
      model: "GPT-5",
      delay: 3000,
    },
    {
      user: "Rewrite this headline to be shorter.",
      assistant: "Edit your docs & resumes visually with AI.",
      text: "Edit your docs & resumes visually with AI.",
      weight: "font-bold",
      model: "GPT-5",
      delay: 3000,
    },
    {
      user: "Make it bolder and add impact.",
      assistant: "The all-in-one AI platform to supercharge your documents and resumes.",
      text: "The all-in-one AI platform to supercharge your documents and resumes.",
      weight: "font-black",
      model: "Claude 4.0 Sonnet",
      delay: 3000,
    },
    {
      user: "Rewrite in XYZ format with a metric.",
      assistant: "Increase clarity by 40% by visually editing and validating every change with AI.",
      text: "Increase clarity by 40% by visually editing and validating every change with AI.",
      weight: "font-bold",
      model: "Claude 4.0 Sonnet",
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
    setSelectedModel(step.model)
    setFontWeight(step.weight)
    setShowAssistantResponse(false) // Always start with assistant response hidden

    if (step.user) {
      typeUserMessage(step.user, () => {
        setTimeout(() => {
          setShowTyping(true)
          setTimeout(() => {
            setShowTyping(false)
            setTimeout(() => {
              setShowAssistantResponse(true) // Only show after typing dots disappear
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
          }, 1000)
        }, 500)
      }
    }, 100)
  }

  const startDocumentFlow = () => {
    setShowDocumentFlow(true)
  }

  const selectDocumentType = (type: string) => {
    setSelectedDocType(type)
    setShowInputMethod(true)
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
      <nav className="border-b border-slate-200/60 backdrop-blur-xl bg-slate-50/90 sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 bg-clip-text text-transparent tracking-tight opacity-100">
              Polish
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-slate-600 hover:text-slate-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 rounded"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-slate-600 hover:text-slate-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 rounded"
              >
                Pricing
              </Link>
              <Link
                href="#resources"
                className="text-slate-600 hover:text-slate-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 rounded"
              >
                Resources
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent font-medium rounded-lg focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg opacity-100 rounded-lg border-0 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative">
          <div className="text-center opacity-90">
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
              No more back-and-forth, no more wasted time. One clean preview, all your edits in one place, powered by
              AI.
            </p>
            <div className="max-w-md mx-auto mb-10 relative">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden backdrop-blur-xl">
                <div className="flex items-center justify-between p-3 border-b border-slate-200/50 bg-gradient-to-r from-slate-50/80 to-slate-100/80">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-5 h-5 bg-gradient-to-br from-slate-500/60 to-slate-700/70 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-sm border border-slate-300/30 opacity-100">
                        <FileText className="w-3 h-3 text-white/80" />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{"Assistant"}</span>
                  </div>
                  <div className="relative group">
                    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-slate-200 shadow-sm opacity-100">
                      <span className="text-sm font-semibold text-slate-800">{selectedModel}</span>
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
                      placeholder="Ask AI to edit your document..."
                      className="flex-1 text-sm bg-transparent border-none outline-none placeholder-slate-500"
                      disabled
                    />
                    <Mic className="w-4 h-4 text-slate-400" />
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <Send className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center mb-6">
              <Link href="/editor">
                <Button
                  size="lg"
                  className="text-lg px-10 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold tracking-tight border-0 opacity-100 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                  aria-label="Open the Polish editor to start editing your document"
                >
                  Open Editor
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-600 text-center font-medium">Work inside your docs, not around them.</p>
          </div>
        </div>
      </section>
      {showDocumentFlow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Choose Document Type</h2>
              <button
                onClick={() => {
                  setShowDocumentFlow(false)
                  setShowInputMethod(false)
                  setSelectedDocType("")
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!showInputMethod ? (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: "Resume", icon: FileText, desc: "Professional resume editing" },
                  { type: "Cover Letter", icon: FileText, desc: "Compelling cover letters" },
                  { type: "Research Paper", icon: FileText, desc: "Academic paper formatting" },
                  { type: "Essay", icon: FileText, desc: "Essay structure & flow" },
                ].map(({ type, icon: Icon, desc }) => (
                  <button
                    key={type}
                    onClick={() => selectDocumentType(type)}
                    className="p-6 border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:bg-slate-50 transition-all duration-200 text-left group"
                  >
                    <Icon className="w-8 h-8 text-slate-600 group-hover:text-slate-900 mb-3" />
                    <h3 className="font-semibold text-slate-900 mb-1">{type}</h3>
                    <p className="text-sm text-slate-600">{desc}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold mb-6">How would you like to input your {selectedDocType}?</h3>
                <div className="space-y-4">
                  <button className="w-full p-6 border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:bg-slate-50 transition-all duration-200 text-left group">
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-slate-600 group-hover:text-slate-900" />
                      <div>
                        <h4 className="font-semibold text-slate-900">Paste LaTeX Code</h4>
                        <p className="text-sm text-slate-600">Paste your existing LaTeX document</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full p-6 border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:bg-slate-50 transition-all duration-200 text-left group">
                    <div className="flex items-center gap-4">
                      <Upload className="w-8 h-8 text-slate-600 group-hover:text-slate-900" />
                      <div>
                        <h4 className="font-semibold text-slate-900">Upload Document</h4>
                        <p className="text-sm text-slate-600">Upload DOCX, TXT, RTF, or other text formats</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
              <h2 className="text-xl font-semibold">Polish Live Demo</h2>
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
                          <li>Implemented GitHub OAuth to get data from user's repositories</li>
                          <li>Visualized GitHub data to show collaboration</li>
                          <li>Used Celery and Redis for asynchronous tasks</li>
                        </ul>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="font-semibold">Simple Paintball | Spigot API, Java, Maven, TravisCI, Git</div>
                          <div className="text-sm text-slate-600">May 2018 -- May 2020</div>
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>
                            Developed a Minecraft server plugin to entertain kids during free time for a previous job
                          </li>
                          <li>Published plugin to websites gaining 2K+ downloads and an average 4.5/5-star review</li>
                          <li>Implemented continuous delivery using TravisCI to build the plugin upon new a release</li>
                          <li>
                            Collaborated with Minecraft server administrators to suggest features and get feedback about
                            the plugin
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-lg font-bold border-b border-slate-300 mb-3">Technical Skills</h2>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="font-semibold">Languages:</span> Java, Python, C/C++, SQL (Postgres),
                        JavaScript, HTML/CSS, R
                      </div>
                      <div>
                        <span className="font-semibold">Frameworks:</span> React, Node.js, Flask, JUnit, WordPress,
                        Material-UI, FastAPI
                      </div>
                      <div>
                        <span className="font-semibold">Developer Tools:</span> Git, Docker, TravisCI, Google Cloud
                        Platform, VS Code, Visual Studio, PyCharm, IntelliJ, Eclipse
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
                    <span className="text-sm font-semibold">GPT-5</span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
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

                  {showTyping && (
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
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-4 py-3">
                    <div className="flex-1 text-sm bg-transparent border-none outline-none placeholder-slate-400 min-h-[20px]">
                      {chatInputText && <span>{chatInputText}</span>}
                      {showChatCaret && <span className="animate-pulse">|</span>}
                      {!chatInputText && !showChatCaret && <span className="text-slate-400">Ask AI to edit...</span>}
                    </div>
                    <Send className="w-4 h-4 text-slate-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <section className="py-20 bg-slate-50/60 backdrop-blur-sm relative" id="features" aria-label="Features section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Zap,
                title: "Edit Smarter",
                desc: "Inline AI edits inside your documents/resume.",
                index: 0,
                animatedText: "Grammar corrected",
              },
              {
                icon: Eye,
                title: "Preview Instantly",
                desc: "See clean formatting right away.",
                index: 1,
                animatedText: "Format updated",
              },
              {
                icon: Palette,
                title: "Track Changes",
                desc: "Review smart AI suggestions and approve with one click.",
                index: 2,
                animatedText: "Changes approved",
              },
              {
                icon: Download,
                title: "Export Fast",
                desc: "Save as PDF, DOCX, or LaTeX.",
                index: 3,
                animatedText: "Exported to PDF",
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
                    <span className="bg-slate-200/60 px-1 rounded">{animatedText}</span> ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="border-t border-slate-200/60 py-16 relative bg-slate-50/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight opacity-100">
              Polish
            </div>
            <div className="flex items-center space-x-8 text-sm text-slate-600">
              <Link href="#features" className="hover:text-slate-800 transition-colors font-medium">
                Features
              </Link>
              <Link href="#pricing" className="hover:text-slate-800 transition-colors font-medium">
                Pricing
              </Link>
              <Link href="#resources" className="hover:text-slate-800 transition-colors font-medium">
                Resources
              </Link>
            </div>
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
