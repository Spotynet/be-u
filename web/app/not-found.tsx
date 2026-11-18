import type {Metadata} from "next";
import Link from "next/link";
import {CalendarDaysIcon, QuestionMarkCircleIcon} from "@heroicons/react/24/outline";
import {NabbiLogo} from "@/components/brand/NabbiLogo";
import {ThemeModeSwitch} from "@/components/ThemeModeSwitch";
import {BackLink} from "@/components/legal/BackLink";
import {LegalFooter} from "@/components/legal/LegalFooter";

export const metadata: Metadata = {
  title: "Página no encontrada | nabbi",
  description: "Esta página no existe en nabbi. Vuelve al inicio o a una página segura.",
};

export default function NotFound() {
  return (
    <div className="nf-page">
      <div className="nf-glow" aria-hidden="true" />

      <header className="nf-top">
        <NabbiLogo variant="header" href="/" />
        <ThemeModeSwitch />
      </header>

      <main className="nf-main">
        <div className="nf-card">
          <div className="nf-illus" aria-hidden="true">
            <CalendarDaysIcon className="nf-illus__cal" />
            <QuestionMarkCircleIcon className="nf-illus__q" />
          </div>
          <p className="nf-code" aria-hidden="true">
            404
          </p>
          <h1 className="nf-title">Esta página no existe</h1>
          <p className="nf-copy">
            Puede que el enlace esté roto o que la página se haya movido. Volvamos a un lugar seguro.
          </p>
          <div className="nf-actions">
            <Link href="/" className="nf-cta lp-focus">
              Ir al inicio
            </Link>
            <BackLink />
          </div>
        </div>
      </main>

      <LegalFooter current="none" />
    </div>
  );
}
