"use client";

import {Suspense} from "react";
import {BentoGrid, BentoItem, PageHeaderRow} from "@/components/layout";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {normalizeAppRole} from "@/components/shell/nav-config";
import {AccountSkeleton} from "./components/AccountSkeleton";
import type {AccountRole, AccountViewComponent} from "./lib/types";
import {ClientAccount} from "./views/ClientAccount";
import {ProfessionalAccount} from "./views/ProfessionalAccount";
import {PlaceAccount} from "./views/PlaceAccount";

export const accountViews: Record<AccountRole, AccountViewComponent> = {
  CLIENT: ClientAccount,
  PROFESSIONAL: ProfessionalAccount,
  PLACE: PlaceAccount,
};

export function AccountPage() {
  const {user, isInitializing} = useAuth();
  const role = normalizeAppRole(user?.role);

  usePageHeader({
    title: "Mi cuenta",
    pageOwnsTitle: true,
  });

  const View = accountViews[role] ?? ClientAccount;

  return (
    <BentoGrid>
      <BentoItem span={12}>
        <PageHeaderRow title="Mi cuenta" />
      </BentoItem>
      <BentoItem span={12} className="@container/me @container/account">
        {isInitializing ? (
          <AccountSkeleton />
        ) : (
          <Suspense fallback={<AccountSkeleton />}>
            <View />
          </Suspense>
        )}
      </BentoItem>
    </BentoGrid>
  );
}
