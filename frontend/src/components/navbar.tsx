

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const tabs = [
    { id: "main", label: "Main" },
    { id: "history", label: "History" },
    { id: "vocabulary", label: "Vocabulary" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="mx-auto max-w-5xl px-1 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <span className="text-xl font-bold text-foreground">
              漢字<span className="text-primary">Learn</span>
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-28 rounded-md py-2 text-sm font-medium transition-all duration-200 text-center ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 rounded-full px-3 py-1.5 cursor-pointer transition-colors duration-200 hover:bg-muted">
            <span className="text-sm font-medium text-foreground hidden sm:block">
              Guest User
            </span>
            <Avatar className="size-8">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                G
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}
