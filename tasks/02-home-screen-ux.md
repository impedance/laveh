
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
Settings → Export backup → denezhka-backup-YYYY-MM-DD.json
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

