"use client";

import Link from "next/link";
import { useState } from "react";
import { ExpenseList } from "@/components/ExpenseList";
import { MonthNav } from "@/components/MonthNav";
import { Notice, Segmented, Spinner } from "@/components/ui";
import { useMonthData } from "@/hooks/useMonthData";
import { formatEuro, monthKey } from "@/lib/format";

type Filter = "all" | "shared" | "personal";

export default function ExpensesPage() {
  const [month, setMonth] = useState(monthKey());
  const [filter, setFilter] = useState<Filter>("all");
  const { expenses, categories, loading, error } = useMonthData(month);

  const list = expenses.filter((e) => filter === "all" || e.scope === filter);
  const total = list.reduce((s, e) => s + (e.kind === "expense" ? e.amount : -e.amount), 0);

  return (
    <div>
      <MonthNav month={month} onChange={setMonth} />
      <div className="mb-3">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Toutes" },
            { value: "shared", label: "Communes" },
            { value: "personal", label: "Perso" },
          ]}
        />
      </div>
      <div className="mb-3 flex items-center justify-between px-1 text-sm text-muted">
        <span>
          {list.length} opération{list.length > 1 ? "s" : ""}
        </span>
        <span>
          Total <span className="font-semibold text-foreground">{formatEuro(total)}</span>
        </span>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {loading && expenses.length === 0 ? (
        <Spinner />
      ) : (
        <ExpenseList expenses={list} categories={categories} />
      )}
      <Link
        href="/depenses/nouvelle"
        aria-label="Ajouter une dépense"
        className="fixed bottom-24 right-5 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-4xl font-light text-primary-foreground shadow-lg active:scale-95"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        +
      </Link>
    </div>
  );
}
