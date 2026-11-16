"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { ExpenseForm, type ExpenseValues } from "@/components/ExpenseForm";
import { PageTitle, Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

export default function NewExpensePage() {
  const router = useRouter();
  const { couple, userId } = useApp();
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("*")
      .eq("archived", false)
      .order("sort_order")
      .order("name")
      .then(({ data }) => setCategories((data ?? []) as Category[]));
  }, []);

  const onSubmit = async (values: ExpenseValues) => {
    const supabase = createClient();
    const { error } = await supabase.from("expenses").insert({
      ...values,
      couple_id: couple.id,
      source: "manual",
      client_id: crypto.randomUUID(),
      created_by: userId,
    });
    if (error) throw new Error(error.message);
    router.replace("/");
  };

  return (
    <div>
      <PageTitle
        right={
          <button type="button" onClick={() => router.back()} className="text-sm font-semibold text-primary">
            Annuler
          </button>
        }
      >
        Nouvelle dépense
      </PageTitle>
      {categories ? (
        <ExpenseForm categories={categories} submitLabel="Valider" onSubmit={onSubmit} />
      ) : (
        <Spinner />
      )}
    </div>
  );
}
