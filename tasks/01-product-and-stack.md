# Денежка — MVP Technical Specification

Денежка is a lightweight personal cashflow dashboard. The app must answer one primary question:

> **How much money is safely free until the next income, after all mandatory future payments and planned living expenses are protected?**

The first version is not a full accounting app. It is a personal financial cockpit that helps the user:

1. See available money without confusing it with the total bank balance.
2. Reserve money for mandatory future payments.
3. Track recurring and living expenses.
4. Import transactions from Excel manually.
5. Keep one primary goal visible: closing the credit card.
6. Maintain soft financial hygiene through one recommended action at a time.

---

## 2. MVP boundaries

### In scope

- iPhone-first PWA.
- Dark theme UI.
- Local-first data storage.
- Manual Excel import.
- Transaction parsing and deduplication.
- Manual category review after import.
- Home dashboard with:
  - Free until next income.
  - Upcoming mandatory obligations.
  - Amount still to allocate.
  - Primary debt payoff goal.
  - Safe daily spending pace.
  - Recurring/living expenses.
  - Money Guard recommendation.
- Basic settings for income date, accounts, categories, obligations and credit card goal.

### Out of scope for MVP

- Direct T-Bank personal account API integration.
- Multi-user spouse dashboard.
- Cloud sync.
- Automatic weekly bank import in background.
- Native iOS app.
- Investment tracking.
- Complex analytics and charts.
- Push notifications.
- AI voice input.

---

## 3. Recommended minimal stack

### Frontend

Use:

```txt
Vite + React + TypeScript
```

Why:

- Minimal setup.
- Fast local development.
- Easy PWA support.
- Good compatibility with browser-only Excel parsing.
- Easy later migration to backend/cloud if needed.

### UI

```txt
React + TypeScript + Tailwind CSS
```

Tailwind даёт быструю итерацию на состояниях и отступах без отдельных CSS-файлов. Тёмная тема делается переменными в `tailwind.config.ts`, текущий HTML-мок переносится в компоненты почти напрямую.

Не тянуть тяжёлый UI-кит в первой версии.

### PWA

Use:

```txt
vite-plugin-pwa
Workbox
Web App Manifest
Service Worker
```

PWA requirements:

- Installable on iPhone through Safari → Share → Add to Home Screen.
- Offline shell loads without network.
- App data stored locally in localStorage via Zustand persist middleware.
- The app must gracefully handle missing cache or storage reset.

### Local storage

```txt
Zustand (persist middleware) → localStorage
```

Почему не IndexedDB на MVP:

- Объём данных: ~5000 транзакций × 200 байт ≈ 1 МБ. Лимит localStorage (5 МБ) покрывает с запасом на годы.
- Zustand persist пишет весь стор в localStorage автоматически — не нужно вручную синхронизировать Dexie и React state.
- Один источник правды: Zustand store = и состояние UI, и персистентное хранилище.
- JSON бэкап — просто выгрузка того же стора в файл, без миграций между форматами.

IndexedDB/Dexie подключается позже, только если объём данных реально упрётся в лимит localStorage.

### Excel parsing

Use:

```txt
SheetJS Community Edition (xlsx)
```

The app should read Excel files in the browser through a file input and parse them client-side.

Expected user flow:

```txt
Open app → Import → Select Excel file → Preview → Confirm import
```

### State management

```txt
Zustand + persist middleware
```

Zustand — основной стор приложения с первого дня:

- Все данные (accounts, transactions, categories, obligations, allocations, goals, imports, rules) в одном typed store.
- `persist` middleware автоматически сохраняет стор в localStorage.
- При старте приложение читает localStorage, восстанавливает состояние — никакого ручного open/read/write.
- React-компоненты подписываются на селекторы стора, перерендер минимален.
- Локальный React state — только для форм и UI-состояний (модалки, фильтры).

### Optional later backend

Not required for MVP.

If later needed:

```txt
Supabase / PostgreSQL
```

Only add backend when there is a clear need for sync, spouse dashboard, backups or multi-device usage.

---

## 4. iPhone PWA feasibility

A PWA is feasible for this MVP on iPhone, with important limitations.

