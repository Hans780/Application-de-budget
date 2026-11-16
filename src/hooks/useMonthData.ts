"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { monthKey, monthRange } from "@/lib/format";
import type { Category, Expense, MonthOverview } from "@/lib/types";
import { useApp } from "@/components/AppProvider";
import { useRealtimeRefresh } from "./useRealtimeRefresh";

interface MonthPayload {
  overview: MonthOverview;
  expenses: Expense[];
  categories: Category[];
}

interface MonthData {
  overview: MonthOverview | null;
  expenses: Expense[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

async function fetchMonth(month: string): Promise<MonthPayload> {
  const supabase = createClient();
  const { start, end } = monthRange(month);
  // On ne crée le budget que pour le mois courant et les suivants : l'historique reste tel quel.
  if (month >= monthKey()) {
    const ensured = await supabase.rpc("ensure_month", { p_month: month });
    if (ensured.error) throw ensured.error;
  }
  const [ov, ex, cats] = await Promise.all([
    supabase.rpc("month_overview", { p_month: month }),
    supabase
      .from("expenses")
      .select("*")
      .gte("occurred_at", start)
      .lt("occurred_at", end)
      .order("occurred_at", { ascending: false }),
    supabase.from("categories").select("*").order("sort_order").order("name"),
  ]);
  if (ov.error) throw ov.error;
  if (ex.error) throw ex.error;
  if (cats.error) throw cats.error;
  return {
    overview: ov.data as MonthOverview,
    expenses: (ex.data ?? []) as Expense[],
    categories: (cats.data ?? []) as Category[],
  };
}

export function useMonthData(month: string): MonthData {
  const { couple } = useApp();
  const [payload, setPayload] = useState<MonthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      fetchMonth(month).then(
        (data) => {
          setPayload(data);
          setError(null);
        },
        (e: unknown) => setError(e instanceof Error ? e.message : "Erreur de chargement"),
      ),
    [month],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  useRealtimeRefresh(couple.id, () => void reload());

  const current = payload && payload.overview.month === month ? payload : null;

  return {
    overview: current?.overview ?? null,
    expenses: current?.expenses ?? [],
    categories: payload?.categories ?? [],
    loading: current === null,
    error,
    reload,
  };
}
