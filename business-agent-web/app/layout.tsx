import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/sales/navbar"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "AI Sales Assistant Hub | Multi-Agent Automation",
  description:
    "Autonomous B2B Sales Assistant built with LangGraph, LangChain, WebSockets, and Model Context Protocol (MCP).",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-screen bg-background text-foreground flex flex-col">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t py-4 text-center text-xs text-muted-foreground">
            AI Agent Engineering Workshop — Built with LangGraph & Model Context Protocol (MCP)
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
