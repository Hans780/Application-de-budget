"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Button, Card, Field, Input, Notice, PageTitle, Spinner } from "@/components/ui";
import { formatEuro, parseAmountInput } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

const COLORS = ["#16a34a", "#ea580c", "#2563eb", "#9333ea", "#dc2626", "#db2777", "#0891b2", "#475569", "#64748b", "#ca8a04"];

interface Draft {
  id: string | null;
  name: string;
  emoji: string;
  color: string;
  default_envelope: string;
  carry_over: boolean;
}

const emptyDraft = (): Draft => ({
  id: null,
  name: "",
  emoji: "🏷️",
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
  default_envelope: "",
  carry_over: false,
});

export default function CategoriesPage() {
  const { couple } = useApp();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    const supabase = createClient();
    return supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .order("name")
      .then(({ data }) => setCategories((data ?? []) as Category[]));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const edit = (c: Category) =>
    setDraft({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      color: c.color,
      default_envelope: c.default_envelope ? String(c.default_envelope).replace(".", ",") : "",
      carry_over: c.carry_over,
    });

  const save = async () => {
    if (!draft || !draft.name.trim()) return;
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const payload = {
      name: draft.name.trim(),
      emoji: draft.emoji.trim() || "🏷️",
      color: draft.color,
      default_envelope: parseAmountInput(draft.default_envelope),
      carry_over: draft.carry_over,
    };
    const res = draft.id
      ? await supabase.from("categories").update(payload).eq("id", draft.id)
      : await supabase.from("categories").insert({
          ...payload,
          couple_id: couple.id,
          sort_order: ((categories?.length ?? 0) + 1) * 10,
        });
    setBusy(false);
    if (res.error) return setMsg({ tone: "error", text: res.error.message });
    setDraft(null);
    await load();
  };

  const setArchived = async (c: Category, archived: boolean) => {
    const supabase = createClient();
    const { error } = await supabase.from("categories").update({ archived }).eq("id", c.id);
    if (error) return setMsg({ tone: "error", text: error.message });
    setDraft(null);
    await load();
  };

  const move = async (c: Category, dir: -1 | 1) => {
    if (!categories) return;
    const active = categories.filter((x) => !x.archived);
    const i = active.findIndex((x) => x.id === c.id);
    const j = i + dir;
    if (j < 0 || j >= active.length) return;
    const supabase = createClient();
    const a = active[i]!;
    const b = active[j]!;
    await Promise.all([
      supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    await load();
  };

  const visible = categories?.filter((c) => showArchived || !c.archived) ?? [];

  return (
    <div className="space-y-4">
      <PageTitle
        right={
          <Link href="/reglages" className="text-sm font-semibold text-primary">
            Retour
          </Link>
        }
      >
        Catégories
      </PageTitle>
      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}

      {draft ? (
        <Card className="space-y-3">
          <div className="font-semibold">{draft.id ? "Modifier la catégorie" : "Nouvelle catégorie"}</div>
          <div className="flex gap-2">
            <Field label="Emoji">
              <Input
                value={draft.emoji}
                onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
                className="w-20 text-center text-2xl"
              />
            </Field>
            <div className="flex-1">
              <Field label="Nom">
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoCapitalize="words" />
              </Field>
            </div>
          </div>
          <Field label="Enveloppe par défaut chaque mois">
            <Input
              inputMode="decimal"
              value={draft.default_envelope}
              onChange={(e) => setDraft({ ...draft, default_envelope: e.target.value })}
              placeholder="0"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((col) => (
              <button
                key={col}
                type="button"
                aria-label={`Couleur ${col}`}
                onClick={() => setDraft({ ...draft, color: col })}
                className={`h-8 w-8 rounded-full ${draft.color === col ? "ring-2 ring-foreground ring-offset-2 ring-offset-surface" : ""}`}
                style={{ background: col }}
              />
            ))}
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={draft.carry_over}
              onChange={(e) => setDraft({ ...draft, carry_over: e.target.checked })}
              className="h-5 w-5 accent-[var(--primary)]"
            />
            Reporter le reste non dépensé sur le mois suivant
          </label>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDraft(null)}>
              Annuler
            </Button>
            <Button className="flex-1" disabled={busy || !draft.name.trim()} onClick={save}>
              Enregistrer
            </Button>
          </div>
          {draft.id ? (
            <Button
              variant="danger"
              className="w-full"
              onClick={() => {
                const c = categories?.find((x) => x.id === draft.id);
                if (c) void setArchived(c, !c.archived);
              }}
            >
              {categories?.find((x) => x.id === draft.id)?.archived ? "Réactiver" : "Archiver (masquer)"}
            </Button>
          ) : null}
        </Card>
      ) : (
        <Button className="w-full" onClick={() => setDraft(emptyDraft())}>
          + Ajouter une catégorie
        </Button>
      )}

      {!categories ? (
        <Spinner />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-surface ring-1 ring-border">
          {visible.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 ${c.archived ? "opacity-50" : ""}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl text-xl" style={{ background: `${c.color}22` }}>
                {c.emoji}
              </span>
              <button type="button" onClick={() => edit(c)} className="min-w-0 flex-1 text-left">
                <span className="block truncate font-medium">
                  {c.name}
                  {c.is_fixed_charges ? <span className="ml-2 text-xs text-muted">charges fixes</span> : null}
                </span>
                <span className="block text-xs text-muted">
                  {c.default_envelope > 0 ? `${formatEuro(c.default_envelope, { round: true })} / mois` : "Sans enveloppe"}
                  {c.carry_over ? " · report" : ""}
                  {c.archived ? " · archivée" : ""}
                </span>
              </button>
              {!c.archived ? (
                <span className="flex flex-col">
                  <button type="button" aria-label="Monter" onClick={() => move(c, -1)} className="px-2 text-muted">
                    ▲
                  </button>
                  <button type="button" aria-label="Descendre" onClick={() => move(c, 1)} className="px-2 text-muted">
                    ▼
                  </button>
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {categories?.some((c) => c.archived) ? (
        <button type="button" onClick={() => setShowArchived((s) => !s)} className="w-full text-sm font-semibold text-primary">
          {showArchived ? "Masquer les catégories archivées" : "Afficher les catégories archivées"}
        </button>
      ) : null}
    </div>
  );
}
