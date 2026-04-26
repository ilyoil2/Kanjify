import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Eye, EyeOff, Loader2, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface VocabularyItem {
  id: number
  kanji: string
  reading: string
  meaning_ko: string
  meaning_en: string
  n_level: string
  memorize_status: string
}

const jlptLevels = ["N1", "N2", "N3", "N4", "N5"] as const
const ITEMS_PER_PAGE = 24

export function VocabularyPage() {
  const [activeLevel, setActiveLevel] = useState<string>("N5")
  const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [hideDetails, setHideDetails] = useState<boolean>(false)

  // 발음 재생 함수 (Web Speech API 활용)
  const playPronunciation = (text: string) => {
    if (!window.speechSynthesis) {
      toast.error("이 브라우저는 음성 재생을 지원하지 않습니다.")
      return
    }

    // 재생 중인 음성 중지
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "ja-JP" // 일본어 설정
    utterance.rate = 0.8 // 약간 천천히

    window.speechSynthesis.speak(utterance)
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
      {/* JLPT Level Tabs with Eye Toggle */}
      <div className="flex items-center justify-between">
        <div className="w-10" />
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
        <Button
          variant={hideDetails ? "default" : "outline"}
          size="icon"
          className="size-10"
          onClick={() => setHideDetails(!hideDetails)}
          title={hideDetails ? "Show all details" : "Hide details (Kanji only)"}
        >
          {hideDetails ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
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
