export function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const ratio = max > 0 ? value / max : value > 0 ? 1 : 0;
  const pct = Math.min(100, Math.max(0, ratio * 100));
  const tone =
    ratio >= 1 ? "var(--danger)" : ratio >= 0.8 ? "var(--warning)" : (color ?? "var(--primary)");
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: tone }}
      />
    </div>
  );
}
