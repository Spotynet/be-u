type Props = {
  /** 2–7 values; last bar emphasized. */
  values: number[];
  toneClass?: string;
  mutedClass?: string;
  className?: string;
  /** Screen-reader summary. */
  summary?: string;
};

/**
 * Pure CSS mini bar chart — no chart library.
 * Hide the parent when fewer than 2 months of data (caller responsibility).
 */
export function MiniBars({
  values,
  toneClass = "bg-primary",
  mutedClass = "bg-primary/20",
  className = "",
  summary,
}: Props) {
  const bars = values.slice(-7);
  if (bars.length < 2) return null;
  const max = Math.max(...bars, 1);

  return (
    <div
      className={`flex h-10 items-end gap-0.5 ${className}`}
      aria-hidden={summary ? undefined : true}
      role={summary ? "img" : undefined}
      aria-label={summary}>
      {bars.map((v, i) => {
        const h = Math.max(4, Math.round((v / max) * 40));
        const last = i === bars.length - 1;
        return (
          <span
            key={i}
            className={`w-1.5 rounded-full ${last ? toneClass : mutedClass}`}
            style={{height: h}}
          />
        );
      })}
      {summary ? <span className="sr-only">{summary}</span> : null}
    </div>
  );
}
