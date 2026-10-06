"use client"

export function Navbar() {
  return (
    <div className="border-b bg-card/60 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight">AI Sales Assistant</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Autonomous Lead Capture, Qualification, Scoring & Personalized Outreach
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
