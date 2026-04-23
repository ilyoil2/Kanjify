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
    <div className="space-y-3 animate-in fade-in duration-500 pb-6">
      {/* 1. 슬림 단어 헤더 */}
      <div className="bg-white border border-blue-600/30 rounded-xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tighter text-blue-600 shrink-0">
              {data.word}
            </h2>
            <span className="text-2xl font-black tracking-tighter text-blue-400">
              {data.reading}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-blue-100 mx-1 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 leading-none mb-1 tracking-wider uppercase">Meaning</span>
            <span className="text-lg font-bold text-gray-800 tracking-tight">
              {data.wordMeaning}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 컴팩트 한자 리스트 */}
      <div className="space-y-2">
        {data.characters.map((item, idx) => (
          <div key={idx} className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-blue-400 transition-all flex items-stretch shadow-sm">
            {/* 한자 아이콘 섹션 (폭 80px로 고정) */}
            <div className="bg-gray-50/50 w-20 flex flex-col items-center justify-center border-r border-gray-100 group-hover:bg-blue-50 transition-colors shrink-0">
              <span className="text-3xl font-black text-gray-800 group-hover:text-blue-600 transition-colors">{item.char}</span>
              <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter truncate px-1 w-full text-center">
                {item.meaning.split(' ')[0]}
              </span>
            </div>

            {/* 상세 데이터 (컴팩트 그리드) */}
            <div className="p-4 flex-1 min-w-0 flex flex-col justify-center">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
                {/* 구성 & 부수 */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-blue-600 uppercase shrink-0 tracking-widest w-8">구조</span>
                    <span className="text-sm font-bold text-gray-800 truncate">{item.components}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-blue-600 uppercase shrink-0 tracking-widest w-8">부수</span>
                    <span className="text-[11px] text-gray-500 truncate font-medium">{item.radical}({item.radicalMeaning}) • {item.radicalExpl}</span>
                  </div>
                </div>

                {/* 음독/훈독 (박스 높이 최소화) */}
                <div className="bg-blue-50/30 rounded-lg px-4 py-2 flex items-center justify-around border border-blue-100/50">
                  <div className="text-center">
                    <span className="block text-[8px] font-bold text-blue-400 uppercase tracking-tighter mb-0.5">음독</span>
                    <span className="text-sm font-black text-gray-800 leading-none">{item.onReading}</span>
                  </div>
                  <div className="w-[1px] h-5 bg-blue-100 mx-2" />
                  <div className="text-center">
                    <span className="block text-[8px] font-bold text-blue-400 uppercase tracking-tighter mb-0.5">훈독</span>
                    <span className="text-sm font-black text-gray-800 leading-none">{item.kunReading}</span>
                  </div>
                </div>
              </div>

              {/* 뜻 & 예문 (한 줄씩 깔끔하게) */}
              <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex gap-2 items-center min-w-0">
                  <Lightbulb className="w-3 h-3 text-yellow-500 shrink-0" />
                  <p className="text-[11px] font-medium text-gray-600 truncate leading-none">
                    <span className="font-bold text-gray-400 mr-1 uppercase text-[8px]">의미</span> {item.meaningDetail}
                  </p>
                </div>
                <div className="flex gap-2 items-center min-w-0">
                  <Languages className="w-3 h-3 text-blue-500 shrink-0" />
                  <p className="text-[11px] font-black text-blue-700 truncate italic leading-none">
                    <span className="font-bold text-gray-400 mr-1 uppercase text-[8px]">예문</span> "{item.example}"
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
