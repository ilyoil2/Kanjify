

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"

interface KanjiInputProps {
  onSubmit: (kanji: string) => void
  isLoading?: boolean
  userEmail?: string | null // User email to be passed for history tracking
}

export function KanjiInput({ onSubmit, isLoading = false, userEmail }: KanjiInputProps) {
  const [inputValue, setInputValue] = useState("")

  // 한자, 히라가나, 가타카나 및 일부 문장 부호만 허용 (한글, 영어 제외)
  const isInvalid = /[a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣]/.test(inputValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isInvalid && inputValue.length >= 1 && inputValue.length <= 6) {
      onSubmit(inputValue.trim())
    }
  }

  const isValidInput = inputValue.length >= 1 && inputValue.length <= 6 && !isInvalid

  return (
    <Card className="border-border shadow-md transition-shadow duration-300 hover:shadow-lg">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="kanji-input"
              className="text-sm font-medium text-foreground"
            >
              한자 또는 히라가나/가타카나 입력 (1-6자)
            </label>
            <Input
              id="kanji-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="漢字を入力してください"
              className={`h-12 text-lg text-center font-medium placeholder:text-muted-foreground/50 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                isInvalid ? "border-red-500 focus:border-red-500" : "focus:border-primary"
              }`}
              maxLength={6}
              autoComplete="off"
            />
            <div className="flex justify-between items-center px-1">
              <p className={`text-xs font-medium transition-colors duration-200 ${isInvalid ? "text-red-500" : "text-muted-foreground"}`}>
                {isInvalid ? "한글과 영어는 입력할 수 없습니다." : `${inputValue.length}/6 characters`}
              </p>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-11 transition-all duration-200"
            disabled={!isValidInput || isLoading}
          >
            <Search className="mr-2 size-4" />
            {isLoading ? "Analyzing..." : "Analyze Kanji"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
