import Link from "next/link";

/** Quiet legal footer for auth form panel */
export function AuthFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="auth-panel-footer">
      <p className="auth-panel-footer__copy">© {year} Nabbi</p>
      <nav className="auth-panel-footer__nav" aria-label="Legal">
        <Link href="/aviso-de-privacidad" className="auth-panel-footer__link lp-focus">
          Privacidad
        </Link>
        <Link href="/contacto" className="auth-panel-footer__link lp-focus">
          Soporte
        </Link>
      </nav>
    </footer>
  );
}
