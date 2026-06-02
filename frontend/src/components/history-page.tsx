import { useState, useMemo } from "react"
import { Search, ExternalLink, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"

interface HistoryItem {
  id: number
  word: string
  meaning: string
  timestamp: string | number
}

interface HistoryPageProps {
  history: HistoryItem[]
  onDeleteEntry: (id: number) => void
  onClearHistory: () => void
  onReAnalyze: (word: string) => void
}

interface DateGroup {
  label: string
  items: HistoryItem[]
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getDateLabel(timestamp: string | number, now: Date): string {
  const date = new Date(timestamp)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (isSameDay(date, now)) return "오늘"
  if (isSameDay(date, yesterday)) return "어제"
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(date)
}

function formatTime(timestamp: string | number): string {
  const d = new Date(timestamp)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function HistoryPage({ history, onDeleteEntry, onClearHistory, onReAnalyze }: HistoryPageProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const groups: DateGroup[] = useMemo(() => {
    const now = new Date()
    const filtered = history
      .filter(
        (item) =>
          item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const map = new Map<string, HistoryItem[]>()
    for (const item of filtered) {
      const label = getDateLabel(item.timestamp, now)
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(item)
    }

    return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
  }, [history, searchTerm])

  const totalCount = history.length

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f0f0ef]">
        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#9b9a97]" />
          <Input
            placeholder="검색..."
            className="pl-9 h-8 text-xs border-[#e8e8e8] bg-[#f7f7f5] focus-visible:ring-0 focus-visible:border-[#c4c4c0] rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex-1" />
        <span className="text-xs text-[#9b9a97]">전체 {totalCount}단어</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[#9b9a97]">검색 결과가 없어요</p>
          </div>
        ) : (
          groups.map((group, gi) => (
            <div key={group.label}>
              {/* Group header */}
              <div className={`px-4 pt-4 pb-1.5 ${gi > 0 ? "border-t border-[#f0f0ef]" : ""}`}>
                <span className="text-[10px] font-semibold text-[#9b9a97] uppercase tracking-widest">
                  {group.label}
                </span>
              </div>

              {/* Rows */}
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="group/row flex items-center gap-4 mx-2 px-3 py-2.5 rounded-md hover:bg-[#f7f7f5] transition-colors"
                >
                  {/* Kanji (large) */}
                  <div className="min-w-[60px] text-center">
                    <span className="text-xl font-bold text-[#37352f] leading-tight">
                      {item.word}
                    </span>
                  </div>

                  {/* Meaning + Time */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#787774] leading-relaxed truncate">
                      {item.meaning}
                    </p>
                    <p className="text-[10px] text-[#c4c4c0] mt-0.5">
                      {formatTime(item.timestamp)}
                    </p>
                  </div>

                  {/* Actions (hover only) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <button
                      onClick={() => onReAnalyze(item.word)}
                      className="w-6 h-6 rounded flex items-center justify-center bg-[#e8e8e8] hover:bg-[#d4d4d0] transition-colors"
                      title="다시 분석"
                    >
                      <ExternalLink className="size-3 text-[#787774]" />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(item.id)}
                      className="w-6 h-6 rounded flex items-center justify-center bg-[#e8e8e8] hover:bg-red-100 transition-colors group/del"
                      title="삭제"
                    >
                      <Trash2 className="size-3 text-[#787774] group-hover/del:text-red-500 transition-colors" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
