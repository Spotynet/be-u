"use client";

import {ChevronRightIcon} from "@heroicons/react/24/outline";
import type {SettingsSectionDef} from "../settingsConfig";

type Props = {
  sections: SettingsSectionDef[];
  dirtyIds?: Set<string>;
  onSelect: (id: string) => void;
  statusById?: Partial<Record<string, string>>;
};

export function SettingsMasterList({
  sections,
  dirtyIds,
  onSelect,
  statusById,
}: Props) {
  return (
    <nav aria-label="Secciones de configuración" className="nabbi-settings-master">
      <ul className="nabbi-settings-card nabbi-settings-master__list m-0 list-none p-0">
        {sections.map((s) => {
          const Icon = s.icon;
          const status = statusById?.[s.id];
          return (
            <li key={s.id}>
              <a
                href={`?seccion=${s.id}`}
                className="nabbi-settings-master__row"
                onClick={(e) => {
                  e.preventDefault();
                  onSelect(s.id);
                }}>
                <span className="nabbi-settings-row__tile" aria-hidden>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="nabbi-settings-row__text min-w-0 flex-1">
                  <span className="nabbi-settings-row__title">{s.label}</span>
                  <span className="nabbi-settings-row__desc">{s.description}</span>
                </span>
                {dirtyIds?.has(s.id) ? (
                  <span className="nabbi-settings-dirty-dot" aria-label="Cambios sin guardar" />
                ) : null}
                {status ? (
                  <span className="text-[12px] font-semibold text-foreground-muted">
                    {status}
                  </span>
                ) : null}
                <ChevronRightIcon
                  className="h-5 w-5 shrink-0 text-foreground-muted"
                  aria-hidden
                />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
