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
    <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 ${isHistory ? "w-full" : ""}`}>
      {/* 1. 요약 카드 (Slim Premium Banner) */}
      <div 
        className="relative overflow-hidden rounded-[32px] p-8 shadow-2xl border border-white/10 group"
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #6d28d9 100%)" }}
      >
        {/* 장식용 배경 요소 */}
        <div className="absolute -right-8 -top-8 size-48 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute -left-8 -bottom-8 size-48 bg-blue-400/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-1.5 rounded-full bg-blue-300 animate-pulse" />
            <p className="text-blue-200/70 text-[10px] font-black uppercase tracking-[0.4em]">
              {isHistory ? "Archived Record" : "Detailed Analysis"}
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
            <div className="flex flex-col">
              <h2 className="text-6xl md:text-7xl font-black text-white tracking-tighter leading-none drop-shadow-md">
                {word}
              </h2>
            </div>
            
            {data.word_info && (
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    {data.word_info.meaning_ko}
                  </span>
                  <span className="text-lg md:text-xl font-bold text-indigo-100/80 tracking-tight">
                    {data.word_info.reading_hiragana}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-1">
                  {rootChars.map(c => (
                    <div 
                      key={c} 
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/90"
                    >
                      <span className="text-xs font-black">{c}</span>
                      <div className="w-[1px] h-2.5 bg-white/20" />
                      <span className="text-[10px] font-bold text-blue-100">{data.nodes[c]?.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. 메인 콘텐츠 영역 (한 줄씩 배치하여 깨짐 방지) */}
      <div className="space-y-8">
        {/* 계층 구조 섹션 (Full Width) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className={`size-8 rounded-xl ${themeBg} flex items-center justify-center shadow-sm`}>
              <ChevronRight className={`size-4 ${themeText}`} />
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">한자 계층 구조 분석</h3>
          </div>
          
          <div className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-xl shadow-slate-200/40">
            <div className="grid grid-cols-1 gap-10">
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
          
          <div className="grid grid-cols-1 gap-3">
            {data.examples && data.examples.length > 0 ? (
              data.examples.map((ex, idx) => (
                <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pr-2">
                    <div className="space-y-1.5 flex-1">
                      <p className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">
                        {ex.sentence}
                      </p>
                      <p className="text-xs text-slate-400 font-bold">
                        {ex.reading}
                      </p>
                    </div>
                    <div className="h-[1px] w-full md:w-[1px] md:h-10 bg-slate-100" />
                    <div className="flex-1 md:max-w-[35%]">
                      <p className="text-base font-black text-slate-600">
                        {ex.meaning}
                      </p>
                    </div>

                    {/* 음성 재생 버튼 */}
                    <button
                      onClick={() => {
                        if (!window.speechSynthesis) return;
                        window.speechSynthesis.cancel();
                        
                        const utterance = new SpeechSynthesisUtterance(ex.sentence);
                        const voices = window.speechSynthesis.getVoices();
                        
                        // Voca 페이지와 동일한 보이스 선택 로직 (Mac 고품질 우선)
                        const preferredVoice = 
                          voices.find(v => v.name.includes("Kyoko")) || 
                          voices.find(v => v.name.includes("Otoya")) || 
                          voices.find(v => v.lang === "ja-JP" || v.lang === "ja_JP");

                        if (preferredVoice) {
                          utterance.voice = preferredVoice;
                        }

                        utterance.lang = "ja-JP";
                        utterance.rate = 0.9;
                        utterance.pitch = 1.0;
                        window.speechSynthesis.speak(utterance);
                      }}
                      className="shrink-0 size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-inner transition-all duration-300 group/btn active:scale-95"
                      title="듣기"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-5 group-hover/btn:animate-pulse">
                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    </button>
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
