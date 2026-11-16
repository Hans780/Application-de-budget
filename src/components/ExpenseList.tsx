"use client";

import Link from "next/link";
import { dayLabel, formatEuro, initials, timeLabel } from "@/lib/format";
import type { Category, Expense } from "@/lib/types";
import { useApp } from "./AppProvider";

export function ExpenseList({
  expenses,
  categories,
  emptyText = "Aucune dépense pour le moment.",
}: {
  expenses: Expense[];
  categories: Category[];
  emptyText?: string;
}) {
  const { members } = useApp();
  const catById = new Map(categories.map((c) => [c.id, c]));
  const memberById = new Map(members.map((m) => [m.id, m]));

  if (expenses.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{emptyText}</p>;
  }

  const groups: { day: string; items: Expense[] }[] = [];
  for (const e of expenses) {
    const day = dayLabel(e.occurred_at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(e);
    else groups.push({ day, items: [e] });
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.day}>
          <div className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {g.day}
          </div>
          <div className="overflow-hidden rounded-3xl bg-surface ring-1 ring-border">
            {g.items.map((e) => {
              const cat = e.category_id ? catById.get(e.category_id) : undefined;
              const payer = memberById.get(e.paid_by);
              const credit = e.kind !== "expense";
              return (
                <Link
                  key={e.id}
                  href={`/depenses/${e.id}`}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 active:bg-surface-2"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xl"
                    style={{ background: `${cat?.color ?? "#64748b"}22` }}
                  >
                    {cat?.emoji ?? "🏷️"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {e.merchant || cat?.name || "Sans catégorie"}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {timeLabel(e.occurred_at)}
                      {e.merchant && cat ? ` · ${cat.name}` : ""}
                      {e.scope === "personal" ? " · Perso" : ""}
                      {e.source === "webhook" ? " ·  Pay" : ""}
                      {e.kind === "refund" ? " · Remboursement" : ""}
                      {e.kind === "income" ? " · Rentrée" : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className={`font-semibold ${credit ? "text-success" : ""} ${
                        e.scope === "personal" ? "text-muted" : ""
                      }`}
                    >
                      {credit ? "+" : "−"}
                      {formatEuro(e.amount)}
                    </span>
                    <span
                      title={payer?.display_name}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-[11px] font-bold text-muted"
                    >
                      {initials(payer?.display_name ?? "?")}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
