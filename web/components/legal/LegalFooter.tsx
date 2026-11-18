import Link from "next/link";

type Props = {
  /** Current page for aria-current */
  current?: "terminos" | "privacidad" | "soporte" | "none";
};

export function LegalFooter({current = "none"}: Props) {
  const year = new Date().getFullYear();
  return (
    <footer className="legal-shell legal-page-footer">
      <p className="legal-page-footer__copy">© {year} Nabbi</p>
      <nav className="legal-page-footer__nav" aria-label="Legal">
        <Link
          href="/terminos-y-condiciones"
          className="legal-page-footer__link"
          aria-current={current === "terminos" ? "page" : undefined}>
          Términos
        </Link>
        <Link
          href="/aviso-de-privacidad"
          className="legal-page-footer__link"
          aria-current={current === "privacidad" ? "page" : undefined}>
          Privacidad
        </Link>
        <Link
          href="/contacto"
          className="legal-page-footer__link"
          aria-current={current === "soporte" ? "page" : undefined}>
          Soporte
        </Link>
      </nav>
    </footer>
  );
}
