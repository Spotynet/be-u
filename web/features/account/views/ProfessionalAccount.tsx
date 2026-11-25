"use client";

import {EmptyState} from "@/components/ui/EmptyState";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {getAccountVariant} from "../lib/accountVariants";
import {AccountSettingsPanel} from "../components/AccountSettingsPanel";
import {AccountSkeleton} from "../components/AccountSkeleton";
import {TabbedCard} from "../components/TabbedCard";
import type {AccountViewProps} from "../lib/types";

const VARIANT = getAccountVariant("PROFESSIONAL");

/**
 * PROFESSIONAL placeholder — full dashboard lands in a follow-up.
 */
export function ProfessionalAccount({className = ""}: AccountViewProps) {
  const {user, isInitializing} = useAuth();

  if (isInitializing || !user) return <AccountSkeleton />;

  return (
    <div className={`@container/account w-full min-w-0 ${className}`}>
      <div className="flex flex-col gap-4">
        <EmptyState
          title={VARIANT.placeholderTitle || "Panel en construcción"}
          description={VARIANT.placeholderDescription}
          primaryAction={{label: "Ir a mi perfil", href: "/profile"}}
          size="md"
          className="rounded-3xl border border-card-border bg-card shadow-card"
        />
        <TabbedCard
          defaultTab="preferencias"
          tabs={[
            {
              id: "preferencias",
              label: "Preferencias",
              content: <AccountSettingsPanel />,
            },
          ]}
        />
      </div>
    </div>
  );
}
