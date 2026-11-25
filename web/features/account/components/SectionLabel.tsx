type Props = {
  children: string;
  className?: string;
};

export function SectionLabel({children, className = ""}: Props) {
  return (
    <p
      className={`text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted ${className}`}>
      {children}
    </p>
  );
}
