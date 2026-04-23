

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { KanjiInput } from "@/components/kanji-input"
import { KanjiResult, type KanjiData } from "@/components/kanji-result"
import { HistoryPage, type HistoryEntry } from "@/components/history-page"
import { VocabularyPage } from "@/components/vocabulary-page"

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
    kunReading: "まな.ぶ",
    radical: "子",
    radicalMeaning: "child",
    strokeCount: 8,
    jlptLevel: "N5",
  },
  日: {
    kanji: "日",
    meaning: "day; sun; Japan",
    onReading: "ニチ, ジツ",
    kunReading: "ひ, -び, -か",
    radical: "日",
    radicalMeaning: "sun",
    strokeCount: 4,
    jlptLevel: "N5",
  },
  本: {
    kanji: "本",
    meaning: "book; origin; main",
    onReading: "ホン",
    kunReading: "もと",
    radical: "木",
    radicalMeaning: "tree",
    strokeCount: 5,
    jlptLevel: "N5",
  },
  語: {
    kanji: "語",
    meaning: "language; word",
    onReading: "ゴ",
    kunReading: "かた.る, かた.らう",
    radical: "言",
    radicalMeaning: "speech",
    strokeCount: 14,
    jlptLevel: "N5",
  },
}

// Generate combined kanji data for multi-character input
function getKanjiAnalysis(input: string): KanjiData | null {
  // For single character, return mock data if available
  if (input.length === 1 && mockKanjiData[input]) {
    return mockKanjiData[input]
  }

  // For multi-character input, create combined analysis
  const chars = input.split("")
  const knownChars = chars.filter((c) => mockKanjiData[c])

  if (knownChars.length === 0) {
    // Return placeholder for unknown kanji
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

  // Combine meanings of known characters
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

  const handleKanjiSubmit = async (kanji: string) => {
    setIsLoading(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const result = getKanjiAnalysis(kanji)
    setKanjiResult(result)
    setIsLoading(false)

    // Add to history if result is valid
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
    <div className="min-h-screen bg-background">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="pt-24 pb-12 px-4 sm:px-6">
        <div
          className={`mx-auto space-y-6 transition-all duration-300 ease-in-out ${
            activeTab === "main" ? "max-w-2xl" : "max-w-4xl"
          }`}
        >
          {activeTab === "main" && (
            <>
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground text-balance">
                  Japanese Kanji Learning
                </h1>
                <p className="text-muted-foreground">
                  Enter a Kanji word to analyze its meaning, readings, and radicals
                </p>
              </div>

              {/* Result Display (appears above input after submission) */}
              {kanjiResult && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <KanjiResult data={kanjiResult} />
                </div>
              )}

              {/* Input Section */}
              <KanjiInput onSubmit={handleKanjiSubmit} isLoading={isLoading} />

              {/* Empty state hint */}
              {!kanjiResult && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Try entering: 漢字, 日本語, 学, or any kanji character
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "history" && (
            <>
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground text-balance">
                  Search History
                </h1>
                <p className="text-muted-foreground">
                  Review your previously searched kanji characters
                </p>
              </div>

              {/* History Table */}
              <HistoryPage
                history={history}
                onDeleteEntry={handleDeleteEntry}
                onClearHistory={handleClearHistory}
              />
            </>
          )}

          {activeTab === "vocabulary" && (
            <>
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground text-balance">
                  Kanji Vocabulary
                </h1>
                <p className="text-muted-foreground">
                  Browse vocabulary grouped by JLPT level
                </p>
              </div>

              {/* Vocabulary Table */}
              <VocabularyPage />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
