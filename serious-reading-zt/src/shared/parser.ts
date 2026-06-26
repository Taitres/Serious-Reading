import type { ParsedBook, Chapter, BookFormat } from './types'

/** 中文小说章节标题正则（沿用 Serious-Reading 验证过的模式） */
const CHAPTER_RE = /^(第[零一二三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟\d]+[章节回卷集部篇](?![的得了地]))\s*(.*)/gm

function extractTitle(filePath: string): string {
  const name = filePath.replace(/\\/g, '/').split('/').pop() ?? filePath
  return name.replace(/\.[^.]+$/, '')
}

/**
 * 解析 TXT：通过 preload 解码后切章。
 * 同时计算每章在全文字符流中的偏移，供百分比跳转。
 */
export function parseTxt(content: string, filePath: string): ParsedBook {
  if (content.charCodeAt(0) === 0xfeff) content = content.substring(1)
  const chapters: Chapter[] = []
  let lastChapterEnd = 0
  let match: RegExpExecArray | null
  CHAPTER_RE.lastIndex = 0
  while ((match = CHAPTER_RE.exec(content)) !== null) {
    if (chapters.length === 0 && match.index > 0) {
      const pre = content.substring(0, match.index).trim()
      if (pre.length > 0) chapters.push({ title: '开篇', index: 0, content: pre, charOffset: 0 })
    } else if (chapters.length > 0) {
      chapters[chapters.length - 1].content = content
        .substring(lastChapterEnd, match.index)
        .trim()
    }
    chapters.push({ title: match[0].trim(), index: chapters.length, content: '', charOffset: match.index })
    lastChapterEnd = match.index + match[0].length
    if (chapters.length > 5000) break
  }
  if (chapters.length > 0) {
    chapters[chapters.length - 1].content = content.substring(lastChapterEnd).trim()
  } else {
    chapters.push({ title: '全文', index: 0, content: content.trim(), charOffset: 0 })
  }
  // 计算 charLength
  let acc = 0
  for (const ch of chapters) {
    ch.charOffset = ch.charOffset ?? acc
    ch.charLength = ch.content.length
    acc = (ch.charOffset ?? 0) + ch.charLength
  }
  return { title: extractTitle(filePath), filePath, format: 'txt' as BookFormat, chapters, totalChapters: chapters.length, fullText: content }
}

/** EPUB：preload 已通过 adm-zip 提取，直接接收 */
export function buildEpub(ebook: EBook, filePath: string): ParsedBook {
  return {
    title: ebook.title || extractTitle(filePath),
    filePath,
    format: 'epub',
    chapters: ebook.chapters.map((c, i) => ({ title: c.title, index: i, content: c.content })),
    totalChapters: ebook.chapters.length,
  }
}

/** PDF：仅返回元信息，真正渲染由阅读窗用 pdfjs 处理 */
export function buildPdf(filePath: string, totalPdfPages: number): ParsedBook {
  return {
    title: extractTitle(filePath),
    filePath,
    format: 'pdf',
    chapters: [{ title: 'PDF', index: 0, content: '' }],
    totalChapters: 1,
    totalPdfPages,
  }
}

/** 全文搜索：返回关键字上下文片段（含高亮），按 offset 排序 */
export function searchFullText(
  fullText: string,
  keyword: string,
  limit = 30,
  from = 0,
): { results: { index: number; snippet: string }[]; hasMore: boolean } {
  if (!keyword || keyword.length < 2) return { results: [], hasMore: false }
  const out: { index: number; snippet: string }[] = []
  let idx = from
  const ctx = 17
  while (out.length < limit) {
    idx = fullText.indexOf(keyword, idx + 1)
    if (idx === -1) break
    const begin = Math.max(0, idx - ctx)
    const end = Math.min(fullText.length, idx + keyword.length + ctx)
    const seg = fullText.substring(begin, end).replace(/\s/g, '')
    const snippet = seg.replace(keyword, `<b class="text-red-500">${keyword}</b>`)
    out.push({ index: idx, snippet })
  }
  const hasMore = idx !== -1
  return { results: out, hasMore }
}

/** 章节标题搜索 */
export function searchChapters(chapters: Chapter[], keyword: string) {
  const kw = keyword.toLowerCase()
  return chapters.filter((c) => c.title.toLowerCase().includes(kw))
}

/** 渲染章节正文为安全 HTML（剥离 epub 的 img/style/script） */
export function renderChapterHtml(content: string, format: BookFormat): string {
  if (format === 'epub') {
    return content
      .replace(/<img[^>]*>/g, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<\/?a[^>]*>/g, '')
      .replace(/\bp[>]/g, 'p style="text-indent:2em;margin:0 0 .15em 0;line-height:inherit">')
  }
  // TXT：按段落包 <p>，首行缩进两字，段间留白，保留原版换行体例
  return content
    .split(/\n+/)
    .filter((p) => p.trim())
    .map((p) => {
      const t = escapeHtml(p.trim())
      const startsWithQuote = /^[“"].*["”]/.test(t)
      const indent = startsWithQuote ? '0' : '2em'
      return `<p style="text-indent:${indent}em;margin:0 0 .55em 0;text-align:justify;word-break:break-all;line-height:inherit">${t}</p>`
    })
    .join('')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}