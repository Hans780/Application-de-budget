"use client";

import type { Category } from "@/lib/types";

export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {categories
        .filter((c) => !c.archived)
        .map((c) => {
          const active = c.id === value;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-sm ring-2 transition ${
                active ? "bg-primary/10 font-semibold ring-primary" : "bg-surface ring-border"
              }`}
            >
              <span className="text-2xl leading-none">{c.emoji}</span>
              <span className="truncate text-xs">{c.name}</span>
            </button>
          );
        })}
    </div>
  );
}
