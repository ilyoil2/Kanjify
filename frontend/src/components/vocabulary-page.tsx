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
const ITEMS_PER_PAGE = 20

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
    <div className="space-y-8 pt-4 pb-20 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Header (History 페이지와 통일) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900">Vocabulary</h2>
          <p className="text-sm text-slate-500 font-medium">JLPT 등급별 단어들을 효율적으로 학습하고 분류하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={hideDetails ? "default" : "outline"}
            size="icon"
            className={`size-10 rounded-2xl border-slate-200 transition-all duration-300 shadow-sm ${
              hideDetails ? "bg-slate-900 text-white" : "hover:border-blue-400 hover:bg-blue-50"
            }`}
            onClick={() => setHideDetails(!hideDetails)}
            title={hideDetails ? "Show all details" : "Hide details (Kanji only)"}
          >
            {hideDetails ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
      </div>

      {/* 2. Level Tabs (중앙 정렬) */}
      <div className="flex justify-center">
        <div className="bg-slate-100/50 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 shadow-inner">
          {jlptLevels.map((level) => (
            <button
              key={level}
              onClick={() => handleLevelChange(level)}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 tracking-widest ${
                activeLevel === level
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-300 scale-105"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Floating Action Toolbar (When selected) */}
      {checkedItems.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500 w-auto max-w-[95%]">
          <div className="flex items-center gap-3 p-2 bg-white/95 backdrop-blur-2xl border border-blue-100 rounded-[28px] shadow-[0_20px_50px_rgba(59,130,246,0.3)] ring-4 ring-blue-50/50">
            <div className="px-5 py-2.5 bg-blue-600 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-blue-200 shrink-0">
              <CheckCircle2 className="size-4 text-white" />
              <span className="text-sm font-black text-white whitespace-nowrap">{checkedItems.size} Selected</span>
            </div>
            
            <div className="flex items-center gap-2 px-1">
              {buttons.map(btn => (
                <button
                  key={btn.id}
                  className="px-4 py-2.5 rounded-2xl text-[13px] font-black transition-all hover:scale-105 active:scale-95 shadow-sm border border-transparent whitespace-nowrap min-w-fit shrink-0"
                  style={{ backgroundColor: btn.color, color: 'white' }}
                  onClick={() => handleClassify(btn.id)}
                >
                  {btn.name}
                </button>
              ))}
            </div>

            <div className="w-[1px] h-8 bg-slate-100 shrink-0 mx-1" />
            
            <button 
              onClick={() => setCheckedItems(new Set())}
              className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0 mr-1"
            >
              <ChevronLeft className="size-5 rotate-45" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Item Count */}
      <div className="flex items-center justify-center gap-4">
        <div className="h-[1px] flex-1 bg-slate-100/50" />
        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">
          {vocabularyList.length} Japanese Words
        </div>
        <div className="h-[1px] flex-1 bg-slate-100/50" />
      </div>

      {/* 5. Vocabulary Grid (더욱 컴팩트하게) */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="size-10 animate-spin text-blue-600/30" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Masterlist...</p>
        </div>
      ) : vocabularyList.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {currentItems.map((item) => (
            <div
              key={item.id}
              className={`group relative flex flex-col p-3 rounded-[20px] border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                checkedItems.has(item.id) 
                  ? "bg-blue-50/50 border-blue-600/20 shadow-xl shadow-blue-100/50 scale-[1.02]" 
                  : "bg-white border-slate-50 hover:border-blue-100 hover:shadow-lg"
              }`}
              onClick={() => handleCheckChange(item.id, !checkedItems.has(item.id))}
            >
              <div className="flex items-start justify-between mb-2 relative z-10">
                <div className={`size-4.5 rounded-md border-2 flex items-center justify-center transition-all ${
                  checkedItems.has(item.id) ? "bg-blue-600 border-blue-600" : "border-slate-200 bg-white"
                }`}>
                  {checkedItems.has(item.id) && <CheckCircle2 className="size-3 text-white" />}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    playPronunciation(item.kanji)
                  }}
                  className="size-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                >
                  <Volume2 className="size-4" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 relative z-10">
                <span className={`text-3xl font-black tracking-tighter transition-colors leading-none ${
                  checkedItems.has(item.id) ? "text-blue-700" : "text-slate-800"
                }`}>
                  {item.kanji}
                </span>
                
                {!hideDetails && (
                  <div className="space-y-1.5 w-full">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                      {item.reading}
                    </p>
                    <p className="text-[13px] font-black text-slate-700 tracking-tight leading-tight px-1 line-clamp-1">
                      {item.meaning_ko || item.meaning_en}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200 space-y-6">
          <div className="size-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl">
             <EyeOff className="size-10 text-slate-200" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-black text-slate-900">No vocabulary found</p>
            <p className="text-sm text-slate-400 font-medium">Try another JLPT level or add some data.</p>
          </div>
        </div>
      )}

      {/* 5. Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-10">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-2xl hover:bg-white hover:shadow-md transition-all"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-5" />
          </Button>

          <div className="flex items-center gap-1 bg-white/50 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            {getPageNumbers().map((page, index) => (
              typeof page === "number" ? (
                <button
                  key={index}
                  onClick={() => setCurrentPage(page)}
                  className={`size-9 rounded-xl text-xs font-black transition-all ${
                    currentPage === page 
                      ? "bg-slate-900 text-white shadow-lg" 
                      : "text-slate-400 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className="px-2 text-slate-300 font-black">
                  {page}
                </span>
              )
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-2xl hover:bg-white hover:shadow-md transition-all"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
