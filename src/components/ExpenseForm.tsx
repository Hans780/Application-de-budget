"use client";

import { useState } from "react";
import { formatEuro, fromLocalInput, parseAmountInput, toLocalInput } from "@/lib/format";
import type { Category, Expense, ExpenseKind, ExpenseScope } from "@/lib/types";
import { AmountKeypad } from "./AmountKeypad";
import { CategoryPicker } from "./CategoryPicker";
import { useApp } from "./AppProvider";
import { Button, Field, Input, Notice, Segmented } from "./ui";

export interface ExpenseValues {
  amount: number;
  category_id: string | null;
  paid_by: string;
  scope: ExpenseScope;
  kind: ExpenseKind;
  merchant: string | null;
  note: string | null;
  occurred_at: string;
}

function amountToString(n: number): string {
  return n.toFixed(2).replace(".", ",").replace(/,00$/, "");
}

export function ExpenseForm({
  categories,
  initial,
  submitLabel,
  onSubmit,
  onDelete,
}: {
  categories: Category[];
  initial?: Expense;
  submitLabel: string;
  onSubmit: (values: ExpenseValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const { userId, members } = useApp();
  const [amount, setAmount] = useState(initial ? amountToString(initial.amount) : "");
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category_id ?? null);
  const [paidBy, setPaidBy] = useState(initial?.paid_by ?? userId);
  const [scope, setScope] = useState<ExpenseScope>(initial?.scope ?? "shared");
  const [kind, setKind] = useState<ExpenseKind>(initial?.kind ?? "expense");
  const [merchant, setMerchant] = useState(initial?.merchant ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [occurredAt, setOccurredAt] = useState(
    toLocalInput(initial?.occurred_at ?? new Date().toISOString()),
  );
  const [showMore, setShowMore] = useState(Boolean(initial && (initial.note || initial.scope === "personal" || initial.kind !== "expense")));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const value = parseAmountInput(amount);
  const canSubmit = value > 0 && (categoryId !== null || kind === "income") && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        amount: value,
        category_id: categoryId,
        paid_by: paidBy,
        scope,
        kind,
        merchant: merchant.trim() || null,
        note: note.trim() || null,
        occurred_at: fromLocalInput(occurredAt),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'enregistrement");
      setBusy(false);
    }
  };

  const kindLabel = kind === "expense" ? "Dépense" : kind === "refund" ? "Remboursement" : "Rentrée d'argent";

  return (
    <div className="space-y-4 pb-24">
      <div className="rounded-3xl bg-surface p-4 text-center ring-1 ring-border">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
          {kindLabel}
          {scope === "personal" ? " · personnelle" : ""}
        </div>
        <div className={`mt-1 text-5xl font-bold tabular-nums ${value === 0 ? "text-muted" : ""}`}>
          {amount === "" ? "0" : amount} €
        </div>
      </div>

      <AmountKeypad value={amount} onChange={setAmount} />

      <div>
        <div className="mb-2 text-sm font-medium text-muted">Catégorie</div>
        <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
      </div>

      <button
        type="button"
        onClick={() => setShowMore((s) => !s)}
        className="w-full py-1 text-sm font-semibold text-primary"
      >
        {showMore ? "Masquer les options" : "Plus d'options (qui a payé, perso, marchand, date…)"}
      </button>

      {showMore ? (
        <div className="space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-border">
          <Field label="Qui a payé ?">
            <Segmented
              value={paidBy}
              onChange={setPaidBy}
              options={members.map((m) => ({ value: m.id, label: m.display_name }))}
            />
          </Field>
          <Field label="Dépense commune ou personnelle ?" hint="Une dépense personnelle ne touche pas au budget du couple.">
            <Segmented
              value={scope}
              onChange={setScope}
              options={[
                { value: "shared", label: "Commune" },
                { value: "personal", label: "Personnelle" },
              ]}
            />
          </Field>
          <Field label="Type">
            <Segmented
              value={kind}
              onChange={setKind}
              options={[
                { value: "expense", label: "Dépense" },
                { value: "refund", label: "Rembours." },
                { value: "income", label: "Rentrée" },
              ]}
            />
          </Field>
          <Field label="Marchand / libellé">
            <Input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Carrefour, Netflix…"
              autoCapitalize="words"
            />
          </Field>
          <Field label="Note">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optionnel" />
          </Field>
          <Field label="Date et heure">
            <Input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {error ? <Notice tone="error">{error}</Notice> : null}

      {onDelete ? (
        confirmDelete ? (
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onDelete();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Échec de la suppression");
                  setBusy(false);
                }
              }}
            >
              Supprimer définitivement
            </Button>
          </div>
        ) : (
          <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
            Supprimer cette dépense
          </Button>
        )
      ) : null}

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 bg-background/90 px-4 pb-3 pt-2 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <Button className="w-full text-lg" disabled={!canSubmit} onClick={submit}>
            {busy ? "Enregistrement…" : `${submitLabel} ${value > 0 ? formatEuro(value) : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
