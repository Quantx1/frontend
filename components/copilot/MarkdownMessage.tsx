'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { MONO } from '@/lib/tokens'

/**
 * MarkdownMessage — the single xAI markdown renderer for Copilot.
 *
 * The app ships no markdown dependency, so this is a small, safe,
 * dependency-free renderer that covers the subset the Copilot agent
 * emits: headings (with emoji section markers), paragraphs, bold, inline
 * code, fenced code blocks, bullet/numbered lists, GFM tables, and links.
 * It renders React nodes only — never raw HTML injection.
 *
 * Rich-output upgrade (2026-07-12): the responder now writes emoji-tagged
 * section headers + GFM tables; this renderer draws them (headings styled by
 * level, tables as hairline data grids with right-aligned numeric cells).
 */

interface Props {
  content: string
  className?: string
}

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g
const LINK = /\[([^\]]+)\]\(([^)]+)\)/
const HEADING = /^(#{1,6})\s+(.*)$/
// Cells that read as numbers (₹, %, ×, ▲▼, +/-) get mono + right-align.
const NUMERICISH = /^[\s₹$+\-−▲▼✓✗×x.,%()0-9]+$/

/** Inline parser: **bold**, `code`, [text](url). Returns React nodes. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let last = 0
  let i = 0
  for (const match of Array.from(text.matchAll(INLINE))) {
    const idx = match.index ?? 0
    if (idx > last) nodes.push(text.slice(last, idx))
    const tok = match[0]
    const key = `${keyPrefix}-${i++}`
    if (tok.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded border border-line bg-wrap-hover px-1 py-0.5 font-mono text-[0.85em] text-d-text-primary"
        >
          {tok.slice(1, -1)}
        </code>,
      )
    } else if (tok.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-d-text-primary">
          {tok.slice(2, -2)}
        </strong>,
      )
    } else {
      const m = tok.match(LINK)
      nodes.push(
        m ? (
          <a
            key={key}
            href={m[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-d-text-primary underline underline-offset-2 hover:text-d-text-secondary"
          >
            {m[1]}
          </a>
        ) : (
          tok
        ),
      )
    }
    last = idx + tok.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

const HEADING_CLASS: Record<number, string> = {
  1: 'text-[15px] font-semibold text-d-text-primary',
  2: 'text-[14px] font-semibold text-d-text-primary',
  3: 'text-[13px] font-semibold text-d-text-primary',
  4: 'text-[12.5px] font-medium text-d-text-primary',
}

export function MarkdownMessage({ content, className }: Props) {
  const blocks = React.useMemo(() => parseBlocks(content), [content])

  return (
    <div
      className={cn(
        'space-y-3 text-sm leading-relaxed text-d-text-secondary',
        className,
      )}
    >
      {blocks.map((block, bi) => {
        switch (block.type) {
          case 'code':
            return (
              <pre
                key={bi}
                className="overflow-x-auto rounded-sm border border-line bg-wrap-hover p-3 font-mono text-xs text-d-text-primary"
              >
                <code>{block.text}</code>
              </pre>
            )
          case 'heading': {
            const Tag = `h${Math.min(block.level, 4)}` as 'h1' | 'h2' | 'h3' | 'h4'
            return (
              <Tag key={bi} className={cn('mt-1 font-sans', HEADING_CLASS[Math.min(block.level, 4)])}>
                {renderInline(block.text, `h-${bi}`)}
              </Tag>
            )
          }
          case 'table':
            return (
              <div key={bi} className="overflow-x-auto rounded-sm border border-line">
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="border-b border-line text-d-text-muted">
                      {block.header.map((h, hi) => (
                        <th
                          key={hi}
                          className={cn(
                            'px-3 py-1.5 font-medium',
                            hi === 0 ? 'text-left' : `text-right ${MONO}`,
                          )}
                        >
                          {renderInline(h, `th-${bi}-${hi}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-line/50 last:border-0">
                        {row.map((cell, ci) => {
                          const numeric = ci > 0 && NUMERICISH.test(cell.trim())
                          const up = /▲|\bup\b/i.test(cell) || (/\+/.test(cell) && !/▼|−/.test(cell))
                          const down = /▼|−/.test(cell)
                          return (
                            <td
                              key={ci}
                              className={cn(
                                'px-3 py-1.5',
                                ci === 0 ? 'text-d-text-primary' : 'text-right tabular-nums',
                                numeric && MONO,
                                up ? 'text-up' : down ? 'text-down' : ci > 0 ? 'text-d-text-secondary' : '',
                              )}
                            >
                              {renderInline(cell, `td-${bi}-${ri}-${ci}`)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'ul':
            return (
              <ul key={bi} className="list-disc space-y-1 pl-5 marker:text-d-text-muted">
                {block.items.map((it, ii) => (
                  <li key={ii}>{renderInline(it, `ul-${bi}-${ii}`)}</li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={bi} className="list-decimal space-y-1 pl-5 marker:text-d-text-muted">
                {block.items.map((it, ii) => (
                  <li key={ii}>{renderInline(it, `ol-${bi}-${ii}`)}</li>
                ))}
              </ol>
            )
          default:
            return (
              <p key={bi} className="whitespace-pre-wrap">
                {renderInline(block.text, `p-${bi}`)}
              </p>
            )
        }
      })}
    </div>
  )
}
MarkdownMessage.displayName = 'MarkdownMessage'

type Block =
  | { type: 'p'; text: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'code'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }

const TABLE_ROW = /^\s*\|(.+)\|\s*$/
const TABLE_SEP = /^\s*\|?[\s:]*-{2,}[\s:|-]*\|?\s*$/

function splitCells(line: string): string[] {
  const m = line.match(TABLE_ROW)
  const body = m ? m[1] : line.replace(/^\s*\|/, '').replace(/\|\s*$/, '')
  return body.split('|').map((c) => c.trim())
}

/** Line-oriented block parser (no external markdown dep). */
function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0
  let para: string[] = []

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: 'p', text: para.join('\n').trim() })
      para = []
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block ```
    if (/^\s*```/.test(line)) {
      flushPara()
      const body: string[] = []
      i++
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        body.push(lines[i])
        i++
      }
      i++ // skip closing fence
      blocks.push({ type: 'code', text: body.join('\n') })
      continue
    }

    // GFM table: a `| … |` header row immediately followed by a `|---|---|` sep.
    if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      flushPara()
      const header = splitCells(line)
      i += 2 // header + separator
      const rows: string[][] = []
      while (i < lines.length && TABLE_ROW.test(lines[i])) {
        rows.push(splitCells(lines[i]))
        i++
      }
      blocks.push({ type: 'table', header, rows })
      continue
    }

    // Heading
    const h = line.match(HEADING)
    if (h) {
      flushPara()
      blocks.push({ type: 'heading', level: h[1].length, text: h[2].trim() })
      i++
      continue
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      flushPara()
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara()
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // Blank line ends a paragraph
    if (line.trim() === '') {
      flushPara()
      i++
      continue
    }

    para.push(line)
    i++
  }
  flushPara()
  return blocks
}
