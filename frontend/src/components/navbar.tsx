import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings, ChevronDown } from "lucide-react"

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
              <div className="flex items-center gap-3 rounded-xl pl-1 pr-4 py-1 cursor-pointer transition-all duration-300 hover:bg-slate-50 group border border-transparent hover:border-slate-200 relative bg-white/40 backdrop-blur-md">
                <Avatar className="size-10 border-2 border-white shadow-md shrink-0 z-10 transition-all duration-300 group-hover:shadow-blue-200/50">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback 
                    className="text-white text-xs font-black"
                    style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}
                  >
                    {userInitial}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col z-10 py-1">
                  <span className="text-[13.5px] font-extrabold text-slate-900 tracking-tight leading-none mb-1 group-hover:text-blue-700 transition-colors">
                    {user?.username || "Guest User"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {user?.email ? 'Member' : 'Visitor'}
                    </span>
                  </div>
                </div>

                <ChevronDown className="size-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-y-0.5 transition-all duration-300 ml-2" />
              </div>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-60 rounded-2xl shadow-2xl border-slate-100 p-1.5 bg-white/98 backdrop-blur-xl">
              <div 
                className="mx-1 mt-1 mb-2 p-4 rounded-xl relative overflow-hidden shadow-inner"
                style={{ background: "linear-gradient(135deg, #1e40af 0%, #6d28d9 100%)" }}
              >
                <div className="absolute -right-4 -bottom-4 size-24 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute -left-4 -top-4 size-24 bg-blue-400/10 rounded-full blur-2xl" />
                
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-200/70 mb-1.5">Account Member</p>
                <p className="text-base font-black text-white truncate tracking-tight">{user?.username}</p>
                <p className="text-[11px] text-indigo-100/70 truncate font-semibold tracking-tight">{user?.email || "guest@kanjify.app"}</p>
              </div>

              <div className="px-1 py-1">
                <DropdownMenuItem className="focus:bg-slate-50 focus:text-blue-700 cursor-pointer font-bold py-2.5 rounded-xl transition-all group">
                  <User className="mr-2.5 size-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[13px]">View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onSettingsClick}
                  className="focus:bg-slate-50 focus:text-blue-700 cursor-pointer font-bold py-2.5 rounded-xl transition-all group"
                >
                  <Settings className="mr-2.5 size-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[13px]">Account Settings</span>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="my-1.5 bg-slate-100/80" />
              
              <div className="px-1">
                <DropdownMenuItem 
                  onClick={onLogout}
                  className="focus:bg-red-50 focus:text-red-600 text-red-500 cursor-pointer font-extrabold py-2.5 rounded-xl transition-all group"
                >
                  <LogOut className="mr-2.5 size-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[13px]">Sign Out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
