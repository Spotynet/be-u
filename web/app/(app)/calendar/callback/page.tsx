"use client";

import {Suspense, useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {PageHeaderRow, StackLayout} from "@/components/layout";
import {Button} from "@/components/ui/Button";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {calendarApi, getCalendarRedirectUri, errorUtils} from "@/lib/api";

function CalendarCallbackInner() {
  usePageHeader({title: "Google Calendar", pageOwnsTitle: true});
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code") || undefined;
      const state = searchParams.get("state") || undefined;
      const oauthError = searchParams.get("error");
      if (oauthError) {
        router.replace(
          `/google-calendar?error=${encodeURIComponent(oauthError)}`,
        );
        return;
      }
      if (!code) {
        setError("Falta el código de autorización.");
        return;
      }
      try {
        const redirectUri = getCalendarRedirectUri();
        await calendarApi.exchangeCode(code, state, redirectUri);
        router.replace("/google-calendar?connected=1");
      } catch (err) {
        setError(errorUtils.getErrorMessage(err));
      }
    };
    run();
  }, [searchParams, router]);

  if (error) {
    return (
      <StackLayout>
        <PageHeaderRow title="Google Calendar" />
        <p className="text-error">{error}</p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.replace("/google-calendar")}>
          Volver a Google Calendar
        </Button>
      </StackLayout>
    );
  }

  return (
    <StackLayout>
      <PageHeaderRow title="Google Calendar" />
      <p className="text-foreground-secondary">Conectando Google Calendar…</p>
    </StackLayout>
  );
}

export default function CalendarCallbackPage() {
  return (
    <Suspense
      fallback={
        <StackLayout>
          <p className="text-foreground-secondary">Conectando…</p>
        </StackLayout>
      }>
      <CalendarCallbackInner />
    </Suspense>
  );
}
