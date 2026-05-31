import { useState, useEffect } from "react"
import { Search, Sparkles, Trash2, History, AlertCircle, Loader2, Clock, MoreHorizontal, LayoutDashboard, Command } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { KanjiInput } from "@/components/kanji-input"
import { KanjiRecursiveResult, type KanjiRecursiveData } from "@/components/kanji-recursive-result"
import { HistoryPage } from "@/components/history-page"
import { VocabularyPage } from "@/components/vocabulary-page"
import { SettingsPage } from "@/components/settings-page"
import { KanjiAnalyzerSidebar } from "@/components/kanji-analyzer-sidebar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface HistoryItem {
  id: number
  word: string
  meaning?: string | null
  data?: KanjiRecursiveData
  timestamp: number
}

interface KanjiDashboardProps {
  user: { username: string, email: string } | null
  onLogout: () => void
  currentPath: string
  navigateTo: (path: string) => void
}

export default function KanjiDashboard({ user, onLogout, currentPath, navigateTo }: KanjiDashboardProps) {
  const [activeTab, setActiveTab] = useState("main")
  const [currentResult, setCurrentResult] = useState<{word: string, data: KanjiRecursiveData} | null>(null)
  const [sidebarHistory, setSidebarHistory] = useState<HistoryItem[]>([])
  const [tabHistory, setTabHistory] = useState<HistoryItem[]>([])
  const [historyAnalysisResult, setHistoryAnalysisResult] = useState<{word: string, data: KanjiRecursiveData} | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Sidebar Resizing Logic
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [isResizing, setIsResizing] = useState(false)

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = e.clientX
      if (newWidth > 180 && newWidth < 450) {
        setSidebarWidth(newWidth)
      }
    }
    const handleMouseUp = () => setIsResizing(false)
    
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "default"
    }
  }, [isResizing])

  useEffect(() => {
    if (currentPath === "/") setActiveTab("main")
    else if (currentPath === "/history") setActiveTab("history")
    else if (currentPath === "/vocabulary") setActiveTab("vocabulary")
    else if (currentPath === "/settings") setActiveTab("settings")
  }, [currentPath])

  const handleTabChange = (tab: string) => {
    const path = tab === "main" ? "/" : `/${tab}`
    navigateTo(path)
  }

  useEffect(() => {
    const saved = localStorage.getItem("kanji_history")
    if (saved) {
      try {
        setSidebarHistory(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load sidebar history", e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("kanji_history", JSON.stringify(sidebarHistory))
  }, [sidebarHistory])

  const fetchBackendHistory = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const userEmail = user?.email
      const url = userEmail ? `http://localhost:8002/api/history/?email=${userEmail}` : "http://localhost:8002/api/history/"
      
      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const data: HistoryItem[] = await response.json()
      setTabHistory(data)
    } catch (err) {
      console.error("Error fetching backend history:", err)
      setError(err instanceof Error ? err.message : "히스토리를 불러오는 데 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "history") {
      fetchBackendHistory()
    }
  }, [activeTab, user])

  const handleKanjiSubmit = async (word: string, skipHistory: boolean = false) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("http://localhost:8002/api/analyze-kanji/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          word,
          email: user?.email,
          skip_history: skipHistory
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "서버 응답에 실패했습니다.")
      }

      const data: KanjiRecursiveData = await response.json()
      setCurrentResult({ word, data })

      if (!skipHistory) {
        setSidebarHistory(prev => {
          const newEntry = {
            id: Date.now(),
            word,
            data,
            timestamp: Date.now()
          }
          const filtered = prev.filter(h => h.word !== word)
          return [newEntry, ...filtered].slice(0, 20)
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSidebarHistoryEntry = (e: React.MouseEvent, word: string) => {
    e.stopPropagation()
    setSidebarHistory(prev => prev.filter(h => h.word !== word))
    if (currentResult?.word === word) setCurrentResult(null)
  }

  const deleteBackendHistoryEntry = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8002/api/history/?id=${id}&email=${user?.email || ""}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error("삭제 실패")
      fetchBackendHistory()
    } catch (err) {
      toast.error("삭제 중 오류가 발생했습니다.")
    }
  }

  const handleReAnalyze = async (word: string) => {
    setActiveTab("main")
    navigateTo("/")
    setTimeout(() => handleKanjiSubmit(word, true), 100)
  }

  useEffect(() => {
    setHistoryAnalysisResult(null)
  }, [activeTab])

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(ts))
  }

  return (
    <div className="min-h-screen bg-[#fafafa] relative flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} user={user} onLogout={onLogout} onSettingsClick={() => handleTabChange("settings")} />

      <div className="flex-1 flex pt-14 h-[calc(100vh-56px)] overflow-hidden">
        {activeTab === "main" ? (
          <div className="flex-1 flex overflow-hidden">
            <aside 
              className="border-r border-slate-200 bg-white hidden md:flex flex-col relative group/sidebar"
              style={{ width: sidebarWidth }}
            >
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-5 rounded-md bg-blue-600/10 flex items-center justify-center">
                    <Clock className="size-3 text-blue-600" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Recent</span>
                </div>
              </div>

              <ScrollArea className="flex-1 px-3">
                <div className="space-y-1 pb-6">
                  {sidebarHistory.map((item) => (
                    <div 
                      key={item.id}
                      className={`group relative flex items-center rounded-xl transition-all duration-300 ${
                        currentResult?.word === item.word 
                          ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <button
                        onClick={() => handleKanjiSubmit(item.word, true)}
                        className="flex-1 flex flex-col items-start px-3 py-2.5 overflow-hidden"
                      >
                        <span className="text-sm font-bold tracking-tight truncate w-full text-left">{item.word}</span>
                        <span className="text-[10px] font-medium opacity-60">
                          {formatDate(item.timestamp)}
                        </span>
                      </button>
                      <button 
                        onClick={(e) => deleteSidebarHistoryEntry(e as any, item.word)}
                        className="mr-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {sidebarHistory.length === 0 && (
                    <div className="py-12 px-4 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest">History Empty</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div 
                onMouseDown={startResizing}
                className={`absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400/30 transition-colors z-20 ${isResizing ? "bg-blue-500/50" : ""}`}
              />
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#fafafa]">
              <div className="max-w-[1000px] mx-auto p-8 lg:p-16 space-y-16">
                <div className="flex flex-col items-center gap-10">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-blue-500/5 blur-3xl rounded-full" />
                    <div className="relative flex flex-col items-center gap-4">
                      <motion.div 
                        whileHover={{ rotate: 12, scale: 1.1 }}
                        className="size-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-200"
                      >
                        <LayoutDashboard className="size-6 text-white" />
                      </motion.div>
                      <div className="text-center space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 sm:text-4xl">
                          Kanjify <span className="text-blue-600">Deep</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">
                          Recursive Etymology Engine
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full max-w-xl relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-1000" />
                    <div className="relative">
                      <KanjiInput onSubmit={(word) => handleKanjiSubmit(word)} isLoading={isLoading} />
                    </div>
                  </div>
                </div>

                <div className="min-h-[400px]">
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div 
                        key="loading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center justify-center py-32 space-y-8"
                      >
                        <div className="relative size-16">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="absolute inset-0 rounded-2xl border-2 border-slate-100 border-t-blue-600" 
                          />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Processing Data</p>
                          <p className="text-[11px] text-slate-400 font-medium">Deconstructing kanji components via AI Engine</p>
                        </div>
                      </motion.div>
                    ) : error ? (
                      <motion.div 
                        key="error"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-xl mx-auto p-6 rounded-3xl bg-white border-2 border-red-50 shadow-xl shadow-red-100/20 flex items-start gap-4"
                      >
                        <div className="size-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                          <AlertCircle className="size-5 text-red-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-red-900">Analysis encountered an issue</p>
                          <p className="text-xs text-red-600/80 font-medium leading-relaxed">{error}</p>
                        </div>
                      </motion.div>
                    ) : currentResult ? (
                      <div key="result">
                        <KanjiRecursiveResult data={currentResult.data} word={currentResult.word} />
                      </div>
                    ) : (
                      <div key="empty" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="md:col-span-3 flex flex-col items-center justify-center py-24 space-y-8 rounded-[40px] bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                              <Command className="size-48 rotate-12" />
                           </div>
                           <div className="size-16 bg-slate-50 rounded-3xl flex items-center justify-center shadow-inner text-slate-300">
                             <Search className="size-8" />
                           </div>
                           <div className="text-center space-y-2 relative z-10">
                             <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Intelligence at your fingertips</p>
                             <p className="text-xs text-slate-500 font-medium max-w-[280px]">Dive deep into the roots of Japanese characters with AI-powered insights.</p>
                           </div>
                           <div className="flex items-center gap-3 relative z-10">
                             {[
                               { label: "Simple", value: "簡単" },
                               { label: "Complex", value: "憂鬱" },
                               { label: "Classic", value: "漢字" }
                             ].map((sample) => (
                               <button 
                                key={sample.label}
                                onClick={() => handleKanjiSubmit(sample.value)}
                                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:-translate-y-1 transition-all shadow-sm active:scale-95"
                               >
                                 {sample.value}
                               </button>
                             ))}
                           </div>
                         </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </main>
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-10 bg-[#fafafa]">
            <div className="max-w-5xl mx-auto">
              {activeTab === "history" ? (
                <>
                  <HistoryPage 
                    history={tabHistory.map(h => ({ 
                      id: h.id, 
                      word: h.word, 
                      meaning: h.meaning || "분석 완료", 
                      timestamp: h.timestamp
                    }))} 
                    onDeleteEntry={deleteBackendHistoryEntry}
                    onClearHistory={() => {}} 
                    onReAnalyze={handleReAnalyze}
                  />

                  <Dialog 
                    open={!!historyAnalysisResult} 
                    onOpenChange={(open) => !open && setHistoryAnalysisResult(null)}
                  >
                    <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto rounded-xl border-none shadow-2xl p-0 bg-white">
                      <div className="sticky top-0 z-50 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
                        <div>
                          <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Clock className="size-4 text-slate-400" />
                            Record: <span className="text-slate-900">{historyAnalysisResult?.word}</span>
                          </DialogTitle>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setHistoryAnalysisResult(null)}
                          className="h-8 text-xs font-semibold"
                        >
                          Close
                        </Button>
                      </div>
                      
                      <div className="p-8">
                        {historyAnalysisResult && (
                          <KanjiRecursiveResult 
                            data={historyAnalysisResult.data} 
                            word={historyAnalysisResult.word}
                            variant="history" 
                          />
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              ) : activeTab === "vocabulary" ? (
                <VocabularyPage />
              ) : activeTab === "settings" ? (
                <SettingsPage />
              ) : null}
            </div>
          </main>
        )}
      </div>

      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed right-6 bottom-6 z-40"
      >
        <Button
          variant="default"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-slate-900 hover:bg-slate-800 text-white border-0"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      </motion.div>

      <KanjiAnalyzerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  )
}
