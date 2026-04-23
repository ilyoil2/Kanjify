import { X, Search, Sparkles } from "lucide-react"
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
        "fixed top-0 right-0 h-full w-[450px] bg-background/95 backdrop-blur-xl border-l shadow-2xl z-50 transition-transform duration-500 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">AI Analyzer</h2>
            <p className="text-xs text-muted-foreground">Quick kanji insights</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        <div className="space-y-4">
          <label className="text-sm font-medium pl-1">Analyze Kanji</label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input 
              placeholder="Enter kanji to reveal its secrets..." 
              className="pl-10 h-12 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Empty State Result Placeholder */}
        <div className="space-y-6">
          <div className="h-[300px] rounded-2xl border-2 border-dashed border-muted/50 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-muted/5">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-muted-foreground">Ready to search</p>
              <p className="text-sm text-muted-foreground/60 leading-relaxed">
                Enter a character above to see radicals, stroke counts, and more.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Hint */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background to-transparent">
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
          <p className="text-xs text-primary/80 leading-relaxed">
            Tip: You can enter multiple kanji to see a combined analysis of the word.
          </p>
        </div>
      </div>
    </div>
  )
}
