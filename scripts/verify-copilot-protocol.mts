/**
 * Cross-language protocol conformance check for the Copilot stream.
 *
 * The Python backend (backend/ai/agents/ui_stream.py) emits the Vercel AI SDK
 * v1 UI-message-stream format. Its own pytest suite pins the frame SEQUENCE,
 * but only this script can prove the frames are actually valid to the SDK —
 * it validates each chunk against the SDK's own `uiMessageChunkSchema` and then
 * replays them through `readUIMessageStream`, the same reducer `useChat` uses.
 *
 * Run:
 *   cd backend && .venv/bin/python -c "..." > /tmp/frames.txt   # see tests/ai/test_ui_stream.py
 *   cd frontend && npx tsx scripts/verify-copilot-protocol.mts /tmp/frames.txt
 *
 * Exits non-zero if any chunk fails the SDK schema.
 */
import { readFileSync } from 'node:fs'
import { uiMessageChunkSchema, readUIMessageStream } from 'ai'

const raw = readFileSync(process.argv[2], 'utf8')
const frames = raw.split('\n\n').map(f => f.trim()).filter(Boolean)

// 1 ── every frame must be valid SSE and a schema-valid UI-message chunk.
const chunks: any[] = []
let bad = 0, sawDone = false
const schema: any = (uiMessageChunkSchema as any)()

for (const f of frames) {
  if (!f.startsWith('data:')) { console.log('✗ not an SSE frame:', f.slice(0, 60)); bad++; continue }
  const payload = f.slice(5).trim()
  if (payload === '[DONE]') { sawDone = true; continue }
  const obj = JSON.parse(payload)
  const r = await schema.validate(obj)
  if (r.success) chunks.push(obj)
  else { bad++; console.log("✗ INVALID chunk", obj.type, String(r.error).slice(0,160)) }
}
console.log(`chunks: ${chunks.length} valid, ${bad} invalid · [DONE] sentinel: ${sawDone}`)

// 2 ── replay through the SDK's OWN reducer to get the message a client renders.
const src = new ReadableStream({
  start(c) { for (const ch of chunks) c.enqueue(ch); c.close() },
})
let final: any = null
for await (const m of readUIMessageStream({ stream: src as any })) final = m

const dataPart = (k: string) => [...final.parts].reverse().find((p: any) => p.type === `data-${k}`)?.data
const text = final.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')

console.log('\n── message as the SDK reconstructs it ──')
console.log('  id            :', final.id)
console.log('  role          :', final.role)
console.log('  text (raw)    :', JSON.stringify(text))
console.log('  meta.reply    :', JSON.stringify(dataPart('meta')?.reply))
console.log('  artifacts     :', dataPart('artifacts')?.map((a: any) => a.type))
console.log('  progress      :', dataPart('progress')?.map((s: any) => s.stage))
console.log('  followups     :', dataPart('followups'))
console.log('  conversation  :', dataPart('conversation')?.conversation_id)
const refs = dataPart('references')
console.log('  references    :', JSON.stringify(refs), '← cited flag must be resolved')
console.log('  data-ref parts:', final.parts.filter((p: any) => p.type === 'data-references').length, '(stable id ⇒ must be 1)')
process.exit(bad === 0 ? 0 : 1)
