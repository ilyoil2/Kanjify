import { Lightbulb, Info, ChevronRight, Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface KanjiNode {
  reading: string
  meaning: string
  components: string[]
}

export interface KanjiRecursiveData {
  nodes: Record<string, KanjiNode>
  origin: Record<string, string>
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
  if (!node) return <div className="p-2 border rounded bg-red-50 text-red-500">정보 없음: {char}</div>

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
              기본 구성요소 (더 이상 분해 불가)
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
  // 입력된 단어의 각 글자가 nodes에 있는지 확인 (루트 노드들)
  const rootChars = Array.from(word).filter(c => data.nodes[c])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* 1. 요약 카드 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 shadow-2xl shadow-blue-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Hash className="size-32 text-white rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end gap-6">
          <div className="space-y-1">
            <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Detailed Analysis</p>
            <h2 className="text-6xl font-black text-white tracking-tighter">
              {word}
            </h2>
          </div>
          <div className="h-12 w-[2px] bg-white/20 hidden md:block mb-1" />
          <div className="flex flex-wrap gap-2 mb-1">
            {rootChars.map(c => (
              <Badge key={c} variant="outline" className="bg-white/10 border-white/20 text-white font-bold backdrop-blur-sm">
                {c}: {data.nodes[c]?.meaning}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 계층 구조 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* 3. 유래 및 정보 */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="size-8 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Info className="size-4 text-yellow-600" />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">단어 유래 및 힌트</h3>
          </div>

          <div className="space-y-4">
            {Object.entries(data.origin).map(([char, text]) => (
              <div key={`origin-${char}`} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm group hover:border-yellow-200 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-black text-gray-900">{char}</span>
                  <div className="h-[1px] flex-1 bg-gray-50 group-hover:bg-yellow-50" />
                </div>
                <div className="flex gap-3">
                  <Lightbulb className="size-4 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-gray-600 font-medium">
                    {text}
                  </p>
                </div>
              </div>
            ))}
            
            {data.confidence === "low" && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
                <div className="size-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-red-600">!</span>
                </div>
                <p className="text-[10px] text-red-700 font-medium leading-tight">
                  이 결과는 AI가 추정한 내용으로, 일부 정보가 정확하지 않을 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
