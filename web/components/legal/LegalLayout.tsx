import Link from "next/link";
import {ArrowLeftIcon} from "@heroicons/react/24/outline";
import {NabbiLogo} from "@/components/brand/NabbiLogo";
import {ThemeModeSwitch} from "@/components/ThemeModeSwitch";
import {BackToTop} from "@/components/legal/BackToTop";
import {LegalFooter} from "@/components/legal/LegalFooter";
import type {ReactNode} from "react";

type Props = {
  title: string;
  updatedAt: string;
  effectiveFrom?: string;
  current: "terminos" | "privacidad";
  children: ReactNode;
};

export function LegalLayout({
  title,
  updatedAt,
  effectiveFrom,
  current,
  children,
}: Props) {
  return (
    <div className="legal-page">
      <header className="legal-topbar">
        <div className="legal-shell legal-topbar__inner">
          <NabbiLogo variant="header" href="/" />
          <div className="legal-topbar__actions">
            <ThemeModeSwitch className="legal-theme-switch" />
            <Link
              href="/"
              className="legal-topbar__back lp-focus"
              aria-label="Volver al inicio">
              <ArrowLeftIcon aria-hidden="true" />
              <span className="legal-topbar__back-label">Volver al inicio</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="legal-shell legal-main">
        <header className="legal-header">
          <h1 className="legal-header__title">{title}</h1>
          <p className="legal-header__meta">Última actualización: {updatedAt}</p>
          {effectiveFrom ? (
            <p className="legal-header__meta">Vigencia a partir de: {effectiveFrom}</p>
          ) : null}
          <div className="legal-header__rule" aria-hidden="true" />
        </header>
        <div className="legal-content">{children}</div>
      </main>

      <LegalFooter current={current} />
      <BackToTop />
    </div>
  );
}
