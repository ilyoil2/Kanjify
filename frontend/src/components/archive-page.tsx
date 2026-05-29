import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

interface WordButton {
  id: number
  name: string
  hide_days: number | null
  color: string
}

interface VocabularyInfo {
  id: number
  kanji: string
  reading: string
  meaning_ko: string
  n_level: string
}

interface WordStatus {
  id: number
  vocabulary: VocabularyInfo
  button: number
  hidden_until: string | null
  updated_at: string
}

function WordStatusList({
  statuses,
  buttonId,
  onRestore,
}: {
  statuses: WordStatus[]
  buttonId: number
  onRestore: (statusId: number, buttonId: number) => void
}) {
  if (statuses.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm border border-dashed rounded-xl mt-4">
        이 그룹에 숨긴 단어가 없습니다.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
      {statuses.map((ws) => (
        <div
          key={ws.id}
          className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-md"
        >
          <div className="flex items-center gap-4 min-w-0">
            <span className="font-bold text-lg shrink-0">{ws.vocabulary.kanji}</span>
            <span className="text-sm text-muted-foreground shrink-0">{ws.vocabulary.reading}</span>
            <span className="text-sm truncate">{ws.vocabulary.meaning_ko}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 ml-2"
            onClick={() => onRestore(ws.id, buttonId)}
          >
            <RotateCcw className="size-3.5 mr-1" />
            복구
          </Button>
        </div>
      ))}
    </div>
  )
}

export function ArchivePage() {
  const [buttons, setButtons] = useState<WordButton[]>([])
  const [wordStatuses, setWordStatuses] = useState<Record<number, WordStatus[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeButtonId, setActiveButtonId] = useState<string>("")

  const fetchButtons = async () => {
    const res = await fetch("http://localhost:8002/api/buttons/")
    const data: WordButton[] = await res.json()
    setButtons(data)
    if (data.length > 0) setActiveButtonId(String(data[0].id))
    return data
  }

  const fetchWordStatuses = async (buttonId: number) => {
    const res = await fetch(`http://localhost:8002/api/word-status/?button_id=${buttonId}`)
    const data: WordStatus[] = await res.json()
    setWordStatuses((prev) => ({ ...prev, [buttonId]: data }))
  }

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      const btns = await fetchButtons()
      if (btns.length > 0) await fetchWordStatuses(btns[0].id)
      setIsLoading(false)
    }
    init()
  }, [])

  const handleTabChange = (value: string) => {
    setActiveButtonId(value)
    fetchWordStatuses(Number(value))
  }

  const handleRestore = async (statusId: number, buttonId: number) => {
    try {
      const res = await fetch(`http://localhost:8002/api/word-status/${statusId}/restore/`, {
        method: "POST",
      })
      if (!res.ok) throw new Error()
      toast.success("복구되었습니다.")
      fetchWordStatuses(buttonId)
    } catch {
      toast.error("복구 중 오류가 발생했습니다.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    )
  }

  if (buttons.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>버튼이 없습니다. 설정에서 버튼을 추가해보세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Archive</h1>
        <p className="text-sm text-muted-foreground mt-1">버튼별로 숨긴 단어 목록입니다.</p>
      </div>
      <Tabs value={activeButtonId} onValueChange={handleTabChange}>
        <TabsList>
          {buttons.map((btn) => (
            <TabsTrigger key={btn.id} value={String(btn.id)} className="gap-2">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: btn.color }}
              />
              {btn.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {buttons.map((btn) => (
          <TabsContent key={btn.id} value={String(btn.id)}>
            <WordStatusList
              statuses={wordStatuses[btn.id] || []}
              buttonId={btn.id}
              onRestore={handleRestore}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
