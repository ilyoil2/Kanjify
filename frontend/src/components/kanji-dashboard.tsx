import { useState, useEffect } from "react"
import { Search, Sparkles, Trash2, History, AlertCircle, Loader2 } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { KanjiInput } from "@/components/kanji-input"
import { KanjiRecursiveResult, type KanjiRecursiveData } from "@/components/kanji-recursive-result"
import { HistoryPage } from "@/components/history-page"
import { VocabularyPage } from "@/components/vocabulary-page"
import { KanjiAnalyzerSidebar } from "@/components/kanji-analyzer-sidebar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface HistoryItem {
  id: number // Using timestamp as a unique ID for local storage items
  word: string
  data: KanjiRecursiveData
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
  const [history, setHistory] = useState<HistoryItem[]>([]) // Local storage history
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // URL 경로와 탭 상태 동기화
  useEffect(() => {
    if (currentPath === "/") setActiveTab("main")
    else if (currentPath === "/history") setActiveTab("history")
    else if (currentPath === "/vocabulary") setActiveTab("vocabulary")
  }, [currentPath])

  const handleTabChange = (tab: string) => {
    const path = tab === "main" ? "/" : `/${tab}`
    navigateTo(path)
  }

  // 로컬 스토리지에서 히스토리 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("kanji_history")
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load history", e)
      }
    }
  }, [])

  // 히스토리 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("kanji_history", JSON.stringify(history))
  }, [history])

  const handleKanjiSubmit = async (word: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("http://localhost:8002/api/analyze-kanji/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ word }), // Removed user email
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "서버 응답에 실패했습니다.")
      }

      const data: KanjiRecursiveData = await response.json()
      
      const newResult = { word, data }
      setCurrentResult(newResult)

      // 히스토리 업데이트 (중복 제거 및 최신순)
      setHistory(prev => {
        const newEntry = {
          id: Date.now(), // Using timestamp as unique ID for local storage items
          word,
          data, // Store the full data for the sidebar
          timestamp: Date.now()
        }
        // Avoid adding exact duplicates immediately if it's already in the current view state
        const filtered = prev.filter(h => h.word !== word)
        return [newEntry, ...filtered].slice(0, 20)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteHistoryEntry = (e: React.MouseEvent, word: string) => {
    e.stopPropagation()
    // Local storage delete logic
    setHistory(prev => prev.filter(h => h.word !== word))
    if (currentResult?.word === word) {
      setCurrentResult(null)
    }
  }

  const clearHistory = () => {
    // Local storage clear logic
    setHistory([])
    setCurrentResult(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col font-sans antialiased text-gray-900">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} user={user} onLogout={onLogout} />

      <div className="flex-1 flex pt-16 h-[calc(100vh-64px)] overflow-hidden">
        {activeTab === "main" ? (
          <>
            {/* 좌측 히스토리 사이드바 */}
            <aside className="w-72 border-r border-slate-200 bg-white hidden md:flex flex-col shadow-sm">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-blue-600">
                  <History className="w-4 h-4" /> Recent Analysis
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {history.map((item) => ( // Using item.id which is Date.now() for local key
                    <div key={item.id} className="group relative"> 
                      <button
                        onClick={() => setCurrentResult({ word: item.word, data: item.data })}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                          currentResult?.word === item.word 
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]" 
                            : "bg-white hover:bg-slate-50 border-slate-100 hover:border-blue-200"
                        }`}
                      >
                        <div className="flex flex-col items-start pr-6 overflow-hidden">
                          <span className={`text-xl font-black tracking-tight truncate w-full text-left ${currentResult?.word === item.word ? "text-white" : "text-slate-800"}`}>
                            {item.word}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${currentResult?.word === item.word ? "text-blue-100" : "text-slate-400"}`}>
                            {/* Use item.data.nodes length for node count */}
                            {item.data?.nodes ? Object.keys(item.data.nodes).length : 0} Nodes
                          </span>
                        </div>
                      </button>
                      <button 
                        onClick={(e) => deleteHistoryEntry(e, item.word)} // Pass word for local filtering
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                          currentResult?.word === item.word ? "text-blue-200 hover:text-white hover:bg-blue-500" : "opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50"
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
                      <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <History className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">
                        최근 분석한 단어가 없습니다.<br/>새로운 단어를 입력해보세요.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </aside>

            {/* 메인 분석 영역 */}
            <main className="flex-1 overflow-y-auto bg-slate-50/50">
              <div className="max-w-5xl mx-auto p-6 lg:p-12 space-y-12">
                {/* Search Header */}
                <div className="space-y-8">
                  <div className="text-center space-y-3">
                    <h1 className="text-5xl font-black tracking-tighter text-slate-900">
                      Kanjify <span className="text-blue-600">Deep</span> Analysis
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.5em]">
                      AI-Powered Recursive Kanji Breakdown
                    </p>
                  </div>
                  
                  <div className="max-w-2xl mx-auto">
                    <KanjiInput onSubmit={handleKanjiSubmit} isLoading={isLoading} />
                  </div>
                </div>

                {/* Status & Results */}
                <div className="min-h-[400px]">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6">
                      <div className="relative">
                        <div className="size-20 rounded-3xl bg-blue-600/10 animate-pulse" />
                        <Loader2 className="size-10 text-blue-600 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-sm font-black text-slate-900">한자 구조를 분석 중입니다...</p>
                        <p className="text-xs text-slate-400">Gemini AI가 재귀적으로 구성요소를 파악하고 있습니다.</p>
                      </div>
                    </div>
                  ) : error ? (
                    <Alert variant="destructive" className="max-w-2xl mx-auto rounded-3xl border-2">
                      <AlertCircle className="h-5 w-5" />
                      <AlertTitle className="font-black">분석 오류</AlertTitle>
                      <AlertDescription className="text-xs font-medium">
                        {error} - 서버가 실행 중인지, 혹은 API 키가 유효한지 확인해주세요.
                      </AlertDescription>
                    </Alert>
                  ) : currentResult ? (
                    <KanjiRecursiveResult data={currentResult.data} word={currentResult.word} />
                  ) : (
                    <div className="text-center py-32 border-2 border-dashed border-slate-200 rounded-[40px] bg-white/50 space-y-6 max-w-3xl mx-auto">
                       <div className="size-20 bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl flex items-center justify-center mx-auto rotate-3 hover:rotate-0 transition-transform duration-500">
                         <Search className="size-10 text-blue-600" />
                       </div>
                       <div className="space-y-2">
                         <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ready to Analyze</p>
                         <p className="text-sm text-slate-600 font-medium">단어를 입력하여 한자의 깊은 구조와 유래를 확인하세요</p>
                       </div>
                       <div className="flex items-center justify-center gap-3">
                         {[
                           { label: "간단", value: "簡単" },
                           { label: "우울", value: "憂鬱" },
                           { label: "한자", value: "漢字" }
                         ].map(sample => (
                           <button 
                            key={sample.label}
                            onClick={() => handleKanjiSubmit(sample.value)}
                            className="px-4 py-2 rounded-full bg-white border border-slate-100 text-xs font-bold text-blue-600 hover:border-blue-200 hover:shadow-md transition-all"
                           >
                             #{sample.label}
                           </button>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </>
        ) : (
          <main className="flex-1 overflow-y-auto p-10 bg-slate-50">
            <div className="max-w-5xl mx-auto">
              {activeTab === "history" ? (
                <HistoryPage 
                  history={history.map(h => ({ 
                    id: h.id, // Use the actual ID from the backend
                    word: h.word, 
                    // Use meaning_ko from the history item, or fallback if it's not there
                    // Also, use data.word_info.meaning_ko if available from currentResult, otherwise fallback to h.meaning
                    meaning: h.meaning || currentResult?.data.word_info?.meaning_ko || "분석 완료",
                    timestamp: new Date(h.timestamp).toLocaleString()
                  }))} 
                  onDeleteEntry={() => {}} // Placeholder for backend delete
                  onClearHistory={() => {}} // Placeholder for backend clear
                />
              ) : <VocabularyPage />}
            </div>
          </main>
        )}
      </div>

      <div className="fixed right-8 bottom-8 z-40">
        <Button
          variant="default"
          size="icon"
          className="h-16 w-16 rounded-3xl shadow-2xl bg-blue-600 hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all group"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Sparkles className="h-7 w-7 text-white group-hover:animate-slow-spin" />
        </Button>
      </div>

      <KanjiAnalyzerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  )
}
