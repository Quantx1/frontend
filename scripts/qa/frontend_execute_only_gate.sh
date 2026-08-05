#!/usr/bin/env bash
set -euo pipefail

# SEBI execute-only gate: the signal detail page must not offer an
# approve/reject affordance, and must execute straight through to /trades or
# /portfolio. Lived in the monorepo at scripts/qa/ and addressed
# `frontend/app/...`; in this repo the app IS the root, hence the path below.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DETAIL_PAGE="${ROOT_DIR}/app/signals/[id]/page.tsx"

has_match() {
  local pattern="$1"
  local file="$2"
  if command -v rg >/dev/null 2>&1; then
    rg -n -i "${pattern}" "${file}" >/dev/null
  else
    grep -Ein "${pattern}" "${file}" >/dev/null
  fi
}

print_matches() {
  local pattern="$1"
  local file="$2"
  if command -v rg >/dev/null 2>&1; then
    rg -n -i "${pattern}" "${file}"
  else
    grep -Ein "${pattern}" "${file}"
  fi
}

if [[ ! -f "${DETAIL_PAGE}" ]]; then
  echo "Missing signal detail page: ${DETAIL_PAGE}"
  exit 1
fi

echo "Checking execute-only signal detail flow..."

if has_match "approve|reject|thumbsup|thumbsdown" "${DETAIL_PAGE}"; then
  echo "Found forbidden approve/reject references in ${DETAIL_PAGE}"
  print_matches "approve|reject|thumbsup|thumbsdown" "${DETAIL_PAGE}"
  exit 1
fi

if ! has_match "api\\.trades\\.execute" "${DETAIL_PAGE}"; then
  echo "Missing api.trades.execute call in ${DETAIL_PAGE}"
  exit 1
fi
if ! has_match "result\\.status\\s*===\\s*'pending'" "${DETAIL_PAGE}"; then
  echo "Missing pending status branch in ${DETAIL_PAGE}"
  exit 1
fi
# Match the DESTINATION inside a router.push, not one exact call shape. The
# page expresses both arms as a single ternary —
#   router.push(result.status === 'pending' ? '/trades' : '/portfolio')
# — which the old literal patterns router.push\('/trades'\) could never match.
# The gate has therefore failed on correct code since it arrived, taking the
# whole frontend `test` job down with it at its first step, which is also why
# nothing after it (lint, tsc, build, e2e) has run.
if ! has_match "router\\.push\\([^)]*'/trades'" "${DETAIL_PAGE}"; then
  echo "Missing /trades route for pending execution in ${DETAIL_PAGE}"
  exit 1
fi
if ! has_match "router\\.push\\([^)]*'/portfolio'" "${DETAIL_PAGE}"; then
  echo "Missing /portfolio route for open execution in ${DETAIL_PAGE}"
  exit 1
fi

echo "Execute-only gate passed."
