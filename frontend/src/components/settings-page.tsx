import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, RotateCcw, Check, X, Pipette } from "lucide-react"
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
            <span className="text-xs text-muted-foreground/50 shrink-0 ml-auto text-right">
              {ws.hidden_until
                ? `~${new Date(ws.hidden_until).toLocaleDateString("ko-KR", { year: "numeric", month: "numeric", day: "numeric" })}`
                : "영구"}
            </span>
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

const PRESET_COLORS = [
  "#6B9FD4", // dusty blue
  "#6BAE8A", // sage green
  "#C47B8A", // dusty rose
  "#9B7BC4", // muted lavender
  "#C49A4A", // warm amber
]

const EMPTY_FORM: ButtonFormData = { name: "", color: PRESET_COLORS[0], hide_days: "" }

function InlineButtonForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ButtonFormData
  onSave: (data: ButtonFormData) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<ButtonFormData>(initial ?? EMPTY_FORM)
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">이름</Label>
          <Input
            autoFocus
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.slice(0, 6) }))}
            placeholder="최대 6자"
            maxLength={6}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">숨김 기간</Label>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, hide_days: "" }))}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all border ${
                form.hide_days === ""
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-500 border-slate-300 hover:border-slate-400 hover:text-slate-700"
              }`}
            >
              영구
            </button>
          </div>
          <Input
            type="number"
            value={form.hide_days}
            onChange={(e) => setForm((f) => ({ ...f, hide_days: e.target.value }))}
            placeholder="일수 입력"
            min="1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">색상</Label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              className="size-7 rounded-full border-2 transition-all hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: form.color === c ? "white" : "transparent",
                outline: form.color === c ? `2px solid ${c}` : "none",
                outlineOffset: "2px",
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => setShowCustomPicker((v) => !v)}
            className="size-7 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground hover:border-primary/60 hover:text-primary transition-all"
            title="직접 색상 선택"
          >
            <Pipette className="size-3.5" />
          </button>
          <div
            className="size-7 rounded-full border border-border shrink-0"
            style={{ backgroundColor: form.color }}
          />
        </div>

        {showCustomPicker && (
          <div className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
            <div className="relative size-7 shrink-0">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <div
                className="size-7 rounded-full border-2 border-white shadow-md pointer-events-none"
                style={{ backgroundColor: form.color }}
              />
            </div>
            <Input
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="font-mono w-32 h-8 text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-4 mr-1" />
          취소
        </Button>
        <Button size="sm" onClick={() => onSave(form)}>
          <Check className="size-4 mr-1" />
          저장
        </Button>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const [buttons, setButtons] = useState<WordButton[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeSubTab, setActiveSubTab] = useState<"buttons" | "vocabulary">("buttons")

  const fetchButtons = async () => {
    const res = await fetch("http://localhost:8002/api/buttons/")
    setButtons(await res.json())
  }

  useEffect(() => {
    fetchButtons()
  }, [])

  const handleCreate = async (data: ButtonFormData) => {
    if (!data.name.trim()) { toast.error("이름을 입력해주세요."); return }
    try {
      const res = await fetch("http://localhost:8002/api/buttons/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          color: data.color,
          hide_days: data.hide_days === "" ? null : parseInt(data.hide_days, 10),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("추가되었습니다.")
      setShowCreateForm(false)
      fetchButtons()
    } catch {
      toast.error("저장 중 오류가 발생했습니다.")
    }
  }

  const handleEdit = async (id: number, data: ButtonFormData) => {
    if (!data.name.trim()) { toast.error("이름을 입력해주세요."); return }
    try {
      const res = await fetch(`http://localhost:8002/api/buttons/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          color: data.color,
          hide_days: data.hide_days === "" ? null : parseInt(data.hide_days, 10),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("수정되었습니다.")
      setEditingId(null)
      fetchButtons()
    } catch {
      toast.error("저장 중 오류가 발생했습니다.")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8002/api/buttons/${id}/`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("삭제되었습니다.")
      fetchButtons()
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.")
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start min-h-[600px]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0 bg-card border border-border rounded-2xl p-2 sticky top-24">
        <div className="p-3 mb-2">
          <h1 className="text-xl font-black text-slate-900 tracking-tight italic">Settings</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Management</p>
        </div>
        
        <nav className="space-y-1">
          <button
            onClick={() => setActiveSubTab("buttons")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeSubTab === "buttons"
                ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className={`size-1.5 rounded-full ${activeSubTab === "buttons" ? "bg-blue-400" : "bg-slate-300"}`} />
            버튼 설정
          </button>
          <button
            onClick={() => setActiveSubTab("vocabulary")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeSubTab === "vocabulary"
                ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className={`size-1.5 rounded-full ${activeSubTab === "vocabulary" ? "bg-purple-400" : "bg-slate-300"}`} />
            학습 단어 관리
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-white/50 backdrop-blur-sm rounded-3xl p-2 md:p-1 border border-transparent">
        {activeSubTab === "buttons" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="px-2 pt-2">
              <h2 className="text-lg font-black text-slate-900">버튼 설정</h2>
              <p className="text-sm text-slate-500 mt-1">단어를 분류할 버튼의 이름, 색상, 숨김 기간을 설정합니다.</p>
            </div>

            <div className="space-y-3">
              {buttons.map((btn) =>
                editingId === btn.id ? (
                  <InlineButtonForm
                    key={btn.id}
                    initial={{
                      name: btn.name,
                      color: btn.color,
                      hide_days: btn.hide_days !== null ? String(btn.hide_days) : "",
                    }}
                    onSave={(data) => handleEdit(btn.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div
                    key={btn.id}
                    className="flex items-center justify-between px-5 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="size-10 rounded-xl flex items-center justify-center shadow-inner" 
                        style={{ backgroundColor: btn.color + '20' }}
                      >
                        <div className="size-4 rounded-full shadow-sm" style={{ backgroundColor: btn.color }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-900 tracking-tight">{btn.name}</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {btn.hide_days !== null ? `${btn.hide_days}일 후 복구` : "영구 숨김"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-9 rounded-xl hover:bg-slate-50 transition-colors"
                        onClick={() => { setShowCreateForm(false); setEditingId(btn.id) }}
                      >
                        <Pencil className="size-4.5 text-slate-400" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-9 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        onClick={() => handleDelete(btn.id)}
                      >
                        <Trash2 className="size-4.5" />
                      </Button>
                    </div>
                  </div>
                )
              )}

              {showCreateForm ? (
                <InlineButtonForm
                  onSave={handleCreate}
                  onCancel={() => setShowCreateForm(false)}
                />
              ) : (
                <button
                  onClick={() => { setEditingId(null); setShowCreateForm(true) }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400/50 hover:text-blue-600 hover:bg-blue-50/30 transition-all duration-300 text-sm font-bold group"
                >
                  <Plus className="size-5 transition-transform group-hover:rotate-90 duration-300" />
                  새로운 버튼 추가
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="px-2 pt-2">
              <h2 className="text-lg font-black text-slate-900">학습 단어 관리</h2>
              <p className="text-sm text-slate-500 mt-1">각 버튼 그룹별로 숨겨진 단어들을 확인하고 복구할 수 있습니다.</p>
            </div>

            <div className="space-y-10">
              {buttons.map((btn) => (
                <div key={`${btn.id}-${refreshKey}`} className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="size-2 rounded-full" style={{ backgroundColor: btn.color }} />
                      <span className="text-sm font-black text-slate-900 tracking-tight italic">{btn.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 uppercase tracking-widest">Group</span>
                    </div>
                  </div>
                  <div className="bg-white/30 rounded-2xl p-1">
                    <ButtonWordList button={btn} onRestore={() => setRefreshKey((k) => k + 1)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
