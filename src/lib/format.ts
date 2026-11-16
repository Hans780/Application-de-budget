const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const euroRound = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatEuro(value: number, opts: { round?: boolean } = {}): string {
  const n = Number.isFinite(value) ? value : 0;
  return (opts.round ? euroRound : euro).format(n);
}

/** "2026-11-01" pour le mois contenant la date donnée (heure locale du téléphone). */
export function monthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function monthFromKey(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function shiftMonth(key: string, delta: number): string {
  const d = monthFromKey(key);
  return monthKey(new Date(d.getFullYear(), d.getMonth() + delta, 1));
}

export function monthLabel(key: string): string {
  const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
    monthFromKey(key),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Bornes ISO [début, fin[ du mois, en heure locale. */
export function monthRange(key: string): { start: string; end: string } {
  const d = monthFromKey(key);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return "Aujourd'hui";
  if (sameDay(d, yesterday)) return "Hier";
  const label = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Valeur pour un <input type="datetime-local"> à partir d'une date ISO. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

/** Convertit une saisie « 12,50 » ou « 12.5 » en nombre. */
export function parseAmountInput(value: string): number {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}
