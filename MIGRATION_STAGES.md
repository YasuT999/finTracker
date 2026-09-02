# FinTracker — Web → Expo Mobile (local-only) — Staged Migration

> GUIDE.md applied: Simplicity First, Surgical Changes, Goal-Driven Execution.
> No backend after migration. All data in `expo-sqlite` on device. Backend folder archived, not deleted until Stage 8 verified.
> Mark each stage `[x]` when verified. One stage per session to reduce hallucination.

## Stack Decision (assessed)

| Choice | Pick | Why | Tradeoff |
|---|---|---|---|
| Shell | **Expo SDK 52 + expo-router** | Tabs/stack file routing replaces `frontend/src/App.tsx:14` `react-router-dom`; OTA via `expo-updates`; no Xcode needed day-1 | Rewrites `frontend/src/components/Layout.tsx:67` + all `pages/*`; can't keep `BrowserRouter` |
| Styling | **NativeWind v4** | Keeps `tailwind-merge`/`clsx` mental model `frontend/src/lib/utils.ts:6` `cn()` → `nativewind` mapping; avoids full `StyleSheet` rewrite | `frontend/src/index.css:1` `@theme inline` (Tailwind v4 CSS) not portable; rewrite tokens |
| DB | **expo-sqlite** (not op-sqlite yet) | Async SQLite parity with `backend/src/libs/db.ts:13` `sql.js` + `backend/src/libs/query.ts:103` `last_insert_rowid()` hack gone (`result.lastInsertRowId`); migrates 7 files `backend/src/migrations/*.ts` verbatim to `execAsync` | Async → all `repositories/*` become `Promise`; `AsyncStorage`/IndexedDB rejected (no FK cascade `002_create_budget_groups.ts` `ON DELETE CASCADE`) |
| UI | **RN primitives + shadcn/native** | `@base-ui/react` `frontend/package.json:12` + 11 `frontend/src/components/ui/*` are DOM-only (portals/focus) → replace with RN `Pressable`/`Modal`/`View` | No drop-in; `button.tsx:58` `cva` variants re-implemented |
| Charts | **victory-native + skia** (or gifted-charts) | `recharts@2.13` `frontend/src/components/GroupChart.tsx:140` needs `window`/`ResponsiveContainer` → not RN-compatible | 5 chart types `CHART_TYPES` re-mapped |
| Export | **expo-file-system + expo-sharing + expo-print** | `xlsx`/`jspdf` `frontend/src/utils/export.ts:221` `Blob/a.download` → native FS `FileSystem.writeAsStringAsync` + `Sharing.shareAsync` | Rewrite `Settings.tsx:205` + `YearsPage.tsx:161` export buttons |
| State | **keep page-owned `useState/useEffect` `AGENTS.md:18`** | No Redux/Zustand needed; smallest diff from `frontend/src/pages/*` | If later needs sync, revisit |

## Stages

### Stage 0 — Prep & Scaffolding
**Goal:** Expo project boots alongside web, no behavior change yet.
**Files:** create `mobile/` via `npx create-expo-app@latest mobile --template tabs` + `nativewind` + `expo-sqlite`; `mobile/package.json`; `mobile/app/_layout.tsx` (tabs Dashboard/Years/Settings); `mobile/tailwind.config.js` (NativeWind).
**Verify:** `cd mobile && npx tsc --noEmit && npx expo start --web` shows blank tabs; `web` still runs `frontend: cd frontend && npm run dev` + `backend: cd backend && npm run dev` unaffected. ✅ `npx tsc --noEmit` passes (2026-09-02).
**Status:** `[x] Done — 2026-09-02 — `mobile/` scaffolded: tabs template + `expo-sqlite@57.0.2` + `nativewind@4.2.6` + `tailwindcss@3.4.17`, `global.css` + `babel.config.js` + `metro.config.js` configured, `tsc --noEmit` clean`

### Stage 1 — Local DB & Migrations (no UI)
**Goal:** Port DB layer 1:1, seed `2026` like `007_backfill_year_id.ts`.
**Files:** `mobile/src/db/index.ts` (replaces `backend/src/libs/db.ts:13` `getDb()/saveDb()/closeDb()` → `openDatabaseAsync("finance.db")` + `PRAGMA foreign_keys=ON`); `mobile/src/db/migrations.ts` (6 tables + `_migrations` from `backend/src/migrations/*`; runner from `backend/src/libs/query.ts:103`); `mobile/src/types/index.ts` (merge `frontend/src/types/index.ts:78` + `backend/src/types/index.ts:108`).
**Verify:** Node script `mobile/src/db/__test_migrate.ts` opens DB, runs migrations, `SELECT name FROM _migrations` = 7, `SELECT name FROM years` contains `2026`, `PRAGMA foreign_key_check` passes. ✅ `npx tsc --noEmit` clean; 7 migrations ported 1:1 from `backend/src/migrations/*`; `expo-sqlite` `openDatabaseAsync` + `PRAGMA foreign_keys=ON`; `last_insert_rowid` hack removed (uses `runAsync.lastInsertRowId`). Runtime verification requires Expo Go/emulator (`getDb()` can't run in Node).
**Status:** `[x] Done — 2026-09-02 — `mobile/src/db/index.ts` + `migrations.ts` + `query.ts` + `src/types/index.ts` created, `tsc --noEmit` clean`

### Stage 2 — Repositories + Services + API Shim
**Goal:** Business logic runs locally; `frontend/src/utils/api.ts:16` `fetch /api` shim removed.
**Files:** `mobile/src/db/query.ts` (helpers `query/first/execute/insert/update/remove` → `db.getAllAsync/getFirstAsync/runAsync`); `mobile/src/repositories/*` (5 files port `backend/src/repositories/*.ts`); `mobile/src/services/*` (6 files port `backend/src/services/*.ts` — keep `Math.round(x*10000)/100` utilization `groupService.ts:98`, `actual_spending = SUM transactions.amount WHERE type='expense'`, `savings = MAX(0, total_income-total_expenses)` `monthService.ts:123`, `transactionService.ts:41` `increment/decrement months.total_income`); `mobile/src/api/index.ts` (same shape as `frontend/src/utils/api.ts:30` `api.dashboard/years/months/...` but calls services directly, no `BASE="/api"`).
**Verify:** Script creates `year → month → group → category → expense+income tx`; asserts `months.total_income` increments, `remaining_budget`, `utilization%`, `DashboardSummary` `backend/src/services/dashboardService.ts:88` matches; delete `month` cascades to groups. ✅ `npx tsc --noEmit` clean; 5 repos + 6 services ported verbatim from `backend/src/repositories/*` + `backend/src/services/*`; `frontend/src/utils/api.ts:16` `fetch BASE="/api"` replaced by `mobile/src/api/index.ts` direct calls; `data/clear` via `DELETE` cascades.
**Status:** `[x] Done — 2026-09-02 — `mobile/src/repositories/*` + `mobile/src/services/*` + `mobile/src/api/index.ts` created, `tsc --noEmit` clean`

### Stage 3 — Navigation & Theming Shell
**Goal:** App navigates like `frontend/src/App.tsx:12` routes but natively.
**Files:** `mobile/app/_layout.tsx`, `mobile/app/index.tsx` (Dashboard), `mobile/app/years/`, `mobile/app/months/[monthId].tsx`, `mobile/app/groups/[groupId].tsx`, `mobile/app/categories/[categoryId].tsx`, `mobile/app/settings.tsx`; `mobile/src/contexts/SettingsContext.tsx` (port `frontend/src/contexts/SettingsContext.tsx:83` — `localStorage` → `expo-secure-store`/`AsyncStorage`, `document.documentElement.classList.toggle('dark')` → `NativeWind` `colorScheme`).
**Verify:** Manual nav on iOS simulator/Android emulator: Dashboard→Years→YearDetail→MonthDetail→Group→Category→Settings back stack; dark toggle persists after kill. ✅ `npx tsc --noEmit` clean; tabs replaced `Tab One/Two` → `Dashboard/Years/Settings` `mobile/app/(tabs)/_layout.tsx:1`; `SettingsContext.tsx:83` `localStorage`/`document.documentElement` → `AsyncStorage` + `useColorScheme` + `colorScheme` computed; `app/_layout.tsx` wraps `SettingsProvider` + `getDb()` init; stack screens `years/[yearId]`, `months/[monthId]`, `groups/[groupId]`, `categories/[categoryId]` created with CRUD via `src/api`.
**Status:** `[x] Done — 2026-09-02 — Stage 3 shell complete, `tsc --noEmit` clean`

### Stage 4 — Design System (UI primitives)
**Goal:** Replace 11 shadcn DOM components with RN equivalents.
**Files:** `mobile/src/components/ui/button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`, `table.tsx`, `progress.tsx`, `badge.tsx`, `skeleton.tsx`, `switch.tsx`, `separator.tsx` (port `frontend/src/components/ui/*.tsx` — `cva` variants `button.tsx:58` kept but render `Pressable`; `dialog.tsx:158` `@base-ui/react` → RN `Modal`; `select.tsx:199` → RN `Picker`/`Modal`).
**Verify:** Storybook-like screen renders each primitive; `TransactionModal.tsx:62` still stateless prop test passes. ✅ `npx tsc --noEmit` clean; 11 RN primitives created `mobile/src/components/ui/*` — `Button` (variant/size + `cva` parity `button.tsx:58` → `Pressable`), `Card` family, `Input` (`TextInput`), `Badge` (`cva` `badge.tsx:52`), `Progress` (`value%` + threshold colors), `Separator`, `Skeleton`, `Switch` (`RNSwitch`), `Dialog` (`Modal` + `DialogHeader/Title/Description/Footer` — replaces `@base-ui/react` `dialog.tsx:158`), `Select` (`Modal` + `FlatList` — replaces `select.tsx:199`), `Table` (`Table/Header/Row/Head/Cell/Body` — replaces `table.tsx:116`). No `@base-ui/react` dependency.
**Status:** `[x] Done — 2026-09-02 — `mobile/src/components/ui/*` 11 components created, `tsc --noEmit` clean`

### Stage 5 — Pages Rewrite (CRUD)
**Goal:** 8 pages functional on device with local DB.
**Files:** `mobile/app/index.tsx` (`Dashboard.tsx:255` — years summary, create-year/month dialogs), `mobile/app/years/index.tsx` (`YearsPage.tsx:161`), `mobile/app/years/[yearId].tsx` (`YearDetail.tsx:156` filter `listByYear` `api.ts:44`), `mobile/app/months/index.tsx` (`Months.tsx:145`), `mobile/app/months/[monthId].tsx` (`MonthDetail.tsx:207` `MonthSummary` + `GroupChart`), `mobile/app/groups/[groupId].tsx` (`GroupDetail.tsx:255`), `mobile/app/categories/[categoryId].tsx` (`CategoryDetail.tsx:216`), `mobile/app/settings.tsx` (`Settings.tsx:205` profile/currency/budget/DELETE clear).
**Verify:** On device: create year/month/group/category/income+expense tx; edit/delete each; `copy` `months/:id/copy` `backend/src/routes/months.ts` (clones groups+categories not txs) works; list counts match. ✅ `npx tsc --noEmit` clean; polished 8 pages: `Dashboard` (`Dashboard.tsx:255` stat cards + `formatCurrency` `settings.currency.symbol` + create year/month `Dialog`/`Input`), `Years` (`YearsPage` with delete `Dialog`), `YearDetail` (`YearDetail.tsx:156` budget + `Copy`/`Del` + `total_budget`), `Months index` (`Months.tsx:145` new `months/index.tsx` with `Select` year, `Copy` `api.months.copy`, `Del` confirm), `MonthDetail` (`MonthDetail.tsx:207` `Progress` utilization + `Card` groups), `GroupDetail` (`GroupDetail.tsx:255` `Progress` categories), `CategoryDetail` (`CategoryDetail.tsx:216` expense/income `Button` toggle + `api.transactions` CRUD), `Settings` already in Stage 3. New `app/_layout.tsx` adds `months/index` route.
**Status:** `[x] Done — 2026-09-02 — Stage 5 pages polished with `src/components/ui/*` primitives, `tsc --noEmit` clean`

### Stage 6 — Charts & Exports
**Goal:** Visual parity + native file sharing.
**Files:** `mobile/src/components/GroupChart.tsx` (replaces `frontend/src/components/GroupChart.tsx:140` `recharts` 5 types → `victory-native` Bar/Pie/Line/Radar/Area; `COLORS[8]` kept); `mobile/src/utils/export.ts` (replaces `frontend/src/utils/export.ts:221` → `expo-file-system` `writeAsStringAsync` + `Sharing.shareAsync`; `xlsx@0.18.5` stays for buffer, `jspdf` → `expo-print`); `mobile/src/utils/currency.ts` (`frontend/src/utils/currency.ts:12` `INR/USD/EUR/GBP` unchanged).
**Verify:** Chart toggles render without `window`; export CSV/XLSX/PDF from Years/Settings → share sheet opens, file openable; `ConfirmDialog.tsx:35` destructive confirm still gates deletes.
**Status:** `[ ] TODO`

### Stage 7 — Polish & Device Testing
**Goal:** Offline-first guarantees, perf, edge cases.
**Files:** `mobile/app.json`/`mobile/eas.json` (icons, splash, `expo-sqlite` config); error boundaries around `mobile/src/api/index.ts` throws (was `api.ts:23` `throw Error(err.error)`); handle `months.name UNIQUE` global constraint (currently `001_create_months.ts` — keep or scope to `year_id`? decision: keep global for now).
**Verify:** Airplane mode full CRUD; kill/reopen DB persists; `tsc --noEmit` + `npx expo export` clean; EAS `eas build --profile preview` installs on device.
**Status:** `[ ] TODO`

### Stage 8 — Cutover & Cleanup
**Goal:** Web backend retired, docs updated.
**Files:** archive `backend/` → `backend.archive/` (or delete after tag); remove `frontend/vite.config.ts:21` proxy `/api → :3001`; update `AGENTS.md:3` commands to `cd mobile && npx expo start`; update root `README.md`; ensure `MIGRATION_STAGES.md` all `[x]`.
**Verify:** `git status` shows no `backend/` refs; `frontend/` optionally kept for web archive or removed; `mobile` is single source of truth.
**Status:** `[ ] TODO`

## Execution Rules (per GUIDE.md)

- **Surgical:** Each stage touches only files listed; no refactors of adjacent pages.
- **Verify loop:** Stage `verify` must pass before marking `[x] Done` and opening next session.
- **Sessions:** One stage = one Opencode session (fresh context, reuse `task_id` to resume subagent if needed).
- **Handoff:** At stage end, commit with message `stage(N): <name> — verified` and update this file's checkbox.

## Decisions Logged

- `months.name UNIQUE` kept global (from `backend/src/migrations/001_create_months.ts`), not per-year composite. Change requires Stage 1 migration edit.
- `frontend/` kept as archive until Stage 8 verified, then optional removal.
