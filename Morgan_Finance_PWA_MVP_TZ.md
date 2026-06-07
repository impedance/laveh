# Morgan Finance — MVP Technical Specification

**Document type:** Technical specification / implementation brief  
**Version:** 0.2  
**Language:** Russian, with English component/entity names  
**Target platform:** iPhone-first PWA, desktop-compatible  
**Initial user:** one user only  
**Bank integration:** manual Excel import from T-Bank / Tinkoff export  
**Primary goal:** personal financial hygiene dashboard, not a generic expense tracker

---

## 1. Product idea

Morgan Finance is a lightweight personal cashflow dashboard. The app must answer one primary question:

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

### What is possible

- Install to Home Screen.
- Dark mobile UI.
- Offline app shell.
- Local data storage.
- Manual Excel file selection via file input.
- Client-side Excel parsing.
- Dashboard recalculation without a server.

### Important limitations

- The app cannot automatically access files from the bank or Downloads folder without user selection.
- The app cannot reliably run a weekly import in the background.
- Manual Excel import is the correct MVP flow.
- Local browser storage can be lost if the user clears Safari data or the browser purges storage.
- Backups/export must be implemented early.

### Required backup feature

The app must support exporting all app data to JSON:

```txt
Settings → Export backup → morgan-backup-YYYY-MM-DD.json
```

And importing it back:

```txt
Settings → Restore backup → select JSON file
```

This is mandatory if MVP is local-first.

---

## 5. Core financial model

The app must separate physical money location from money purpose.

### Key principle

```txt
Account balance = where money is.
Allocation = what the money is for.
Free money = money without a protected job.
```

The user must never mistake total bank balance for spendable money.

---

## 6. Main formula

### Primary metric

```txt
Free Until Next Income
```

### Formula

```txt
Free Until Next Income =
Current Cash Balance
- Upcoming Mandatory Payments Gap
- Remaining Planned Living Expenses
- Protected Reserve
- Planned Debt Goal Contribution
```

More precise version:

```txt
Free Until Next Income =
Current Cash Balance
- Total Required Allocations Until Next Income
```

Where:

```txt
Total Required Allocations Until Next Income =
Mandatory Obligations Remaining
+ Living Envelopes Remaining
+ Reserve Protection
+ Planned Credit Card Goal Contribution
```

### Important rule

Credit card limit is not money. It must not be included in Current Cash Balance.

---

## 7. Home screen UX

The home screen must be an allocation-first cashflow dashboard, not a generic transaction list.

### Screen goal

Within 10 seconds, the user must understand:

1. How much is safely free.
2. What mandatory payments are coming.
3. How much still needs to be allocated.
4. Whether the credit card payoff goal is progressing.
5. What one action is recommended today.

---

## 8. Home screen layout

### Component order

Первые 3 карточки отвечают на прямой вопрос «сколько осталось и сколько отложить». Остальное — ниже (скролл) или свёрнуто.

```txt
1. FreeMoneyHeroCard          ← свободно + нужно отложить (ключевые цифры здесь)
2. UpcomingObligationsCard    ← что и когда платить
3. SafeDailyPaceCard          ← сколько можно тратить в день
4. MoneyGuardCard             ← одно рекомендуемое действие (компактно)
--- ниже / свёрнуто ---
5. PrimaryGoalCard            ← долгосрочная цель (не для ежедневного сканирования)
6. RecurringExpensesCard      ← детализация постоянных расходов
7. BottomNavigation
```

PrimaryGoalCard и RecurringExpensesCard — не на первом экране без скролла. Пользователь видит главные цифры сразу, детали — тапом или скроллом.

---

## 9. Component specification

## 9.1 FreeMoneyHeroCard

### Purpose

Show the primary answer: how much money is safely free until the next income.

### Content

```txt
Title: Свободно до следующего дохода
Amount: 47 300 ₽
Mode badge: Режим: спокойно / осторожно / стоп
```

### Supporting metrics

```txt
Нужно отложить: 12 000 ₽ до 25 июня   ← прямой ответ на второй вопрос пользователя
Баланс сейчас: 212 000 ₽
Распределено: 164 700 ₽
Следующий доход: 25 июня
Импорт Excel: 2 дня назад
```

Строка «Нужно отложить» = Total Obligation Gap (сумма недобора по всем обязательствам до следующего дохода). Это главный призыв к действию прямо в HeroCard.

### Mode logic

```txt
incomeRatio = FreeUntilNextIncome / ExpectedMonthlyIncome

if incomeRatio > 0.2:
  mode = спокойно

if incomeRatio >= 0 and incomeRatio <= 0.2:
  mode = осторожно

if FreeUntilNextIncome < 0:
  mode = стоп
```

Использование доли от месячного дохода надёжнее, чем привязка к safeDailyPace — последний может быть слишком маленьким и давать ложное «спокойно» даже при 300 ₽ свободных.

### Visual states

- Green / calm: obligations protected, free money positive.
- Amber / caution: gaps exist.
- Red / stop: free money negative or mandatory payment is underfunded near due date.

---

## 9.2 UpcomingObligationsCard

### Purpose

Show future mandatory payments and how much still needs to be distributed.

### Header

```txt
Ближайшие обязательства
до 25 июня
```

### Summary block

```txt
Ещё распределить: 12 000 ₽
Нужно 158 000 ₽ · уже отложено 146 000 ₽
```

### Rows

Each row:

```txt
Name
Due date
Status
Amount
Gap if underfunded
```

Example:

```txt
Ипотека
10 июня · платёж защищён
84 000 ₽

Автокредит
15 июня · платёж защищён
34 000 ₽

Кредитка · платёж месяца
20 июня · не хватает 12 000 ₽
30 000 ₽
```

### Calculation

```txt
Obligation Gap = plannedAmount - allocatedAmount
Total Obligation Gap = sum(max(0, gap) for obligations due before next income)
```

### CTA

```txt
Закрыть gap
```

CTA opens allocation screen with underfunded obligations filtered.

---

## 9.3 PrimaryGoalCard

### Purpose

Keep the main debt payoff goal visible without creating shame or pressure.

### Position

Не на первом экране. Долгосрочная цель не нужна при каждом открытии. Показывается ниже (скролл) или свёрнутой — с текущим процентом и суммой для быстрого взгляда. Раскрывается тапом.

### Current MVP goal

```txt
Цель №1: закрыть кредитку
```

### Example state

```txt
Накоплено: 400 000 ₽
Цель: 700 000 ₽
Progress: 57%
До следующего рубежа: 50 000 ₽
```

### UI

- Progress bar.
- Percentage.
- Current amount.
- Target amount.
- Next milestone.

### Milestone model

Default milestones:

```txt
100 000 ₽
250 000 ₽
400 000 ₽
550 000 ₽
700 000 ₽
```

When current amount reaches a milestone, show calm celebration:

```txt
Новый рубеж достигнут: 400 000 ₽ защищены для закрытия кредитки.
```

Avoid casino-like or childish gamification.

### Copy tone

Good:

```txt
+10 000 ₽ к свободе от кредитки
```

Avoid:

```txt
Вы всё ещё должны 300 000 ₽
```

---

## 9.4 SafeDailyPaceCard

### Purpose

Translate the free balance into a simple daily spending guideline.

### Content

```txt
Безопасный темп трат
2 490 ₽ / день
Сегодня потрачено 1 240 ₽ · осталось 1 250 ₽
```

### Formula

```txt
Safe Daily Pace = Free Until Next Income / Days Until Next Income
```

### Today remaining

```txt
Today Remaining = Safe Daily Pace - Today Flexible Spending
```

Only flexible spending should reduce today's pace. Mandatory payments should not be treated as daily spending.

### Visual

- Circular progress ring.
- Show percent used today.

---

## 9.5 RecurringExpensesCard

### Purpose

Show ongoing living expenses compactly.

### Categories

Initial categories:

```txt
Продукты
Подписки
Транспорт
Дом / хозяйство
Связь / интернет
Медицина
```

### Row format

```txt
Category name
Progress bar
Remaining amount
```

Example:

```txt
Продукты    18 400 / 60 000 ₽    осталось 41 600 ₽
Подписки     3 200 / 5 000 ₽      осталось 1 800 ₽
Транспорт    7 000 / 20 000 ₽     осталось 13 000 ₽
```

### Warning logic

```txt
Expected spend by today = monthlyPlan * monthProgressPercent

if actualSpend > expectedSpend * 1.15:
  category status = above pace
```

---

## 9.6 MoneyGuardCard

### Purpose

Give one soft, useful action instead of showing a long warning list.

### Example

```txt
Money Guard
1 действие

Защитить платёж по кредитке
Распредели 12 000 ₽, чтобы все обязательства были закрыты.
[Сделать]
```

### Priority order for recommendations

1. Underfunded mandatory obligation due soon.
2. Excel import data older than 7 days.
3. Uncategorized transactions after import.
4. Free Until Next Income is negative.
5. Primary goal contribution missed.
6. Spending pace too high in a key category.

### Copy rules

Use calm navigation language:

- “нужно распределить”
- “платёж не защищён”
- “данные устарели”
- “можно снизить темп трат”

Avoid shame language:

- “вы плохо тратите”
- “вы превысили”
- “ошибка”
- “нельзя”

---

## 10. Navigation

Initial bottom navigation:

```txt
Главная
Операции
План
Импорт
```

### Главная

Dashboard.

### Операции

Transaction list, filters and category review.

### План

Obligations, recurring expenses, allocations, credit card goal.

### Импорт

Excel import flow and import history.

---

## 11. Data model

Типы описывают структуру Zustand store. Хранятся в `src/store/types.ts`.

### accounts

```ts
type Account = {
  id: string;
  name: string;
  type: 'cash' | 'debit' | 'credit' | 'savings';
  bank?: 'tbank' | 'manual' | 'other';
  currency: 'RUB';
  includeInCashBalance: boolean;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
};
```

Rule:

```txt
Credit accounts must not increase Current Cash Balance.
```

---

### transactions

```ts
type Transaction = {
  id: string;
  date: string;
  amount: number;
  direction: 'income' | 'expense' | 'transfer';
  accountId: string;
  merchant?: string;
  description?: string;
  categoryId?: string;
  owner: 'me';
  source: 'excel' | 'manual';
  sourceImportId?: string;
  externalHash: string;
  isReviewed: boolean;
  isInternalTransfer: boolean;
  createdAt: string;
  updatedAt: string;
};
```

---

### categories

```ts
type Category = {
  id: string;
  name: string;
  group: 'income' | 'mandatory' | 'living' | 'flexible' | 'debt' | 'reserve' | 'joy';
  monthlyPlan?: number;
  isActive: boolean;
};
```

---

### obligations

```ts
type Obligation = {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  dueDate?: string;
  categoryId: string;
  priority: number;
  isMandatory: boolean;
  allocatedAmount: number;
  status: 'protected' | 'underfunded' | 'paid';
  createdAt: string;
  updatedAt: string;
};
```

---

### allocations

```ts
type Allocation = {
  id: string;
  period: string; // YYYY-MM
  targetType: 'category' | 'obligation' | 'goal' | 'reserve';
  targetId: string;
  plannedAmount: number;
  allocatedAmount: number;
  spentAmount: number;
  createdAt: string;
  updatedAt: string;
};
```

---

### goals

```ts
type Goal = {
  id: string;
  title: string;
  type: 'debt_payoff' | 'reserve' | 'saving';
  targetAmount: number;
  currentAmount: number;
  priority: number;
  nextMilestoneAmount?: number;
  deadline?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};
```

---

### imports

```ts
type ImportBatch = {
  id: string;
  fileName: string;
  importedAt: string;
  rowCount: number;
  importedCount: number;
  duplicateCount: number;
  needsReviewCount: number;
  status: 'preview' | 'committed' | 'failed';
};
```

---

### rules

```ts
type CategorizationRule = {
  id: string;
  name: string;
  matchField: 'merchant' | 'description';
  matchType: 'contains' | 'equals' | 'regex';
  pattern: string;
  categoryId: string;
  priority: number;
  isActive: boolean;
};
```

---

## 12. Excel import flow

### User flow

```txt
Импорт → Выбрать Excel файл → Preview → Проверить неизвестные операции → Импортировать
```

### Technical flow

```txt
1. User selects .xlsx / .xls / .csv file.
2. Browser reads file via File API.
3. SheetJS parses workbook.
4. App maps columns to normalized transaction fields.
5. App generates externalHash for each row.
6. App detects duplicates.
7. App applies categorization rules.
8. App shows preview.
9. User confirms.
10. App writes transactions to Zustand store (auto-persisted to localStorage).
11. App recalculates dashboard.
```

### Supported formats

MVP:

```txt
.xlsx
.csv
```

Later:

```txt
.xls
ofx
qif
```

### Column mapping

The app must support manual mapping on the first import.

Expected fields:

```txt
Date
Amount
Description
Merchant / Payee
Account
Operation type
```

Persist mapping per import source:

```txt
sourceProfile: 'tbank_excel_v1'
```

### Deduplication hash

Generate:

```txt
externalHash = sha256(date + amount + description + account + sourceProfile)
```

If hash already exists, mark as duplicate.

### Import preview

Show:

```txt
Found: 42 transactions
New: 37
Duplicates: 5
Need review: 4
```

CTA:

```txt
Import 37 transactions
```

---

## 13. Categorization rules

Initial default rules:

```txt
Пятёрочка → Продукты
Перекрёсток → Продукты
Магнит → Продукты
ВкусВилл → Продукты
Яндекс Плюс → Подписки
Кинопоиск → Подписки
АЗС → Транспорт
Tinkoff Mobile → Связь
ЖКХ / квартплата → ЖКХ
```

Rules must be editable.

When user manually changes category, app should offer:

```txt
Always categorize similar transactions this way?
```

---

## 14. Plan screen

The Plan screen must allow editing:

- Next income date.
- Expected income amount.
- Mandatory obligations.
- Living category plans.
- Reserve protection amount.
- Primary goal.

### Required setup wizard

On first launch:

```txt
1. Current cash balance / accounts
2. Next income date
3. Mandatory payments
4. Living expense plans
5. Credit card goal
6. Reserve protection
```

---

## 15. Operations screen

### Features

- List transactions.
- Filter by date, category, source and review status.
- Edit transaction category.
- Mark transaction as internal transfer.
- Delete imported transaction.
- Undo last import batch.

### Review queue

The app must have a quick review mode:

```txt
4 операции без категории
```

Each item:

```txt
Merchant / description
Amount
Date
Suggested category if any
Category picker
```

---

## 16. Import screen

### Features

- Upload file.
- Show import instructions.
- Show last import date.
- Show import history.
- Undo import batch.

### Instruction copy

```txt
Скачай Excel-выписку из банка за последние 14 дней и загрузи сюда.
Приложение само пропустит дубликаты и добавит только новые операции.
```

Use 14 days instead of 7 to handle delayed settlement and missed imports.

---

## 17. Dashboard calculation service

Create a pure calculation module:

```txt
src/domain/dashboard/calculateDashboard.ts
```

Inputs:

```ts
type DashboardInput = {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  obligations: Obligation[];
  allocations: Allocation[];
  goals: Goal[];
  nextIncomeDate: string;
  today: string;
};
```

Output:

```ts
type DashboardViewModel = {
  currentCashBalance: number;
  alreadyAllocated: number;
  freeUntilNextIncome: number;
  nextIncomeDate: string;
  daysUntilNextIncome: number;
  safeDailyPace: number;
  todayFlexibleSpent: number;
  todayRemaining: number;
  obligationSummary: {
    required: number;
    allocated: number;
    gap: number;
  };
  obligations: ObligationView[];
  primaryGoal: GoalView;
  recurringExpenses: RecurringExpenseView[];
  moneyGuardAction?: MoneyGuardAction;
  mode: 'calm' | 'caution' | 'stop';
};
```

All dashboard cards must render from this view model.

---

## 18. Visual design requirements

### Theme

Dark theme only for MVP.

### Visual mood

- Calm.
- Premium but simple.
- Not gamified like a game.
- No shame colors everywhere.
- Amber means “needs attention”, not “failure”.

### Colors

Suggested palette:

```txt
Background: #090d12
Panel: #121821
Panel 2: #171f2a
Text: #eef4f8
Muted: #8795a5
Green: #58d68d
Amber: #f6c85f
Red: #ff6b6b
Blue: #75b8ff
Violet: #b794f4
```

### Mobile-first layout

Target width:

```txt
375px–430px
```

Cards should stack vertically.

Desktop can show the phone-width dashboard centered or with side panels.

---

## 19. Acceptance criteria

### PWA

- App can be opened on iPhone Safari.
- App can be added to Home Screen.
- App shell opens offline after first load.
- Dark theme works on mobile.

### Import

- User can select Excel/CSV file.
- App parses transactions.
- App shows preview before commit.
- App skips duplicates.
- App stores import history.
- User can undo import batch.

### Dashboard

- Dashboard shows correct current cash balance.
- Dashboard shows Free Until Next Income.
- Dashboard shows Upcoming Obligations gap.
- Dashboard shows Primary Goal progress.
- Dashboard shows Safe Daily Pace.
- Dashboard shows one Money Guard action.

### Data safety

- User can export JSON backup.
- User can restore JSON backup.
- App must not send financial data to any external service in MVP.

---

## 20. Suggested project structure

```txt
src/
  app/
    App.tsx
    routes.tsx
  components/
    layout/
    cards/
      FreeMoneyHeroCard.tsx
      UpcomingObligationsCard.tsx
      PrimaryGoalCard.tsx
      SafeDailyPaceCard.tsx
      RecurringExpensesCard.tsx
      MoneyGuardCard.tsx
  domain/
    dashboard/
      calculateDashboard.ts
      types.ts
    import/
      parseWorkbook.ts
      mapRowsToTransactions.ts
      deduplicateTransactions.ts
    categorization/
      applyRules.ts
    money/
      formatMoney.ts
      dateUtils.ts
  store/
    index.ts         ← Zustand store + persist
    types.ts         ← все типы данных
    seed.ts          ← demo-данные для разработки
  pages/
    HomePage.tsx
    OperationsPage.tsx
    PlanPage.tsx
    ImportPage.tsx
    SettingsPage.tsx
  pwa/
    manifest.ts
```

---

## 21. Implementation phases

### Phase 1 — Static UI

- Convert dark HTML mock into React components.
- Use mock data.
- Implement responsive mobile layout.

### Phase 2 — Zustand store + data + backup

- Создать типизированный Zustand store (все entities).
- Подключить `persist` middleware → автосохранение в localStorage.
- Наполнить store demo-данными.
- Рендерить дашборд из Zustand store.
- **Сразу добавить JSON экспорт/импорт** — выгрузка стора в файл и восстановление. Локальные данные Safari может стереть в любой момент. Не откладывать.

### Phase 3 — Dashboard calculations

- Implement calculation service.
- Add unit tests for formulas.
- Validate obligations gap and free money.

### Phase 4 — Excel import

- Add file upload.
- Parse Excel/CSV.
- Preview rows.
- Deduplicate.
- Commit import.

### Phase 5 — Categories and review

- Add category rules.
- Add review queue.
- Allow manual category editing.

### Phase 6 — PWA

- Add manifest and service worker.
- Test Add to Home Screen on iPhone.
- Offline shell loads without network.

---

## 22. Coding agent prompt

Use this prompt to start implementation:

```txt
You are implementing Morgan Finance, a local-first iPhone PWA for personal cashflow hygiene.

Build a Vite + React + TypeScript app with a dark mobile-first dashboard.

The app must implement the home screen from this specification:
- FreeMoneyHeroCard
- UpcomingObligationsCard
- PrimaryGoalCard
- SafeDailyPaceCard
- RecurringExpensesCard
- MoneyGuardCard
- BottomNavigation

Start with mock data, but structure components so they render from a DashboardViewModel.

Use Tailwind CSS. Keep the UI close to the provided dark HTML mock.

Then add Zustand store with persist middleware for localStorage, SheetJS-based Excel/CSV import, transaction deduplication, category rules, JSON backup/export, and PWA installation support.

Do not add a backend in MVP.
Do not send financial data to external services.
Do not implement direct bank API integration.
```

---

## 23. Notes for future versions

Possible next steps after MVP:

- Wife dashboard with limited summary view.
- Cloud sync.
- T-Business official API integration if business account exists.
- AI-assisted categorization.
- Voice transaction input.
- Monthly review screen.
- Debt payoff simulator.
- Reserve days calculation.
- Weekly financial hygiene ritual.

---

## 24. Key product decision

The dashboard must not ask the user to “control every ruble”.

It must show:

```txt
What is safe?
What is already protected?
What needs attention?
What is the next small action?
```

That is the core UX of Morgan Finance MVP.
