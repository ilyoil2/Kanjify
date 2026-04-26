import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface HistoryItem {
  id: number // Using timestamp as unique ID for local storage items
  word: string
  meaning: string
  timestamp: string
}

interface HistoryPageProps {
  history: HistoryItem[] // This prop will now be the local state from KanjiDashboard
  onDeleteEntry: (id: number) => void // This will trigger local filtering
  onClearHistory: () => void // This will trigger local clearing
}

const ITEMS_PER_PAGE = 20 // Number of items per page for history

export function HistoryPage({ history, onDeleteEntry, onClearHistory }: HistoryPageProps) {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  const totalPages = Math.max(1, Math.ceil(history.length / ITEMS_PER_PAGE))

  // Get current page items
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentItems = history.slice(startIndex, endIndex)

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
    if (selectedItems.size === 0) {
      toast.warning("삭제할 항목을 선택해주세요.")
      return
    }
    // Call the parent's handler for local state update
    selectedItems.forEach(id => onDeleteEntry(id)) // Assuming onDeleteEntry can handle multiple IDs or is called per item
    setSelectedItems(new Set()) // Clear selection
  }

  const handleClearAll = () => {
    if (history.length === 0) {
      toast.info("지울 히스토리가 없습니다.")
      return
    }
    // Call the parent's handler for local state clearing
    onClearHistory()
  }

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Analysis History</h2>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              Delete Selected ({selectedItems.size})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {history.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-3">
            {currentItems.map((item) => (
              <div
                key={item.id} // item.id is from Date.now() or similar, unique enough for local history
                className={`flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-md transition-colors cursor-pointer ${
                  selectedItems.has(item.id) ? "bg-muted/30 border-primary/30" : ""
                }`}
                onClick={() => handleCheckChange(item.id, !selectedItems.has(item.id))}
              >
                <Checkbox
                  checked={selectedItems.has(item.id)}
                  onCheckedChange={(checked) =>
                    handleCheckChange(item.id, checked as boolean)
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-sm"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-lg text-foreground truncate">
                    {item.word}
                  </span>
                  <span className="text-sm text-muted-foreground truncate">
                    {item.meaning}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
        </>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
          <p className="text-muted-foreground">No history found.</p>
          <p className="text-sm text-muted-foreground mt-1">Analyze some Kanji to see your history here.</p>
        </div>
      )}
    </div>
  )
}
