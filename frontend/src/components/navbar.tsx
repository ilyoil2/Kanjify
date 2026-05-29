import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings } from "lucide-react"

interface NavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  user: { username: string, email: string } | null
  onLogout: () => void
  onSettingsClick: () => void
}

export function Navbar({ activeTab, onTabChange, user, onLogout, onSettingsClick }: NavbarProps) {
  const tabs = [
    { id: "main", label: "Main" },
    { id: "history", label: "History" },
    { id: "vocabulary", label: "Vocabulary" },
  ]

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : "G"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="mx-auto max-w-5xl px-1 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onTabChange("main")}
            className="flex-shrink-0 flex items-center gap-2.5 group"
          >
            <div
              className="size-8 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200"
              style={{ background: "linear-gradient(135deg, #3B82F6 0%, #a78bfa 100%)" }}
            >
              <span className="text-white font-black text-sm leading-none">K</span>
            </div>
            <span
              className="text-xl font-black tracking-tight bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #3B82F6 0%, #a78bfa 100%)" }}
            >
              Kanjify
            </span>
          </button>

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

          {/* User Profile with Logout */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2.5 rounded-full px-3 py-1.5 cursor-pointer transition-colors duration-200 hover:bg-muted">
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {user?.username || "Guest User"}
                </span>
                <Avatar className="size-8 border border-border shadow-sm">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-border">
              <DropdownMenuLabel className="font-black text-xs uppercase tracking-widest text-muted-foreground">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <p className="text-sm font-bold text-foreground">{user?.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="focus:bg-muted cursor-pointer font-medium py-2 rounded-lg">
                <User className="mr-2 size-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onSettingsClick}
                className="focus:bg-muted cursor-pointer font-medium py-2 rounded-lg"
              >
                <Settings className="mr-2 size-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onLogout}
                className="focus:bg-red-50 focus:text-red-600 text-red-500 cursor-pointer font-bold py-2 rounded-lg transition-colors"
              >
                <LogOut className="mr-2 size-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
