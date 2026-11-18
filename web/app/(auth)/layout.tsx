import {Suspense} from "react";
import {AuthShell} from "@/components/auth/AuthDualPanel";
import {RedirectIfAuthenticated} from "@/components/auth/RedirectIfAuthenticated";

export default function AuthRouteLayout({children}: {children: React.ReactNode}) {
  return (
    <RedirectIfAuthenticated>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        }>
        <AuthShell>{children}</AuthShell>
      </Suspense>
    </RedirectIfAuthenticated>
  );
}
