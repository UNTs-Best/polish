"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X, Check } from "lucide-react"
import { Card } from "@/components/ui/card"

interface FileUploadProps {
  onFileUpload: (file: File, content: string) => void
  onClose: () => void
}

export function FileUpload({ onFileUpload, onClose }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type === "application/pdf") {
      processFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1200))

    clearInterval(progressInterval)
    setUploadProgress(100)

    // Show success state briefly
    await new Promise((resolve) => setTimeout(resolve, 400))

    const resumeContent = `Mohamed Babiker
US Citizen|(682) 702-9491|mohamedaebabiker@gmail.com|linkedin.com/in/mohamed-babiker-

Education
University of North Texas
Bachelors of Science in Computer Science, Major GPA: 3.8
Denton, TX
May 2026

Relevant Coursework: Data Structures & Algorithms (A+), Computer Architecture (A+), Computer Networks (A+), Software Engineering (A), Applied AI (A+), Probability (A+), Linear Algebra, Systems Programming
Affiliations: ColorStack, National Society of Black Engineers, AfroTech

Technical Skills
Languages: Go, Python, JavaScript, TypeScript, SQL, Swift
Developer Tools: AWS, Docker, Git, Linux/Unix, CI/CD, Google Cloud, PostgreSQL, MongoDB, Azure, Jupyter
Libraries: React, Flask, scikit-learn, UIKit, Next.js, Django, numpy, pandas, Matplotlib, TensorFlow

Experience
The Oluwadare Lab
Research Assistant, Machine Learning
Denton, TX
Aug 2025 - Present
Developed algorithms for genomic analysis, processing 10,000+ sequences and identifying 150+ disease patterns.
Implemented Python TensorFlow models to analyze genome organization, improved prediction accuracy by 25%.
Enhanced lab infrastructure by optimizing data pipelines and workflows, reducing processing time by 35%.
Created visualization tools for genomic data analysis, reducing sequence pattern identification time by 30%.

HashiCorp (an IBM Company)
Software Engineer Intern, Cloud Services
San Francisco, CA
May 2025 - Aug 2025
Collaborated with PM and Design leads to redesign billing interfaces across subscription tiers for 500M downloads.
Increased Trial-to-PAYG conversions by 12% by conducting user research and streamlining upgrade flow friction.
Delivered feature parity between billing interfaces using Go, Ember.js, JavaScript, TypeScript, and HDS.
Accelerated engineer onboarding by 40% by identifying documentation gaps and updating internal technical docs.

Notable Capital (prev. GGV Capital)
AI Fellow
San Francisco, CA
May 2025 - Aug 2025
Developed AI startup concept and pitched to Notable Capital partners, ranking Top 5 of 29 fellows on Demo Day.
Conducted market research analyzing Notable's $5B portfolio: Airbnb, Anthropic, Vercel, Slack, Coinbase, etc.
Refined business model through weekly feedback sessions with portfolio founders and Notable investment partners.
Developed 12-month product roadmap and financial model, receiving positive feedback from 3 Notable partners.

City Point Billing
Software Engineer Intern
Dallas, TX
May 2024 - Aug 2024
Reduced billing report latency by 30% optimizing SQL queries and ETL pipelines in PostgreSQL.
Improved claim validation accuracy by 15% prototyping anomaly-detection models with Python and scikit-learn.
Sped up deployments by 20% containerizing Flask microservices with Docker and CI/CD checks.
Decreased data processing errors by 25% integrating automated review flags for medical dataset validation.

Projects
IronInterview | TypeScript, React, Node.js, Go, Docker, AWS, PostgreSQL
May 2025 - Aug 2025
Built real-time interview monitoring platform handling 50+ concurrent sessions receiving $50K acquisition offer.
Implemented AI-powered candidate verification using behavioral analysis and secure session recording.

SwiftCareerAI | Swift, Python, OpenAI, UIKit, Core Data
Nov 2024 - Jan 2025
Developed AI-powered iOS application leveraging OpenAI GPT-4 API for intelligent form recognition processing.
Automated job application workflow reducing manual entry by 50% using NLP and smart mapping.

Leadership
National Society of Black Engineers
Vice President of Outreach
Denton, TX
Jan 2024 - Present
Organized 8 professional development events including workshops and info sessions, engaging 50+ members.
Built relationships with 3 tech companies to provide career resources and recruiting opportunities for members.`

    onFileUpload(file, resumeContent)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Upload Resume</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isUploading}
            className="text-slate-600 hover:text-slate-900"
            aria-label="Close upload dialog"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {isUploading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                {uploadProgress < 100 ? (
                  <>
                    <div className="w-16 h-16 mx-auto border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-slate-900">Uploading resume...</p>
                    <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-600">{uploadProgress}%</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-green-700">Upload complete!</p>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-slate-900 bg-slate-50" : "border-slate-300 hover:border-slate-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p className="text-sm text-slate-700 mb-2">Drag and drop your PDF resume here</p>
            <p className="text-xs text-slate-500 mb-4">or</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="File input for PDF upload"
            />
          </div>
        )}

        <p className="text-xs text-slate-500 mt-4 text-center">Supported format: PDF (max 10MB)</p>
      </Card>
    </div>
  )
}
