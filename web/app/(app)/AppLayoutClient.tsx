"use client";

import {usePathname} from "next/navigation";
import {ProtectedRoute} from "@/components/layout/ProtectedRoute";
import {AppShell} from "@/components/shell/AppShell";

/** Browse-only surfaces guests can open without an account. */
const PUBLIC_APP_PATHS = ["/feed", "/explore", "/profile", "/post"];

function isPublicAppPath(pathname: string): boolean {
  return PUBLIC_APP_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function AppLayoutClient({
  children,
  initialSidebarPinned,
}: {
  children: React.ReactNode;
  initialSidebarPinned?: boolean | null;
}) {
  const pathname = usePathname() || "";
  const isOwnProfileEditor = pathname === "/profile";
  const requireAuth = isOwnProfileEditor || !isPublicAppPath(pathname);

  return (
    <ProtectedRoute requireAuth={requireAuth}>
      <AppShell initialSidebarPinned={initialSidebarPinned}>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}
