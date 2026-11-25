"use client";

import {Suspense} from "react";
import {SettingsPage} from "@/features/settings";

export default function NotificationPreferencesPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPage />
    </Suspense>
  );
}
