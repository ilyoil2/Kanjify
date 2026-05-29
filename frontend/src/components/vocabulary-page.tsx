import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Eye, EyeOff, Loader2, Volume2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface WordButton {
  id: number
  name: string
  hide_days: number | null
  color: string
}

interface VocabularyItem {
  id: number
  kanji: string
  reading: string
  meaning_ko: string
  meaning_en: string
  n_level: string
  memorize_status: string
  hidden_until: string | null
}

const jlptLevels = ["N1", "N2", "N3", "N4", "N5"] as const
const ITEMS_PER_PAGE = 24

export function VocabularyPage({ userEmail }: { userEmail?: string }) {
  const [activeLevel, setActiveLevel] = useState<string>("N5")
  const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [hideDetails, setHideDetails] = useState<boolean>(false)
  const [buttons, setButtons] = useState<WordButton[]>([])

  // 발음 재생 함수 (Web Speech API 최적화 - Mac 고품질 음성 우선)
  const playPronunciation = (text: string) => {
    if (!window.speechSynthesis) {
      toast.error("이 브라우저는 음성 재생을 지원하지 않습니다.")
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    
    // 사용 가능한 목소리 목록 가져오기
    const voices = window.speechSynthesis.getVoices()
    
    // 1순위: Kyoko (Mac 고품질 여성), 2순위: Otoya (Mac 고품질 남성), 3순위: 일본어(ja-JP) 포함된 목소리
    const preferredVoice = 
      voices.find(v => v.name.includes("Kyoko")) || 
      voices.find(v => v.name.includes("Otoya")) || 
      voices.find(v => v.lang === "ja-JP" || v.lang === "ja_JP")

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.lang = "ja-JP"
    utterance.rate = 0.9 // 속도 살짝 조정
    utterance.pitch = 1.0

    window.speechSynthesis.speak(utterance)
  }

  // 목소리 목록이 로드되지 않았을 때를 대비해 더미 호출 (일부 브라우저 대응)
  useEffect(() => {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  const fetchButtons = async () => {
    try {
      const res = await fetch("http://localhost:8002/api/buttons/")
      if (!res.ok) return
      setButtons(await res.json())
    } catch (e) {
      console.error("Failed to fetch buttons", e)
    }
  }

  const fetchVocabulary = async () => {
    setIsLoading(true)
    try {
      // Fetch from our new Django API
      const response = await fetch("http://localhost:8002/api/vocabulary/")
      if (!response.ok) throw new Error("Failed to fetch vocabulary")
      const data = await response.json()
      
      const filteredData = data.filter((item: VocabularyItem) => item.n_level === activeLevel)
      setVocabularyList(filteredData)
    } catch (error) {
      console.error("Error fetching vocabulary:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVocabulary()
  }, [activeLevel])

  useEffect(() => {
    fetchButtons()
  }, [])

  const totalPages = Math.max(1, Math.ceil(vocabularyList.length / ITEMS_PER_PAGE))

  // Get current page items
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentItems = vocabularyList.slice(startIndex, endIndex)

  const handleCheckChange = (itemId: number, checked: boolean) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(itemId)
      } else {
        newSet.delete(itemId)
      }
      return newSet
    })
  }

  const handleLevelChange = (level: string) => {
    setActiveLevel(level)
    setCurrentPage(1)
  }

  const handleClassify = async (buttonId: number) => {
    if (checkedItems.size === 0) return
    const button = buttons.find(b => b.id === buttonId)
    if (!button) return

    try {
      const res = await fetch("http://localhost:8002/api/vocabulary/classify/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vocabulary_ids: Array.from(checkedItems),
          button_id: buttonId,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${checkedItems.size}개 단어를 "${button.name}"으로 분류했습니다.`)
      setCheckedItems(new Set())
      fetchVocabulary()
    } catch {
      toast.error("처리 중 오류가 발생했습니다.")
    }
  }

  const checkedCount = vocabularyList.filter((item) => checkedItems.has(item.id)).length

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-md bg-muted p-1">
            {jlptLevels.map((level) => (
              <button
                key={level}
                onClick={() => handleLevelChange(level)}
                className={`rounded px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeLevel === level
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {checkedItems.size > 0 && (
            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 animate-in zoom-in-95 duration-300">
              <div className="px-3 py-1 bg-slate-50 rounded-xl flex items-center gap-2 border border-slate-100">
                <CheckCircle2 className="size-3.5 text-blue-600" />
                <span className="text-xs font-black text-slate-700">{checkedItems.size}</span>
              </div>
              <div className="w-[1px] h-4 bg-slate-200 mx-1" />
              {buttons.map(btn => (
                <Button
                  key={btn.id}
                  variant="ghost"
                  size="sm"
                  className="font-bold rounded-xl px-4 h-9 gap-2 border transition-all hover:scale-[1.02] active:scale-95"
                  style={{ backgroundColor: btn.color + '20', color: btn.color, borderColor: btn.color + '40' }}
                  onClick={() => handleClassify(btn.id)}
                >
                  {btn.name}
                </Button>
              ))}
            </div>
          )}
          <Button
            variant={hideDetails ? "default" : "outline"}
            size="icon"
            className="size-10 rounded-2xl border-slate-200 shadow-sm transition-all hover:border-blue-400"
            onClick={() => setHideDetails(!hideDetails)}
            title={hideDetails ? "Show all details" : "Hide details (Kanji only)"}
          >
            {hideDetails ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Item Count */}
      <div className="text-center text-sm text-muted-foreground min-h-[20px]">
        {!isLoading && (
          checkedCount > 0 ? (
            <span>
              <span className="font-medium text-primary">{checkedCount}</span> of{" "}
              {vocabularyList.length} items selected for {activeLevel}
            </span>
          ) : (
            <span>
              Showing {vocabularyList.length} vocabulary items for {activeLevel}
            </span>
          )
        )}
      </div>

      {/* Vocabulary Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-8 animate-spin mb-2" />
          <p>Loading vocabulary...</p>
        </div>
      ) : vocabularyList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {currentItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-md hover:bg-muted/50 transition-colors cursor-pointer ${
                checkedItems.has(item.id) ? "bg-muted/30 border-primary/30" : ""
              }`}
              onClick={() => handleCheckChange(item.id, !checkedItems.has(item.id))}
            >
              <Checkbox
                checked={checkedItems.has(item.id)}
                onCheckedChange={(checked) =>
                  handleCheckChange(item.id, checked as boolean)
                }
                onClick={(e) => e.stopPropagation()}
                className="rounded-sm"
              />
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <span className="font-bold text-lg text-foreground shrink-0">
                  {item.kanji}
                </span>
                {!hideDetails && (
                  <>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {item.reading}
                    </span>
                    <span className="text-sm text-foreground truncate ml-auto">
                      {item.meaning_ko || item.meaning_en}
                    </span>
                  </>
                )}
              </div>
              
              {/* 발음 듣기 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full hover:bg-blue-50 hover:text-blue-600 shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  playPronunciation(item.kanji)
                }}
                title="발음 듣기"
              >
                <Volume2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
          <p className="text-muted-foreground">No vocabulary found for {activeLevel}</p>
          <p className="text-sm text-muted-foreground mt-1">Try another JLPT level or add some data.</p>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-md"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-4" />
          </Button>

          {getPageNumbers().map((page, index) => (
            typeof page === "number" ? (
              <Button
                key={index}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className="size-9 rounded-md"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="px-2 text-muted-foreground">
                {page}
              </span>
            )
          ))}

          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-md"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
