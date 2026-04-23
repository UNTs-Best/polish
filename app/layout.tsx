import type React from "react"
import type { Metadata } from "next"
import { Instrument_Sans, Instrument_Serif } from "next/font/google"
import { Suspense } from "react"
import { TokenRefreshProvider } from "@/components/token-refresh-provider"
import "./globals.css"

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
})

export const metadata: Metadata = {
  title: "Polish - AI-Powered Resume Editor",
  description: "The all-in-one platform to edit your resumes visually — powered by AI.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${instrumentSans.variable} ${instrumentSerif.variable}`}>
        <Suspense fallback={null}>
          <TokenRefreshProvider>{children}</TokenRefreshProvider>
        </Suspense>
      </body>
    </html>
  )
}
