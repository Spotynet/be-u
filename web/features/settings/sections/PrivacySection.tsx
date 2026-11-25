"use client";

import Link from "next/link";
import {
  ChevronRightIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {SettingsCard} from "../components/SettingsCard";
import {SettingsSectionGrid} from "../components/SettingsSectionGrid";

export function PrivacySection() {
  return (
    <SettingsSectionGrid layout="stack">
      <SettingsCard
        title="Privacidad y datos"
        description="Documentos legales"
        icon={ShieldCheckIcon}
        headingAs="h3">
        <ul className="nabbi-settings-group__list m-0 list-none p-0">
          <li>
            <Link
              href="/terminos-y-condiciones"
              className="nabbi-settings-row nabbi-settings-row--link">
              <span className="nabbi-settings-row__tile" aria-hidden>
                <DocumentTextIcon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <span className="nabbi-settings-row__text min-w-0">
                <span className="nabbi-settings-row__title">
                  Términos y condiciones
                </span>
                <span className="nabbi-settings-row__desc">
                  Condiciones de uso de nabbi
                </span>
              </span>
              <span className="nabbi-settings-row__control">
                <ChevronRightIcon
                  className="h-5 w-5 text-foreground-muted"
                  aria-hidden
                />
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/aviso-de-privacidad"
              className="nabbi-settings-row nabbi-settings-row--link">
              <span className="nabbi-settings-row__tile" aria-hidden>
                <DocumentTextIcon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <span className="nabbi-settings-row__text min-w-0">
                <span className="nabbi-settings-row__title">
                  Política de privacidad
                </span>
                <span className="nabbi-settings-row__desc">
                  Cómo tratamos tus datos
                </span>
              </span>
              <span className="nabbi-settings-row__control">
                <ChevronRightIcon
                  className="h-5 w-5 text-foreground-muted"
                  aria-hidden
                />
              </span>
            </Link>
          </li>
        </ul>
      </SettingsCard>
    </SettingsSectionGrid>
  );
}
