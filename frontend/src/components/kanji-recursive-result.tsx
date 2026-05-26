import { ChevronRight, Hash, BookOpen, AlertCircle } from "lucide-react"
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

function RecursiveComponent({ 
  char, 
  nodes, 
  isRoot = false 
}: { 
  char: string, 
  nodes: Record<string, KanjiNode>,
  isRoot?: boolean
}) {
  const node = nodes[char]
  if (!node) return <div className="p-2 border rounded bg-red-50 text-red-500 text-[10px]">정보 없음: {char}</div>

  return (
    <div className={`flex flex-col ${isRoot ? "" : "ml-6 mt-2 border-l-2 border-blue-100 pl-4"}`}>
      <div className="flex items-center gap-3 group">
        <div className={`
          flex items-center justify-center shrink-0 transition-all duration-300
          ${isRoot ? "size-12 rounded-xl bg-blue-600 text-white shadow-lg" : "size-10 rounded-lg bg-white border border-blue-200 text-blue-600 group-hover:border-blue-400 group-hover:bg-blue-50"}
        `}>
          <span className={`${isRoot ? "text-2xl font-black" : "text-xl font-bold"}`}>{char}</span>
        </div>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-800">{node.meaning}</span>
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold text-[10px] h-4 px-1.5">
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
            <RecursiveComponent key={`${char}-${comp}-${idx}`} char={comp} nodes={nodes} />
          ))}
        </div>
      )}
    </div>
  )
}

export function KanjiRecursiveResult({ data, word }: { data: KanjiRecursiveData, word: string }) {
  const rootChars = Array.from(word).filter(c => data.nodes[c])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* 1. 요약 카드 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 shadow-2xl shadow-blue-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Hash className="size-32 text-white rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end gap-8">
          <div className="space-y-1">
            <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Detailed Analysis</p>
            <h2 className="text-6xl font-black text-white tracking-tighter">
              {word}
            </h2>
          </div>
          
          {data.word_info && (
            <>
              <div className="h-12 w-[2px] bg-white/20 hidden md:block mb-1" />
              <div className="flex flex-col gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/10 text-white border-none font-bold text-xs">
                    뜻
                  </Badge>
                  <span className="text-xl font-bold text-white">{data.word_info.meaning_ko}</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-400/20 text-blue-100 border-none font-bold text-[10px]">
                      발음
                    </Badge>
                    <span className="text-sm font-medium text-blue-50">{data.word_info.reading_hiragana}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex-1" />
          
          <div className="flex flex-wrap gap-2 mb-1">
            {rootChars.map(c => (
              <Badge key={c} variant="outline" className="bg-white/10 border-white/20 text-white font-bold backdrop-blur-sm">
                {c}: {data.nodes[c]?.meaning}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. 계층 구조 섹션 (좌측 2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <ChevronRight className="size-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">계층적 구성 분석</h3>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-10">
            {rootChars.map(c => (
              <div key={`root-${c}`} className="space-y-6">
                <RecursiveComponent char={c} nodes={data.nodes} isRoot={true} />
              </div>
            ))}
          </div>
        </div>

        {/* 3. 실용 예문 섹션 (우측 1/3) */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="size-8 rounded-lg bg-green-50 flex items-center justify-center">
              <BookOpen className="size-4 text-green-600" />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">실용 예문 (3)</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {data.examples && data.examples.length > 0 ? (
              data.examples.slice(0, 3).map((ex, idx) => (
                <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-green-200 transition-all group">
                  <div className="space-y-2">
                    <p className="text-base font-bold text-slate-800 tracking-tight group-hover:text-green-700 transition-colors">
                      {ex.sentence}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {ex.reading}
                    </p>
                    <div className="pt-2 border-t border-slate-50">
                      <p className="text-xs font-bold text-slate-600">
                        {ex.meaning}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
                <AlertCircle className="size-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  이전에 분석한 단어라 예문이 없습니다.<br/>
                  <span className="text-blue-600 font-bold">새로운 단어</span>를 입력하시면<br/>예문을 보실 수 있습니다!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



