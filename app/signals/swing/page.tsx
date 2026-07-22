import { redirect } from 'next/navigation'

// Legacy slug — the swing book is now Alpha Picks.
export default function LegacySwingRedirect() {
  redirect('/signals/alpha-picks')
}
