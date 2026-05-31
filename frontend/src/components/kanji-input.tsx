import { useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

interface KanjiInputProps {
  onSubmit: (kanji: string) => void
  isLoading?: boolean
}

export function KanjiInput({ onSubmit, isLoading = false }: KanjiInputProps) {
  const [inputValue, setInputValue] = useState("")

  const isInvalid = /[a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣]/.test(inputValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isInvalid && inputValue.length >= 1 && inputValue.length <= 6) {
      onSubmit(inputValue.trim())
    }
  }

  const isValidInput = inputValue.length >= 1 && inputValue.length <= 6 && !isInvalid

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Input Ring Decoration */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition duration-500" />
        
        <div className="relative flex gap-2 p-1.5 bg-white border border-slate-200/80 shadow-sm rounded-2xl group-focus-within:border-blue-200 group-focus-within:shadow-md transition-all">
          <div className="relative flex-1">
            <Input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="일본어 단어 또는 한자를 입력하세요..."
              className="h-11 pl-4 text-[13.5px] font-bold border-none focus-visible:ring-0 bg-transparent placeholder:text-slate-300 placeholder:font-medium tracking-tight"
              maxLength={6}
              autoComplete="off"
            />
            {inputValue.length > 0 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 select-none bg-slate-50 px-1.5 py-0.5 rounded-md">
                {inputValue.length}/6
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!isValidInput || isLoading}
            className={`px-5 h-11 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2.5 transition-all active:scale-95 shadow-sm ${
              isValidInput && !isLoading 
                ? "bg-slate-900 text-white hover:bg-blue-600 hover:shadow-blue-200" 
                : "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100"
            }`}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
            {isLoading ? "Wait" : "Analyze"}
          </button>
        </div>
      </form>
      
      {isInvalid && (
        <p className="mt-2 text-[10px] font-bold text-red-500/80 ml-2 animate-in slide-in-from-top-1">
          한글과 영어는 분석할 수 없습니다. 한자나 가나를 입력해주세요.
        </p>
      )}
    </div>
  )
}
