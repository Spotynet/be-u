"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";
import {notificationApi} from "@/lib/api";

const MAIN = "#558367";
const DARK = "#1F3328";
const CREAM = "#F7F4EE";

type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  match?: (path: string) => boolean;
  badge?: number;
};

export function AppShell({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const {user, isAuthenticated} = useAuth();
  const provider = isProviderRole(user?.role);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await notificationApi.getStats();
        const data = res.data || {};
        const count =
          Number(data.unread) ||
          Number(data.unread_count) ||
          Number(data.total_unread) ||
          0;
        if (!cancelled) setUnread(count);
      } catch {
        if (!cancelled) setUnread(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, pathname]);

  /** Desktop / tablet top nav — full set */
  const desktopItems: NavItem[] = [
    {href: "/feed", label: "Feed", match: (p) => p.startsWith("/post") || p.startsWith("/posts")},
    {href: "/explore", label: "Explorar"},
    {
      href: "/notifications",
      label: "Avisos",
      match: (p) => p.startsWith("/notification"),
      badge: unread,
    },
    {href: "/reservations", label: "Reservas", match: (p) => p.startsWith("/reservation")},
    {href: "/favorites", label: "Favoritos"},
    ...(provider ? [{href: "/dashboard", label: "Dashboard"}] : []),
    {href: "/me", label: "Perfil"},
  ];

  /** Mobile bottom nav — keep to 5 so labels aren't crushed */
  const mobileItems: NavItem[] = [
    {href: "/feed", label: "Feed", match: (p) => p.startsWith("/post") || p.startsWith("/posts")},
    {href: "/explore", label: "Explorar", shortLabel: "Explorar"},
    {
      href: "/notifications",
      label: "Avisos",
      match: (p) => p.startsWith("/notification"),
      badge: unread,
    },
    {
      href: "/reservations",
      label: "Reservas",
      shortLabel: "Reservas",
      match: (p) => p.startsWith("/reservation"),
    },
    {href: "/me", label: "Perfil"},
  ];

  return (
    <div
      className="nabbi-shell"
      style={{
        minHeight: "100vh",
        background: CREAM,
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: DARK,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
          }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              flexShrink: 0,
            }}>
            <img
              src="/nabbi_logo_t.png"
              alt="nabbi"
              width={28}
              height={28}
              style={{borderRadius: 8}}
            />
            <span
              style={{
                color: "white",
                fontWeight: 900,
                fontSize: 17,
                letterSpacing: "-0.03em",
              }}>
              nabbi
            </span>
          </Link>
          {isAuthenticated ? (
            <nav
              className="nabbi-top-nav"
              style={{
                marginLeft: "auto",
                gap: 2,
                alignItems: "center",
                minWidth: 0,
                maxWidth: "100%",
              }}>
              {desktopItems.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/") ||
                  item.match?.(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      padding: "7px 10px",
                      borderRadius: 10,
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      color: active ? "white" : "rgba(255,255,255,0.55)",
                      background: active ? `rgba(85,131,103,0.35)` : "transparent",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}>
                    {item.label}
                    {item.badge && item.badge > 0 ? (
                      <span
                        style={{
                          background: "#e11d48",
                          color: "white",
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "1px 6px",
                          minWidth: 16,
                          textAlign: "center",
                        }}>
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          ) : (
            <nav
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexShrink: 0,
              }}>
              <Link
                href="/login"
                style={{
                  color: "rgba(255,255,255,0.75)",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                }}>
                Entrar
              </Link>
              <Link
                href="/register"
                style={{
                  background: MAIN,
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "8px 12px",
                  borderRadius: 10,
                }}>
                Crear cuenta
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: 1100,
          width: "100%",
          margin: "0 auto",
          padding: isAuthenticated
            ? "16px 12px calc(88px + env(safe-area-inset-bottom))"
            : "16px 12px 32px",
          boxSizing: "border-box",
          minWidth: 0,
        }}>
        {children}
      </main>

      {isAuthenticated && (
        <nav
          className="nabbi-bottom-nav"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "white",
            borderTop: "1px solid rgba(18,33,26,0.08)",
            display: "grid",
            gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))`,
            zIndex: 40,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}>
          {mobileItems.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/") ||
              item.match?.(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textAlign: "center",
                  padding: "10px 2px",
                  textDecoration: "none",
                  fontSize: 11,
                  fontWeight: active ? 800 : 500,
                  color: active ? MAIN : "#6b7c72",
                  position: "relative",
                }}>
                {item.shortLabel || item.label}
                {item.badge && item.badge > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: "12%",
                      background: "#e11d48",
                      color: "white",
                      borderRadius: 999,
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "0 4px",
                      minWidth: 14,
                    }}>
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
