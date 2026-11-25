"use client";

import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {createPortal} from "react-dom";
import {XMarkIcon} from "@heroicons/react/24/outline";

type Size = "sm" | "md" | "lg";
type Variant = "default" | "command";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: Size;
  children?: ReactNode;
  footer?: ReactNode;
  /** Optional custom header node (overrides title). */
  header?: ReactNode;
  className?: string;
  /**
   * `command` — top-anchored command palette shell (no default header chrome).
   * Caller owns input, list, footer, and may handle Esc before close.
   */
  variant?: Variant;
  /** When false, Escape does not call onClose (caller handles it). Default true. */
  closeOnEscape?: boolean;
  /** Optional labelledby id when title/header omitted (command variant). */
  labelledBy?: string;
  /** Optional id on the dialog panel (for aria-controls from triggers). */
  id?: string;
  panelRef?: React.RefObject<HTMLDivElement | null>;
};

const SIZE: Record<Size, string> = {
  sm: "w-full sm:w-[min(440px,calc(100vw-32px))]",
  md: "w-full sm:w-[min(480px,calc(100vw-32px))]",
  lg: "w-full sm:w-[min(560px,calc(100vw-32px))]",
};

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  header,
  className = "",
  variant = "default",
  closeOnEscape = true,
  labelledBy,
  id,
  panelRef: panelRefProp,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const internalPanelRef = useRef<HTMLDivElement | null>(null);
  const panelRef = panelRefProp ?? internalPanelRef;
  const lastFocus = useRef<HTMLElement | null>(null);
  const isCommand = variant === "command";

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (!isCommand) {
      const panel = panelRef.current;
      const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
      focusables?.[0]?.focus();
    }

    return () => {
      document.body.style.overflow = prev;
      lastFocus.current?.focus?.();
    };
  }, [open, isCommand, panelRef]);

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, closeOnEscape]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open || typeof document === "undefined") return null;

  if (isCommand) {
    return createPortal(
      <div
        className="nabbi-cmd-overlay fixed inset-0 z-[66] flex items-stretch justify-center md:items-start md:px-4 md:pt-[12vh]"
        role="presentation">
        <button
          type="button"
          className="absolute inset-0 bg-foreground/50 backdrop-blur-sm dark:bg-foreground/65"
          aria-label="Cerrar"
          onClick={onClose}
        />
        <div
          ref={panelRef}
          id={id}
          role="dialog"
          aria-modal="true"
          aria-label={title || "Búsqueda global"}
          aria-labelledby={labelledBy}
          onKeyDown={onKeyDown}
          className={[
            "nabbi-cmd-panel relative z-[1] flex w-full flex-col overflow-hidden border-card-border bg-card text-foreground shadow-dropdown",
            "h-[100dvh] max-h-[100dvh] rounded-none border-0",
            "md:h-auto md:max-h-[min(560px,72dvh)] md:w-[min(640px,92vw)] md:rounded-[20px] md:border",
            "animate-[nabbi-cmd-in_160ms_ease-out] motion-reduce:animate-none",
            className,
          ].join(" ")}>
          {children}
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title || header ? titleId : labelledBy}
        aria-describedby={description ? descId : undefined}
        onKeyDown={onKeyDown}
        className={[
          "relative z-[1] flex max-h-[85dvh] w-full flex-col overflow-hidden border border-card-border bg-card shadow-card",
          "rounded-t-2xl sm:rounded-2xl",
          SIZE[size],
          className,
        ].join(" ")}>
        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-foreground-muted/25 sm:hidden"
          aria-hidden
        />
        <div className="flex items-start justify-between gap-3 border-b border-card-border px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {header ? (
              <div id={titleId}>{header}</div>
            ) : title ? (
              <h2 id={titleId} className="text-[16px] font-bold text-foreground">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id={descId} className="mt-1 text-[13px] text-foreground-secondary">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-foreground-muted hover:bg-foreground-muted/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label="Cerrar">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-card-border px-4 py-3 max-[419px]:[&>button]:w-full max-[419px]:[&>a]:w-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:px-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
