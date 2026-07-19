import type { ComponentType } from 'react'

/** Narration token: [text, emphasisIntensity] — the number is a char count fed
 *  to the streaming reveal for emphasis, NOT a boolean. (Promoted from /os.) */
export type Tok = [string, number]

/** A generated filter / rule / spec chip. */
export type ChipItem = { icon?: ComponentType<any>; k: string; op?: string; v?: string }
