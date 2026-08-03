/**
 * Read a `CopilotUIMessage` back into the shapes the existing renderers want.
 *
 * These exist so ChatArtifacts / ProgressRail / ReferencesRail / MarkdownMessage
 * keep their current prop contracts and are NOT rewritten as part of the
 * migration. Every selector returns exactly what the old `Msg` field held.
 */

import { isTextUIPart } from 'ai'

import type { CopilotDataParts, CopilotUIMessage } from './ui-message'

/** Concatenated text of a message — the old `msg.content`. */
export function msgText(m: CopilotUIMessage): string {
  return m.parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join('')
}

/**
 * The most recent `data-<key>` payload on a message.
 *
 * Takes the LAST match on purpose: `meta` and `references` are each emitted
 * twice — once before the prose and again at finish with `cited` flags and the
 * authoritative reply resolved. The later one always wins.
 */
export function msgData<K extends keyof CopilotDataParts>(
  m: CopilotUIMessage,
  key: K,
): CopilotDataParts[K] | undefined {
  const wanted = `data-${key}`
  for (let i = m.parts.length - 1; i >= 0; i--) {
    const p = m.parts[i] as { type: string; data?: unknown }
    if (p.type === wanted) return p.data as CopilotDataParts[K]
  }
  return undefined
}

/**
 * The display text for an assistant message.
 *
 * The streamed deltas are RAW and still contain `[tool:…]` citation markers;
 * `data-meta.reply` carries the cleaned text. Prefer the clean reply once it has
 * arrived, and fall back to the raw stream while tokens are still flowing. This
 * reproduces the old two-step exactly:
 *
 *     onToken: content = content + t          →  raw, mid-stream
 *     onDone:  content = done.reply || ''     →  clean, at finish
 */
export function msgDisplayText(m: CopilotUIMessage): string {
  const reply = msgData(m, 'meta')?.reply
  return reply || msgText(m)
}

/**
 * Whether THIS message is still working with nothing to show yet.
 *
 * ⚠️ Deliberately per-message, not the chat-global `status === 'streaming'`.
 * The old `thinking` flag was `streaming && !content`, and it gates three
 * things: the pulsing ProgressRail, and whether artifacts and prose render at
 * all (CopilotProvider.tsx:566-578). Wiring it to chat status would make every
 * message in the thread pulse during any turn, and would hide the artifacts and
 * prose of the message currently streaming for its entire duration.
 *
 * @param m the message
 * @param isLast whether this is the message currently being streamed
 */
export function msgThinking(m: CopilotUIMessage, isLast: boolean): boolean {
  return isLast && msgDisplayText(m).length === 0
}
