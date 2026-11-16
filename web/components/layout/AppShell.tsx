"use client";

import {FormEvent, useEffect, useRef, useState} from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";
import {notificationApi} from "@/lib/api";

type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  match?: (path: string) => boolean;
  badge?: number;
};

export function AppShell({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const router = useRouter();
  const {user, isAuthenticated, logout} = useAuth();
  const provider = isProviderRole(user?.role);
  const [unread, setUnread] = useState(0);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const wideBrowse =
    pathname.startsWith("/explore") ||
    pathname.startsWith("/profile/") ||
    pathname.startsWith("/booking") ||
    pathname.startsWith("/favorites");

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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const desktopItems: NavItem[] = [
    {href: "/explore", label: "Explorar"},
    {
      href: "/feed",
      label: "Feed",
      match: (p) => p.startsWith("/post") || p.startsWith("/posts"),
    },
    {
      href: "/notifications",
      label: "Avisos",
      match: (p) => p.startsWith("/notification"),
      badge: unread,
    },
    {
      href: "/reservations",
      label: "Reservas",
      match: (p) => p.startsWith("/reservation"),
    },
  ];

  const mobileItems: NavItem[] = [
    {
      href: "/feed",
      label: "Feed",
      match: (p) => p.startsWith("/post") || p.startsWith("/posts"),
    },
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

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(params.toString() ? `/explore?${params}` : "/explore");
  };

  const goNearby = () => {
    router.push("/explore?nearby=1");
  };

  return (
    <div className="nabbi-shell flex min-h-screen flex-col bg-background font-sans">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-primary-dark">
        <div className="nabbi-shell-inner flex flex-col gap-2 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href={isAuthenticated ? "/explore" : "/"}
              className="flex shrink-0 items-center gap-2 no-underline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nabbi_logo_t.png"
                alt="nabbi"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="text-[17px] font-black tracking-tight text-white">
                nabbi
              </span>
            </Link>

            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={goNearby}
                  className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-white/25 bg-white/15 px-2.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-white/25 sm:inline-flex">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    aria-hidden>
                    <path d="M12 21s-6-5.4-6-10a6 6 0 1 1 12 0c0 4.6-6 10-6 10z" />
                    <circle cx="12" cy="11" r="2.2" />
                  </svg>
                  Cerca
                </button>

                <form
                  onSubmit={onSearch}
                  className="hidden min-w-0 flex-1 md:block">
                  <label className="sr-only" htmlFor="nabbi-shell-search">
                    Buscar
                  </label>
                  <div className="relative">
                    <svg
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      aria-hidden>
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-3.5-3.5" />
                    </svg>
                    <input
                      id="nabbi-shell-search"
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar profesionales o lugares"
                      className="w-full rounded-xl border border-white/15 bg-white/15 py-2.5 pl-10 pr-3 text-[14px] text-white placeholder:text-white/60 outline-none ring-0 focus:border-white/30 focus:bg-white/20"
                    />
                  </div>
                </form>

                <nav className="nabbi-top-nav ml-auto items-center gap-0.5">
                  {desktopItems.map((item) => {
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/") ||
                      item.match?.(pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={[
                          "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2.5 py-1.5 text-[13px] no-underline",
                          active
                            ? "bg-white font-extrabold text-primary-dark"
                            : "font-semibold text-white/85 hover:bg-white/10 hover:text-white",
                        ].join(" ")}>
                        {item.label}
                        {item.badge && item.badge > 0 ? (
                          <span className="min-w-4 rounded-full bg-rose-600 px-1.5 text-center text-[10px] font-extrabold text-white">
                            {item.badge > 9 ? "9+" : item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>

                <div className="relative ml-1 hidden shrink-0 sm:block" ref={menuRef}>
                  <button
                    type="button"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-[13px] font-extrabold text-secondary-foreground ring-2 ring-white/40">
                    {(user?.firstName || user?.email || "U")
                      .slice(0, 1)
                      .toUpperCase()}
                  </button>
                  {menuOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[210px] overflow-hidden rounded-xl border border-border-dark bg-card py-1.5 shadow-dropdown">
                      <Link
                        href="/favorites"
                        role="menuitem"
                        className="block px-3.5 py-2.5 text-[13px] font-semibold text-foreground no-underline hover:bg-primary-light hover:text-primary-dark">
                        Favoritos
                      </Link>
                      <Link
                        href="/me"
                        role="menuitem"
                        className="block px-3.5 py-2.5 text-[13px] font-semibold text-foreground no-underline hover:bg-primary-light hover:text-primary-dark">
                        Mi perfil
                      </Link>
                      {provider ? (
                        <Link
                          href="/dashboard"
                          role="menuitem"
                          className="block px-3.5 py-2.5 text-[13px] font-semibold text-foreground no-underline hover:bg-primary-light hover:text-primary-dark">
                          Dashboard
                        </Link>
                      ) : null}
                      <div className="my-1 border-t border-card-border" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => logout()}
                        className="block w-full px-3.5 py-2.5 text-left text-[13px] font-bold text-error hover:bg-error-light">
                        Cerrar sesión
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <nav className="ml-auto flex shrink-0 items-center gap-2">
                <Link
                  href="/login"
                  className="text-[14px] font-semibold text-white/75 no-underline hover:text-white">
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="rounded-[10px] bg-primary px-3 py-2 text-[13px] font-bold text-white no-underline">
                  Crear cuenta
                </Link>
              </nav>
            )}
          </div>

          {/* Mobile search row */}
          {isAuthenticated ? (
            <form onSubmit={onSearch} className="md:hidden">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar profesionales o lugares"
                className="w-full rounded-xl border border-white/15 bg-white/15 py-2.5 px-3 text-[14px] text-white placeholder:text-white/60 outline-none focus:border-white/30"
              />
            </form>
          ) : null}
        </div>
      </header>

      <main
        className={[
          "nabbi-shell-main nabbi-shell-inner box-border min-w-0 flex-1 px-3 sm:px-4",
          wideBrowse ? "py-3 sm:py-4" : "py-4",
          isAuthenticated
            ? "pb-[calc(88px+env(safe-area-inset-bottom))]"
            : "pb-8",
        ].join(" ")}>
        {children}
      </main>

      {isAuthenticated ? (
        <nav
          className="nabbi-bottom-nav fixed bottom-0 left-0 right-0 z-40 grid border-t border-card-border bg-card"
          style={{
            gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))`,
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
                className={[
                  "relative px-0.5 py-2.5 text-center text-[11px] no-underline",
                  active
                    ? "font-extrabold text-primary"
                    : "font-semibold text-foreground-secondary",
                ].join(" ")}>
                {item.shortLabel || item.label}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute right-[12%] top-1 min-w-[14px] rounded-full bg-rose-600 px-1 text-[9px] font-extrabold text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
