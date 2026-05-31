import { useState, useMemo, useEffect } from "react"
import { 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Search, 
  ExternalLink, 
  Volume2,
  MoreHorizontal,
  Clock,
  ArrowUpDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
  meaning: string
  timestamp: string
}

interface HistoryPageProps {
  history: HistoryItem[]
  onDeleteEntry: (id: number) => void
  onClearHistory: () => void
  onReAnalyze: (word: string) => void
}

const ITEMS_PER_PAGE = 20 // Increased density

export function HistoryPage({ history, onDeleteEntry, onClearHistory, onReAnalyze }: HistoryPageProps) {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

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
    if (preferredVoice) utterance.voice = preferredVoice
    utterance.lang = "ja-JP"
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  const filteredHistory = useMemo(() => {
    const filtered = history.filter(item => 
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })
  }, [history, searchTerm, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE))
  const currentItems = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(currentItems.map(item => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleCheckChange = (itemId: number, checked: boolean) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (checked) newSet.add(itemId)
      else newSet.delete(itemId)
      return newSet
    })
  }
  
  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return
    selectedItems.forEach(id => onDeleteEntry(id))
    setSelectedItems(new Set())
    toast.success(`${selectedItems.size} items deleted`)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date)
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header / Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <Input 
              placeholder="Search history..." 
              className="pl-9 h-8 text-xs border-slate-200 focus:ring-1 focus:ring-slate-300 bg-white"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
              <span className="text-[11px] font-medium text-slate-500">{selectedItems.size} selected</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDeleteSelected}
                className="h-7 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
             className="h-8 text-xs text-slate-600 gap-1.5"
           >
             <ArrowUpDown className="size-3" />
             {sortOrder === "desc" ? "Newest" : "Oldest"}
           </Button>
        </div>
      </div>

      {/* Table Structure */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/30">
              <th className="p-3 w-10">
                <Checkbox 
                  checked={selectedItems.size === currentItems.length && currentItems.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  className="size-3.5 border-slate-300"
                />
              </th>
              <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-32">Word</th>
              <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Meaning</th>
              <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-40">Date</th>
              <th className="p-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-20 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <tr 
                  key={item.id} 
                  className={`group hover:bg-slate-50/50 transition-colors ${
                    selectedItems.has(item.id) ? "bg-slate-50/80" : ""
                  }`}
                >
                  <td className="p-3">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) => handleCheckChange(item.id, checked as boolean)}
                      className="size-3.5 border-slate-300"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{item.word}</span>
                      <button
                        onClick={() => playPronunciation(item.word)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Volume2 className="size-3" />
                      </button>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-sm text-slate-600 line-clamp-1">{item.meaning}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 tabular-nums">
                      <Clock className="size-3" />
                      {formatDate(item.timestamp)}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onReAnalyze(item.word)}
                        className="size-7 text-slate-400 hover:text-blue-600"
                        title="Re-analyze"
                      >
                        <ExternalLink className="size-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7 text-slate-400">
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem 
                            onClick={() => onDeleteEntry(item.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 text-xs"
                          >
                            <Trash2 className="size-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-slate-50 border border-slate-100">
                      <Search className="size-5 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">No results found</p>
                      <p className="text-xs text-slate-500">Try adjusting your search or filters.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/30">
          <div className="text-[11px] text-slate-500 font-medium">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)} of {filteredHistory.length} results
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded border-slate-200"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-xs font-semibold text-slate-900">{currentPage}</span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs text-slate-400">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded border-slate-200"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
