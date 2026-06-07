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

