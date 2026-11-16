"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { MonthNav } from "@/components/MonthNav";
import { Button, Card, Field, Input, Notice, Spinner } from "@/components/ui";
import { formatEuro, monthKey, parseAmountInput } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { Category, Envelope, MonthlyBudget } from "@/lib/types";

function fmtInput(n: number): string {
  return n === 0 ? "" : String(n).replace(".", ",");
}

export default function BudgetPage() {
  const router = useRouter();
  const { couple } = useApp();
  const [month, setMonth] = useState(monthKey());
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState("");
  const [envs, setEnvs] = useState<Record<string, string>>({});
  const [applyDefault, setApplyDefault] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const load = useCallback(() => {
    const supabase = createClient();
    return supabase
      .rpc("ensure_month", { p_month: month })
      .then(async ({ data: budgetId, error }) => {
        if (error) throw error;
        const [b, e, c] = await Promise.all([
          supabase.from("monthly_budgets").select("*").eq("id", budgetId).single(),
          supabase.from("envelopes").select("*").eq("monthly_budget_id", budgetId),
          supabase.from("categories").select("*").eq("archived", false).order("sort_order").order("name"),
        ]);
        if (b.error) throw b.error;
        return { mb: b.data as MonthlyBudget, envelopes: (e.data ?? []) as Envelope[], cats: (c.data ?? []) as Category[] };
      })
      .then(
        ({ mb, envelopes, cats }) => {
          setBudget(mb);
          setTotal(fmtInput(Number(mb.total_amount)));
          const map: Record<string, string> = {};
          for (const env of envelopes) map[env.category_id] = fmtInput(Number(env.amount));
          setEnvs(map);
          setCategories(cats);
        },
        (e: unknown) => setMsg({ tone: "error", text: e instanceof Error ? e.message : "Erreur de chargement" }),
      );
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalValue = parseAmountInput(total);
  const sumEnvelopes = categories.reduce((s, c) => s + parseAmountInput(envs[c.id] ?? ""), 0);

  const save = async () => {
    if (!budget) return;
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    try {
      const { error: e1 } = await supabase
        .from("monthly_budgets")
        .update({ total_amount: totalValue })
        .eq("id", budget.id);
      if (e1) throw e1;

      const rows = categories.map((c) => ({
        couple_id: couple.id,
        monthly_budget_id: budget.id,
        category_id: c.id,
        amount: parseAmountInput(envs[c.id] ?? ""),
      }));
      const { error: e2 } = await supabase
        .from("envelopes")
        .upsert(rows, { onConflict: "monthly_budget_id,category_id" });
      if (e2) throw e2;

      if (applyDefault) {
        const { error: e3 } = await supabase
          .from("couples")
          .update({ default_total_budget: totalValue })
          .eq("id", couple.id);
        if (e3) throw e3;
        for (const c of categories) {
          const amount = parseAmountInput(envs[c.id] ?? "");
          if (amount !== Number(c.default_envelope)) {
            const { error: e4 } = await supabase
              .from("categories")
              .update({ default_envelope: amount })
              .eq("id", c.id);
            if (e4) throw e4;
          }
        }
      }
      setMsg({ tone: "success", text: "Budget enregistré." });
      router.refresh();
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof Error ? e.message : "Échec de l'enregistrement" });
    } finally {
      setBusy(false);
    }
  };

  const ready = budget !== null && budget.month === month;

  return (
    <div className="pb-20">
      <MonthNav month={month} onChange={setMonth} />
      {!ready ? (
        <Spinner />
      ) : (
        <div className="space-y-4">
          <Card key={budget.id}>
            <Field label="Budget global du mois" hint="Montant total que vous voulez dépenser à deux ce mois-ci.">
              <div className="relative">
                <Input
                  inputMode="decimal"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="1500"
                  className="pr-10 text-2xl font-bold"
                />
                <span className="absolute right-4 top-3 text-xl text-muted">€</span>
              </div>
            </Field>
          </Card>

          <Card>
            <div className="mb-3 font-semibold">Enveloppes par catégorie</div>
            <div className="space-y-3">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="w-8 text-center text-xl">{c.emoji}</span>
                  <span className="flex-1 text-sm font-medium">{c.name}</span>
                  <div className="relative w-32">
                    <Input
                      inputMode="decimal"
                      value={envs[c.id] ?? ""}
                      onChange={(e) => setEnvs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder="0"
                      className="pr-8 text-right"
                    />
                    <span className="absolute right-3 top-3 text-muted">€</span>
                  </div>
                </div>
              ))}
            </div>
            <div
              className={`mt-4 flex justify-between rounded-2xl px-3 py-2 text-sm ${
                totalValue > 0 && sumEnvelopes > totalValue ? "bg-danger/10 text-danger" : "bg-surface-2 text-muted"
              }`}
            >
              <span>Somme des enveloppes</span>
              <span className="font-semibold">
                {formatEuro(sumEnvelopes)}
                {totalValue > 0 ? ` / ${formatEuro(totalValue)}` : ""}
              </span>
            </div>
            {totalValue > 0 && sumEnvelopes > totalValue ? (
              <p className="mt-2 text-xs text-danger">
                Les enveloppes dépassent le budget global. Ce n&apos;est pas bloquant, mais le reste global passera en négatif avant les enveloppes.
              </p>
            ) : null}
          </Card>

          <label className="flex items-center gap-3 px-1 text-sm">
            <input
              type="checkbox"
              checked={applyDefault}
              onChange={(e) => setApplyDefault(e.target.checked)}
              className="h-5 w-5 accent-[var(--primary)]"
            />
            Utiliser ces montants pour les prochains mois
          </label>

          {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}

          <Button className="w-full" disabled={busy} onClick={save}>
            {busy ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      )}
    </div>
  );
}
