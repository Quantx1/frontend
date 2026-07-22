import { redirect } from 'next/navigation'

// Legacy slug — the momentum book is now Momentum Picks.
export default function LegacyMomentumRedirect() {
  redirect('/signals/momentum-picks')
}
