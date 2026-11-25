"use client";

import {
  AdjustmentsHorizontalIcon,
  BellIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import {AccountGroupCard, AccountRow} from "@/components/account";
import {useLocationFilterOptional} from "@/components/shell/useLocationFilter";

/** Preferencias tab — links into Configuración hub sections (no duplicated forms). */
export function PreferencesPanel() {
  const location = useLocationFilterOptional();
  const locHint = location?.enabled
    ? `${location.city || location.label || "Cerca"} · ${location.radiusKm} km`
    : "Tema, ubicación y radio";

  return (
    <div className="flex flex-col gap-4">
      <AccountGroupCard label="Configuración">
        <li>
          <AccountRow
            href="/notification-preferences?seccion=notificaciones"
            icon={BellIcon}
            title="Notificaciones"
            description="Cómo y cuándo te avisamos"
          />
        </li>
        <li>
          <AccountRow
            href="/notification-preferences?seccion=preferencias"
            icon={AdjustmentsHorizontalIcon}
            title="Preferencias de cuenta"
            description={locHint}
          />
        </li>
        <li>
          <AccountRow
            href="/notification-preferences?seccion=preferencias"
            icon={MapPinIcon}
            title="Ubicación y radio"
            description="Misma ubicación que el chip de la barra superior"
          />
        </li>
      </AccountGroupCard>
    </div>
  );
}
