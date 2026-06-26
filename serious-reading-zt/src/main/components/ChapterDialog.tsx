import { useEffect, useMemo, useState } from 'react'
import type { ShelfBook, ParsedBook, Settings } from '@/shared/types'
import { searchChapters } from '@/shared/parser'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ChapterDialog(props: {
  book: ShelfBook
  parsed: ParsedBook | undefined
  settings: Settings
  onSkip: (chapterIndex: number, charOffset?: number) => void
}) {
  const [kw, setKw] = useState('')
  const list = useMemo(() => {
    if (!props.parsed) return []
    if (!kw) return props.parsed.chapters
    return searchChapters(props.parsed.chapters, kw)
  }, [props.parsed, kw])

  useEffect(() => {
    const cur = document.querySelector('[data-cur="true"]')
    cur?.scrollIntoView({ block: 'center' })
  }, [list.length])

  return (
    <Dialog open onOpenChange={() => props.onSkip(props.book.lastChapter ?? 0)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>章节跳转 · {props.book.name}</DialogTitle>
        </DialogHeader>
        <Command className="border">
          <CommandInput placeholder="搜索章节标题…" value={kw} onValueChange={setKw} />
          <CommandList>
            <CommandEmpty>无匹配章节</CommandEmpty>
            <CommandGroup>
              {list.map((ch) => (
                <CommandItem
                  key={ch.index}
                  data-cur={ch.index === (props.book.lastChapter ?? 0)}
                  onSelect={() => props.onSkip(ch.index, ch.charOffset)}
                >
                  <span className="truncate">{ch.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}