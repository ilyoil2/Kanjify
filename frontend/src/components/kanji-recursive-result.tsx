import { ChevronRight, BookOpen, AlertCircle, Volume2, Command } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
  variant?: "default" | "history"
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
  if (!node) return <div className="p-3 border border-red-100 rounded-xl bg-red-50 text-red-500 text-[10px] font-bold">Unknown: {char}</div>

  const textActive = accentColor === "blue" ? "text-blue-600" : "text-indigo-600"

  return (
    <div className={`flex flex-col ${isRoot ? "" : `ml-8 mt-4 border-l-2 border-slate-100 pl-6 relative before:absolute before:left-[-2px] before:top-0 before:w-2 before:h-2 before:bg-white before:border-l-2 before:border-t-2 before:border-slate-100 before:rounded-tl-lg`}`}>
      <div className="flex items-center gap-4 group">
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 0 }}
          className={`
            flex items-center justify-center shrink-0 transition-all duration-500
            ${isRoot 
              ? `size-14 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200 rotate-[-2deg]` 
              : `size-10 rounded-xl bg-white border border-slate-200 shadow-sm ${textActive} group-hover:border-blue-300 group-hover:shadow-md`}
          `}
        >
          <span className={`${isRoot ? "text-2xl font-black" : "text-lg font-bold"}`}>{char}</span>
        </motion.div>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-black text-slate-900 tracking-tighter">{node.meaning}</span>
            <span className={`text-[15px] font-black ${textActive} tracking-tighter`}>{node.reading}</span>
          </div>
          {node.components.length === 0 && (
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">
              Fundamental Radical
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
  
  const themeAccent = isHistory ? "indigo" : "blue"
  const themeText = isHistory ? "text-indigo-600" : "text-blue-600"
  const themeBg = isHistory ? "bg-indigo-50" : "bg-blue-50"

  const playPronunciation = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = 
      voices.find(v => v.name.includes("Kyoko")) || 
      voices.find(v => v.name.includes("Otoya")) || 
      voices.find(v => v.lang === "ja-JP" || v.lang === "ja_JP");
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className={`space-y-12 pb-20 ${isHistory ? "w-full" : ""}`}>
      {/* 1. 요약 카드 (Slim Premium Banner - Original Design with Left Alignment) */}
      <div 
        className="relative overflow-hidden rounded-[32px] p-10 shadow-2xl border border-white/10 group"
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #6d28d9 100%)" }}
      >
        {/* 장식용 배경 요소 */}
        <div className="absolute -right-8 -top-8 size-48 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute -left-8 -bottom-8 size-48 bg-blue-400/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="size-2 rounded-full bg-blue-300" 
              />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200/70">
                {isHistory ? "Archived record" : "Detailed Analysis Output"}
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-12">
              <h2 className="text-7xl md:text-8xl font-black text-white tracking-tighter leading-none drop-shadow-md shrink-0">
                {word}
              </h2>
              
              {data.word_info && (
                <div className="flex flex-col items-start gap-4 mb-1">
                  <div className="text-left">
                    <p className="text-4xl font-black text-white tracking-tight leading-tight">
                      {data.word_info.meaning_ko}
                    </p>
                    <p className="text-xl font-bold text-indigo-100/80 mt-1">
                      {data.word_info.reading_hiragana}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-start">
                    {rootChars.map((c) => (
                      <div 
                        key={c}
                        className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 shadow-sm text-[12px] font-black flex items-center gap-2"
                      >
                        <span className="text-white">{c}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-blue-100">{data.nodes[c]?.meaning}</span>
                          <span className="text-white">{data.nodes[c]?.reading}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Breakdown Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className={`size-8 rounded-xl ${themeBg} flex items-center justify-center shadow-sm`}>
              <ChevronRight className={`size-4 ${themeText}`} />
            </div>
            <h3 className="text-[13px] font-black text-slate-900 tracking-widest uppercase">Recursive breakdown</h3>
          </div>
          
          <div className="bg-white border border-slate-200/60 rounded-[32px] p-10 shadow-sm relative overflow-hidden">
             <div className="space-y-12 relative z-10">
                {rootChars.map(c => (
                  <RecursiveComponent key={`root-${c}`} char={c} nodes={data.nodes} isRoot={true} accentColor={themeAccent} />
                ))}
             </div>
          </div>
        </div>

        {/* Examples Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className={`size-8 rounded-xl bg-emerald-50 flex items-center justify-center shadow-sm`}>
              <BookOpen className="size-4 text-emerald-600" />
            </div>
            <h3 className="text-[13px] font-black text-emerald-900/40 tracking-widest uppercase">Contextual usage</h3>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {data.examples && data.examples.length > 0 ? (
                data.examples.map((ex, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ x: 5 }}
                    className="group bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-[17px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                            {ex.sentence}
                          </p>
                          <p className="text-[11px] text-slate-400 font-bold tracking-tight">
                            {ex.reading}
                          </p>
                        </div>
                        <button
                          onClick={() => playPronunciation(ex.sentence)}
                          className="shrink-0 size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
                        >
                          <Volume2 className="size-4" />
                        </button>
                      </div>
                      <div className="pt-3 border-t border-slate-50">
                        <p className="text-sm font-bold text-slate-600 italic">
                          "{ex.meaning}"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center">
                  <AlertCircle className="size-6 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No examples found</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {data.confidence === "low" && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 mt-8">
              <AlertCircle className="size-4 text-amber-600 mt-0.5" />
              <p className="text-[10px] text-amber-800 font-bold leading-normal uppercase tracking-tight">
                Low confidence output: Information generated by AI may contain historical inaccuracies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
