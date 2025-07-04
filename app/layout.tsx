// app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "moleXa – 3D Molecular Visualization",
  description:
    "High-quality 3D molecular visualization powered by PubChem data. Educational tool for exploring molecular structures.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* default favicon (picked up automatically too) */}
        <link rel="icon" href="/favicon.ico" />

        {/* PNG favicons */}
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />

        {/* Apple / Android icons */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/android-chrome-192x192.png"
        />

        {/* PWA manifest */}
        <link rel="manifest" href="/site.webmanifest" />

        {/* Theme colors */}
        <meta name="msapplication-TileColor" content="#007bff" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${inter.variable} font-inter antialiased`}>
        {children}
        <Toaster position="top-right" />
        <Analytics/>
      </body>
    </html>
  )
}
