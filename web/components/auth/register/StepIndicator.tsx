"use client";

import {useEffect, useState} from "react";
import {ChevronLeftIcon} from "@heroicons/react/24/outline";

interface StepIndicatorProps {
  /** 1-based index into the current steps array */
  step: number;
  total: number;
  onBack?: () => void;
  backDisabled?: boolean;
}

export function StepIndicator({
  step,
  total,
  onBack,
  backDisabled = false,
}: StepIndicatorProps) {
  const label = `Paso ${step} de ${total}`;
  const showBack = step > 1;
  const [segFading, setSegFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setSegFading(true);
    const t = window.setTimeout(() => setSegFading(false), 150);
    return () => window.clearTimeout(t);
  }, [total]);

  return (
    <div className="reg-stepper" aria-label={label}>
      <div className="reg-stepper__top">
        <div className="reg-stepper__back-slot">
          {showBack ? (
            <button
              type="button"
              className="reg-stepper__back lp-focus"
              onClick={onBack}
              disabled={backDisabled || !onBack}
              aria-label="Volver al paso anterior">
              <ChevronLeftIcon className="reg-stepper__back-icon" aria-hidden="true" />
            </button>
          ) : (
            <span className="reg-stepper__back-placeholder" aria-hidden="true" />
          )}
        </div>
        <p className="reg-stepper__label">{label}</p>
      </div>

      <div
        className={`reg-stepper__track${segFading ? " is-seg-fading" : ""}`.trim()}
        role="list"
        style={{gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`}}>
        {Array.from({length: total}, (_, i) => {
          const n = i + 1;
          const state = n < step ? "is-done" : n === step ? "is-active" : "is-todo";
          return (
            <div
              key={`${total}-${n}`}
              className={`reg-stepper__seg ${state}`}
              role="listitem"
              aria-current={n === step ? "step" : undefined}
              aria-label={`Paso ${n}`}
            />
          );
        })}
      </div>
    </div>
  );
}
