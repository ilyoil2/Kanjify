import { ChevronRight, Hash, BookOpen, AlertCircle, Quote } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface KanjiNode {
  reading: string
  meaning: string
  components: string[]
}

export interface Example {
  sentence: string
  reading: string
  meaning: string
}

export interface WordInfo {
  meaning_ko: string
  reading_hiragana: string
  reading_katakana: string
}

export interface KanjiRecursiveData {
  word_info?: WordInfo
  examples?: Example[]
  nodes: Record<string, KanjiNode>
  confidence: "high" | "low"
}

interface KanjiRecursiveResultProps {
  data: KanjiRecursiveData
  word: string
  variant?: "default" | "history" // variant to distinguish design
}

function RecursiveComponent({ 
  char, 
  nodes, 
  isRoot = false,
  accentColor = "blue"
}: { 
  char: string, 
  nodes: Record<string, KanjiNode>,
  isRoot?: boolean,
  accentColor?: "blue" | "indigo"
}) {
  const node = nodes[char]
  if (!node) return <div className="p-2 border rounded bg-red-50 text-red-500 text-[10px]">정보 없음: {char}</div>

  const bgActive = accentColor === "blue" ? "bg-blue-600" : "bg-indigo-600"
  const textActive = accentColor === "blue" ? "text-blue-600" : "text-indigo-600"
  const borderActive = accentColor === "blue" ? "border-blue-200 group-hover:border-blue-400" : "border-indigo-200 group-hover:border-indigo-400"
  const lineActive = accentColor === "blue" ? "border-blue-100" : "border-indigo-100"
  const badgeActive = accentColor === "blue" ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"

  return (
    <div className={`flex flex-col ${isRoot ? "" : `ml-6 mt-2 border-l-2 ${lineActive} pl-4`}`}>
      <div className="flex items-center gap-3 group">
        <div className={`
          flex items-center justify-center shrink-0 transition-all duration-300
          ${isRoot ? `size-12 rounded-xl ${bgActive} text-white shadow-lg` : `size-10 rounded-lg bg-white border ${borderActive} ${textActive} group-hover:bg-slate-50`}
        `}>
          <span className={`${isRoot ? "text-2xl font-black" : "text-xl font-bold"}`}>{char}</span>
        </div>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-800">{node.meaning}</span>
            <Badge variant="secondary" className={`${badgeActive} border-none font-bold text-[10px] h-4 px-1.5`}>
              {node.reading}
            </Badge>
          </div>
          {node.components.length === 0 && (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              기본 구성요소
            </span>
          )}
        </div>
      </div>

      {node.components.length > 0 && (
        <div className="flex flex-col">
          {node.components.map((comp, idx) => (
            <RecursiveComponent key={`${char}-${comp}-${idx}`} char={comp} nodes={nodes} accentColor={accentColor} />
          ))}
        </div>
      )}
    </div>
  )
}

export function KanjiRecursiveResult({ data, word, variant = "default" }: KanjiRecursiveResultProps) {
  const rootChars = Array.from(word).filter(c => data.nodes[c])
  const isHistory = variant === "history"
  
  // Theme colors based on variant
  const themeBase = isHistory ? "from-indigo-600 to-indigo-900" : "from-blue-600 to-blue-800"
  const themeAccent = isHistory ? "indigo" : "blue"
  const themeText = isHistory ? "text-indigo-600" : "text-blue-600"
  const themeBg = isHistory ? "bg-indigo-50" : "bg-blue-50"

  return (
    <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 ${isHistory ? "max-w-4xl mx-auto" : ""}`}>
      {/* 1. 요약 카드 */}
      <div className={`bg-gradient-to-br ${themeBase} rounded-[40px] p-10 shadow-2xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          {isHistory ? <Quote className="size-48 text-white rotate-12" /> : <Hash className="size-48 text-white rotate-12" />}
        </div>
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.4em] mb-2">
                {isHistory ? "Archived Record" : "Detailed Analysis"}
              </p>
              <h2 className="text-7xl font-black text-white tracking-tighter leading-none">
                {word}
              </h2>
            </div>
            
            {data.word_info && (
              <div className="flex flex-col gap-3 items-start md:items-end">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20 font-bold px-3 py-1">
                    뜻
                  </Badge>
                  <span className="text-3xl font-black text-white">{data.word_info.meaning_ko}</span>
                </div>
                <div className="flex items-center gap-3">
                   <Badge variant="outline" className="bg-white/10 text-white border-white/20 font-bold px-3 py-1 text-[10px]">
                    발음
                  </Badge>
                  <span className="text-xl font-bold text-white/90">{data.word_info.reading_hiragana}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
            {rootChars.map(c => (
              <Badge key={c} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-none font-bold backdrop-blur-md px-3 py-1">
                {c}: {data.nodes[c]?.meaning}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 메인 콘텐츠 영역 (한 줄씩 배치하여 깨짐 방지) */}
      <div className="space-y-10">
        {/* 계층 구조 섹션 (Full Width) */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className={`size-10 rounded-2xl ${themeBg} flex items-center justify-center shadow-sm`}>
              <ChevronRight className={`size-5 ${themeText}`} />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">한자 계층 구조 분석</h3>
          </div>
          
          <div className="bg-white border border-slate-100 rounded-[32px] p-10 shadow-xl shadow-slate-200/40">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {rootChars.map(c => (
                <div key={`root-${c}`} className="space-y-6">
                  <RecursiveComponent char={c} nodes={data.nodes} isRoot={true} accentColor={themeAccent} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. 실용 예문 섹션 (Full Width - 한 줄씩 배치) */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="size-10 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-sm">
              <BookOpen className="size-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">실용 일본어 예문</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {data.examples && data.examples.length > 0 ? (
              data.examples.map((ex, idx) => (
                <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-8 shadow-md hover:shadow-lg hover:border-emerald-200 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 flex-1">
                      <p className="text-2xl font-bold text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">
                        {ex.sentence}
                      </p>
                      <p className="text-sm text-slate-400 font-bold">
                        {ex.reading}
                      </p>
                    </div>
                    <div className="h-[1px] w-full md:w-[1px] md:h-12 bg-slate-100" />
                    <div className="flex-1 md:max-w-[40%]">
                      <p className="text-lg font-black text-slate-600">
                        {ex.meaning}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-16 text-center space-y-4">
                <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="size-8 text-slate-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-slate-900">저장된 예문이 없습니다.</p>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    이전에 분석한 단어는 예문 데이터를 포함하지 않습니다.<br/>
                    <span className="text-blue-600 font-bold underline">메인 화면에서 다시 검색</span>하시면 새로운 예문을 보실 수 있습니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {data.confidence === "low" && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="size-5 text-amber-600" />
          <p className="text-xs text-amber-700 font-bold">
            이 결과는 AI가 추정한 내용으로, 일부 정보가 정확하지 않을 수 있습니다.
          </p>
        </div>
      )}
    </div>
  )
}
