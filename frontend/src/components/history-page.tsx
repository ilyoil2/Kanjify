import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight, Trash2, Search, ExternalLink, Calendar, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface HistoryItem {
  id: number
  word: string
  meaning: string
  timestamp: string
}

interface HistoryPageProps {
  history: HistoryItem[]
  onDeleteEntry: (id: number) => void
  onClearHistory: () => void
  onReAnalyze: (word: string) => void // New prop to jump back to analysis
}

const ITEMS_PER_PAGE = 15

export function HistoryPage({ history, onDeleteEntry, onClearHistory, onReAnalyze }: HistoryPageProps) {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")

  // 발음 재생 함수 (Web Speech API 최적화 - Mac 고품질 음성 우선)
  const playPronunciation = (text: string) => {
    if (!window.speechSynthesis) {
      toast.error("이 브라우저는 음성 재생을 지원하지 않습니다.")
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    
    const preferredVoice = 
      voices.find(v => v.name.includes("Kyoko")) || 
      voices.find(v => v.name.includes("Otoya")) || 
      voices.find(v => v.lang === "ja-JP" || v.lang === "ja_JP")

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    utterance.lang = "ja-JP"
    utterance.rate = 0.9
    utterance.pitch = 1.0

    window.speechSynthesis.speak(utterance)
  }

  // 목소리 목록이 로드되지 않았을 때를 대비해 더미 호출
  useEffect(() => {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  // Filter history based on search term
  const filteredHistory = useMemo(() => {
    return history.filter(item => 
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [history, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE))

  // Get current page items
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentItems = filteredHistory.slice(startIndex, endIndex)

  const handleCheckChange = (itemId: number, checked: boolean) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(itemId)
      } else {
        newSet.delete(itemId)
      }
      return newSet
    })
  }
  
  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return
    selectedItems.forEach(id => onDeleteEntry(id))
    setSelectedItems(new Set())
    toast.success(`${selectedItems.size}개의 기록이 삭제되었습니다.`)
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900">Analysis History</h2>
          <p className="text-sm text-slate-500 font-medium">과거에 분석했던 한자들을 다시 확인하고 관리하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteSelected}
              className="rounded-full px-4 shadow-lg shadow-red-100"
            >
              <Trash2 className="size-4 mr-2" />
              Delete Selected ({selectedItems.size})
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-md">
        <div className="relative flex items-center">
          <Search className="absolute left-4 size-4 text-slate-400" />
          <Input 
            placeholder="단어, 뜻으로 검색..." 
            className="pl-11 h-11 rounded-xl border-slate-200 focus:border-blue-500 bg-white shadow-sm text-sm"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
      </div>

      {filteredHistory.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className={`group flex items-center gap-4 p-4 bg-white border rounded-2xl transition-all duration-300 hover:shadow-lg hover:border-blue-100 ${
                  selectedItems.has(item.id) ? "border-blue-600 bg-blue-50/30" : "border-slate-100"
                }`}
              >
                <Checkbox
                  checked={selectedItems.has(item.id)}
                  onCheckedChange={(checked) => handleCheckChange(item.id, checked as boolean)}
                  className="rounded-full size-5 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                
                <div className="flex-1 min-w-0 flex items-center gap-8">
                  {/* 단어 */}
                  <div className="shrink-0 min-w-[80px]">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {item.word}
                    </span>
                  </div>

                  {/* 뜻 (한자 바로 옆) */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-600 truncate max-w-[400px]">
                      {item.meaning}
                    </p>
                  </div>

                  {/* 날짜 및 액션 (오른쪽 정렬) */}
                  <div className="flex items-center gap-6 shrink-0 ml-auto">
                    <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <Calendar className="size-3" />
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* 발음 버튼 (오른쪽으로 이동) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          playPronunciation(item.word)
                        }}
                        title="발음 듣기"
                      >
                        <Volume2 className="size-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReAnalyze(item.word)}
                        className="rounded-full hover:bg-blue-50 hover:text-blue-600 font-bold text-xs h-9 px-4"
                      >
                        <ExternalLink className="size-3.5 mr-1.5" />
                        Analyze
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteEntry(item.id)}
                        className="rounded-full hover:bg-red-50 hover:text-red-500 size-9 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="icon"
                className="size-10 rounded-2xl border-slate-200"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  typeof page === "number" ? (
                    <Button
                      key={index}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className={`size-10 rounded-2xl font-bold ${
                        currentPage === page 
                          ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100" 
                          : "border-slate-200 text-slate-600"
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ) : (
                    <span key={index} className="px-2 text-slate-400 font-bold">
                      {page}
                    </span>
                  )
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="size-10 rounded-2xl border-slate-200"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-[40px] space-y-6">
          <div className="size-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto">
            <Search className="size-10 text-slate-300" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-black text-slate-900">검색 결과가 없습니다.</p>
            <p className="text-xs text-slate-400 font-medium">새로운 단어를 분석하거나 검색어를 확인해보세요.</p>
          </div>
        </div>
      )}
    </div>
  )
}
