import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface KanjiData {
  kanji: string
  meaning: string
  onReading: string
  kunReading: string
  radical: string
  radicalMeaning: string
  strokeCount: number
  jlptLevel: string
}

interface KanjiResultProps {
  data: KanjiData
}

export function KanjiResult({ data }: KanjiResultProps) {
  return (
    <Card className="border-border shadow-md overflow-hidden">
      <CardHeader className="bg-secondary/50 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-foreground">
            Analysis Result
          </CardTitle>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {data.jlptLevel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Large Kanji Display */}
          <div className="text-center">
            <p className="text-6xl sm:text-7xl font-bold text-foreground tracking-wide">
              {data.kanji}
            </p>
            <p className="mt-2 text-lg text-muted-foreground">{data.meaning}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Readings */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Readings
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">On&apos;yomi</span>
                  <span className="text-sm font-medium text-foreground">
                    {data.onReading}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Kun&apos;yomi</span>
                  <span className="text-sm font-medium text-foreground">
                    {data.kunReading}
                  </span>
                </div>
              </div>
            </div>

            {/* Radical & Strokes */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Radical</span>
                  <span className="text-sm font-medium text-foreground">
                    {data.radical} ({data.radicalMeaning})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Strokes</span>
                  <span className="text-sm font-medium text-foreground">
                    {data.strokeCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
