"use client";

import {usePathname} from "next/navigation";
import {ProtectedRoute} from "@/components/layout/ProtectedRoute";
import {AppShell} from "@/components/layout/AppShell";

/** Browse-only surfaces guests can open without an account. */
const PUBLIC_APP_PATHS = ["/feed", "/explore"];

function isPublicAppPath(pathname: string): boolean {
  return PUBLIC_APP_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export default function AppLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname() || "";
  const requireAuth = !isPublicAppPath(pathname);

  return (
    <ProtectedRoute requireAuth={requireAuth}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
