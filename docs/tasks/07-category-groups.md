# Work Plan: Phase 7 — Category Groups (YNAB-style envelopes)

> **Status: Draft**

## 0) Orientation
- Read: `AGENTS.md` → `docs/index.md` → existing plans `05-categories-review.md`
- Anchor context: grep for `type: 'living'|'savings'|'obligation'`, `SpendingGroupsCard`, `PlanPage`, `EditCategoryModal`
- Current state: flat `Category` with `type` enum. UI calls categories «группы». No grouping hierarchy.
- Target: `CategoryGroup → Category` two-level model. 5 groups: Обязательные, Регулярные, Отдых, Резервы, Долги.

## 1) Outcome
- Goal: Categories are organized into editable groups (like YNAB). Home screen shows groups with nested categories and their plan amounts. Plan page allows managing both groups and categories.
- Success criteria:
  - Home screen renders `SpendingGroupsCard` as grouped sections (group name → category list with plans).
  - Plan page has group CRUD (add / rename / delete) and category-creation picks a group.
  - EditCategoryModal shows categories grouped under group headers; «Новая категория» allows group selection.
  - Operations page category filter uses `<optgroup>` by group.
  - Dashboard `computeTotalRequiredAllocations` sums ALL category plans (no `type` filter).
  - Existing data migrates automatically (v3 persist migration): old `type` → default groups.
  - `make smoke && make preflight` passes.

## 2) Scope
- In scope:
  - Data model: `CategoryGroup` type, `groupId` + `sortOrder` on `Category`, remove `type`.
  - Store: `categoryGroups[]` in state, `upsertGroup`, `deleteGroup`, `reorderGroups`, `moveCategoryToGroup` actions.
  - Store: v3 migration mapping `type` → group, assigning defaults.
  - Store: `partialize` + `restoreFromJSON` include `categoryGroups`.
  - Seed: 5 default groups, 3 seed categories assigned to groups.
  - Dashboard: replace `type === 'living'` filter → sum all categories. Add `spendingGroups` to ViewModel.
  - `SpendingGroupsCard`: accepts `CategoryGroupView[]`, renders groups with nested categories.
  - `HomePage`: passes `vm.spendingGroups` to card.
  - `PlanPage`: new "Группы" section (add/rename/delete groups), category editor gets group dropdown.
  - `EditCategoryModal`: group headers, «+ Новая категория» button instead of «+ Новая группа». Title "Категория" instead of "Группа".
  - `OperationsPage`: `<optgroup>` in category filter dropdown.
  - Tests: update store test and dashboard test for new fields.
- Out of scope:
  - Drag-and-drop reordering of categories/groups (sortOrder prepared but no drag UI).
  - Actual-spending-vs-plan per category (plan amounts only, like today).
  - Color coding per group.
  - Group-specific icons or emoji.
- Assumptions / open questions:
  - Default group assignment in migration: `living`→Регулярные, `savings`→Резервы, `obligation`→Долги.
  - `deleteGroup` cascades: deletes group + all its categories + clears `categoryId` from affected transactions + removes bankMappings/rules.
  - `upsertCategory` hardcodes defaults when creating (groupId from UI, plan=0, sortOrder appended).

## 3) Change surface + safety
- Entry points:
  - Store types (`types.ts`): `CategoryGroup` added, `Category.type` removed, `groupId`+`sortOrder` added.
  - Store actions (`index.ts`): new group actions, v3 migration, updated `partialize`/`restoreFromJSON`.
  - Dashboard calc (`calculateDashboard.ts`): filter changed, new `spendingGroups` view.
  - UI components: `SpendingGroupsCard`, `PlanPage`, `EditCategoryModal`, `OperationsPage`, `HomePage`.
- Files/modules:
  - `src/store/types.ts` — types
  - `src/store/index.ts` — store + migration
  - `src/store/seed.ts` — seed data
  - `src/domain/dashboard/calculateDashboard.ts` — calculation
  - `src/domain/dashboard/types.ts` — view types
  - `src/components/cards/SpendingGroupsCard.tsx` — card UI
  - `src/pages/HomePage.tsx` — wiring
  - `src/pages/PlanPage.tsx` — group + category editor
  - `src/pages/OperationsPage.tsx` — filter dropdown
  - `src/components/operations/EditCategoryModal.tsx` — category picker
  - `src/store/__tests__/store.test.ts` — store tests
  - `src/domain/dashboard/__tests__/calculateDashboard.test.ts` — dashboard tests
- Invariants/contracts to preserve:
  - Transaction → Category link (`categoryId`) unchanged.
  - `commitImport` auto-categorization pipeline unchanged.
  - `learnBankMapping` unchanged (works with categoryId).
  - `deleteCategory` cascade: clears transactions, removes bankMappings, renumbers rules.
  - `restoreFromJSON` must tolerate missing `categoryGroups` in old JSON.
- Main risks + mitigation:
  - **Risk**: User has custom categories with `type: 'living'|'savings'|'obligation'` and migration maps them to wrong group.
    - **Mitigation**: Migration is one-time. After migration, user can reassign categories to any group via Plan page.
  - **Risk**: `restoreFromJSON` from pre-v3 backup crashes on missing `categoryGroups`.
    - **Mitigation**: `restoreFromJSON` uses `?? seedData.categoryGroups` as default.
  - **Risk**: Tests reference `type` field — will fail until updated.
    - **Mitigation**: Update tests in the same commit.

## 4) Implementation steps

### 4.1 Types (`src/store/types.ts`)
- Add `CategoryGroup` interface: `{ id, name, sortOrder }`.
- Replace `Category.type` with `groupId: string` and `sortOrder: number`.
- Add `categoryGroups: CategoryGroup[]` to `StoreState`.
- Add to `StoreActions`:
  ```ts
  upsertGroup: (group: Omit<CategoryGroup, 'id'> & { id?: string }) => void;
  deleteGroup: (id: string) => void;
  reorderGroups: (ids: string[]) => void;
  moveCategoryToGroup: (categoryId: string, groupId: string) => void;
  ```

### 4.2 Seed data (`src/store/seed.ts`)
- Add `categoryGroups` array with 5 groups:
  | id | name | sortOrder |
  |---|---|---|
  | `group-obligatory` | Обязательные | 0 |
  | `group-regular` | Регулярные | 1 |
  | `group-fun` | Отдых | 2 |
  | `group-reserves` | Резервы | 3 |
  | `group-debts` | Долги | 4 |
- Update seed categories: `type` → `groupId` + `sortOrder`.
  - Продукты → `group-obligatory`, sortOrder 0
  - Подписки → `group-regular`, sortOrder 0
  - Транспорт → `group-regular`, sortOrder 1

### 4.3 Store + migration (`src/store/index.ts`)
- Bump `version: 3` in persist config.
- Add v3 migration in `migrate`: if `version < 3`:
  1. Create default `categoryGroups` (same 5 as seed).
  2. Map each category's old `type` → `groupId`: `living`→`group-regular`, `savings`→`group-reserves`, `obligation`→`group-debts`.
  3. Add `sortOrder: index` to each category.
  4. Delete `type` from each category.
- Add state default: `categoryGroups: seedData.categoryGroups`.
- Add `upsertGroup` action (create or update).
- Add `deleteGroup` action: cascade delete group + its categories + clear affected transactions + remove bankMappings/rules (same pattern as `deleteCategory` but iterate all categories in the group).
- Add `reorderGroups` action: set `sortOrder` from `ids` array order.
- Add `moveCategoryToGroup` action: update single category's `groupId`.
- Update `upsertCategory`: replace `type` with `groupId` in the Omit type. When creating, `sortOrder` = max sortOrder in that group + 1.
- Update `partialize`: add `categoryGroups`.
- Update `restoreFromJSON`: add `categoryGroups: parsed.categoryGroups ?? seedData.categoryGroups`.

### 4.4 Dashboard view types (`src/domain/dashboard/types.ts`)
- Add `CategoryView`: `{ id, name, plan }`.
- Add `CategoryGroupView`: `{ id, name, categories: CategoryView[], totalPlan: number }`.
- Add `spendingGroups: CategoryGroupView[]` to `DashboardViewModel`.

### 4.5 Dashboard calculation (`src/domain/dashboard/calculateDashboard.ts`)
- In `computeTotalRequiredAllocations`: replace `categories.filter(c => c.type === 'living')` with `categories.reduce((sum, c) => sum + c.plan, 0)`.
- Add `computeSpendingGroupsView(categories, categoryGroups)` function:
  - For each group (sorted by sortOrder), collect its categories (sorted by sortOrder).
  - Compute `totalPlan = sum(cat.plan)`.
  - Return `CategoryGroupView[]`.
- Add `spendingGroups` to return value of `calculateDashboard`.
- Accept `categoryGroups: CategoryGroup[]` in `DashboardInput`.

### 4.6 Dashboard input (`src/domain/dashboard/types.ts`)
- Add `categoryGroups: CategoryGroup[]` to `DashboardInput`.

### 4.7 SpendingGroupsCard (`src/components/cards/SpendingGroupsCard.tsx`)
- Props: `groups: CategoryGroupView[]` (replace `categories: Category[]`).
- Render: each group → section header with group name and totalPlan, then category rows with name + plan.
- Only render groups that have at least 1 category.

### 4.8 HomePage (`src/pages/HomePage.tsx`)
- Add `store.categoryGroups` to `DashboardInput`.
- Pass `vm.spendingGroups` to `<SpendingGroupsCard groups={vm.spendingGroups} />`.

### 4.9 PlanPage (`src/pages/PlanPage.tsx`)
- Add new "Группы" section at top (before Доход):
  - List all groups with name + category count.
  - Edit button → inline rename input.
  - Delete button → confirm: "Удалить группу «X» и все её категории?"
  - "Добавить группу" button at bottom.
- Update "Категории" section:
  - Each category row shows its group name (badge).
  - When editing a category: add group dropdown (`<select>`).
  - When creating a category: add group dropdown, defaults to first group.
  - Remove `type: 'living'` hardcode from `handleAddCategory`.
- Remove unused `reserveAmount` state and section (already dead code).

### 4.10 EditCategoryModal (`src/components/operations/EditCategoryModal.tsx`)
- Title: "Категория" (was "Группа").
- Category list: group by `groupId`, show group name as header, categories indented below.
- Button: "+ Новая категория" (was "+ Новая группа").
- When creating new category: show group `<select>` dropdown, default to first group.
- Checkbox label: "Всегда назначать эту категорию для таких операций".

### 4.11 OperationsPage (`src/pages/OperationsPage.tsx`)
- Category filter `<select>`: use `<optgroup label="Group Name">` for each group, categories inside.
- Need `categoryGroups` from store for the optgroup structure.

### 4.12 Tests
- `store.test.ts`:
  - Update `updateCategory` test: category has `groupId` not `type`.
  - Add: `upsertGroup` creates/updates a group.
  - Add: `deleteGroup` cascades (group + its categories + txns cleared).
  - Add: `moveCategoryToGroup` changes groupId.
- `calculateDashboard.test.ts`:
  - Update all category fixtures: `{ id, name, plan, groupId, sortOrder }`.
  - Add `categoryGroups` to `DashboardInput`.
  - Add test: `spendingGroups` has correct grouping and totalPlan.

## 5) Validation
- Fast gate:
  - `make smoke` → pass (lint + test).
  - `make preflight` → pass (lint + typecheck + test).
- Task-specific checks:
  - `npx vitest run src/store/` → all store tests pass.
  - `npx vitest run src/domain/dashboard/` → all dashboard tests pass.
  - Manual: open app, verify Home shows 5 groups. Verify Plan page can add/rename/delete groups. Verify EditCategoryModal shows group headers.
- Rollback:
  - Revert commit.
  - Clear localStorage (`denezhka-store` key) and reload — app starts with seed data.
  - `git checkout` all changed files.

## 6) DOD
- [ ] 5 groups appear on Home screen with categories inside.
- [ ] Plan page: group CRUD working (add, rename, delete with cascade).
- [ ] Plan page: category creation/editing includes group selector.
- [ ] EditCategoryModal: shows categories grouped under group headers, "Новая категория" works.
- [ ] Operations filter: categories in optgroups.
- [ ] Dashboard calculation uses ALL category plans (no type filter).
- [ ] v3 migration works: old data loads with groups.
- [ ] `restoreFromJSON` handles missing `categoryGroups`.
- [ ] All tests pass (`make preflight`).
- [ ] No `type: 'living'|'savings'|'obligation'` remains in production code.

## 7) Final verdict

Ready for implementation: yes
