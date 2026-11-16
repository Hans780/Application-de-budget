"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const TABLES = ["expenses", "envelopes", "monthly_budgets", "categories", "profiles"] as const;

/**
 * Recharge les données dès qu'un changement touche le couple :
 * - via le temps réel Supabase (Postgres changes)
 * - au retour au premier plan de l'application (iOS coupe souvent la connexion)
 * - au retour du réseau
 */
export function useRealtimeRefresh(coupleId: string, onChange: () => void) {
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => cb.current(), 150);
    };

    const channel = supabase.channel(`couple-${coupleId}`);
    for (const table of TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `couple_id=eq.${coupleId}` },
        trigger,
      );
    }
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "couples", filter: `id=eq.${coupleId}` },
      trigger,
    );
    channel.subscribe();

    const onVisible = () => {
      if (document.visibilityState === "visible") trigger();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", trigger);
    window.addEventListener("focus", trigger);

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", trigger);
      window.removeEventListener("focus", trigger);
    };
  }, [coupleId]);
}
