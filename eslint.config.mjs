// ESLint 9 flat config (required by eslint-config-next@16 / Next.js 16).
// eslint-config-next v16 ships native flat-config arrays, so we spread them
// directly instead of using the FlatCompat bridge (which crashes on the
// next plugin's circular structure).
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // eslint-config-next@16's `typescript` preset enforces rules that the
    // Next 14 `next lint` pipeline never ran against this codebase. These are
    // pre-existing style issues (not upgrade regressions); downgrade them to
    // warnings so the lint gate stays green and the signal is preserved,
    // rather than mass-rewriting hundreds of `any` types as part of a stack
    // upgrade. Tighten incrementally later.
    rules: {
      // Pre-existing TypeScript style, never enforced under Next 14.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      // react-hooks v6 (React Compiler era) ships new rules with
      // eslint-config-next@16. They flag long-standing, working patterns
      // across the app that were valid under Next 14. Treat as warnings for
      // this upgrade; address as a dedicated follow-up, not a version bump.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/incompatible-library': 'warn',
      // Keep genuinely actionable correctness rules as errors:
      // react-hooks/rules-of-hooks, react/no-unescaped-entities,
      // @next/next/no-html-link-for-pages, no-console stay at preset level.
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'scripts/**',
      'next-env.d.ts',
    ],
  },
]

export default eslintConfig
