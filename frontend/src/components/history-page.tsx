"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { KanjiData } from "@/components/kanji-result"

export interface HistoryEntry extends KanjiData {
  id: string
  searchedAt: Date
}

interface HistoryPageProps {
  history: HistoryEntry[]
  onDeleteEntry: (id: string) => void
  onClearHistory: () => void
}

export function HistoryPage({
  history,
  onDeleteEntry,
  onClearHistory,
}: HistoryPageProps) {
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <>
      <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Search History</CardTitle>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearHistory}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Clear All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No search history yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Search for kanji on the Main tab to build your history
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Kanji</TableHead>
                  <TableHead>Meaning</TableHead>
                  <TableHead className="w-24">JLPT</TableHead>
                  <TableHead className="w-32">Searched</TableHead>
                  <TableHead className="w-16 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer transition-colors duration-150 hover:bg-muted/50"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <TableCell className="font-bold text-xl">
                      {entry.kanji}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[200px]">
                      {entry.meaning}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {entry.jlptLevel}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(entry.searchedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteEntry(entry.id)
                        }}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete entry</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={selectedEntry !== null}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-4xl font-bold">{selectedEntry?.kanji}</span>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {selectedEntry?.jlptLevel}
              </span>
            </DialogTitle>
            <DialogDescription>{selectedEntry?.meaning}</DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4 pt-2">
              {/* Readings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">On&apos;yomi</p>
                  <p className="font-medium">{selectedEntry.onReading}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Kun&apos;yomi</p>
                  <p className="font-medium">{selectedEntry.kunReading}</p>
                </div>
              </div>

              {/* Radical and Strokes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Radical</p>
                  <p className="font-medium">
                    {selectedEntry.radical}{" "}
                    <span className="text-muted-foreground">
                      ({selectedEntry.radicalMeaning})
                    </span>
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Strokes</p>
                  <p className="font-medium">{selectedEntry.strokeCount}</p>
                </div>
              </div>

              {/* Searched At */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Searched on {formatDate(selectedEntry.searchedAt)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
