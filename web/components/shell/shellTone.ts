/** Visual tone for header controls on dark frame vs light/dark panel. */
export type ShellChromeTone = "on-dark" | "on-panel";

export const chromeIconBtn = (tone: ShellChromeTone) =>
  tone === "on-dark"
    ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/85 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--shell-frame-mid)]"
    : "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground-secondary hover:bg-foreground-muted/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const chromePillBtn = (tone: ShellChromeTone) =>
  tone === "on-dark"
    ? "inline-flex h-10 max-w-[200px] items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 text-[12px] font-semibold text-white/85 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--shell-frame-mid)]"
    : "inline-flex h-10 max-w-[220px] items-center gap-1.5 rounded-full border border-card-border bg-card px-3 text-[12px] font-semibold text-foreground transition-colors hover:bg-foreground-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
