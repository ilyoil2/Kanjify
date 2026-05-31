import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
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
    { id: "main", label: "Dashboard" },
    { id: "history", label: "History" },
    { id: "vocabulary", label: "Vocabulary" },
  ]

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : "G"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
      <div className="mx-auto px-6 max-w-[1600px]">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-10">
            <button
              onClick={() => onTabChange("main")}
              className="flex items-center gap-2.5 group transition-all"
            >
              <img
                src="/logo.png"
                alt="Kanjify"
                className="size-8 rounded-lg object-contain shadow-lg shadow-slate-200 group-hover:rotate-6 transition-transform"
              />
              <span className="text-sm font-black tracking-tighter text-slate-900">
                Kanjify <span className="text-blue-600">.</span>
              </span>
            </button>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100/50 rounded-xl border border-slate-200/40">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Side: Profile & Settings */}
          <div className="flex items-center gap-4">
            <div className="h-6 w-[1px] bg-slate-200/60 mx-2" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-200/60">
                  <Avatar className="size-7 border-2 border-white shadow-sm ring-1 ring-slate-100">
                    <AvatarImage src="" alt="User" />
                    <AvatarFallback className="bg-slate-900 text-white text-[10px] font-black">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start pr-1">
                    <span className="text-[11px] font-black text-slate-900 leading-tight">
                      {user?.username || "Guest"}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-tight">
                      {user ? "Member" : "Visitor"}
                    </span>
                  </div>
                  <ChevronDown className="size-3 text-slate-300 group-hover:text-slate-600 transition-colors mr-1" />
                </button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl border-slate-200/60 p-1.5 mt-2 animate-in fade-in zoom-in-95 duration-200">
                <DropdownMenuLabel className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-slate-100 flex items-center justify-center">
                      <User className="size-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{user?.username || "Guest User"}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{user?.email || "guest@kanjify.app"}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100 mx-1" />
                <div className="p-1 space-y-0.5">
                  <DropdownMenuItem className="text-[11px] font-bold py-2 rounded-lg focus:bg-slate-50 cursor-pointer">
                    <User className="mr-2 size-3.5 text-slate-400" />
                    Profile Detail
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onSettingsClick}
                    className="text-[11px] font-bold py-2 rounded-lg focus:bg-slate-50 cursor-pointer"
                  >
                    <Settings className="mr-2 size-3.5 text-slate-400" />
                    Preferences
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="bg-slate-100 mx-1" />
                <div className="p-1">
                  <DropdownMenuItem 
                    onClick={onLogout}
                    className="text-[11px] font-bold py-2 rounded-lg focus:bg-red-50 text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 size-3.5" />
                    Sign Out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
