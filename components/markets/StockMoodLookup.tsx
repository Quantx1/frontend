'use client'

/**
 * StockMoodLookup — Markets-desk widget: type any NSE symbol → on-demand news
 * Mood (sentiment). Wraps NewsMoodCard with a symbol input so the pre-market
 * desk can check sentiment for ANY stock (the standalone Mood engine).
 */

import { useState, type FormEvent } from 'react'
import { Search } from '@/lib/icons'
import NewsMoodCard from '@/components/stock/NewsMoodCard'

export default function StockMoodLookup() {
  const [input, setInput] = useState('')
  const [symbol, setSymbol] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const s = input.trim().toUpperCase().replace('.NS', '')
    if (s) setSymbol(s)
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={submit}
        className="flex items-center gap-2 rounded-xl border border-line bg-main px-2.5 py-2"
      >
        <Search className="h-4 w-4 shrink-0 text-d-text-muted" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Check any stock's Mood — e.g. RELIANCE"
          aria-label="Stock symbol for news Mood"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-d-text-primary placeholder:text-d-text-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground transition-opacity disabled:opacity-40"
        >
          Go
        </button>
      </form>
      {symbol && <NewsMoodCard key={symbol} symbol={symbol} autoFetch />}
    </div>
  )
}
