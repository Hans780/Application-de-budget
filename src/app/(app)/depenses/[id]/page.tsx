"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ExpenseForm, type ExpenseValues } from "@/components/ExpenseForm";
import { Notice, PageTitle, Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Category, Expense } from "@/lib/types";

export default function EditExpensePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("expenses").select("*").eq("id", id).maybeSingle(),
      supabase.from("categories").select("*").order("sort_order").order("name"),
    ]).then(([ex, cats]) => {
      if (ex.error || !ex.data) {
        setError("Dépense introuvable.");
        return;
      }
      setExpense(ex.data as Expense);
      setCategories((cats.data ?? []) as Category[]);
    });
  }, [id]);

  const onSubmit = async (values: ExpenseValues) => {
    const supabase = createClient();
    const { error } = await supabase.from("expenses").update(values).eq("id", id);
    if (error) throw new Error(error.message);
    router.back();
  };

  const onDelete = async () => {
    const supabase = createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw new Error(error.message);
    router.replace("/depenses");
  };

  return (
    <div>
      <PageTitle
        right={
          <button type="button" onClick={() => router.back()} className="text-sm font-semibold text-primary">
            Retour
          </button>
        }
      >
        Modifier
      </PageTitle>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {expense ? (
        <>
          {expense.source === "webhook" ? (
            <div className="mb-3">
              <Notice>
                Dépense reçue automatiquement d&apos;Apple Pay
                {expense.card_name ? ` (${expense.card_name})` : ""}. Vous pouvez la corriger ou la supprimer.
              </Notice>
            </div>
          ) : null}
          <ExpenseForm
            categories={categories}
            initial={expense}
            submitLabel="Enregistrer"
            onSubmit={onSubmit}
            onDelete={onDelete}
          />
        </>
      ) : error ? null : (
        <Spinner />
      )}
    </div>
  );
}
