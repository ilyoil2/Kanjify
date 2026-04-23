import { useState } from "react"
import { Search, Sparkles } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { KanjiInput } from "@/components/kanji-input"
import { KanjiResult, type KanjiData } from "@/components/kanji-result"
import { HistoryPage, type HistoryEntry } from "@/components/history-page"
import { VocabularyPage } from "@/components/vocabulary-page"
import { KanjiAnalyzerSidebar } from "@/components/kanji-analyzer-sidebar"
import { Button } from "@/components/ui/button"

// Mock data for demonstration - replace with actual API call
const mockKanjiData: Record<string, KanjiData> = {
  漢: {
    kanji: "漢",
    meaning: "China; Han dynasty",
    onReading: "カン",
    kunReading: "—",
    radical: "氵",
    radicalMeaning: "water",
    strokeCount: 13,
    jlptLevel: "N3",
  },
  字: {
    kanji: "字",
    meaning: "character; letter; word",
    onReading: "ジ",
    kunReading: "あざ",
    radical: "子",
    radicalMeaning: "child",
    strokeCount: 6,
    jlptLevel: "N4",
  },
  学: {
    kanji: "学",
    meaning: "study; learning",
    onReading: "ガク",
    kunReading: "まな.부",
    radical: "子",
    radicalMeaning: "child",
    strokeCount: 8,
    jlptLevel: "N5",
  },
  日: {
    kanji: "日",
    meaning: "day; sun; Japan",
    onReading: "ニチ, ジツ",
    kunReading: "ひ, -비, -か",
    radical: "日",
    radicalMeaning: "sun",
    strokeCount: 4,
    jlptLevel: "N5",
  },
  本: {
    kanji: "本",
    meaning: "book; origin; main",
    onReading: "ホン",
    kunReading: "도",
    radical: "木",
    radicalMeaning: "tree",
    strokeCount: 5,
    jlptLevel: "N5",
  },
  語: {
    kanji: "語",
    meaning: "language; word",
    onReading: "ゴ",
    kunReading: "か타.る, 카타.らう",
    radical: "言",
    radicalMeaning: "speech",
    strokeCount: 14,
    jlptLevel: "N5",
  },
}

function getKanjiAnalysis(input: string): KanjiData | null {
  if (input.length === 1 && mockKanjiData[input]) {
    return mockKanjiData[input]
  }
  const chars = input.split("")
  const knownChars = chars.filter((c) => mockKanjiData[c])
  if (knownChars.length === 0) {
    return {
      kanji: input,
      meaning: "Meaning not found",
      onReading: "—",
      kunReading: "—",
      radical: "—",
      radicalMeaning: "unknown",
      strokeCount: input.length * 8,
      jlptLevel: "N/A",
    }
  }
  const meanings = knownChars
    .map((c) => mockKanjiData[c].meaning.split(";")[0].trim())
    .join(" + ")
  return {
    kanji: input,
    meaning: meanings,
    onReading: knownChars.map((c) => mockKanjiData[c].onReading).join(", "),
    kunReading: knownChars.map((c) => mockKanjiData[c].kunReading).join(", "),
    radical: knownChars.map((c) => mockKanjiData[c].radical).join(", "),
    radicalMeaning: knownChars
      .map((c) => mockKanjiData[c].radicalMeaning)
      .join(", "),
    strokeCount: knownChars.reduce(
      (sum, c) => sum + mockKanjiData[c].strokeCount,
      0
    ),
    jlptLevel: "Mixed",
  }
}

export default function KanjiDashboard() {
  const [activeTab, setActiveTab] = useState("main")
  const [kanjiResult, setKanjiResult] = useState<KanjiData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleKanjiSubmit = async (kanji: string) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    const result = getKanjiAnalysis(kanji)
    setKanjiResult(result)
    setIsLoading(false)
    if (result) {
      const newEntry: HistoryEntry = {
        ...result,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        searchedAt: new Date(),
      }
      setHistory((prev) => [newEntry, ...prev])
    }
  }

  const handleDeleteEntry = (id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id))
  }

  const handleClearHistory = () => {
    setHistory([])
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="pt-24 pb-12 px-4 sm:px-6 transition-all duration-500">
        <div
          className={`mx-auto space-y-6 transition-all duration-500 ease-in-out ${
            activeTab === "main" ? "max-w-2xl" : "max-w-4xl"
          }`}
        >
          {activeTab === "main" && (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  Kanjify Analysis
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                  Decode the beauty of Japanese characters with AI-powered insights.
                </p>
              </div>

              {kanjiResult && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <KanjiResult data={kanjiResult} />
                </div>
              )}

              <KanjiInput onSubmit={handleKanjiSubmit} isLoading={isLoading} />

              {!kanjiResult && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground border">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Try: 漢字, 日本語, or 桜</span>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "history" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Search History</h1>
                <p className="text-muted-foreground">Your recent kanji explorations.</p>
              </div>
              <HistoryPage
                history={history}
                onDeleteEntry={handleDeleteEntry}
                onClearHistory={handleClearHistory}
              />
            </div>
          )}

          {activeTab === "vocabulary" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground">JLPT Vocabulary</h1>
                <p className="text-muted-foreground">Master kanji across all proficiency levels.</p>
              </div>
              <VocabularyPage />
            </div>
          )}
        </div>
      </main>

      {/* Floating Toggle Button */}
      {!isSidebarOpen && (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 animate-in fade-in zoom-in duration-300">
          <Button
            variant="default"
            size="icon"
            className="h-14 w-14 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all bg-primary hover:bg-primary/90"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </Button>
        </div>
      )}

      {/* Modern Sidebar (No Overlay) */}
      <KanjiAnalyzerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  )
}
