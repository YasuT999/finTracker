# FinTracker — Mobile (Expo, local-only)

Offline finance tracker. All data (years, months, groups, categories, transactions) lives on-device via `expo-sqlite`. No cloud/backend.

> **Rewritten Sep 2026** (stateless components + FlatList virtualization) after the old app was deleted for list-scroll performance issues. Old code retrievable via `git tag mobile-cutover`.

## Quick Start

```sh
cd mobile && npm install
cd mobile && npx tsc --noEmit
cd mobile && npm run start      # scan QR with Expo Go
cd mobile && npm run android    # or ios / web
```

## Run in the Android emulator (from VSCode)

VSCode has no built-in app runner — you use its integrated terminal (`Terminal > New Terminal`). One-time setup (this machine has no Android SDK yet):

1. Install Android Studio (bundles the Android SDK + emulator).
2. Open Android Studio → Device Manager → Create Device (e.g. Pixel 7, recent API) → launch it once so it boots.
3. In VSCode, open this repo folder and run:

```sh
cd mobile && npm install
cd mobile && npm run android
```

Expo finds the running emulator and opens the app in Expo Go on it. If it can't locate the SDK, set `ANDROID_HOME` to your SDK path (default `C:\Users\<you>\AppData\Local\Android\Sdk`), restart VSCode, and retry.

Notes: iOS simulator requires macOS. Physical phone also works — `npm run start` and scan the QR with Expo Go.

### Troubleshooting: `npm` is not recognized

You likely use nvm-windows and the terminal has a stale `PATH`: fully quit VSCode (not just reload), reopen, and check `node -v` / `npm -v`. If still broken, replace the `%NVM_SYMLINK%` entry in your User `PATH` with the literal path `C:\nvm4w\nodejs`, then restart VSCode.

## Project Structure

```
mobile/  # Expo SDK 57 + expo-router + expo-sqlite + StyleSheet (source of truth)
  app/
    index.tsx              # Splash → redirect (onboarding/login/tabs)
    onboarding.tsx login.tsx  # First-run + mock local profile (no backend)
    (tabs)/                # Home (years) · Reports (charts) · Settings
    years/[yearId].tsx     # Year pills + mini-bars + month grid
    months/[monthId].tsx   # Month dashboard (hero, bar + donut charts, groups)
    groups/[groupId].tsx   # Group detail (filter pills + transactions)
    categories/[categoryId].tsx  # Category transactions + CSV export
  src/
    db.ts     # SQLite singleton, schema + indexes, SQL aggregates, pagination
    theme.ts  # Dark/Light tokens (Figma spec) + useTheme/useMode
    ui.tsx    # Stateless memo'd components (props-only) + View-built charts
    AddTxnSheet.tsx  # Add-transaction bottom sheet (group + category screens)
    types.ts  # Entities + summaries (PAGE_SIZE = 50)
    format.ts # formatCurrency, todayISO, pct
```

## How It Works

- **Data:** single `src/db.ts` module (`finance.db`, WAL, FKs on). Years → months → budget groups → categories → transactions (+ `_meta` for currency/theme/onboarding/profile).
- **UI:** dark + light themes (`src/theme.ts`, toggle in Settings); stateless components in `src/ui.tsx` — state lives in screens, data in `src/db.ts`.
- **Performance:** `FlatList` virtualization with fixed row heights, paginated queries (`LIMIT`/`OFFSET`), totals computed in SQL, charts built from plain Views (no chart/NativeWind runtime).
- **Export:** per-category CSV via `expo-file-system` + `expo-sharing`.

See `AGENTS.md` for agent build/verify commands and perf rules.
