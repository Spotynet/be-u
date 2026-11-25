"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {createPortal} from "react-dom";

type Props = {
  content: ReactNode;
  children: ReactNode;
  /** Delay before show (ms). Default 500. */
  delay?: number;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  /** Extra classes on the portaled tip surface. */
  tipClassName?: string;
  /**
   * When true, pointer hover only opens on fine pointers with hover
   * capability (no tip on touch). Keyboard focus still shows the tip.
   */
  hoverFineOnly?: boolean;
};

function canHoverFine(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function Tooltip({
  content,
  children,
  delay = 500,
  side = "right",
  className = "",
  tipClassName = "",
  hoverFineOnly = false,
}: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{top: number; left: number} | null>(null);
  const timer = useRef<number | null>(null);

  const clear = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 8;
    let top = r.top;
    let left = r.left;
    if (side === "right") {
      top = r.top + r.height / 2;
      left = r.right + gap;
    } else if (side === "left") {
      top = r.top + r.height / 2;
      left = r.left - gap;
    } else if (side === "top") {
      top = r.top - gap;
      left = r.left + r.width / 2;
    } else {
      top = r.bottom + gap;
      left = r.left + r.width / 2;
    }
    setCoords({top, left});
  }, [side]);

  const show = (from: "pointer" | "focus" = "pointer") => {
    if (from === "pointer" && hoverFineOnly && !canHoverFine()) return;
    clear();
    timer.current = window.setTimeout(() => {
      place();
      setOpen(true);
    }, delay);
  };

  const hide = () => {
    clear();
    setOpen(false);
  };

  useEffect(() => () => clear(), []);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => place();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, place]);

  const transform =
    side === "right"
      ? "translateY(-50%)"
      : side === "left"
        ? "translate(-100%, -50%)"
        : side === "top"
          ? "translate(-50%, -100%)"
          : "translateX(-50%)";

  return (
    <>
      <span
        ref={triggerRef}
        className={className ? className : "inline-flex"}
        onMouseEnter={() => show("pointer")}
        onMouseLeave={hide}
        onFocusCapture={() => show("focus")}
        onBlurCapture={hide}
        aria-describedby={open ? id : undefined}>
        {children}
      </span>
      {open && coords && typeof document !== "undefined"
        ? createPortal(
            <span
              id={id}
              role="tooltip"
              className={[
                "pointer-events-none fixed z-[60] max-w-[220px] border border-card-border bg-card text-foreground shadow-card",
                "rounded-lg px-2.5 py-1.5 text-[12px] font-semibold",
                tipClassName,
              ]
                .filter(Boolean)
                .join(" ")}
              style={{top: coords.top, left: coords.left, transform}}>
              {content}
            </span>,
            document.body
          )
        : null}
    </>
  );
}
