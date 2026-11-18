"use client";

import {useEffect, useRef, useState, type ReactNode} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {AuthLayout} from "@/components/auth/AuthLayout";
import {AuthBrandPanel} from "@/components/auth/AuthBrandPanel";
import {AuthFooter} from "@/components/auth/AuthFooter";
import {ThemeModeSwitch} from "@/components/ThemeModeSwitch";

export type AuthMode = "login" | "register";

type EnterDir = "from-right" | "from-left" | "fade";

function modeFromPath(pathname: string | null): AuthMode {
  return pathname?.startsWith("/register") ? "register" : "login";
}

interface AuthShellProps {
  children: ReactNode;
}

/**
 * Persistent auth chrome (brand panel + card shell).
 * Only `{children}` (login/register form) remounts and animates on mode switch.
 */
export function AuthShell({children}: AuthShellProps) {
  const pathname = usePathname() || "/login";
  const mode = modeFromPath(pathname);
  const isRegister = mode === "register";
  const prevModeRef = useRef<AuthMode>(mode);

  // Direction must be decided in the same render as the route change (before paint)
  const enterDir: EnterDir =
    prevModeRef.current === mode
      ? "fade"
      : mode === "register"
        ? "from-right"
        : "from-left";

  const [settledPath, setSettledPath] = useState<string | null>(null);
  const animSettled = settledPath === pathname;

  useEffect(() => {
    if (prevModeRef.current !== mode) {
      requestAnimationFrame(() => {
        document.getElementById("auth-form-title")?.focus();
      });
    }
    prevModeRef.current = mode;
  }, [mode, pathname]);

  return (
    <AuthLayout wide>
      <div
        className={`auth-dual ${isRegister ? "auth-dual--register" : "auth-dual--login"}`.trim()}
        data-mode={mode}>
        <AuthBrandPanel />

        <section
          className="auth-dual__form"
          aria-label={isRegister ? "Crear cuenta" : "Iniciar sesión"}>
          <div className="auth-dual__form-card">
            <header className="auth-form-top">
              <div className="auth-form-top__left">
                <Link href="/" className="auth-back lp-focus">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                  <span className="auth-back__label">Volver al inicio</span>
                </Link>
              </div>

              <div className="auth-form-top__right">
                <ThemeModeSwitch />
              </div>
            </header>

            <main className="auth-dual__form-inner nabbi-scrollbar">
              <div className="auth-dual__form-stage">
                <div
                  key={pathname}
                  className={`auth-content-enter auth-content-enter--${enterDir}${animSettled ? " is-settled" : ""}`.trim()}
                  onAnimationEnd={() => setSettledPath(pathname)}>
                  {children}
                </div>
              </div>
            </main>

            <AuthFooter />
          </div>
        </section>
      </div>
    </AuthLayout>
  );
}

/** @deprecated Prefer AuthShell via (auth)/layout */
export function AuthDualPanel({children}: {initialMode?: AuthMode; children?: ReactNode}) {
  return <AuthShell>{children}</AuthShell>;
}
