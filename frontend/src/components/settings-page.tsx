import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

interface WordButton {
  id: number
  name: string
  hide_days: number | null
  color: string
}

interface ButtonFormData {
  name: string
  color: string
  hide_days: string
}

interface VocabularyInfo {
  id: number
  kanji: string
  reading: string
  meaning_ko: string
}

interface WordStatus {
  id: number
  vocabulary: VocabularyInfo
  hidden_until: string | null
}

function ButtonWordList({
  button,
  onRestore,
}: {
  button: WordButton
  onRestore: () => void
}) {
  const [statuses, setStatuses] = useState<WordStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchStatuses = async () => {
    setIsLoading(true)
    const res = await fetch(`http://localhost:8002/api/word-status/?button_id=${button.id}`)
    setStatuses(await res.json())
    setIsLoading(false)
  }

  useEffect(() => {
    fetchStatuses()
  }, [button.id])

  const handleRestore = async (statusId: number) => {
    try {
      const res = await fetch(`http://localhost:8002/api/word-status/${statusId}/restore/`, {
        method: "POST",
      })
      if (!res.ok) throw new Error()
      toast.success("복구되었습니다.")
      fetchStatuses()
      onRestore()
    } catch {
      toast.error("복구 중 오류가 발생했습니다.")
    }
  }

  if (isLoading) return <div className="py-4 text-sm text-muted-foreground">불러오는 중...</div>

  if (statuses.length === 0) {
    return (
      <div className="py-4 text-sm text-muted-foreground text-center border border-dashed rounded-lg">
        이 그룹에 단어가 없습니다.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
            onClick={() => handleRestore(ws.id)}
          >
            <RotateCcw className="size-3.5 mr-1" />
            복구
          </Button>
        </div>
      ))}
    </div>
  )
}

export function SettingsPage() {
  const [buttons, setButtons] = useState<WordButton[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingButton, setEditingButton] = useState<WordButton | null>(null)
  const [form, setForm] = useState<ButtonFormData>({
    name: "",
    color: "#3B82F6",
    hide_days: "",
  })
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchButtons = async () => {
    const res = await fetch("http://localhost:8002/api/buttons/")
    setButtons(await res.json())
  }

  useEffect(() => {
    fetchButtons()
  }, [])

  const openCreate = () => {
    setEditingButton(null)
    setForm({ name: "", color: "#3B82F6", hide_days: "" })
    setIsDialogOpen(true)
  }

  const openEdit = (btn: WordButton) => {
    setEditingButton(btn)
    setForm({
      name: btn.name,
      color: btn.color,
      hide_days: btn.hide_days !== null ? String(btn.hide_days) : "",
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("이름을 입력해주세요.")
      return
    }

    const payload = {
      name: form.name.trim(),
      color: form.color,
      hide_days: form.hide_days === "" ? null : parseInt(form.hide_days, 10),
    }

    try {
      const url = editingButton
        ? `http://localhost:8002/api/buttons/${editingButton.id}/`
        : "http://localhost:8002/api/buttons/"
      const method = editingButton ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success(editingButton ? "수정되었습니다." : "추가되었습니다.")
      setIsDialogOpen(false)
      fetchButtons()
    } catch {
      toast.error("저장 중 오류가 발생했습니다.")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8002/api/buttons/${id}/`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      toast.success("삭제되었습니다.")
      fetchButtons()
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.")
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Settings</h1>
      </div>

      {/* 버튼 관리 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
            버튼 관리
          </h2>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-1" />
            버튼 추가
          </Button>
        </div>

        {buttons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-xl">
            버튼이 없습니다. 추가해보세요.
          </div>
        ) : (
          <div className="space-y-2">
            {buttons.map((btn) => (
              <div
                key={btn.id}
                className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-4 rounded-full shrink-0"
                    style={{ backgroundColor: btn.color }}
                  />
                  <span className="font-bold">{btn.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {btn.hide_days !== null ? `${btn.hide_days}일` : "영구"}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="size-8" onClick={() => openEdit(btn)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(btn.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 버튼별 단어 목록 */}
      {buttons.map((btn) => (
        <div key={`${btn.id}-${refreshKey}`} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: btn.color }} />
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              {btn.name}
            </h2>
          </div>
          <ButtonWordList button={btn} onRestore={() => setRefreshKey((k) => k + 1)} />
        </div>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingButton ? "버튼 수정" : "버튼 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="예: 5일 숨기기"
              />
            </div>
            <div className="space-y-2">
              <Label>숨김 기간 (일) — 비워두면 영구</Label>
              <Input
                type="number"
                value={form.hide_days}
                onChange={(e) => setForm((f) => ({ ...f, hide_days: e.target.value }))}
                placeholder="예: 5"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>색상</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="size-10 rounded cursor-pointer border border-border p-0.5"
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
