import { useState } from "react"
import { Search, Sparkles, Trash2, ChevronRight, History } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { KanjiInput } from "@/components/kanji-input"
import { KanjiResult, type KanjiData } from "@/components/kanji-result"
import { HistoryPage } from "@/components/history-page"
import { VocabularyPage } from "@/components/vocabulary-page"
import { KanjiAnalyzerSidebar } from "@/components/kanji-analyzer-sidebar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const mockDetailedData: Record<string, KanjiData> = {
  간단: {
    word: "簡單",
    reading: "かんたん",
    wordMeaning: "간단",
    characters: [
      {
        char: "簡",
        meaning: "대쪽 간",
        components: "竹(대죽) + 間(사이 간)",
        radical: "竹",
        radicalMeaning: "대나무",
        radicalExpl: "정보를 간략히 기록하던 죽간에서 '간략하다'는 뜻이 파생되었습니다.",
        onReading: "カン",
        kunReading: "え라.ぶ",
        meaningDetail: "분량이 적고 내용이 요약되어 있어 복잡하지 않은 상태.",
        example: "간단한 대답 (簡単な返事)"
      },
      {
        char: "單",
        meaning: "홑 단",
        components: "吅 + 田 + 十",
        radical: "口",
        radicalMeaning: "입",
        radicalExpl: "혼자 사용하는 도구에서 유래하여 '하나', '홑'의 뜻을 나타냅니다.",
        onReading: "タン",
        kunReading: "ひと.つ",
        meaningDetail: "둘 이상이 아닌 오직 하나인 상태, 혹은 복잡하지 않은 구조.",
        example: "단순 명쾌 (単純明快)"
      }
    ]
  }
}

export default function KanjiDashboard() {
  const [activeTab, setActiveTab] = useState("main")
  const [currentResult, setCurrentResult] = useState<KanjiData | null>(null)
  const [recentSearches, setRecentSearches] = useState<KanjiData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleKanjiSubmit = async (kanji: string) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    const result = mockDetailedData[kanji]
    setIsLoading(false)

    if (result) {
      setCurrentResult(result)
      if (!recentSearches.find(r => r.word === result.word)) {
        setRecentSearches(prev => [result, ...prev].slice(0, 10))
      }
    } else {
      alert("데이터를 찾을 수 없습니다.")
    }
  }

  return (
    <div className="min-h-screen bg-white relative flex flex-col font-sans antialiased text-gray-900">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex pt-16 h-[calc(100vh-64px)] overflow-hidden">
        {activeTab === "main" ? (
          <>
            {/* 좌측 사이드바: Blue & White */}
            <aside className="w-72 border-r border-blue-50 bg-blue-50/20 hidden md:flex flex-col">
              <div className="p-5 border-b border-blue-50 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-widest text-blue-600">
                  <History className="w-4 h-4" /> Recent Analysis
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600" onClick={() => setRecentSearches([])}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2.5">
                  {recentSearches.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentResult(res)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                        currentResult?.word === res.word 
                          ? "bg-white border-blue-600 shadow-lg shadow-blue-600/10 scale-105" 
                          : "bg-white/50 hover:bg-white border-transparent"
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className={`text-lg font-black tracking-tight ${currentResult?.word === res.word ? "text-blue-600" : "text-gray-700"}`}>
                          {res.word}
                        </span>
                        <span className="text-[11px] font-bold text-gray-400">
                          {res.wordMeaning}
                        </span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${currentResult?.word === res.word ? "text-blue-600" : "text-gray-300"}`} />
                    </button>
                  ))}
                  {recentSearches.length === 0 && (
                    <div className="text-center py-20 text-blue-200 text-xs font-bold uppercase tracking-widest">
                      No Records
                    </div>
                  )}
                </div>
              </ScrollArea>
            </aside>

            {/* 우측 메인 영역 */}
            <main className="flex-1 overflow-y-auto bg-white p-6 lg:p-10">
              <div className="max-w-4xl mx-auto space-y-10">
                {/* Header */}
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black tracking-tight text-gray-900">
                      Japanese <span className="text-blue-600 underline decoration-blue-100 decoration-8 underline-offset-[-2px]">Kanji</span> Learning
                    </h1>
                    <p className="text-[11px] text-blue-400 font-black uppercase tracking-[0.3em]">
                      Precision Analysis & Insights
                    </p>
                  </div>
                  
                  <div className="max-w-xl mx-auto">
                    <KanjiInput onSubmit={handleKanjiSubmit} isLoading={isLoading} />
                  </div>
                </div>

                {/* Result Section */}
                <div className="animate-in fade-in duration-700">
                  {currentResult ? (
                    <KanjiResult data={currentResult} />
                  ) : (
                    <div className="text-center py-32 border-2 border-dashed border-blue-50 rounded-3xl bg-blue-50/10 space-y-4">
                       <div className="w-16 h-16 bg-white border-2 border-blue-50 shadow-sm rounded-2xl flex items-center justify-center mx-auto animate-bounce">
                         <Search className="w-8 h-8 text-blue-600" />
                       </div>
                       <p className="text-[11px] font-black text-blue-300 uppercase tracking-widest">분석할 한자나 단어를 입력하세요</p>
                       <p className="text-xs text-blue-600/60 font-black italic underline underline-offset-8">Example: 간단</p>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </>
        ) : (
          <main className="flex-1 overflow-y-auto p-10 bg-white">
            <div className="max-w-4xl mx-auto">
              {activeTab === "history" ? <HistoryPage history={[]} onDeleteEntry={() => {}} onClearHistory={() => {}} /> : <VocabularyPage />}
            </div>
          </main>
        )}
      </div>

      <div className="fixed right-6 bottom-6 z-40">
        <Button
          variant="default"
          size="icon"
          className="h-14 w-14 rounded-2xl shadow-xl bg-blue-600 hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Sparkles className="h-6 w-6 text-white" />
        </Button>
      </div>

      <KanjiAnalyzerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  )
}
