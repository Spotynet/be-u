"use client";

import {useEffect, useRef, useState} from "react";
import {
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/outline";
import {ThemeSegmented} from "@/components/shell/UserMenu/ThemeSegmented";
import {useShellOverlay} from "@/components/shell/overlay";
import {
  RADIUS_OPTIONS,
  useLocationFilter,
  type RadiusKm,
} from "@/components/shell/useLocationFilter";
import {Button} from "@/components/ui/Button";
import {
  applyClientPreferences,
  readClientPreferences,
  writeClientPreferences,
} from "../clientPreferences";
import {SavedHint} from "../components/SavedHint";
import {SettingsCard} from "../components/SettingsCard";
import {SettingsRow} from "../components/SettingsRow";
import {SettingsSectionGrid} from "../components/SettingsSectionGrid";
import type {SettingsCapability} from "../settingsConfig";

type Props = {
  caps: SettingsCapability;
};

function useSavedFlash() {
  const [on, setOn] = useState(false);
  const timer = useRef<number | null>(null);
  const flash = () => {
    setOn(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOn(false), 1500);
  };
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );
  return {on, flash};
}

export function PreferencesSection({caps}: Props) {
  const loc = useLocationFilter();
  const {open} = useShellOverlay();
  const radiusFlash = useSavedFlash();
  const motionFlash = useSavedFlash();
  const themeFlash = useSavedFlash();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const prefs = readClientPreferences();
    setReduceMotion(Boolean(prefs.reduceMotion));
    applyClientPreferences(prefs);
  }, []);

  const place =
    loc.label?.trim() ||
    loc.city?.trim() ||
    (loc.coords ? "Ubicación actual" : "Sin ubicación");

  const cardCount =
    Number(caps.location) + Number(caps.theme) + Number(caps.reduceMotion);
  const layout = cardCount >= 2 ? "grid" : "stack";

  return (
    <SettingsSectionGrid layout={layout}>
      {caps.location ? (
        <SettingsCard
          title="Ubicación y radio"
          description="Se usa para Explorar y para los resultados cercanos."
          icon={MapPinIcon}
          headingAs="h3"
          action={<SavedHint visible={radiusFlash.on} />}>
          <div className="nabbi-settings-group__list">
            <SettingsRow
              title="Ubicación predeterminada"
              description={place}
              descriptionTitle={place}
              icon={MapPinIcon}
              control="wide"
              titleWrap
              trailing={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="nabbi-settings-row__btn"
                  onClick={() => open("location")}>
                  Cambiar
                </Button>
              }
            />
          </div>
          <div className="nabbi-settings-segment-block">
            <p
              id="settings-pref-radius"
              className="nabbi-settings-segment-block__label">
              Radio de búsqueda
            </p>
            <div
              className="nabbi-settings-segmented nabbi-settings-segmented--wrap"
              role="radiogroup"
              aria-labelledby="settings-pref-radius">
              {RADIUS_OPTIONS.map((r) => {
                const selected = loc.radiusKm === r;
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      loc.setRadiusKm(r as RadiusKm);
                      radiusFlash.flash();
                    }}
                    className={[
                      "nabbi-settings-segmented__chip",
                      selected ? "is-selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}>
                    {r} km
                  </button>
                );
              })}
            </div>
            <p className="nabbi-settings-segment-block__hint">
              Se guarda en este dispositivo
            </p>
          </div>
        </SettingsCard>
      ) : null}

      {caps.theme ? (
        <SettingsCard
          title="Apariencia"
          description="Tema de la interfaz"
          icon={PaintBrushIcon}
          headingAs="h3"
          action={<SavedHint visible={themeFlash.on} />}>
          <div
            className="nabbi-settings-segment-block"
            onClick={() => themeFlash.flash()}>
            <div className="nabbi-settings-theme">
              <ThemeSegmented />
            </div>
            <p className="nabbi-settings-segment-block__hint">
              Se guarda en este dispositivo
            </p>
          </div>
        </SettingsCard>
      ) : null}

      {caps.reduceMotion ? (
        <SettingsCard
          title="Accesibilidad"
          icon={AdjustmentsHorizontalIcon}
          headingAs="h3"
          action={<SavedHint visible={motionFlash.on} />}>
          <div className="nabbi-settings-group__list">
            <SettingsRow
              title="Reducir movimiento"
              description="Desactiva animaciones en esta app. Se guarda en este dispositivo."
              icon={AdjustmentsHorizontalIcon}
              checked={reduceMotion}
              onCheckedChange={(next) => {
                setReduceMotion(next);
                writeClientPreferences({reduceMotion: next});
                motionFlash.flash();
              }}
            />
          </div>
        </SettingsCard>
      ) : null}
    </SettingsSectionGrid>
  );
}
