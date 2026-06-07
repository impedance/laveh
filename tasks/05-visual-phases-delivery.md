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
