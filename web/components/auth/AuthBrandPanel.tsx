"use client";

import {useEffect, useRef, useState} from "react";
import {NabbiLogo} from "@/components/brand/NabbiLogo";

const SLIDES = [
  {
    title: "Sin contraseñas",
    copy: "Entras con un código a tu correo.",
  },
  {
    title: "Reserva 24/7",
    copy: "Belleza, bienestar y mascotas, cuando quieras.",
  },
  {
    title: "Sin llamadas",
    copy: "Agenda, confirma y listo.",
  },
] as const;

const INTERVAL_MS = 5000;

/**
 * Brand panel: compact header on mobile; full sticky column on desktop.
 */
export function AuthBrandPanel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || reduceMotion.current) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const slide = SLIDES[index];

  return (
    <aside
      className="auth-brand-panel"
      aria-label="Acerca de nabbi"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}>
      <div className="auth-brand-panel__glow" aria-hidden="true" />

      <div className="auth-brand-panel__body">
        <NabbiLogo variant="auth-panel" href={null} />

        <p className="auth-brand-panel__kicker">Belleza · Bienestar · Mascotas</p>
        <h2 className="auth-brand-panel__headline">Tu agenda, en automático</h2>
        <p className="auth-brand-panel__copy">
          Reserva sin llamadas ni esperas. Un solo lugar para clientes y profesionales.
        </p>

        <div className="auth-brand-panel__carousel" aria-live="polite">
          <p className="auth-brand-panel__slide-title">{slide.title}</p>
          <p className="auth-brand-panel__slide-copy">{slide.copy}</p>
        </div>

        <div className="auth-brand-panel__dots" role="group" aria-label="Beneficios">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              className={`auth-brand-panel__dot${i === index ? " is-active" : ""}`}
              aria-label={`${s.title}: diapositiva ${i + 1} de ${SLIDES.length}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
