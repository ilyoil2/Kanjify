import { Lightbulb, Languages } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface KanjiCharDetail {
  char: string
  meaning: string
  components: string
  radical: string
  radicalMeaning: string
  radicalExpl: string
  onReading: string
  kunReading: string
  meaningDetail: string
  example: string
}

export interface KanjiData {
  word: string
  reading: string
  wordMeaning: string
  characters: KanjiCharDetail[]
}

export function KanjiResult({ data }: { data: KanjiData }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">
      {/* 1. 슬림 프리미엄 헤더 */}
      <div 
        className="relative overflow-hidden rounded-2xl p-5 shadow-xl border border-white/20 group"
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #6d28d9 100%)" }}
      >
        {/* 장식용 배경 요소 */}
        <div className="absolute -right-8 -top-8 size-32 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute -left-8 -bottom-8 size-32 bg-blue-400/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-blue-300 animate-pulse" />
              <span className="text-[10px] font-black text-blue-200/70 uppercase tracking-[0.2em]">Analysis Result</span>
            </div>
            
            <div className="flex items-baseline gap-3">
              <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-sm">
                {data.word}
              </h2>
              <span className="text-lg font-bold text-indigo-100/80 tracking-tight">
                {data.reading}
              </span>
            </div>
            
            <div className="mt-1">
              <span className="text-xl font-black text-white/95 tracking-tight">
                {data.wordMeaning}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
              Confirmed
            </Badge>
          </div>
        </div>
      </div>

      {/* 2. 컴팩트 한자 리스트 */}
      <div className="space-y-3">
        {data.characters.map((item, idx) => (
          <div key={idx} className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-blue-200 hover:shadow-lg transition-all flex items-stretch shadow-sm">
            {/* 한자 아이콘 섹션 */}
            <div 
              className="w-24 flex flex-col items-center justify-center border-r border-slate-50 transition-colors shrink-0 relative overflow-hidden"
              style={{ background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)" }}
            >
              <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors duration-300" />
              <span className="text-4xl font-black text-slate-800 group-hover:text-blue-700 transition-all duration-300 group-hover:scale-110 z-10">{item.char}</span>
              <span className="text-[11px] font-black text-slate-400 mt-2 uppercase tracking-tighter truncate px-2 w-full text-center z-10">
                {item.meaning.split(' ')[0]}
              </span>
            </div>

            {/* 상세 데이터 (컴팩트 그리드) */}
            <div className="p-5 flex-1 min-w-0 flex flex-col justify-center">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-4">
                {/* 구성 & 부수 */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-blue-600 uppercase shrink-0 tracking-[0.15em] w-10">Structure</span>
                    <span className="text-[15px] font-bold text-slate-800 truncate">{item.components}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-blue-600 uppercase shrink-0 tracking-[0.15em] w-10">Radical</span>
                    <span className="text-[13px] text-slate-500 truncate font-semibold tracking-tight">
                      <span className="text-slate-900 font-black mr-1">{item.radical}</span>
                      ({item.radicalMeaning}) • {item.radicalExpl}
                    </span>
                  </div>
                </div>

                {/* 음독/훈독 (박스 디자인 고도화) */}
                <div className="bg-slate-50/80 rounded-2xl px-5 py-2.5 flex items-center justify-around border border-slate-100 group-hover:border-blue-100 transition-colors">
                  <div className="text-center">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">On</span>
                    <span className="text-[15px] font-black text-slate-900 leading-none tracking-tight">{item.onReading}</span>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-200 mx-2" />
                  <div className="text-center">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Kun</span>
                    <span className="text-[15px] font-black text-slate-900 leading-none tracking-tight">{item.kunReading}</span>
                  </div>
                </div>
              </div>

              {/* 뜻 & 예문 (디바이더 및 텍스트 스타일링) */}
              <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
                <div className="flex gap-3 items-start min-w-0">
                  <div className="size-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="w-3 h-3 text-amber-500" />
                  </div>
                  <p className="text-[13px] font-semibold text-slate-600 leading-tight">
                    <span className="font-black text-slate-300 mr-2 uppercase text-[9px] tracking-wider">Meaning</span> 
                    {item.meaningDetail}
                  </p>
                </div>
                <div className="flex gap-3 items-start min-w-0">
                  <div className="size-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Languages className="w-3 h-3 text-blue-500" />
                  </div>
                  <p className="text-[13px] font-bold text-blue-700/80 italic leading-tight">
                    <span className="font-black text-slate-300 mr-2 uppercase text-[9px] tracking-wider not-italic">Example</span> 
                    "{item.example}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
