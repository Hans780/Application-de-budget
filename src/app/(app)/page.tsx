"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { ExpenseList } from "@/components/ExpenseList";
import { ProgressBar } from "@/components/ProgressBar";
import { Card, Notice, Spinner } from "@/components/ui";
import { useMonthData } from "@/hooks/useMonthData";
import { formatEuro, monthKey, monthLabel } from "@/lib/format";

export default function HomePage() {
  const { profile, partner } = useApp();
  const month = monthKey();
  const { overview, expenses, categories, loading, error } = useMonthData(month);

  const shared = expenses.filter((e) => e.scope === "shared");
  const hasBudget = (overview?.total ?? 0) > 0;
  const remainingTone =
    overview && overview.remaining < 0 ? "text-danger" : overview && hasBudget && overview.remaining / overview.total < 0.2 ? "text-warning" : "";

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm text-muted">Bonjour {profile.display_name}</div>
          <h1 className="text-2xl font-bold">{monthLabel(month)}</h1>
        </div>
        {!partner ? (
          <Link href="/reglages" className="text-xs font-semibold text-primary">
            Inviter mon/ma partenaire →
          </Link>
        ) : null}
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {loading && !overview ? (
        <Spinner />
      ) : overview ? (
        <>
          <Card className="text-center">
            <div className="text-sm font-medium text-muted">Reste à dépenser ce mois-ci</div>
            <div className={`mt-1 text-5xl font-bold tabular-nums ${remainingTone}`}>
              {formatEuro(overview.remaining, { round: Math.abs(overview.remaining) >= 1000 })}
            </div>
            {hasBudget ? (
              <>
                <div className="mt-2 text-sm text-muted">
                  {overview.days_left > 0 ? (
                    <>
                      soit <span className="font-semibold text-foreground">{formatEuro(overview.per_day)}</span> par jour
                      pendant {overview.days_left} jour{overview.days_left > 1 ? "s" : ""}
                    </>
                  ) : (
                    "Mois terminé"
                  )}
                </div>
                <div className="mt-4">
                  <ProgressBar value={overview.spent - overview.credits} max={overview.total} />
                  <div className="mt-1 flex justify-between text-xs text-muted">
                    <span>Dépensé {formatEuro(overview.spent - overview.credits)}</span>
                    <span>Budget {formatEuro(overview.total)}</span>
                  </div>
                </div>
              </>
            ) : (
              <Link href="/budget" className="mt-3 inline-block text-sm font-semibold text-primary">
                Définir le budget du mois →
              </Link>
            )}
          </Card>

          <section>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="font-semibold">Par catégorie</h2>
              <Link href="/budget" className="text-xs font-semibold text-primary">
                Ajuster
              </Link>
            </div>
            <Card className="space-y-3">
              {overview.categories.filter((c) => c.envelope > 0 || c.spent !== 0).length === 0 ? (
                <p className="text-sm text-muted">Aucune enveloppe définie. Rendez-vous dans Budget.</p>
              ) : null}
              {overview.categories
                .filter((c) => c.envelope > 0 || c.spent !== 0)
                .map((c) => {
                  const over = c.envelope > 0 && c.spent >= c.envelope;
                  const warn = c.envelope > 0 && !over && c.spent >= c.envelope * 0.8;
                  return (
                    <div key={c.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {c.emoji} {c.name}
                          {over ? <span className="ml-2 text-xs font-semibold text-danger">Dépassé</span> : null}
                          {warn ? <span className="ml-2 text-xs font-semibold text-warning">80 % atteint</span> : null}
                        </span>
                        <span className="tabular-nums text-muted">
                          <span className={over ? "font-semibold text-danger" : "text-foreground"}>
                            {formatEuro(c.spent)}
                          </span>
                          {c.envelope > 0 ? ` / ${formatEuro(c.envelope, { round: true })}` : ""}
                        </span>
                      </div>
                      <ProgressBar value={c.spent} max={c.envelope} color={c.color} />
                    </div>
                  );
                })}
            </Card>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="font-semibold">Dernières dépenses</h2>
              <Link href="/depenses" className="text-xs font-semibold text-primary">
                Tout voir
              </Link>
            </div>
            <ExpenseList expenses={shared.slice(0, 6)} categories={categories} emptyText="Aucune dépense commune ce mois-ci. Touchez + pour commencer." />
          </section>
        </>
      ) : null}

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
