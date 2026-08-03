/**
 * The typed Copilot message contract for the Vercel AI SDK.
 *
 * The backend streams the AI SDK v1 UI-message format (see
 * `backend/backend/ai/agents/ui_stream.py`); this file is the client half of
 * that contract, so a shape change on either side is a TypeScript error rather
 * than a blank panel.
 *
 * The eight artifact types, the progress steps and the references are
 * RE-EXPORTED from `lib/api.ts`, never redefined. That union is what
 * ChatArtifacts / ProgressRail / ReferencesRail are typed against — duplicating
 * it here would let the two copies drift silently.
 */

import type { UIMessage } from 'ai'

import type { CopilotArtifact, CopilotReference, CopilotStep } from '@/lib/api'

export type { CopilotArtifact, CopilotReference, CopilotStep }

/**
 * Custom `data-*` parts the backend emits, keyed by the suffix after `data-`.
 *
 * Each is written under a STABLE id per kind, so a re-emit mutates the existing
 * part in place. `references` is genuinely emitted twice — once up front and
 * again once the reply is known, with `cited` flags resolved.
 */
export type CopilotDataParts = {
  /**
   * Turn-level metadata. Emitted twice: a thin version before the prose
   * (intent + tools), then the full version at finish.
   *
   * `reply` is the AUTHORITATIVE cleaned text. The streamed deltas are RAW and
   * still contain `[tool:…]` citation markers, because the SDK's text reducer is
   * append-only and cannot replace. The client swaps the accumulated text for
   * `reply` once, at finish — mirroring what the hand-rolled client already did.
   */
  meta: {
    intent?: string | null
    tools_used?: string[]
    refused?: boolean
    reply?: string
    grounding?: { grounded: boolean; unsupported: string[] } | null
    /**
     * True when the words were WRITTEN, not generated — a deterministic
     * template render (`/copilot/render`), which costs zero chat credits and
     * runs no model.
     *
     * The client needs this to stay honest in two directions. It must not
     * animate a render as if a model were composing it, and it must not
     * attach model-flavoured chrome ("thought for 2.4s") to text that was
     * assembled from a tool result. `template` names which surface produced
     * it, so analytics can separate navigation from chat without inspecting
     * the prose.
     */
    rendered?: boolean
    template?: string | null
  }
  progress: CopilotStep[]
  artifacts: CopilotArtifact[]
  references: CopilotReference[]
  followups: string[]
  conversation: { conversation_id: string | null }
}
// `UIMessage`'s DATA_PARTS generic is constrained to `Record<string, unknown>`
// (ui-messages.ts:17), which an `interface` cannot satisfy — interfaces have no
// implicit index signature. A type alias does. Keep this a `type`.

/**
 * An assistant/user message in the Copilot thread.
 *
 * `UIMessage<METADATA, DATA_PARTS>` — we carry no per-message metadata of our
 * own (everything rides on `data-meta`), hence `never`.
 */
export type CopilotUIMessage = UIMessage<never, CopilotDataParts>
