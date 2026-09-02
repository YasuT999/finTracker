# FinTracker — Mobile (Expo, local-only)

> **Migrated Web → Mobile (local-only) — Sep 2026.** All data, transactions, budgets run offline on device via `expo-sqlite`. No cloud/backend. Web removed in cutover — see `git tag mobile-cutover`.

## Quick Start (Mobile — primary)

```sh
cd mobile && npm install
cd mobile && npx tsc --noEmit
cd mobile && npm run start      # scan QR with Expo Go
cd mobile && npm run android    # or ios / web
```

- DB: `expo-sqlite` `finance.db`, 7 migrations (`mobile/src/db/migrations.ts` ← `backend/src/migrations/*`), `PRAGMA foreign_keys=ON`.
- API shim: `mobile/src/api/index.ts` calls `mobile/src/services/*` directly (no `fetch /api`).
- UI: NativeWind + `mobile/src/components/ui/*` (RN `Pressable`/`Modal` replaces shadcn `@base-ui/react`).
- Charts: `mobile/src/components/GroupChart.tsx` (View-based, no `window`/`recharts`).
- Exports: `mobile/src/utils/export.ts` → `expo-file-system` + `expo-sharing` + `xlsx`/`jspdf`.

See `MIGRATION_STAGES.md` for 8 staged migrations (0–8 all `[x]`).

## Archive

Web removed. Retrieve original web via:

```sh
git show mobile-cutover:frontend/   # or
git checkout mobile-cutover -- frontend backend
```

## Project Structure

```
mobile/  # Expo 57 + expo-router + expo-sqlite + NativeWind (source of truth)
  app/   # (tabs)/index( Dashboard) /years /settings + stack: years/[id] months/[id] groups/[id] categories/[id]
  src/db, repositories, services, api, contexts, components/ui, utils
```

## Tradeoffs (see MIGRATION_STAGES.md Stack Decision)

- **Expo vs Capacitor:** Expo chosen for true native UX; Capacitor would be simpler (wrap web SPA, keep recharts/tailwind) but WebView jank.
- **expo-sqlite vs AsyncStorage:** SQLite required for FK cascades + joins (`sumExpensesByCategories`), not KV.
- **NativeWind vs StyleSheet:** NativeWind retains Tailwind mental model; fully StyleSheet would be simpler but larger diff.
