#!/usr/bin/env tsx
// AICODE-NOTE: DB_CLI  Reads data/state.json synced via Vite plugin + Zustand subscribe.
// Usage: npx tsx tools/db.ts <command> [args]
//   summary       — accounts, transactions, groups counts
//   find <text>   — transactions where description / bankCategory / amount match
//   txn <id>      — full transaction detail
//   groups        — list groups (categories) with txn count
//   mappings      — list bankMappings
//   rules         — list categorization rules
//   raw           — dump full state
//   dump <field>  — raw value of a top-level field

import { readFileSync } from 'fs';
import { resolve } from 'path';

const STATE_PATH = resolve(import.meta.dirname!, '../data/state.json');

function loadState(): Record<string, any> {
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  } catch {
    console.error('Cannot read data/state.json. Make sure the dev server is running and has synced at least once.');
    process.exit(1);
  }
}

function S(v: unknown): string {
  return v == null ? '—' : String(v);
}

/* ─── Commands ────────────────────────────────────────────── */

function cmdSummary(state: Record<string, any>) {
  const txns = state.transactions ?? [];
  const cats = state.categories ?? [];
  const bm = state.bankMappings ?? [];

  const grouped = txns.filter((t: any) => t.categoryId).length;
  const noGroup = txns.filter((t: any) => !t.categoryId).length;
  const unreviewed = txns.filter((t: any) => !t.isReviewed).length;

  console.log(`Accounts:       ${state.accounts?.length ?? 0}`);
  console.log(`Transactions:   ${txns.length}  (grouped:${grouped}  ?:${noGroup}  unreviewed:${unreviewed})`);
  console.log(`Groups:         ${cats.length}`);
  console.log(`BankMappings:   ${bm.length}`);
  console.log(`Rules:          ${state.rules?.length ?? 0}`);
  console.log(`ImportBatches:  ${state.importBatches?.length ?? 0}`);
  console.log();

  if (bm.length > 0) {
    console.log('── BankMappings ──');
    for (const m of bm) {
      const cn = cats.find((c: any) => c.id === m.categoryId)?.name ?? '?';
      console.log(`  ${m.bankCategory}  →  ${cn}  (hits:${m.hitCount})`);
    }
    console.log();
  }
}

function cmdFind(state: Record<string, any>, query: string) {
  const txns = state.transactions ?? [];
  const q = query.toLowerCase();
  const found = txns.filter((t: any) =>
    t.description?.toLowerCase()?.includes(q) ||
    t.bankCategory?.toLowerCase()?.includes(q) ||
    String(t.amount).includes(q)
  );
  if (found.length === 0) { console.log('No matches.'); return; }
  console.log(`Found ${found.length} transaction(s):\n`);
  for (const t of found) {
    const cat = (state.categories ?? []).find((c: any) => c.id === t.categoryId);
    console.log(`  id:          ${t.id}`);
    console.log(`  date:        ${t.date}`);
    console.log(`  description: ${t.description}`);
    console.log(`  amount:      ${t.amount}`);
    console.log(`  bankCat:     ${S(t.bankCategory)}`);
    console.log(`  group:       ${cat ? cat.name : '?'}`);
    console.log(`  categoryId:  ${S(t.categoryId)}`);
    console.log(`  reviewed:    ${t.isReviewed ? 'yes' : 'no'}`);
    console.log(`  mcc:         ${S(t.mcc)}`);
    console.log(`  cashback:    ${S(t.cashback)}`);
    console.log(`  cardNumber:  ${S(t.cardNumber)}`);
    console.log();
  }
}

function cmdTxn(state: Record<string, any>, id: string) {
  const txn = (state.transactions ?? []).find((t: any) => t.id === id);
  if (!txn) { console.log('Transaction not found.'); return; }
  console.log(JSON.stringify(txn, null, 2));
}

function cmdGroups(state: Record<string, any>) {
  const cats = state.categories ?? [];
  const txns = state.transactions ?? [];
  for (const c of cats) {
    const count = txns.filter((t: any) => t.categoryId === c.id).length;
    console.log(`${c.name}  (id:${c.id})  plan:${c.plan}  type:${c.type}  group:${S(c.group)}  txns:${count}`);
  }
}

function cmdMappings(state: Record<string, any>) {
  const m = state.bankMappings ?? [];
  const cats = state.categories ?? [];
  if (m.length === 0) { console.log('No bankMappings.'); return; }
  for (const bm of m) {
    const cn = cats.find((c: any) => c.id === bm.categoryId)?.name ?? '?';
    console.log(`${bm.bankCategory}  →  ${cn}  hitCount:${bm.hitCount}`);
  }
}

function cmdRules(state: Record<string, any>) {
  const rules = state.rules ?? [];
  const cats = state.categories ?? [];
  if (rules.length === 0) { console.log('No rules.'); return; }
  for (const r of rules) {
    const cn = cats.find((c: any) => c.id === r.categoryId)?.name ?? '?';
    const active = r.active !== false;
    console.log(`"${r.pattern}"  →  ${cn}  [${r.matchType}]  prio:${r.priority}  ${active ? '' : '(disabled)'}`);
  }
}

function cmdDump(state: Record<string, any>, field: string) {
  if (field in state) {
    console.log(JSON.stringify(state[field], null, 2));
  } else {
    console.log(`Field "${field}" not found. Available: ${Object.keys(state).join(', ')}`);
  }
}

function cmdRaw(state: Record<string, any>) {
  console.log(JSON.stringify(state, null, 2));
}

/* ─── Main ────────────────────────────────────────────────── */

const cmds: Record<string, (s: any, ...a: string[]) => void> = {
  summary: cmdSummary,
  find: cmdFind,
  txn: cmdTxn,
  groups: cmdGroups,
  mappings: cmdMappings,
  rules: cmdRules,
  dump: cmdDump,
  raw: cmdRaw,
};

const cmd = process.argv[2] ?? 'summary';
const args = process.argv.slice(3);

const state = loadState();
if (cmd in cmds) {
  cmds[cmd](state, ...args);
} else {
  console.log(`Unknown command "${cmd}". Available: ${Object.keys(cmds).join(', ')}`);
  process.exit(1);
}
