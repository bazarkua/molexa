import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "moleXa - 3D Molecular Visualization",
  description:
    "High-quality 3D molecular visualization powered by PubChem data. Educational tool for exploring molecular structures.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-inter antialiased`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
