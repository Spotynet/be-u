"use client";

import {ProtectedRoute} from "@/components/layout/ProtectedRoute";
import {AppShell} from "@/components/layout/AppShell";

export default function AppLayout({children}: {children: React.ReactNode}) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
