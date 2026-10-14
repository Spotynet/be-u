"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {homePathForRole} from "@/lib/roles";

/** Keeps login/register for guests only; logged-in users go into the app. */
export function RedirectIfAuthenticated({children}: {children: React.ReactNode}) {
  const {isAuthenticated, isLoading, user} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(homePathForRole(user?.role));
    }
  }, [isAuthenticated, isLoading, router, user?.role]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
