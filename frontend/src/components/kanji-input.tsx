

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"

interface KanjiInputProps {
  onSubmit: (kanji: string) => void
  isLoading?: boolean
}

export function KanjiInput({ onSubmit, isLoading = false }: KanjiInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && inputValue.length >= 1 && inputValue.length <= 6) {
      onSubmit(inputValue.trim())
    }
  }

  const isValidLength = inputValue.length >= 1 && inputValue.length <= 6

  return (
    <Card className="border-border shadow-md transition-shadow duration-300 hover:shadow-lg">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="kanji-input"
              className="text-sm font-medium text-foreground"
            >
              Enter Kanji (1-6 characters)
            </label>
            <Input
              id="kanji-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="漢字を入力してください"
              className="h-12 text-lg text-center font-medium placeholder:text-muted-foreground/50 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              maxLength={6}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground text-center transition-colors duration-200">
              {inputValue.length}/6 characters
            </p>
          </div>
          <Button
            type="submit"
            className="w-full h-11 transition-all duration-200"
            disabled={!isValidLength || isLoading}
          >
            <Search className="mr-2 size-4" />
            {isLoading ? "Analyzing..." : "Analyze Kanji"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
