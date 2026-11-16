"use client";

/**
 * Pavé numérique maison : plus rapide que le clavier iOS et affiche la virgule.
 * La valeur est une chaîne « 12,50 » que l'on convertit à la validation.
 */
export function AmountKeypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const press = (k: string) => {
    if (k === "⌫") return onChange(value.slice(0, -1));
    if (k === ",") {
      if (value.includes(",")) return;
      return onChange(value === "" ? "0," : value + ",");
    }
    const [, dec] = value.split(",");
    if (dec !== undefined && dec.length >= 2) return;
    if (value === "0" && k !== ",") return onChange(k);
    if (value.replace(",", "").length >= 8) return;
    onChange(value + k);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫"];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => press(k)}
          className="h-14 rounded-2xl bg-surface text-2xl font-semibold ring-1 ring-border active:bg-surface-2"
        >
          {k}
        </button>
      ))}
    </div>
  );
}
