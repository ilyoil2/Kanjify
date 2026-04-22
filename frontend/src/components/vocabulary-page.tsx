"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface VocabularyItem {
  id: string
  kanji: string
  hiragana: string
  katakana: string
  korean: string
  jlptLevel: string
}

// Small mock data (5-10 items per level)
const mockVocabularyData: Record<string, VocabularyItem[]> = {
  N5: [
    { id: "n5-1", kanji: "日本", hiragana: "にほん", katakana: "ニホン", korean: "일본", jlptLevel: "N5" },
    { id: "n5-2", kanji: "学校", hiragana: "がっこう", katakana: "ガッコウ", korean: "학교", jlptLevel: "N5" },
    { id: "n5-3", kanji: "先生", hiragana: "せんせい", katakana: "センセイ", korean: "선생님", jlptLevel: "N5" },
    { id: "n5-4", kanji: "学生", hiragana: "がくせい", katakana: "ガクセイ", korean: "학생", jlptLevel: "N5" },
    { id: "n5-5", kanji: "友達", hiragana: "ともだち", katakana: "トモダチ", korean: "친구", jlptLevel: "N5" },
    { id: "n5-6", kanji: "電話", hiragana: "でんわ", katakana: "デンワ", korean: "전화", jlptLevel: "N5" },
    { id: "n5-7", kanji: "時間", hiragana: "じかん", katakana: "ジカン", korean: "시간", jlptLevel: "N5" },
    { id: "n5-8", kanji: "毎日", hiragana: "まいにち", katakana: "マイニチ", korean: "매일", jlptLevel: "N5" },
  ],
  N4: [
    { id: "n4-1", kanji: "経験", hiragana: "けいけん", katakana: "ケイケン", korean: "경험", jlptLevel: "N4" },
    { id: "n4-2", kanji: "説明", hiragana: "せつめい", katakana: "セツメイ", korean: "설명", jlptLevel: "N4" },
    { id: "n4-3", kanji: "注意", hiragana: "ちゅうい", katakana: "チュウイ", korean: "주의", jlptLevel: "N4" },
    { id: "n4-4", kanji: "約束", hiragana: "やくそく", katakana: "ヤクソク", korean: "약속", jlptLevel: "N4" },
    { id: "n4-5", kanji: "準備", hiragana: "じゅんび", katakana: "ジュンビ", korean: "준비", jlptLevel: "N4" },
    { id: "n4-6", kanji: "質問", hiragana: "しつもん", katakana: "シツモン", korean: "질문", jlptLevel: "N4" },
    { id: "n4-7", kanji: "文化", hiragana: "ぶんか", katakana: "ブンカ", korean: "문화", jlptLevel: "N4" },
  ],
  N3: [
    { id: "n3-1", kanji: "環境", hiragana: "かんきょう", katakana: "カンキョウ", korean: "환경", jlptLevel: "N3" },
    { id: "n3-2", kanji: "技術", hiragana: "ぎじゅつ", katakana: "ギジュツ", korean: "기술", jlptLevel: "N3" },
    { id: "n3-3", kanji: "状況", hiragana: "じょうきょう", katakana: "ジョウキョウ", korean: "상황", jlptLevel: "N3" },
    { id: "n3-4", kanji: "影響", hiragana: "えいきょう", katakana: "エイキョウ", korean: "영향", jlptLevel: "N3" },
    { id: "n3-5", kanji: "対象", hiragana: "たいしょう", katakana: "タイショウ", korean: "대상", jlptLevel: "N3" },
    { id: "n3-6", kanji: "効果", hiragana: "こうか", katakana: "コウカ", korean: "효과", jlptLevel: "N3" },
  ],
  N2: [
    { id: "n2-1", kanji: "貢献", hiragana: "こうけん", katakana: "コウケン", korean: "공헌", jlptLevel: "N2" },
    { id: "n2-2", kanji: "概念", hiragana: "がいねん", katakana: "ガイネン", korean: "개념", jlptLevel: "N2" },
    { id: "n2-3", kanji: "傾向", hiragana: "けいこう", katakana: "ケイコウ", korean: "경향", jlptLevel: "N2" },
    { id: "n2-4", kanji: "現象", hiragana: "げんしょう", katakana: "ゲンショウ", korean: "현상", jlptLevel: "N2" },
    { id: "n2-5", kanji: "構造", hiragana: "こうぞう", katakana: "コウゾウ", korean: "구조", jlptLevel: "N2" },
  ],
  N1: [
    { id: "n1-1", kanji: "曖昧", hiragana: "あいまい", katakana: "アイマイ", korean: "애매", jlptLevel: "N1" },
    { id: "n1-2", kanji: "煩雑", hiragana: "はんざつ", katakana: "ハンザツ", korean: "번잡", jlptLevel: "N1" },
    { id: "n1-3", kanji: "顕著", hiragana: "けんちょ", katakana: "ケンチョ", korean: "현저", jlptLevel: "N1" },
    { id: "n1-4", kanji: "懸念", hiragana: "けねん", katakana: "ケネン", korean: "우려", jlptLevel: "N1" },
    { id: "n1-5", kanji: "妥協", hiragana: "だきょう", katakana: "ダキョウ", korean: "타협", jlptLevel: "N1" },
    { id: "n1-6", kanji: "把握", hiragana: "はあく", katakana: "ハアク", korean: "파악", jlptLevel: "N1" },
    { id: "n1-7", kanji: "偏見", hiragana: "へんけん", katakana: "ヘンケン", korean: "편견", jlptLevel: "N1" },
    { id: "n1-8", kanji: "余裕", hiragana: "よゆう", katakana: "ヨユウ", korean: "여유", jlptLevel: "N1" },
    { id: "n1-9", kanji: "臨機応変", hiragana: "りんきおうへん", katakana: "リンキオウヘン", korean: "임기응변", jlptLevel: "N1" },
  ],
}

const jlptLevels = ["N1", "N2", "N3", "N4", "N5"] as const
const ITEMS_PER_PAGE = 24

export function VocabularyPage() {
  const [activeLevel, setActiveLevel] = useState<string>("N5")
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [hideDetails, setHideDetails] = useState<boolean>(false)

  const vocabularyList = mockVocabularyData[activeLevel] || []
  const totalPages = Math.max(1, Math.ceil(vocabularyList.length / ITEMS_PER_PAGE))

  // Get current page items
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentItems = vocabularyList.slice(startIndex, endIndex)

  const handleCheckChange = (itemId: string, checked: boolean) => {
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
    <div className="space-y-4">
      {/* JLPT Level Tabs with Eye Toggle */}
      <div className="flex items-center justify-between">
        <div className="w-10" />
        <div className="inline-flex items-center gap-1 rounded-md bg-muted p-1">
          {jlptLevels.map((level) => (
            <button
              key={level}
              onClick={() => handleLevelChange(level)}
              className={`rounded px-4 py-2 text-sm font-medium ${
                activeLevel === level
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <Button
          variant={hideDetails ? "default" : "outline"}
          size="icon"
          className="size-10"
          onClick={() => setHideDetails(!hideDetails)}
          title={hideDetails ? "Show all details" : "Hide details (Kanji only)"}
        >
          {hideDetails ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>

      {/* Item Count */}
      <div className="text-center text-sm text-muted-foreground">
        {checkedCount > 0 ? (
          <span>
            <span className="font-medium text-primary">{checkedCount}</span> of{" "}
            {vocabularyList.length} items selected for {activeLevel}
          </span>
        ) : (
          <span>
            Showing {vocabularyList.length} vocabulary items for {activeLevel}
          </span>
        )}
      </div>

      {/* Vocabulary Grid - 2 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {currentItems.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-md hover:bg-muted/50 cursor-pointer ${
              checkedItems.has(item.id) ? "bg-muted/30 border-primary/30" : ""
            }`}
            onClick={() => handleCheckChange(item.id, !checkedItems.has(item.id))}
          >
            <Checkbox
              checked={checkedItems.has(item.id)}
              onCheckedChange={(checked) =>
                handleCheckChange(item.id, checked as boolean)
              }
              onClick={(e) => e.stopPropagation()}
              className="rounded-sm"
            />
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="font-bold text-lg text-foreground shrink-0">
                {item.kanji}
              </span>
              <span className="text-sm text-muted-foreground shrink-0">
                {item.hiragana}
              </span>
              <span className="text-xs text-muted-foreground/70 shrink-0">
                {item.katakana}
              </span>
              <span className="text-sm text-foreground truncate ml-auto">
                {item.korean}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
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
    </div>
  )
}
