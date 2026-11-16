"use client";

import { monthLabel, shiftMonth } from "@/lib/format";

export function MonthNav({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <button
        type="button"
        aria-label="Mois précédent"
        onClick={() => onChange(shiftMonth(month, -1))}
        className="h-10 w-10 rounded-full bg-surface-2 text-lg"
      >
        ‹
      </button>
      <span className="text-lg font-semibold">{monthLabel(month)}</span>
      <button
        type="button"
        aria-label="Mois suivant"
        onClick={() => onChange(shiftMonth(month, 1))}
        className="h-10 w-10 rounded-full bg-surface-2 text-lg"
      >
        ›
      </button>
    </div>
  );
}
