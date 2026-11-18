"use client";

import {useEffect, useState} from "react";
import {ArrowUpIcon} from "@heroicons/react/24/outline";

/** Fixed “Volver arriba” — fades in after ~600px scroll. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, {passive: true});
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      className={`legal-back-top${visible ? " is-visible" : ""}`}
      aria-label="Volver arriba"
      tabIndex={visible ? 0 : -1}
      onClick={() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({top: 0, behavior: reduced ? "auto" : "smooth"});
      }}>
      <ArrowUpIcon aria-hidden="true" />
    </button>
  );
}
