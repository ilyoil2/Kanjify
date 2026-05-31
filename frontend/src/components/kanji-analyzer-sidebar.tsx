import { X, Search, Sparkles, Command } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface KanjiAnalyzerSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function KanjiAnalyzerSidebar({ isOpen, onClose }: KanjiAnalyzerSidebarProps) {
  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-full w-[400px] bg-white border-l border-slate-200 shadow-xl z-50 transition-transform duration-500 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="size-6 bg-slate-900 rounded flex items-center justify-center">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">AI Quick Analyzer</h2>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="size-8 rounded-md hover:bg-slate-50">
          <X className="size-4 text-slate-400" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        <div className="space-y-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input 
              placeholder="Analyze kanji..." 
              className="h-10 pl-10 text-sm border-slate-200 focus:ring-1 focus:ring-slate-300 focus:border-slate-300 bg-white"
            />
          </div>
          <p className="text-[10px] text-slate-400 font-medium px-1">
            Enter a single kanji or a word to reveal its radicals and meaning.
          </p>
        </div>

        {/* Empty State Result Placeholder */}
        <div className="flex-1">
          <div className="h-[350px] rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
            <div className="size-12 bg-white border border-slate-100 rounded-lg flex items-center justify-center shadow-sm mb-4">
              <Command className="size-5 text-slate-300" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Ready to search</p>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">
                Enter a character above to see radicals, stroke counts, and more.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Hint */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 size-1.5 rounded-full bg-slate-400 shrink-0" />
            <p className="text-[11px] text-slate-500 font-medium leading-normal">
              <span className="font-bold text-slate-900">Tip:</span> You can enter multiple kanji to see a combined analysis of the word.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
